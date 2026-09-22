/**
 * The server entry point: connects to MongoDB, builds the Express app, mounts
 * every router and starts listening.
 *
 * @remarks
 * Three mount points, and nothing else. There is no `/api` prefix and no
 * version prefix:
 *
 * - `/auth` — the account routes; signed-in callers.
 * - `/customer` — eleven routers, all sharing this one prefix. The home and
 *   catalogue routers are public; the rest apply `requireAuth` to themselves.
 * - `/admin` — seven routers, every one guarded by `requireAdmin`.
 *
 * Because the customer and admin routers share a prefix, a path is matched
 * against them in mount order, and the first router with a matching path
 * wins. Adding a path that already exists in an earlier router on the same
 * prefix would make the later one unreachable.
 *
 * Two routes are defined here rather than in a router, `/health` and
 * `/app-version`, and both are public.
 *
 * Middleware order matters and is fixed: CORS, then the JSON body parser,
 * then request logging, then Clerk. `clerkMiddleware` only reads the
 * `Authorization` header and attaches the auth state — it never rejects a
 * request, so an unauthenticated call reaches the route and is refused there.
 * `notFound` and `errorHandler` close the chain after every router.
 *
 * The process exits with code 1 if `connectDB` rejects, so the server never
 * accepts traffic without a database. `utils/razorpay` also throws at import
 * time when its keys are missing, which stops the whole server rather than
 * just the payment routes.
 *
 * @packageDocumentation
 */
import "dotenv/config";
import express from "express";
import { connectDB } from "./db";
import cors from "cors";
import morgan from "morgan";
import { ok } from "./utils/envelope";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorhandler";
import { clerkMiddleware } from "@clerk/express";
import { authRouter } from "./routes/auth/auth.routes";
import { adminProductRouter } from "./routes/admin/product.routes";
import { customerProductRouter } from "./routes/customer/product.routes";
import { customerAddressRouter } from "./routes/customer/address.routes";
import { adminPromoRouter } from "./routes/admin/promo.routes";
import { customerPromoRouter } from "./routes/customer/promo.routes";
import { customerCartWishlistRouter } from "./routes/customer/cart-wishlist.routes";
import { customerCheckoutRouter } from "./routes/customer/checkout.routes";
import { customerOrderRouter } from "./routes/customer/orders.routes";
import { customerCheckoutWithPointsRouter } from "./routes/customer/checkout-with-points.routes";
import { adminOrderRouter } from "./routes/admin/orders.routes";
import { adminSettingsRouter } from "./routes/admin/settings.routes";
import { adminDashboardRouter } from "./routes/admin/dashboard.routes";
import { adminStaffRouter } from "./routes/admin/staff.routes";
import { adminShopNetworkRouter } from "./routes/admin/shop-network.routes";
import { adminAuditRouter } from "./routes/admin/audit.routes";
import { customerHomeRouter } from "./routes/customer/home.routes";
import { customerGroceryListRouter } from "./routes/customer/grocery-list.routes";
import { customerProfileRouter } from "./routes/customer/profile.routes";
import { customerPushTokenRouter } from "./routes/customer/push-token.routes";
import { adminGroceryListRouter } from "./routes/admin/grocery-list.routes";
import { adminPushTokenRouter } from "./routes/admin/push-token.routes";

/**
 * Connects to MongoDB, assembles the Express app and binds the listener.
 *
 * @remarks
 * Awaits `connectDB()` before anything else, so the port is only opened once
 * the database is reachable.
 *
 * `CORS_ORIGINS` is a comma-separated allowlist, defaulting to
 * `http://localhost:3000`, and credentials are allowed. An origin that is not
 * on the list is refused by the browser as a CORS failure, so the caller
 * never sees a JSON error for it.
 *
 * `PORT` defaults to 5000.
 *
 * @returns A promise that settles once the server is listening.
 */
async function mainEntryFunction() {
  await connectDB();

  const app = express();

  // The platform terminates TLS and forwards the request, so Express must be
  // told it is behind a proxy or `req.protocol` and `req.ip` describe the
  // proxy rather than the caller. The shop-network gate does NOT rely on this:
  // utils/clientIp.ts reads the headers itself, from the right, precisely
  // because `trust proxy` believes whatever the leftmost hop claimed.
  app.set("trust proxy", true);

  // Headers every response carries. None of these existed before, and the
  // panel is a page that shows a shop's orders to whoever is signed in.
  app.use((_req, res, next) => {
    // The API answers JSON to an app and to a separate origin; nothing here is
    // ever a page to frame, style or script.
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    // Belt and braces for the browsers that predate frame-ancestors.
    res.setHeader("X-Frame-Options", "DENY");
    // Stop a JSON response being sniffed into something executable.
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Do not leak the admin URL a request came from to any third party.
    res.setHeader("Referrer-Policy", "no-referrer");
    // No camera, microphone or location is ever needed from this origin.
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );
    // Two years, subdomains included: the API is HTTPS-only in production.
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains",
    );
    next();
  });

  // Express advertises itself by default; there is no reason to tell a prober
  // which framework to look up exploits for.
  app.disable("x-powered-by");

  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // Cap request bodies — a grocery list / chat message is tiny, so 100kb is
  // plenty and stops a multi-MB payload from ever reaching the DB layer.
  app.use(express.json({ limit: "100kb" }));
  app.use(morgan("dev"));
  app.use(clerkMiddleware());

  /**
   * `GET /health` — liveness probe.
   *
   * @remarks
   * Auth: public. No parameters. Always answers 200 with a fixed message.
   *
   * It says the process is up, not that the database is. The listener only
   * starts after `connectDB()` resolves, so a 200 proves Mongo was reachable
   * at boot — it does not re-check the connection on each call.
   *
   * Side effects: none.
   */
  app.get("/health", (_req, res) => {
    res.status(200).json(ok({ message: "Server is healthy/in running state" }));
  });

  /**
   * `GET /app-version` — the Play Store version the mobile app compares
   * itself against.
   *
   * @remarks
   * Auth: public. No parameters.
   *
   * Reads three environment variables and nothing else, so it touches neither
   * the database nor the Play Store. Each field falls back to a default when
   * unset: `latestVersion` and `minVersion` to `""`, and `androidPackage` to
   * `"com.skirana.app"`.
   *
   * An empty `latestVersion` is the "say nothing" case — the app has no
   * version to compare against and shows no prompt — so forgetting the
   * variable is quiet rather than broken. The app decides what to do with the
   * answer; this route enforces nothing.
   *
   * Side effects: none.
   */
  // Public: the app asks "is there a newer Play Store build than the one I'm
  // running?". Driven by env vars so publishing a new Play release only needs
  // an env change here — no code deploy:
  //   APP_LATEST_VERSION -> the version now live on Play, e.g. "1.0.1"
  //   APP_MIN_VERSION    -> optional; below this the update is MANDATORY
  app.get("/app-version", (_req, res) => {
    res.status(200).json(
      ok({
        latestVersion: process.env.APP_LATEST_VERSION || "",
        minVersion: process.env.APP_MIN_VERSION || "",
        androidPackage: process.env.ANDROID_PACKAGE || "com.skirana.app",
      }),
    );
  });

  // auth routes
  app.use("/auth", authRouter);

  // customer routes
  app.use("/customer", customerHomeRouter);
  app.use("/customer", customerProductRouter);
  app.use("/customer", customerAddressRouter);
  app.use("/customer", customerPromoRouter);
  app.use("/customer", customerCartWishlistRouter);
  app.use("/customer", customerCheckoutRouter);
  app.use("/customer", customerCheckoutWithPointsRouter);
  app.use("/customer", customerOrderRouter);
  app.use("/customer", customerGroceryListRouter);
  app.use("/customer", customerProfileRouter);
  app.use("/customer", customerPushTokenRouter);

  // admin routes
  app.use("/admin", adminProductRouter);
  app.use("/admin", adminGroceryListRouter);
  app.use("/admin", adminPushTokenRouter);
  app.use("/admin", adminPromoRouter);
  app.use("/admin", adminOrderRouter);
  app.use("/admin", adminSettingsRouter);
  app.use("/admin", adminDashboardRouter);
  app.use("/admin", adminStaffRouter);
  app.use("/admin", adminShopNetworkRouter);
  app.use("/admin", adminAuditRouter);

  app.use(notFound);
  app.use(errorHandler);

  const port = Number(process.env.PORT || 5000);

  app.listen(port, () => {
    console.log(`Server is now listening to port ${port}`);
  });
}

mainEntryFunction().catch((err) => {
  console.error("failed to start", err);
  process.exit(1);
});

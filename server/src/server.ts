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
import { customerHomeRouter } from "./routes/customer/home.routes";
import { customerGroceryListRouter } from "./routes/customer/grocery-list.routes";
import { customerProfileRouter } from "./routes/customer/profile.routes";
import { customerPushTokenRouter } from "./routes/customer/push-token.routes";
import { adminGroceryListRouter } from "./routes/admin/grocery-list.routes";
import { adminPushTokenRouter } from "./routes/admin/push-token.routes";

async function mainEntryFunction() {
  await connectDB();

  const app = express();

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

  app.get("/health", (_req, res) => {
    res.status(200).json(ok({ message: "Server is healthy/in running state" }));
  });

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

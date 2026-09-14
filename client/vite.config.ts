import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

// Two pages are built:
//   index.html - the public, static homepage at "/" (plain HTML, no React)
//   app.html   - the React admin panel, plus /privacy and /delete-account
// On Vercel, vercel.json sends every other path to app.html. This plugin does
// the same for the dev server and `vite preview`, which would otherwise hand
// every unknown path the homepage.
function adminAppFallback(): Plugin {
  const toApp: Connect.NextHandleFunction = (req, _res, next) => {
    const pathname = (req.url ?? "/").split("?")[0];
    const wantsPage = req.headers.accept?.includes("text/html");
    const isHomepage = pathname === "/" || pathname === "/index.html";
    const isFileOrTool =
      path.extname(pathname) !== "" ||
      pathname.startsWith("/@") ||
      pathname.startsWith("/src/") ||
      pathname.startsWith("/node_modules/");

    if (req.method === "GET" && wantsPage && !isHomepage && !isFileOrTool) {
      req.url = "/app.html";
    }
    next();
  };

  return {
    name: "admin-app-fallback",
    configureServer(server) {
      server.middlewares.use(toApp);
    },
    configurePreviewServer(server) {
      server.middlewares.use(toApp);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), adminAppFallback()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rolldownOptions: {
      input: {
        home: path.resolve(__dirname, "index.html"),
        app: path.resolve(__dirname, "app.html"),
      },
    },
  },
});

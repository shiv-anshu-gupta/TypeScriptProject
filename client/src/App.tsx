/**
 * Root component: starts the auth bootstrap, then renders the router.
 *
 * @packageDocumentation
 */
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useBootstrapAuth } from "./features/auth/useBootstrapAuth";

/**
 * Renders the whole admin app.
 *
 * @remarks
 * `useBootstrapAuth` is called here, above the router, so it runs exactly once
 * for the life of the page. It installs the axios token getter and populates
 * the auth store with the signed-in user and their role. The route guards read
 * only that store, so they cannot run before this hook has had its first turn —
 * which is why they all check `isBootstrapped` before deciding anything.
 *
 * @returns The router provider for {@link router}.
 */
function App() {
  useBootstrapAuth();

  return <RouterProvider router={router} />;
}

export default App;

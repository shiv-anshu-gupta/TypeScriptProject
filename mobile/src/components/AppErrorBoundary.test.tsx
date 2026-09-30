/**
 * The app-level error boundary: a render crash anywhere in the tree must show
 * a recovery screen, never a white screen the customer has to force-kill.
 */
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { AppErrorBoundary } from "./AppErrorBoundary";

// A child that throws until told not to — the "broken screen".
function Bomb({ defused }: { defused?: boolean }) {
  if (!defused) throw new Error("boom from a screen");
  return <Text>app content</Text>;
}

// React logs every caught render error to console.error; keep test output
// readable without hiding real failures elsewhere.
let consoleError: jest.SpyInstance;
beforeEach(() => {
  consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

it("renders its children when nothing is wrong", async () => {
  await render(
    <AppErrorBoundary>
      <Text>app content</Text>
    </AppErrorBoundary>,
  );
  expect(screen.getByText("app content")).toBeTruthy();
});

it("shows the recovery screen instead of crashing when a child throws", async () => {
  await render(
    <AppErrorBoundary>
      <Bomb />
    </AppErrorBoundary>,
  );
  // Customer-facing and bilingual, like the language picker.
  expect(screen.getByText(/kuch galat ho gaya/i)).toBeTruthy();
  expect(screen.getByText(/something went wrong/i)).toBeTruthy();
});

it("tries the app again when the customer taps retry", async () => {
  let defused = false;
  const { rerender } = await render(
    <AppErrorBoundary>
      <Bomb defused={defused} />
    </AppErrorBoundary>,
  );

  // The crash is fixed (state changed, network back...) — retry must re-render
  // the children rather than staying stuck on the failure screen.
  defused = true;
  await rerender(
    <AppErrorBoundary>
      <Bomb defused={defused} />
    </AppErrorBoundary>,
  );
  await fireEvent.press(screen.getByRole("button"));

  expect(screen.getByText("app content")).toBeTruthy();
});

import { startSession } from "@uvcp/editor";
import { FoundationScreen } from "@uvcp/ui";
import { createRoot } from "react-dom/client";
import { applyDevFailure } from "./dev-failure.ts";
import { foundationProps } from "./foundation-props.ts";
import { Studio } from "./studio.tsx";
import "./shell.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("The foundation shell root is missing.");
}

const session = startSession({
  write(line) {
    console.error(line);
  },
  initialize(starting) {
    // Startup is synchronous, so the screen paints the settled session once.
    // The dev failure value is defined only for `vite serve`. Production
    // replaces this branch with nothing, so the switch is not in the bundle.
    if (import.meta.env.DEV) {
      applyDevFailure(starting, __UVCP_DEV_FAILURE__);
    }
  },
});

const screen =
  session.status === "ready" ? (
    <Studio />
  ) : (
    <FoundationScreen {...foundationProps(session)} />
  );

createRoot(rootElement).render(screen);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import useThemeStore from "./stores/themeStore";

// Initialize theme before first render to prevent flash
useThemeStore.getState().initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import { createRoot } from "react-dom/client";
// import App from "./scene/PaintableVase";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <App />
  // </StrictMode>
);

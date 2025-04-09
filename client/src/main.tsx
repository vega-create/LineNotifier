import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create a global type for HTML input elements with date type
declare global {
  interface HTMLInputElement {
    // Allow setting value to Date objects for date inputs
    valueAsDate: Date | null;
  }
}

createRoot(document.getElementById("root")!).render(<App />);

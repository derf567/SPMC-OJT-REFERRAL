import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/consoleSecurity";

createRoot(document.getElementById("root")!).render(<App />);



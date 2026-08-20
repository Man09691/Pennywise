import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";
import App from "./App.jsx";
import React from "react";
import ReactDOM from "react-dom/client";


import { ThemeProvider } from "./context/ThemeContext.jsx";

ReactDOM.createRoot(
  document.getElementById("root"),
).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
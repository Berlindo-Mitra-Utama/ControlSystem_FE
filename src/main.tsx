import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { HashRouter } from "react-router-dom";
import "./index.css"; // Pastikan Tailwind masuk sini

// Menghapus StrictMode untuk mengatasi masalah data hilang setelah refresh
ReactDOM.createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <App />
  </HashRouter>
);

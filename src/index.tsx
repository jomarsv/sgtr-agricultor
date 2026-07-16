import React from "react";
import ReactDOM from "react-dom/client";
import AgricultorApp from "./App";
import { AuthProvider } from "./contexts/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AgricultorApp />
    </AuthProvider>
  </React.StrictMode>
);
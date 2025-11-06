import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { createRoot } from "react-dom/client";

import "./index.css";
import { StrictMode } from "react";

import AdminProvider from "./AdminContext/AdminProvider.jsx";
import { RemoteComponent } from "./RemoteComponent.jsx";
import App from "./App.jsx";

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RemoteComponent
      url="https://irserver2.eku.edu/libraries/remote/wrapper.cjs"
      heading="User Access"
    >
      <AdminProvider>
        <App />
      </AdminProvider>
    </RemoteComponent>
  </StrictMode>
);

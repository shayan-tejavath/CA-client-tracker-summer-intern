
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ClientsList from "./pages/clients/ClientsList.jsx";
import AddClient from "./pages/clients/AddClient.jsx";
import EditClient from "./pages/clients/EditClient.jsx";
import ClientDetails from "./pages/clients/ClientDetails.jsx";
import TasksList from "./pages/tasks/TasksList.jsx";
import CreateTask from "./pages/tasks/CreateTask.jsx";
import TaskDetails from "./pages/tasks/TaskDetails.jsx";
import EditTask from "./pages/tasks/EditTask.jsx";
import Documents from "./pages/dashboard/Documents.jsx";
import Reports from "./pages/dashboard/Reports.jsx";
import AdminPanel from "./pages/dashboard/AdminPanel.jsx";
import PermissionMatrix from "./pages/dashboard/PermissionMatrix.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager", "Employee"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ClientsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients/add"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner"]}>
                <AddClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients/:clientId/edit"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner"]}>
                <EditClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/clients/:clientId"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ClientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager", "Employee"]}>
                <TasksList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks/add"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <CreateTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks/:taskId/edit"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager", "Employee"]}>
                <EditTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks/:taskId"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager", "Employee"]}>
                <TaskDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/documents"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager", "Employee", "Client"]}>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/reports"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/permissions"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                <PermissionMatrix />
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={
              <div className="page-center">
                <div className="card">
                  <h1>Page not found</h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              </div>
            }
          />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


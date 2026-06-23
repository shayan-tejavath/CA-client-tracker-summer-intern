import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  ToastContainer,
} from "react-toastify";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";



// AUTH + LANDING

import LandingPage from "./pages/LandingPage.jsx";

import Login from "./pages/Login.jsx";



// DASHBOARD

import Dashboard from "./pages/Dashboard.jsx";
import ClientDashboard from "./pages/dashboard/ClientDashboard.jsx";



// CLIENTS

import ClientsList from "./pages/clients/ClientsList.jsx";

import AddClient from "./pages/clients/AddClient.jsx";

import EditClient from "./pages/clients/EditClient.jsx";

import ClientDetails from "./pages/clients/ClientDetails.jsx";

import ClientDocuments from "./pages/clients/ClientDocuments.jsx";



// SERVICES

import ServicesList from "./pages/services/ServicesList.jsx";

import AddService from "./pages/services/AddService.jsx";

import EditService from "./pages/services/EditService.jsx";
import ServiceDetails from "./pages/services/ServiceDetails.jsx";



// TASKS

import TasksList from "./pages/tasks/TasksList.jsx";

import CreateTask from "./pages/tasks/CreateTask.jsx";

import TaskDetails from "./pages/tasks/TaskDetails.jsx";

import EditTask from "./pages/tasks/EditTask.jsx";



// DOCUMENTS

import Documents from "./pages/dashboard/Documents.jsx";

import DocumentsList from "./pages/documents/DocumentsList.jsx";

import UploadDocument from "./pages/documents/UploadDocument.jsx";



// DASHBOARD PAGES

import Reports from "./pages/dashboard/Reports.jsx";

import AdminPanel from "./pages/dashboard/AdminPanel.jsx";

import PermissionMatrix from "./pages/dashboard/PermissionMatrix.jsx";

import UsersList from "./pages/users/UsersList.jsx";

import CreateUser from "./pages/users/CreateUser.jsx";

import UserRolesList from "./pages/users/UserRolesList.jsx";

import UserRoleForm from "./pages/users/UserRoleForm.jsx";



// ROUTE PROTECTION

import ProtectedRoute from "./routes/ProtectedRoute.jsx";



import "react-toastify/dist/ReactToastify.css";



const DashboardRoute = ({ children }) => {
  const { user } = useAuth();

  if (user?.role === "Client") {
    return <ClientDashboard />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Routes>

          {/* LANDING */}

          <Route
            path="/"
            element={
              <LandingPage />
            }
          />



          {/* LOGIN */}

          <Route
            path="/login"
            element={<Login />}
          />



          {/* DASHBOARD */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                  "Client",
                ]}
              >
                <DashboardRoute>
                  <Dashboard />
                </DashboardRoute>
              </ProtectedRoute>
            }
          />



          {/* CLIENTS */}

          <Route
            path="/dashboard/clients"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                ]}
              >
                <ClientsList />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/clients/add"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                ]}
              >
                <AddClient />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/clients/:clientId/edit"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                ]}
              >
                <EditClient />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/clients/:clientId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                ]}
              >
                <ClientDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/clients/:clientId/documents"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                  "Client",
                ]}
              >
                <ClientDocuments />
              </ProtectedRoute>
            }
          />



          {/* SERVICES */}

          <Route
            path="/dashboard/services"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                  "Client",
                ]}
              >
                <ServicesList />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/services/add"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                ]}
              >
                <AddService />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/services/edit/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                ]}
              >
                <EditService />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/services/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <ServiceDetails />
              </ProtectedRoute>
            }
          />



          {/* TASKS */}

          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <TasksList />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/tasks/add"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                ]}
              >
                <CreateTask />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/tasks/:taskId/edit"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <EditTask />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/tasks/:taskId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <TaskDetails />
              </ProtectedRoute>
            }
          />



          {/* DOCUMENTS */}

          <Route
            path="/dashboard/documents"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                  "Client",
                ]}
              >
                <DocumentsList />
              </ProtectedRoute>
            }
          />



          <Route
            path="/dashboard/documents/upload"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                  "Client",
                ]}
              >
                <UploadDocument />
              </ProtectedRoute>
            }
          />



          {/* REPORTS */}

          <Route
            path="/dashboard/reports"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                ]}
              >
                <Reports />
              </ProtectedRoute>
            }
          />



          {/* ADMIN */}

          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* USERS */}

          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <UsersList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/users/new"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <CreateUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/user-roles"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <UserRolesList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/user-roles/:roleId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <UserRoleForm />
              </ProtectedRoute>
            }
          />



          {/* PERMISSIONS */}

          <Route
            path="/dashboard/permissions"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <PermissionMatrix />
              </ProtectedRoute>
            }
          />



          {/* FALLBACK */}

          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

                <div className="bg-slate-900 p-10 rounded-2xl border border-slate-700 text-center">

                  <h1 className="text-4xl font-bold mb-4">
                    Page Not Found
                  </h1>

                  <p className="text-slate-400">
                    The page you are looking for does not exist.
                  </p>

                </div>
              </div>
            }
          />

        </Routes>



        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

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
import { PERMISSIONS } from "./constants/rbac.js";



// AUTH + LANDING

import LandingPage from "./pages/LandingPage.jsx";

import Login from "./pages/Login.jsx";



// DASHBOARD

import Dashboard from "./pages/Dashboard.jsx";
import ClientDashboard from "./pages/dashboard/Clients.jsx";



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
import WorkflowTemplatesPage from "./pages/services/WorkflowTemplatesPage.jsx";
import InvoiceDashboardPage from "./pages/invoices/InvoiceDashboardPage.jsx";



// TASKS

import TasksList from "./pages/tasks/TasksList.jsx";

import CreateTask from "./pages/tasks/CreateTask.jsx";

import TaskDetails from "./pages/tasks/TaskDetails.jsx";

import EditTask from "./pages/tasks/EditTask.jsx";



// DOCUMENTS

import Documents from "./pages/dashboard/Documents.jsx";

import DocumentsList from "./pages/documents/DocumentsList.jsx";

import UploadDocument from "./pages/documents/UploadDocument.jsx";

import DocumentsInOutRegister from "./pages/documents/DocumentsInOutRegister.jsx";

import DscManagement from "./pages/documents/DscManagement.jsx";

import DocumentCollection from "./pages/documents/DocumentCollection.jsx";



// DASHBOARD PAGES

import AdminPanel from "./pages/dashboard/AdminPanel.jsx";

import PermissionMatrix from "./pages/dashboard/PermissionMatrix.jsx";

import UsersList from "./pages/users/UsersList.jsx";

import CreateUser from "./pages/users/CreateUser.jsx";

import UserRolesList from "./pages/users/UserRolesList.jsx";

import UserRoleForm from "./pages/users/UserRoleForm.jsx";

//Reports

import Reports from "./pages/dashboard/Reports";
import TaskReports from "./pages/dashboard/reports/TaskReports";
import ServiceReports from "./pages/dashboard/reports/ServiceReports";
import ClientReports from "./pages/dashboard/reports/ClientReports";
import EmployeeReports from "./pages/dashboard/reports/EmployeeReports";
import ExportCenter from "./pages/dashboard/reports/ExportCenter";

//TODO
import TodoDashboardPage from "./pages/todos/TodoDashboardPage.jsx";

// ATTENDANCE

import Attendance from "./pages/attendance/Attendance.jsx";



// ROUTE PROTECTION

import ProtectedRoute from "./routes/ProtectedRoute.jsx";



import "react-toastify/dist/ReactToastify.css";

//Receipts
import ReceiptDashboardPage from "./pages/receipts/ReceiptDashboardPage.jsx";
import ReceiptPage from "./pages/receipts/ReceiptPage.jsx";
import QuotationManagementPage from "./pages/quotations/QuotationManagementPage.jsx";
import ExpenseManagementPage from "./pages/expenses/ExpenseManagementPage.jsx";
import NewExpensePage from "./pages/expenses/NewExpensePage.jsx";
import ExpenseDetailsPage from "./pages/expenses/ExpenseDetailsPage.jsx";
import EditExpensePage from "./pages/expenses/EditExpensePage.jsx";
import ExpenseDashboardPage from "./pages/expenses/ExpenseDashboardPage.jsx";


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
                requiredPermission={PERMISSIONS.CLIENT_READ}
              >
                <ClientsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/clients/add"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.CLIENT_CREATE}
              >
                <AddClient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/clients/:clientId/edit"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.CLIENT_UPDATE}
              >
                <EditClient />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/clients/:clientId"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.CLIENT_READ}
              >
                <ClientDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/clients/:clientId/documents"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DOCUMENT_READ}
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

          <Route
            path="/dashboard/services/workflow-templates"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                ]}
              >
                <WorkflowTemplatesPage />
              </ProtectedRoute>
            }
          />

          {/* INVOICES */}
          <Route
            path="/dashboard/invoices"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.INVOICE_READ}
              >
                <InvoiceDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/invoices/new"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.INVOICE_CREATE}
              >
                <InvoiceDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/invoices/:invoiceId"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.INVOICE_READ}
              >
                <InvoiceDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* QUOTATIONS */}
          <Route
            path="/dashboard/quotations"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <QuotationManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/quotations/new"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <QuotationManagementPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/quotations/:quotationId"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                  "Partner",
                  "Manager",
                  "Employee",
                ]}
              >
                <QuotationManagementPage />
              </ProtectedRoute>
            }
          />

          {/* TASKS */}
          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TASK_READ}
              >
                <TasksList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/tasks/add"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TASK_CREATE}
              >
                <CreateTask />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/tasks/:taskId/edit"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TASK_UPDATE}
              >
                <EditTask />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/tasks/:taskId"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TASK_READ}
              >
                <TaskDetails />
              </ProtectedRoute>
            }
          />

          {/* DOCUMENTS */}
          <Route
            path="/dashboard/documents"
            element={
              <Navigate to="/dashboard/documents/in-out" replace />
            }
          />

          <Route
            path="/dashboard/documents/in-out"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DOCUMENT_READ}
              >
                <DocumentsInOutRegister />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/documents/dsc"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DOCUMENT_READ}
              >
                <DscManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/documents/collection"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DOCUMENT_READ}
              >
                <DocumentCollection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/documents/upload"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.DOCUMENT_UPLOAD}
              >
                <UploadDocument />
              </ProtectedRoute>
            }
          />

          {/* REPORTS */}
          <Route
            path="/dashboard/reports"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/reports/tasks"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <TaskReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/reports/services"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <ServiceReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/reports/clients"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <ClientReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/reports/employees"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <EmployeeReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/reports/export"
            element={
              <ProtectedRoute requiredPermission={PERMISSIONS.REPORTS_VIEW}>
                <ExportCenter />
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

          {/* RECEIPTS */}
          <Route
            path="/dashboard/expenses"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ExpenseManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/expenses/new"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <NewExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/expenses/dashboard"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ExpenseDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/expenses/:expenseId"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ExpenseDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/expenses/:expenseId/edit"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <EditExpensePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/receipts"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ReceiptDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/receipts/new"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/receipts/:receiptId"
            element={
              <ProtectedRoute allowedRoles={["SuperAdmin", "Partner", "Manager"]}>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />

          {/* ATTENDANCE */}
          <Route
            path="/dashboard/attendance"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "SuperAdmin",
                ]}
              >
                <Attendance />
              </ProtectedRoute>
            }
          />

          {/* TODO */}
          <Route
            path="/dashboard/todos"
            element={
              <ProtectedRoute
                requiredPermission={PERMISSIONS.TODO_READ}
              >
                <TodoDashboardPage />
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
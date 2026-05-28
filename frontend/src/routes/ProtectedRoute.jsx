import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({
  children,
  allowedRoles = [],
}) => {
  const {
    user,
    initializing,
  } = useAuth();

  const location = useLocation();

  // auth still initializing
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>

          <h2 className="text-xl font-semibold">
            Initializing Session...
          </h2>

          <p className="text-slate-400 mt-2">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    );
  }

  // no authenticated user
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // role validation
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="bg-slate-900 border border-slate-700 p-10 rounded-2xl text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-400">
            Unauthorized Access
          </h1>

          <p className="text-slate-400">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

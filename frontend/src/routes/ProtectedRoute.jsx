import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-center">
        <div className="card">
          <h1>Unauthorized</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

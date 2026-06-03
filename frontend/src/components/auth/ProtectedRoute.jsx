import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { token, user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={styles.center}>
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

const styles = {
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "40vh",
    fontSize: "18px",
  },
};

export default ProtectedRoute;
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function ProtectedRoute() {
  const {
    isAuthenticated,
    authLoading,
  } = useAuth();

  /*
    Wait until we determine whether an
    existing session is still valid.
  */
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading...
      </div>
    );
  }

  /*
    User is not authenticated.
    Send them to Login.
  */
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  /*
    User is authenticated.
    Render the requested protected page.
  */
  return <Outlet />;
}

export default ProtectedRoute;
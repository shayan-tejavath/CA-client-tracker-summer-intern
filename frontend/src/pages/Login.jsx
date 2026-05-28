import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login({ email, password });
      console.log("[LOGIN] Success:", {
        userId: userData.id,
        role: userData.role,
        email: userData.email,
        hasToken: !!userData.token,
      });
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Unable to sign in. Please check your credentials.";
      console.error("[LOGIN] Error:", errorMessage, err.response?.status);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card login-card">
        <h1>Welcome back</h1>
        <p>Sign in to access the CA practice management dashboard.</p>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <div className="alert danger">{error}</div>}
          <button type="submit" className="button primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

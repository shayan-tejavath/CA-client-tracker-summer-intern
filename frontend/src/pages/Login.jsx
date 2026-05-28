import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const blockedDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const from =
    location.state?.from?.pathname || "/dashboard";

  const validateOfficialEmail = (emailAddress) => {
    const domain = emailAddress.split("@")[1];

    if (!domain) return false;

    return !blockedDomains.includes(domain.toLowerCase());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // basic validation
    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    // official email validation
    if (!validateOfficialEmail(email)) {
      setError(
        "Please use your official company email address."
      );
      return;
    }

    // password validation
    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const userData = await login({
        email,
        password,
      });

      // optional remember me handling
      if (!rememberMe) {
        sessionStorage.setItem(
          "temp_user",
          JSON.stringify(userData)
        );
      }

      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to sign in. Please check your credentials.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-grid">
        <aside className="login-info">
          <div>
            <p className="login-badge">QwikCA</p>

            <h1>Welcome back</h1>

            <p>
              Sign in to access your CA practice management dashboard with
              secure access to clients, tasks, documents, and compliance tools.
            </p>
          </div>

          <div className="login-highlights">
            <div className="login-highlight">
              <strong>Secure access</strong>

              <span>
                Official company email sign-in with enterprise
                session control.
              </span>
            </div>

            <div className="login-highlight">
              <strong>Smart validation</strong>

              <span>
                Built-in checks guide you to the right credentials
                every time.
              </span>
            </div>

            <div className="login-highlight">
              <strong>Quick workflow return</strong>

              <span>
                Get back to managing clients and deadlines without
                friction.
              </span>
            </div>
          </div>
        </aside>

        <section className="page-card login-card">
          <div className="login-card-header">
            <h1>Sign in to continue</h1>

            <p>
              Use your official email and password to access the
              QwikCA dashboard.
            </p>
          </div>

          {error && (
            <div className="alert danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form-stack">
            <label htmlFor="email">Official Email</label>

            <input
              id="email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <label htmlFor="password">Password</label>

            <div className="password-row">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="password-toggle"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="login-meta-row">
              <label className="remember-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="remember-checkbox-input"
                />
                <span>Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-link"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button primary full"
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>
          </form>

          <div className="login-footer">
            Secure enterprise authentication powered by
            QwikCA
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import "../styles/login.css";

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

  const from = location.state?.from?.pathname || "/dashboard";

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
      setError("Please use your official company email address.");
      return;
    }

    // password validation
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
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

      const redirectPath =
        userData.role === "Client" &&
        (from === "/dashboard" || from === "/")
          ? "/dashboard"
          : from;

      navigate(redirectPath, { replace: true });
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
    <div className="login-page">
      {/* Background Orbs */}
      <div className="login-orb one" aria-hidden="true" />
      <div className="login-orb two" aria-hidden="true" />

      <div className="login-container">
        
        {/* ======================================================= */}
        {/* LEFT SIDE: Branding & Features                          */}
        {/* ======================================================= */}
        <aside className="login-left fade-right">
          <Link to="/" className="login-brand" style={{ textDecoration: 'none' }}>
            <div className="login-logo">
              <Briefcase size={26} strokeWidth={2.5} />
            </div>
            <div>
              <h2>QwikCA</h2>
              <span>Enterprise Practice Management</span>
            </div>
          </Link>

          <h1 className="login-title">
            Welcome <span>back</span>
          </h1>

          <p className="login-description">
            Sign in to access your CA practice management dashboard with
            secure access to clients, tasks, documents, and compliance tools.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4>Secure Authentication</h4>
                <p>Bank-level encryption protecting your sensitive practice data and client documents.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <Briefcase size={24} />
              </div>
              <div>
                <h4>Practice Management</h4>
                <p>Streamline daily operations, billing, and resource allocation from one dashboard.</p>
              </div>
            </div>

            <div className="login-feature">
              <div className="login-feature-icon">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4>Real-time Workflow</h4>
                <p>Collaborate seamlessly with your partners, articled assistants, and clients.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ======================================================= */}
        {/* RIGHT SIDE: Authentication Form                         */}
        {/* ======================================================= */}
        <section className="login-card-wrapper fade-left">
          <div className="login-card">
            <div className="login-card-header">
              <h3>Sign in to continue</h3>
              <p>Enter your official credentials to access your workspace.</p>
            </div>

            {error && (
              <div className="login-error mb-3 flex items-center gap-2">
                <AlertCircle size={18} strokeWidth={2.5} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>

              {/* Email Input */}
              <div className="login-group">
                <label htmlFor="email" className="login-label">
                  Official Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="login-input w-100"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@qwikca.com"
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="login-group">
                <label htmlFor="password" className="login-label">
                  Password
                </label>
                <div className="password-wrapper w-100">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="login-input w-100"
                    style={{ paddingRight: "70px" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="login-options">
                <label className="remember cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link" style={{ textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-button mt-1 flex items-center justify-center gap-2 w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

            </form>

            <div className="login-footer">
              Secure enterprise authentication powered by QwikCA
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Login;

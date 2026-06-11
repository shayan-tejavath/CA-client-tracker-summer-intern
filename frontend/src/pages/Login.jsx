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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .qca-login-shell {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #09090f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 24px;
        }

        /* Background Effects */
        .qca-login-shell::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        .qca-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          opacity: 0.4; animation: qca-orb-float 15s linear infinite;
        }
        .qca-orb-purple {
          width: 450px; height: 450px;
          background: radial-gradient(circle, #7C3AED 0%, transparent 70%);
          top: -100px; right: -50px;
        }
        .qca-orb-orange {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #F97316 0%, transparent 70%);
          bottom: -50px; left: -100px;
          animation-delay: -5s; opacity: 0.25;
        }

        @keyframes qca-orb-float {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(30px, -40px) scale(1.05); }
          66%  { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* Layout Grid */
        .qca-login-grid {
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          max-width: 1080px;
          width: 100%;
          align-items: center;
        }

        /* Left Info Section */
        .qca-login-info {
          color: #fff;
          animation: qca-fade-right 0.6s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes qca-fade-right {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .qca-login-brand {
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none; margin-bottom: 40px;
        }
        
        .qca-logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #F97316 100%);
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 16px;
          box-shadow: 0 0 20px rgba(124,58,237,0.5);
        }

        .qca-brand-text {
          font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.4px;
        }

        .qca-login-info h1 {
          font-size: clamp(2.2rem, 4vw, 3rem); font-weight: 800;
          letter-spacing: -0.04em; line-height: 1.1; margin-bottom: 20px;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }

        .qca-login-info > p {
          font-size: 1.05rem; color: rgba(255,255,255,0.55);
          line-height: 1.7; margin-bottom: 48px; max-width: 440px;
        }

        .qca-login-highlights {
          display: flex; flex-direction: column; gap: 28px;
        }

        .qca-login-highlight {
          display: flex; align-items: flex-start; gap: 16px;
        }

        .qca-highlight-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(124,58,237,0.1); color: #A855F7;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          border: 1px solid rgba(124,58,237,0.2);
        }

        .qca-highlight-text strong {
          display: block; font-size: 1rem; font-weight: 700; color: #fff;
          margin-bottom: 4px; letter-spacing: -0.01em;
        }
        .qca-highlight-text span {
          display: block; font-size: 0.9rem; color: rgba(255,255,255,0.45); line-height: 1.5;
        }

        /* Right Form Card Section */
        .qca-login-card-wrapper {
          animation: qca-fade-left 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }

        @keyframes qca-fade-left {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .qca-login-card {
          background: rgba(18, 10, 35, 0.6);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 48px;
          box-shadow: 0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          position: relative; overflow: hidden;
        }

        .qca-login-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent);
        }

        .qca-card-header { margin-bottom: 32px; }
        .qca-card-header h2 {
          font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 8px; letter-spacing: -0.02em;
        }
        .qca-card-header p {
          font-size: 0.95rem; color: rgba(255,255,255,0.45);
        }

        /* Alerts */
        .qca-alert-danger {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FCA5A5; padding: 14px 16px; border-radius: 12px; font-size: 0.9rem;
          margin-bottom: 24px; display: flex; align-items: center; gap: 10px;
          animation: qca-shake 0.4s ease-in-out;
        }

        @keyframes qca-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        /* Form Elements */
        .qca-form-stack { display: flex; flex-direction: column; gap: 20px; }
        .qca-form-group { display: flex; flex-direction: column; gap: 8px; }
        
        .qca-label {
          font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7);
        }

        .qca-input-wrapper { position: relative; display: flex; align-items: center; }

        .qca-input {
          width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1); color: #fff;
          padding: 14px 16px; border-radius: 12px; font-size: 0.95rem;
          font-family: inherit; transition: all 0.2s ease;
        }
        .qca-input::placeholder { color: rgba(255,255,255,0.25); }
        .qca-input:hover { border-color: rgba(255,255,255,0.2); }
        .qca-input:focus {
          border-color: #7C3AED; outline: none; background: rgba(124,58,237,0.05);
          box-shadow: 0 0 0 4px rgba(124,58,237,0.15);
        }

        .qca-password-toggle {
          position: absolute; right: 12px;
          background: transparent; border: none; color: rgba(255,255,255,0.4);
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.05em; cursor: pointer; padding: 6px 10px;
          border-radius: 6px; transition: all 0.2s;
        }
        .qca-password-toggle:hover { background: rgba(255,255,255,0.08); color: #fff; }

        /* Meta Row (Remember & Forgot) */
        .qca-login-meta {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 4px; margin-bottom: 8px;
        }

        .qca-checkbox-label {
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
        }
        .qca-checkbox-input {
          appearance: none; width: 18px; height: 18px;
          border: 1px solid rgba(255,255,255,0.2); border-radius: 4px;
          background: rgba(255,255,255,0.03); outline: none; transition: all 0.2s;
          display: grid; place-content: center; cursor: pointer;
        }
        .qca-checkbox-input::before {
          content: ""; width: 10px; height: 10px; transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em #fff;
          transform-origin: center;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .qca-checkbox-input:checked {
          background: #7C3AED; border-color: #7C3AED;
        }
        .qca-checkbox-input:checked::before { transform: scale(1); }
        .qca-checkbox-text { font-size: 0.85rem; color: rgba(255,255,255,0.6); font-weight: 500; }

        .qca-text-link {
          font-size: 0.85rem; color: #A855F7; text-decoration: none; font-weight: 600;
          transition: color 0.2s;
        }
        .qca-text-link:hover { color: #D8B4FE; }

        /* Submit Button */
        .qca-btn-submit {
          width: 100%; background: linear-gradient(135deg, #7C3AED, #9333EA);
          color: #fff; border: none; padding: 16px; border-radius: 12px;
          font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 14px rgba(124,58,237,0.4);
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .qca-btn-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .qca-btn-submit:hover:not(:disabled) {
          transform: translateY(-2px); box-shadow: 0 6px 24px rgba(124,58,237,0.55);
        }
        .qca-btn-submit:hover::before { opacity: 1; }
        .qca-btn-submit:active:not(:disabled) { transform: translateY(0); }
        .qca-btn-submit:disabled {
          opacity: 0.7; cursor: not-allowed; filter: grayscale(50%);
        }

        .qca-login-footer {
          margin-top: 32px; text-align: center;
          font-size: 0.8rem; color: rgba(255,255,255,0.3); font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 960px) {
          .qca-login-grid { gap: 40px; }
          .qca-login-card { padding: 32px; }
        }

        @media (max-width: 768px) {
          .qca-login-shell { padding: 16px; padding-top: 40px; align-items: flex-start; }
          .qca-login-grid { grid-template-columns: 1fr; gap: 32px; }
          .qca-login-info > p { margin-bottom: 24px; }
          .qca-login-highlights { display: none; } /* Hide highlights on mobile to save space */
          .qca-login-brand { margin-bottom: 24px; }
        }
      `}</style>

      <div className="qca-login-shell">
        <div className="qca-orb qca-orb-purple" aria-hidden="true" />
        <div className="qca-orb qca-orb-orange" aria-hidden="true" />

        <div className="qca-login-grid">
          {/* Left Side: Brand & Info */}
          <aside className="qca-login-info">
            <Link to="/" className="qca-login-brand">
              <div className="qca-logo-mark">Q</div>
              <span className="qca-brand-text">QwikCA</span>
            </Link>

            <h1>Welcome back</h1>
            <p>
              Sign in to access your CA practice management dashboard with
              secure access to clients, tasks, documents, and compliance tools.
            </p>

            <div className="qca-login-highlights">
              <div className="qca-login-highlight">
                <div className="qca-highlight-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="qca-highlight-text">
                  <strong>Secure access</strong>
                  <span>Official company email sign-in with enterprise session control.</span>
                </div>
              </div>

              <div className="qca-login-highlight">
                <div className="qca-highlight-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="qca-highlight-text">
                  <strong>Smart validation</strong>
                  <span>Built-in checks guide you to the right credentials every time.</span>
                </div>
              </div>

              <div className="qca-login-highlight">
                <div className="qca-highlight-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="qca-highlight-text">
                  <strong>Quick workflow return</strong>
                  <span>Get back to managing clients and deadlines without friction.</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Side: Login Form */}
          <section className="qca-login-card-wrapper">
            <div className="qca-login-card">
              <div className="qca-card-header">
                <h2>Sign in to continue</h2>
                <p>Use your official email and password to access the dashboard.</p>
              </div>

              {error && (
                <div className="qca-alert-danger" role="alert">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="qca-form-stack">
                <div className="qca-form-group">
                  <label htmlFor="email" className="qca-label">Official Email</label>
                  <div className="qca-input-wrapper">
                    <input
                      id="email"
                      type="email"
                      className="qca-input"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                    />
                  </div>
                </div>

                <div className="qca-form-group">
                  <label htmlFor="password" className="qca-label">Password</label>
                  <div className="qca-input-wrapper">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="qca-input"
                      style={{ paddingRight: "70px" }}
                      value={password}
                      autoComplete="current-password"
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="qca-password-toggle"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="qca-login-meta">
                  <label className="qca-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      className="qca-checkbox-input"
                    />
                    <span className="qca-checkbox-text">Remember me</span>
                  </label>

                  <Link to="/forgot-password" className="qca-text-link">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="qca-btn-submit"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>

              <div className="qca-login-footer">
                Secure enterprise authentication powered by QwikCA
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default Login;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import "../../styles/superadmin-signup.css";
import { register } from "../../services/authService.js";

const initialForm = {
  companyName: "",
  ownerName: "",
  username: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const SuperAdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
    setSubmitError("");
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.companyName.trim()) {
      nextErrors.companyName = "Company name is required.";
    }

    if (!formData.ownerName.trim()) {
      nextErrors.ownerName = "Owner name is required.";
    }

    if (!formData.username.trim()) {
      nextErrors.username = "Username is required.";
    } else if (formData.username.trim().length < 4) {
      nextErrors.username = "Username must be at least 4 characters.";
    }

    if (!formData.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required.";
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(formData.mobile.trim())) {
      nextErrors.mobile = "Enter a valid mobile number.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      nextErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage("");
    setSubmitError("");

    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        companyName: formData.companyName.trim(),
        ownerName: formData.ownerName.trim(),
        username: formData.username.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: "SuperAdmin",
      });

      setSuccessMessage("Company created successfully. Redirecting to login...");
      setFormData(initialForm);
      setLogoPreview("");

      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to create your company account right now.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-orb one" aria-hidden="true" />
      <div className="signup-orb two" aria-hidden="true" />

      <div className="signup-container">
        <aside className="signup-left">
          <Link to="/" className="signup-brand" style={{ textDecoration: "none" }}>
            <div className="signup-logo">
              <Briefcase size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2>QwikCA</h2>
              <span>Enterprise Practice Management</span>
            </div>
          </Link>

          <h1 className="signup-title">
            Build your <span>practice empire</span>
          </h1>

          <p className="signup-description">
            Launch a secure company workspace for your CA firm with professional onboarding,
            centralized operations, and client-ready workflows.
          </p>

          <div className="signup-features">
            <div className="signup-feature">
              <div className="signup-feature-icon">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4>Enterprise grade security</h4>
                <p>Protect every client record and document with a trusted workspace foundation.</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="signup-feature-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <h4>Modern onboarding</h4>
                <p>Capture your firm details in a polished experience designed for scale.</p>
              </div>
            </div>

            <div className="signup-feature">
              <div className="signup-feature-icon">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4>Ready for growth</h4>
                <p>Support teams, clients, and compliance tasks from day one.</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="signup-card-wrapper">
          <div className="signup-card">
            <div className="signup-card-header">
              <div className="signup-badge">SuperAdmin Onboarding</div>
              <h3>Create your company workspace</h3>
              <p>Set up your firm profile with confidence and professionalism.</p>
            </div>

            {submitError && (
              <div className="signup-error-banner">
                <span>{submitError}</span>
              </div>
            )}

            {successMessage && (
              <div className="signup-success">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            <form className="signup-form" onSubmit={handleSubmit} noValidate>
              <div className="signup-grid">
                <div className="signup-group">
                  <label htmlFor="companyName" className="signup-label">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className={`signup-input ${errors.companyName ? "is-invalid" : ""}`}
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. QwikCA Advisory LLP"
                  />
                  {errors.companyName && <p className="signup-error-text">{errors.companyName}</p>}
                </div>

                <div className="signup-group">
                  <label htmlFor="ownerName" className="signup-label">
                    Owner Name
                  </label>
                  <input
                    id="ownerName"
                    name="ownerName"
                    type="text"
                    className={`signup-input ${errors.ownerName ? "is-invalid" : ""}`}
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="Enter the account owner"
                  />
                  {errors.ownerName && <p className="signup-error-text">{errors.ownerName}</p>}
                </div>

                <div className="signup-group">
                  <label htmlFor="username" className="signup-label">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className={`signup-input ${errors.username ? "is-invalid" : ""}`}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                  />
                  {errors.username && <p className="signup-error-text">{errors.username}</p>}
                </div>

                <div className="signup-group">
                  <label htmlFor="mobile" className="signup-label">
                    Mobile Number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    className={`signup-input ${errors.mobile ? "is-invalid" : ""}`}
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                  {errors.mobile && <p className="signup-error-text">{errors.mobile}</p>}
                </div>

                <div className="signup-group full-width">
                  <label htmlFor="email" className="signup-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`signup-input ${errors.email ? "is-invalid" : ""}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                  />
                  {errors.email && <p className="signup-error-text">{errors.email}</p>}
                </div>

                <div className="signup-group">
                  <label htmlFor="password" className="signup-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className={`signup-input ${errors.password ? "is-invalid" : ""}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                  />
                  {errors.password && <p className="signup-error-text">{errors.password}</p>}
                </div>

                <div className="signup-group">
                  <label htmlFor="confirmPassword" className="signup-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className={`signup-input ${errors.confirmPassword ? "is-invalid" : ""}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter the password"
                  />
                  {errors.confirmPassword && <p className="signup-error-text">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="signup-upload-card">
                <div className="signup-upload-header">
                  <div>
                    <h4>Company Logo</h4>
                    <p>Optional. Upload your brand mark for a polished workspace experience.</p>
                  </div>
                  <label className="signup-upload-button" htmlFor="logoUpload">
                    <UploadCloud size={18} />
                    Upload
                  </label>
                </div>
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  className="signup-upload-input"
                  onChange={handleLogoUpload}
                />
                <div className="signup-upload-preview">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Company logo preview" />
                  ) : (
                    <div className="signup-upload-placeholder">
                      <UploadCloud size={28} />
                      <span>PNG, JPG, or WebP up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="signup-submit-button" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="signup-spinner" />
                    Creating Company...
                  </>
                ) : (
                  "Create Company"
                )}
              </button>
            </form>

            <div className="signup-footer">
              <span>Already have an account?</span>
              <Link to="/login">Login</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminSignup;

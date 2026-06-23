import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const roles = ["SuperAdmin", "Partner", "Manager", "Employee", "Client"];

const EditUserModal = ({ user, isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ name: "", email: "", role: "Partner", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form when user is selected
  useEffect(() => {
    if (user && isOpen) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "Partner",
        password: "", // Don't pre-fill password
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // Role validation
    if (!form.role || !roles.includes(form.role)) {
      newErrors.role = "Valid role is required";
    }

    // Password validation (only if provided)
    if (form.password && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      // Only send password if it was changed
      const updateData = {
        name: form.name,
        email: form.email,
        role: form.role,
      };

      if (form.password) {
        updateData.password = form.password;
      }

      await onSave(user._id, updateData);
      toast.success("User updated successfully");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <style>{`
        /* ━━━━━━━━━━━━━━━━━━━━ MODAL ANIMATIONS & OVERLAY ━━━━━━━━━━━━━━━━━━━━ */
        @keyframes qca-modal-fade-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }

        @keyframes qca-modal-scale-up {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes qca-error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .qca-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(9, 9, 15, 0.7);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: qca-modal-fade-in 0.3s ease-out forwards;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* ── MODAL SURFACE ── */
        .qca-modal-content {
          width: 100%;
          max-width: 520px;
          background: rgba(18, 10, 35, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
          animation: qca-modal-scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Premium Top Gradient Line */
        .qca-modal-content::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #7C3AED, #06B6D4, transparent);
          opacity: 0.8;
        }

        /* ── HEADER ── */
        .qca-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .qca-modal-header h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #fff;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .qca-modal-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .qca-modal-close:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        /* ── BODY & FORM FIELDS ── */
        .qca-modal-body {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .qca-form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .qca-label-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .qca-form-field label {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }

        .qca-optional-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
          padding: 2px 8px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .qca-input, .qca-select {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        /* Custom Select Styling */
        .qca-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 16px;
          padding-right: 40px;
          cursor: pointer;
        }

        .qca-select option {
          background: #120a23;
          color: #fff;
        }

        .qca-input::placeholder { color: rgba(255, 255, 255, 0.25); }

        .qca-input:hover, .qca-select:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }

        .qca-input:focus, .qca-select:focus {
          border-color: #7C3AED;
          outline: none;
          background: rgba(124, 58, 237, 0.05);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }

        /* Error States */
        .qca-form-error {
          font-size: 0.8rem;
          color: #FCA5A5;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: qca-error-shake 0.4s ease-in-out;
        }

        .qca-form-error::before {
          content: '⚠️';
          font-size: 0.75rem;
        }

        .qca-input.qca-error-input, .qca-select.qca-error-input {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.05);
        }
        .qca-input.qca-error-input:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
        }

        /* ── FOOTER ACTIONS ── */
        .qca-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 24px 32px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .qca-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 20px;
          height: 44px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          font-family: inherit;
        }

        .qca-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          filter: grayscale(0.4);
        }

        .qca-btn-cancel {
          background: transparent;
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .qca-btn-cancel:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .qca-btn-save {
          background: linear-gradient(135deg, #7C3AED, #9333EA);
          color: #fff;
          border: none;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }

        .qca-btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(124, 58, 237, 0.5);
        }
      `}</style>

      <div className="qca-modal-overlay" onClick={onClose}>
        <div className="qca-modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="qca-modal-header">
            <h2>Edit User</h2>
            <button type="button" className="qca-modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="qca-modal-body">
              {/* Name Field */}
              <div className="qca-form-field">
                <label htmlFor="edit-name">Name</label>
                <input
                  id="edit-name"
                  name="name"
                  className={`qca-input ${errors.name ? "qca-error-input" : ""}`}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Full name"
                />
                {errors.name && <span className="qca-form-error">{errors.name}</span>}
              </div>

              {/* Email Field */}
              <div className="qca-form-field">
                <label htmlFor="edit-email">Email</label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  className={`qca-input ${errors.email ? "qca-error-input" : ""}`}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                />
                {errors.email && <span className="qca-form-error">{errors.email}</span>}
              </div>

              {/* Role Field */}
              <div className="qca-form-field">
                <label htmlFor="edit-role">Role</label>
                <select 
                  id="edit-role" 
                  name="role" 
                  className={`qca-select ${errors.role ? "qca-error-input" : ""}`}
                  value={form.role} 
                  onChange={handleChange}
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {errors.role && <span className="qca-form-error">{errors.role}</span>}
              </div>

              {/* Password Field */}
              <div className="qca-form-field">
                <div className="qca-label-wrapper">
                  <label htmlFor="edit-password">Password</label>
                  <span className="qca-optional-badge">Optional</span>
                </div>
                <input
                  id="edit-password"
                  name="password"
                  type="password"
                  className={`qca-input ${errors.password ? "qca-error-input" : ""}`}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                />
                {errors.password && <span className="qca-form-error">{errors.password}</span>}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="qca-modal-footer">
              <button 
                type="button" 
                className="qca-btn qca-btn-cancel" 
                onClick={onClose} 
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="qca-btn qca-btn-save" 
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditUserModal;
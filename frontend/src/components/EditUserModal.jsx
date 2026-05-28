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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-field">
            <label htmlFor="edit-name">Name</label>
            <input
              id="edit-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="edit-email">Email</label>
            <input
              id="edit-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="user@example.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="edit-role">Role</label>
            <select id="edit-role" name="role" value={form.role} onChange={handleChange}>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {errors.role && <span className="form-error">{errors.role}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="edit-password">
              Password <span className="form-optional">(leave blank to keep current)</span>
            </label>
            <input
              id="edit-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="New password (optional)"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="button button-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

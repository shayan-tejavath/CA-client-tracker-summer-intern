import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit3, Image as ImageIcon } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createAdminUser, getUserRoles } from "../../services/adminService.js";
import "../../styles/users.css";

const initialForm = {
  name: "",
  username: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "",
  isActive: true,
};

const CreateUser = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoadingRoles(true);
        const roleData = await getUserRoles();
        const roleNames = roleData.map((role) => role.name);
        setRoles(roleNames);
        setForm((current) => ({
          ...current,
          role: current.role || roleNames[0] || "",
        }));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load user roles.");
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const roleOptions = useMemo(() => roles.filter(Boolean), [roles]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.password || !form.role) {
      setError("Name, username, email, password and role are required.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("username", form.username.trim());
      payload.append("mobile", form.mobile.trim());
      payload.append("email", form.email.trim());
      payload.append("password", form.password);
      payload.append("role", form.role);
      payload.append("isActive", String(form.isActive));

      if (photo) {
        payload.append("photo", photo);
      }

      await createAdminUser(payload);
      navigate("/dashboard/users");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <form className="users-page" onSubmit={handleSubmit}>
        <div className="users-header">
          <div>
            <p className="users-breadcrumb">
              <Link to="/dashboard/users">Users</Link>
              <span>&gt;</span>
              New User
            </p>
            <h1>New User</h1>
          </div>
        </div>

        <section className="users-card">
          {error && <div className="users-alert">{error}</div>}

          <div className="form-grid">
            <label>Photo</label>
            <div className="photo-editor">
              <div className="photo-preview">
                {photoPreview ? <img src={photoPreview} alt="User preview" /> : <ImageIcon size={72} />}
              </div>

              <button
                type="button"
                className="photo-button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Choose user photo"
              >
                <Edit3 size={18} />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} />
              </button>
            </div>

            <label htmlFor="name">Name <span>*</span></label>
            <input id="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />

            <label htmlFor="username">Username <span>*</span></label>
            <input id="username" value={form.username} onChange={(event) => updateField("username", event.target.value)} />

            <label htmlFor="mobile">Mobile</label>
            <input id="mobile" value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} />

            <label htmlFor="email">Email <span>*</span></label>
            <input id="email" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />

            <label htmlFor="password">Password <span>*</span></label>
            <input id="password" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />

            <label htmlFor="confirmPassword">Confirm Password <span>*</span></label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
            />

            <label htmlFor="role">Role <span>*</span></label>
            <div>
              <select
                id="role"
                value={form.role}
                disabled={loadingRoles}
                onChange={(event) => updateField("role", event.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <p className="field-help">
                To create custom user roles go to <Link to="/dashboard/user-roles">Settings &gt; User Roles</Link>
              </p>
            </div>

            <label>Is Active?</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateField("isActive", event.target.checked)}
              />
              <span />
            </label>
          </div>
        </section>

        <button className="users-primary save-button" type="submit" disabled={saving || loadingRoles}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </DashboardLayout>
  );
};

export default CreateUser;

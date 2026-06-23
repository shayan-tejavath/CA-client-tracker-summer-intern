import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImageIcon, Pencil } from "lucide-react";
import { toast } from "react-toastify";
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
  const [form, setForm] = useState(initialForm);
  const [roles, setRoles] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadRoles = async () => {
      const data = await getUserRoles();
      setRoles(data);
      setForm((current) => ({ ...current, role: current.role || data[0]?.name || "" }));
    };

    loadRoles().catch(() => toast.error("Unable to load user roles."));
  }, []);

  const roleOptions = useMemo(() => roles.map((role) => role.name), [roles]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Password and confirm password must match.");
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key !== "confirmPassword") payload.append(key, value);
    });
    if (photo) payload.append("photo", photo);

    try {
      setSaving(true);
      await createAdminUser(payload);
      toast.success("User created successfully.");
      navigate("/dashboard/users");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to create user.");
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
              <Link to="/dashboard/users">Users</Link> <span>›</span> New User
            </p>
            <h1>New User</h1>
          </div>
        </div>

        <section className="users-card user-form-card">
          <div className="form-grid">
            <label>Photo</label>
            <div className="photo-editor">
              <div className="photo-preview">
                {photoPreview ? <img src={photoPreview} alt="Selected user" /> : <ImageIcon size={58} />}
              </div>
              <label className="photo-button">
                <Pencil size={18} />
                <input type="file" accept="image/*" onChange={handlePhotoChange} />
              </label>
            </div>

            <label>Name <span>*</span></label>
            <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />

            <label>Username <span>*</span></label>
            <input required value={form.username} onChange={(event) => updateField("username", event.target.value)} />

            <label>Mobile</label>
            <input value={form.mobile} onChange={(event) => updateField("mobile", event.target.value)} />

            <label>Email</label>
            <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />

            <label>Password <span>*</span></label>
            <input required type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} />

            <label>Confirm Password <span>*</span></label>
            <input required type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} />

            <label>Role <span>*</span></label>
            <div>
              <select required value={form.role} onChange={(event) => updateField("role", event.target.value)}>
                {roleOptions.map((role) => <option key={role}>{role}</option>)}
              </select>
              <p className="field-help">To create custom user roles go to <Link to="/dashboard/user-roles">User Roles</Link></p>
            </div>

            <label>Is Active?</label>
            <label className="toggle">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />
              <span />
            </label>
          </div>
        </section>

        <button className="users-primary save-button" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </DashboardLayout>
  );
};

export default CreateUser;

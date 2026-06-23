import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getClientById,
  updateClient,
  updateClientPhoto,
} from "../../services/clientService.js";
import "../../styles/edit-client.css";

const serviceOptions = [
  "GST Filing",
  "Income Tax Return",
  "TDS Filing",
  "ROC Compliance",
  "Audit",
  "Bookkeeping",
  "Payroll",
];

const EditClient = () => {
  const { clientId } = useParams();

  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const profileImageInputRef = useRef(null);

  useEffect(() => {
    const loadClient = async () => {
      try {
        const data =
          await getClientById(clientId);

        setClient({
          ...data,
          customServices: "",
          profileImagePreview: data.profileImage || "",
          profileImageFile: null,
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load client details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [clientId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setClient((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 512;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
          const quality = file.type === "image/png" ? 0.9 : 0.7;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error("Image compression failed."));
              }

              const compressedFile = new File([blob], file.name, {
                type: outputType,
              });
              const preview = canvas.toDataURL(outputType, quality);

              resolve({ compressedFile, preview });
            },
            outputType,
            quality
          );
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { compressedFile, preview } = await compressImage(file);
      setClient((current) => ({
        ...current,
        profileImageFile: compressedFile,
        profileImage: preview,
        profileImagePreview: preview,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Unable to process the selected image.");
    }
  };

  const handleServiceToggle = (
    service
  ) => {
    setClient((current) => {
      const alreadySelected =
        current.assignedServices?.includes(
          service
        );

      return {
        ...current,
        assignedServices:
          alreadySelected
            ? current.assignedServices.filter(
                (item) =>
                  item !== service
              )
            : [
                ...current.assignedServices,
                service,
              ],
      };
    });
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    setSaving(true);

    try {
      const customServicesArray =
        client.customServices
          .split(",")
          .map((service) =>
            service.trim()
          )
          .filter(Boolean);

      const {
        profileImage,
        profileImagePreview,
        profileImageFile,
        ...clientPayload
      } = client;
      let payload = {
        ...clientPayload,
        assignedServices: [
          ...client.assignedServices,
          ...customServicesArray,
        ],
      };
      delete payload.profileImage;
      delete payload.profileImagePreview;
      delete payload.profileImageFile;

      if (profileImageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, value);
          }
        });
        formData.append(
          "profileImage",
          profileImageFile,
          profileImageFile.name
        );

        await updateClient(clientId, formData);
      } else if (Object.keys(payload).length > 0) {
        await updateClient(clientId, payload);
      }

      toast.success(
        "Client updated successfully."
      );

      navigate(
        `/dashboard/clients/${clientId}`
      );
    } catch (err) {
      console.error("EditClient save error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card">

        <div className="page-header">
          <div>
            <p className="eyebrow">
              Clients
            </p>

            <h1>Edit client</h1>

            <p>
              Update client profile,
              services, and compliance
              information.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="alert">
            Loading client data…
          </div>
        ) : error ? (
          <div className="alert danger">
            {error}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="form-stack"
          >

            <div className="photo-section">
              <div
                className="photo-preview rounded-[20px] border border-slate-700 bg-slate-950 p-4 text-center"
                onClick={() => profileImageInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    profileImageInputRef.current?.click();
                  }
                }}
              >
                {client.profileImagePreview ? (
                  <img
                    src={client.profileImagePreview}
                    alt="Client profile"
                    className="mx-auto h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-slate-700 bg-slate-900 text-slate-500">
                    <span className="text-2xl">📷</span>
                  </div>
                )}

                <p className="mt-3 text-sm text-slate-400">
                  Click to upload or change profile photo
                </p>
              </div>

              <input
                ref={profileImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <label>
              Client name
              <input
                name="clientName"
                value={
                  client.clientName || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Client type
              <select
                name="clientType"
                value={
                  client.clientType ||
                  "Business"
                }
                onChange={handleChange}
              >
                <option value="Individual">
                  Individual
                </option>

                <option value="Business">
                  Business
                </option>

                <option value="Partnership">
                  Partnership
                </option>

                <option value="LLP">
                  LLP
                </option>

                <option value="Private Limited">
                  Private Limited
                </option>
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={
                  client.status ||
                  "Active"
                }
                onChange={handleChange}
              >
                <option value="Active">
                  Active
                </option>

                <option value="Pending">
                  Pending
                </option>

                <option value="Inactive">
                  Inactive
                </option>

                <option value="Archived">
                  Archived
                </option>
              </select>
            </label>

            <label>
              PAN
              <input
                name="pan"
                value={client.pan || ""}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              GSTIN
              <input
                name="gstin"
                value={
                  client.gstin || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              TAN
              <input
                name="tan"
                value={client.tan || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              CIN
              <input
                name="cin"
                value={client.cin || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              MSME Number
              <input
                name="msmeNumber"
                value={client.msmeNumber || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={
                  client.email || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Alternate Email
              <input
                name="alternateEmail"
                type="email"
                value={
                  client.alternateEmail || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Mobile
              <input
                name="mobile"
                value={
                  client.mobile || ""
                }
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Alternate Mobile
              <input
                name="alternateMobile"
                value={
                  client.alternateMobile || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Website
              <input
                name="website"
                value={client.website || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Address Line 1
              <input
                name="addressLine1"
                value={
                  client.addressLine1 || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Address Line 2
              <input
                name="addressLine2"
                value={
                  client.addressLine2 || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              City
              <input
                name="city"
                value={client.city || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              State
              <input
                name="state"
                value={client.state || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Pincode
              <input
                name="pincode"
                value={client.pincode || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Country
              <input
                name="country"
                value={client.country || ""}
                onChange={handleChange}
              />
            </label>

            <label>
              Contact Person Name
              <input
                name="contactPersonName"
                value={
                  client.contactPersonName || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Contact Person Designation
              <input
                name="contactPersonDesignation"
                value={
                  client.contactPersonDesignation || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Contact Person Mobile
              <input
                name="contactPersonMobile"
                value={
                  client.contactPersonMobile || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Contact Person Email
              <input
                name="contactPersonEmail"
                type="email"
                value={
                  client.contactPersonEmail || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Business Start Date
              <input
                name="businessStartDate"
                type="date"
                value={
                  client.businessStartDate || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Industry Type
              <input
                name="industryType"
                value={
                  client.industryType || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Annual Turnover
              <input
                name="annualTurnover"
                value={
                  client.annualTurnover || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Relationship Manager
              <input
                name="relationshipManager"
                value={
                  client.relationshipManager || ""
                }
                onChange={handleChange}
              />
            </label>

            <label>
              Assigned manager
              <input
                name="assignedManager"
                value={
                  client.assignedManager ||
                  ""
                }
                onChange={handleChange}
              />
            </label>

            {/* SERVICES */}
            <div>
              <p className="detail-label">
                Assigned Services
              </p>

              <div className="services-grid">
                {serviceOptions.map(
                  (service) => (
                    <label
                      key={service}
                      className="service-checkbox"
                    >
                      <input
                        type="checkbox"
                        checked={client.assignedServices?.includes(
                          service
                        )}
                        onChange={() =>
                          handleServiceToggle(
                            service
                          )
                        }
                      />

                      <span>
                        {service}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* CUSTOM SERVICES */}
            <label>
              Custom Services
              <input
                name="customServices"
                value={
                  client.customServices ||
                  ""
                }
                onChange={handleChange}
                placeholder="Startup Registration, FEMA Consulting"
              />
            </label>

            <label>
              Full Address
              <textarea
                name="address"
                value={
                  client.address || ""
                }
                onChange={handleChange}
                rows="3"
              />
            </label>

            <label>
              Internal Notes
              <textarea
                name="notes"
                value={
                  client.notes || ""
                }
                onChange={handleChange}
                rows="3"
              />
            </label>

            {error && (
              <div className="alert danger">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="button primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>

              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  navigate(
                    `/dashboard/clients/${clientId}`
                  )
                }
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </DashboardLayout>
  );
};

export default EditClient;

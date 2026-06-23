import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { createClient } from "../../services/clientService.js";
import "../../styles/add-client.css";

const serviceOptions = [
  "GST Filing",
  "Income Tax Return",
  "TDS Filing",
  "ROC Compliance",
  "Audit",
  "Bookkeeping",
  "Payroll",
];

const initialState = {
  clientName: "",
  profileImage: "",
  profileImagePreview: "",
  profileImageFile: null,
  clientCode: "",
  pan: "",
  gstin: "",
  tan: "",
  cin: "",
  msmeNumber: "",
  mobile: "",
  alternateMobile: "",
  email: "",
  alternateEmail: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  country: "",
  contactPersonName: "",
  contactPersonDesignation: "",
  contactPersonMobile: "",
  contactPersonEmail: "",
  contactPersonDob: "",
  businessStartDate: "",
  industryType: "",
  annualTurnover: "",
  relationshipManager: "",
  assignedEmployees: "",
  services: "",
  tags: "",
  allowLogin: false,
  temporaryPassword: "",
  notificationPreferences: {
    email: true,
    sms: false,
    push: false,
  },
  clientType: "Business",
  status: "Active",
  assignedManager: "",
  notes: "",
  assignedServices: [],
  customServices: "",
};

const gstinStateCodes = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  25: "Daman and Diu",
  26: "Dadra and Nagar Haveli",
  27: "Maharashtra",
  28: "Andhra Pradesh",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh (New)",
  38: "Ladakh",
};

const getGstinState = (gstin) => {
  if (!gstin || gstin.length < 2) return "";
  const prefix = gstin.slice(0, 2);
  return gstinStateCodes[prefix] || "";
};

const validateClient = (data) => {
  if (!data.clientName.trim())
    return "Client name is required.";

  if (!data.pan.trim())
    return "PAN is required.";

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
      data.pan.trim()
    )
  ) {
    return "PAN must be a valid format.";
  }

  if (!data.gstin.trim())
    return "GSTIN is required.";

  if (
    !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(
      data.gstin.trim()
    )
  ) {
    return "GSTIN must be a valid format.";
  }

  if (!data.mobile.trim())
    return "Mobile number is required.";

  if (
    !/^[0-9]{10,15}$/.test(
      data.mobile.trim()
    )
  ) {
    return "Mobile number must contain 10 to 15 digits.";
  }

  if (!data.email.trim())
    return "Email is required.";

  if (!/.+@.+\..+/.test(data.email.trim())) {
    return "Email must be valid.";
  }

  if (!data.address.trim())
    return "Address is required.";

  return null;
};

const AddClient = () => {
  const navigate = useNavigate();

  const [client, setClient] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const profileImageInputRef = useRef(null);

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
        current.assignedServices.includes(
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

  const getRandomDigit = () => Math.floor(Math.random() * 10);
  const getRandomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  const buildPan = () => {
    return Array.from({ length: 5 }, getRandomLetter)
      .join("") +
      Array.from({ length: 4 }, getRandomDigit)
        .join("") +
      getRandomLetter();
  };

  const buildGstin = (pan) => {
    const stateCode = "27"; // Maharashtra sample code
    const entityCode = getRandomDigit();
    const checksum = getRandomLetter();
    return `${stateCode}${pan}${entityCode}Z${checksum}`;
  };

  const buildTan = () => {
    return Array.from({ length: 4 }, getRandomLetter)
      .join("") +
      Array.from({ length: 5 }, getRandomDigit)
        .join("") +
      getRandomLetter();
  };

  const handleAutoFillCredentials = () => {
    const suffix = Date.now().toString().slice(-4);
    const pan = buildPan();
    const gstin = buildGstin(pan);
    const tan = buildTan();
    const clientName = `Sample Client ${suffix}`;

    setClient((current) => ({
      ...current,
      clientName,
      clientCode: `CLT-${suffix}`,
      pan,
      gstin,
      tan,
      cin: `U12345MH2024PTC${suffix.padStart(6, "0")}`,
      msmeNumber: `UAM-${suffix}0000`,
      mobile: `90000${suffix}`.slice(0, 10),
      alternateMobile: `90001${suffix}`.slice(0, 10),
      email: `client${suffix}@example.com`,
      alternateEmail: `contact${suffix}@example.com`,
      website: `https://client${suffix}.example.com`,
      addressLine1: "12 Sample Street",
      addressLine2: "Suite 101",
      address: "12 Sample Street, Suite 101, Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      contactPersonName: "Rahul Sharma",
      contactPersonDesignation: "Operations Head",
      contactPersonMobile: "9123456780",
      contactPersonEmail: `rahul.sharma${suffix}@example.com`,
      businessStartDate: "2023-04-01",
      industryType: "Accounting",
      annualTurnover: "10,00,000",
      relationshipManager: "Pooja Mehta",
      assignedServices: ["GST Filing", "TDS Filing"],
      customServices: "",
      status: "Active",
      clientType: "Business",
    }));

    toast.success("Client credentials auto-filled.");
  };

  const handleGstinAutoFill = () => {
    const gstin = client.gstin.trim().toUpperCase();
    const validGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(gstin);

    if (!validGstin) {
      toast.error("Enter a valid GSTIN before autofill.");
      return;
    }

    const state = getGstinState(gstin);

    setClient((current) => ({
      ...current,
      gstin,
      state: state || current.state,
      country: "India",
    }));

    if (state) {
      toast.success(`GSTIN auto-filled state: ${state}`);
    } else {
      toast.success("GSTIN autofill applied.");
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const validationError =
      validateClient(client);

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

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
        formData.append("profileImage", profileImageFile, profileImageFile.name);
        payload = formData;
      }

      await createClient(payload);

      toast.success(
        "Client added successfully."
      );

      navigate(
        "/dashboard/clients",
        {
          replace: true,
        }
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to add client. Please try again."
      );

      toast.error(
        err.response?.data?.message ||
          "Unable to add client. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="page-card add-client-page">
        <div className="page-header add-client-page__header">
          <div>
            <p className="eyebrow">
              Clients
            </p>

            <h1>Add client</h1>

            <p>
              Create a complete client
              profile with compliance and
              service information.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="add-client-form"
        >
          <section className="form-section">
            <div className="section-head section-head--with-actions">
              <div>
                <h2>Basic Details</h2>
                <p>Enter the core profile details for the client.</p>
              </div>
              <div className="section-head-actions">
                <button
                  type="button"
                  onClick={handleAutoFillCredentials}
                  className="button secondary"
                >
                  Auto-fill credentials
                </button>
                <button
                  type="button"
                  onClick={handleGstinAutoFill}
                  className="button secondary"
                >
                  Autofill from GSTIN
                </button>
              </div>
            </div>

            <div className="basic-details-layout">
              <div className="profile-upload">
                <div className="profile-upload__head">
                  <div>
                    <p className="profile-upload__label">Photo</p>
                    <p className="profile-upload__hint">Upload or edit the client photo used in profiles.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    className="button secondary button--sm"
                  >
                    Change
                  </button>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => profileImageInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      profileImageInputRef.current?.click();
                    }
                  }}
                  className="profile-upload__dropzone"
                >
                  {client.profileImagePreview || client.profileImage ? (
                    <img
                      src={client.profileImagePreview || client.profileImage}
                      alt="Client"
                      className="profile-upload__image"
                    />
                  ) : (
                    <span className="profile-upload__placeholder">📷</span>
                  )}
                </div>
                <p className="profile-upload__caption">
                  Click image to update photo
                </p>
                <input
                  id="profileImageInput"
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="visually-hidden"
                />
              </div>

              <div className="form-grid">
                <div className="field field--full">
                  <label htmlFor="clientName">Client Name</label>
                  <input
                    id="clientName"
                    name="clientName"
                    value={client.clientName}
                    onChange={handleChange}
                    placeholder="Client name"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="clientType">Client Type</label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={client.clientType}
                    onChange={handleChange}
                  >
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Partnership">Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="Private Limited">Private Limited</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={client.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="field field--full">
                  <label htmlFor="relationshipManager">Relationship Manager</label>
                  <input
                    id="relationshipManager"
                    name="relationshipManager"
                    value={client.relationshipManager}
                    onChange={handleChange}
                    placeholder="Relationship manager"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Tax Details</h2>
              <p>Add PAN, GSTIN and other fiscal identifiers.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="pan">PAN</label>
                <input
                  id="pan"
                  name="pan"
                  value={client.pan}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="gstin">GSTIN</label>
                <input
                  id="gstin"
                  name="gstin"
                  value={client.gstin}
                  onChange={(event) => {
                    const value = event.target.value.toUpperCase();
                    setClient((current) => ({
                      ...current,
                      gstin: value,
                    }));
                  }}
                  placeholder="22ABCDE1234F2Z5"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="tan">TAN</label>
                <input
                  id="tan"
                  name="tan"
                  value={client.tan}
                  onChange={handleChange}
                  placeholder="ABCD12345E"
                />
              </div>

              <div className="field">
                <label htmlFor="cin">CIN</label>
                <input
                  id="cin"
                  name="cin"
                  value={client.cin}
                  onChange={handleChange}
                  placeholder="U12345MH2024PTC000000"
                />
              </div>

              <div className="field field--full">
                <label htmlFor="msmeNumber">MSME Number</label>
                <input
                  id="msmeNumber"
                  name="msmeNumber"
                  value={client.msmeNumber}
                  onChange={handleChange}
                  placeholder="MSME123456789"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Contact Details</h2>
              <p>Add phone, email and website details.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="mobile">Primary Mobile</label>
                <input
                  id="mobile"
                  name="mobile"
                  value={client.mobile}
                  onChange={handleChange}
                  placeholder="Primary mobile"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="alternateMobile">Secondary Mobile</label>
                <input
                  id="alternateMobile"
                  name="alternateMobile"
                  value={client.alternateMobile}
                  onChange={handleChange}
                  placeholder="Secondary mobile"
                />
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={client.email}
                  onChange={handleChange}
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="alternateEmail">Alternate Email</label>
                <input
                  id="alternateEmail"
                  name="alternateEmail"
                  type="email"
                  value={client.alternateEmail}
                  onChange={handleChange}
                  placeholder="alternate@example.com"
                />
              </div>

              <div className="field field--full">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="website"
                  value={client.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Address Details</h2>
              <p>Fill in the client&apos;s registered address information.</p>
            </div>
            <div className="form-grid">
              <div className="field field--full">
                <label htmlFor="addressLine1">Address Line 1</label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  value={client.addressLine1}
                  onChange={handleChange}
                  placeholder="Address Line 1"
                />
              </div>

              <div className="field field--full">
                <label htmlFor="addressLine2">Address Line 2</label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  value={client.addressLine2}
                  onChange={handleChange}
                  placeholder="Address Line 2"
                />
              </div>

              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  value={client.city}
                  onChange={handleChange}
                  placeholder="City"
                />
              </div>

              <div className="field">
                <label htmlFor="state">State</label>
                <input
                  id="state"
                  name="state"
                  value={client.state}
                  onChange={handleChange}
                  placeholder="State"
                />
              </div>

              <div className="field">
                <label htmlFor="pincode">Pincode</label>
                <input
                  id="pincode"
                  name="pincode"
                  value={client.pincode}
                  onChange={handleChange}
                  placeholder="Pincode"
                />
              </div>

              <div className="field">
                <label htmlFor="country">Country</label>
                <input
                  id="country"
                  name="country"
                  value={client.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Contact Person</h2>
              <p>Add the primary contact for this client.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="contactPersonName">Contact Person Name</label>
                <input
                  id="contactPersonName"
                  name="contactPersonName"
                  value={client.contactPersonName}
                  onChange={handleChange}
                  placeholder="Name"
                />
              </div>

              <div className="field">
                <label htmlFor="contactPersonDesignation">Designation</label>
                <input
                  id="contactPersonDesignation"
                  name="contactPersonDesignation"
                  value={client.contactPersonDesignation}
                  onChange={handleChange}
                  placeholder="Designation"
                />
              </div>

              <div className="field">
                <label htmlFor="contactPersonMobile">Mobile</label>
                <input
                  id="contactPersonMobile"
                  name="contactPersonMobile"
                  value={client.contactPersonMobile}
                  onChange={handleChange}
                  placeholder="Contact mobile"
                />
              </div>

              <div className="field">
                <label htmlFor="contactPersonEmail">Email</label>
                <input
                  id="contactPersonEmail"
                  name="contactPersonEmail"
                  type="email"
                  value={client.contactPersonEmail}
                  onChange={handleChange}
                  placeholder="Contact email"
                />
              </div>

              <div className="field field--full">
                <label htmlFor="contactPersonDob">Date Of Birth</label>
                <input
                  id="contactPersonDob"
                  name="contactPersonDob"
                  type="date"
                  value={client.contactPersonDob}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Business Information</h2>
              <p>Capture company details and financial metadata.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="businessStartDate">Business Start Date</label>
                <input
                  id="businessStartDate"
                  name="businessStartDate"
                  type="date"
                  value={client.businessStartDate}
                  onChange={handleChange}
                />
              </div>

              <div className="field">
                <label htmlFor="industryType">Industry Type</label>
                <input
                  id="industryType"
                  name="industryType"
                  value={client.industryType}
                  onChange={handleChange}
                  placeholder="Industry type"
                />
              </div>

              <div className="field field--full">
                <label htmlFor="annualTurnover">Annual Turnover</label>
                <input
                  id="annualTurnover"
                  name="annualTurnover"
                  value={client.annualTurnover}
                  onChange={handleChange}
                  placeholder="Annual turnover"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Service Assignment</h2>
              <p>Choose the services this client will receive.</p>
            </div>

            <div className="field field--full field--spaced">
              <label htmlFor="services">Selected Services</label>
              <input
                id="services"
                name="services"
                value={client.services}
                onChange={handleChange}
                placeholder="GST Filing, Audit"
              />
            </div>

            <div className="services-grid field--spaced">
              {serviceOptions.map((service) => {
                const isActive = client.assignedServices.includes(service);
                return (
                  <label
                    key={service}
                    className={`service-checkbox${isActive ? " service-checkbox--active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleServiceToggle(service)}
                    />
                    <span>{service}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Team Assignment</h2>
              <p>Assign employees and managers for this client.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="assignedEmployees">Assigned Employees</label>
                <input
                  id="assignedEmployees"
                  name="assignedEmployees"
                  value={client.assignedEmployees}
                  onChange={handleChange}
                  placeholder="Employee IDs or names"
                />
              </div>

              <div className="field">
                <label htmlFor="assignedManager">Assigned Manager</label>
                <input
                  id="assignedManager"
                  name="assignedManager"
                  value={client.assignedManager}
                  onChange={handleChange}
                  placeholder="Manager name"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Client Portal Settings</h2>
              <p>Control client access and portal credentials.</p>
            </div>
            <div className="form-grid">
              <label className="service-checkbox field--full">
                <input
                  name="allowLogin"
                  type="checkbox"
                  checked={client.allowLogin}
                  onChange={(e) =>
                    setClient((current) => ({
                      ...current,
                      allowLogin: e.target.checked,
                    }))
                  }
                />
                <span>Allow Login Access</span>
              </label>

              <div className="field field--full">
                <label htmlFor="temporaryPassword">Generate Temporary Password</label>
                <input
                  id="temporaryPassword"
                  name="temporaryPassword"
                  value={client.temporaryPassword}
                  onChange={handleChange}
                  placeholder="Temporary password"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-head">
              <h2>Notes &amp; Submit</h2>
              <p>Add internal comments and save the client profile.</p>
            </div>

            <div className="field">
              <label htmlFor="notes">Internal Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={client.notes}
                onChange={handleChange}
                placeholder="Internal notes about this client"
                rows="4"
              />
            </div>

            {error && (
              <div className="form-alert form-alert--error">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => navigate("/dashboard/clients")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save client"}
              </button>
            </div>
          </section>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AddClient;
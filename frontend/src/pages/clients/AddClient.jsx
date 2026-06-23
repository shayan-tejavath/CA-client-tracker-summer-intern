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
      <section className="page-card">
        <div className="page-header">
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
          className="space-y-10"
        >
          <div className="space-y-8">
              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 mb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Basic Details</h2>
                    <p className="text-slate-400">Enter the core profile details for the client.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillCredentials}
                      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                    >
                      Auto-fill credentials
                    </button>
                    <button
                      type="button"
                      onClick={handleGstinAutoFill}
                      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                    >
                      Autofill from GSTIN
                    </button>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-[minmax(0,1.5fr)_minmax(220px,1fr)]">
                  <div>
                    <div className="mb-6 rounded-[24px] border border-slate-700 bg-slate-900 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-400">Photo</p>
                          <p className="mt-2 text-sm text-slate-300">Upload or edit the client photo used in profiles.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
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
                        className="mt-4 mx-auto flex h-20 w-20 cursor-pointer items-center justify-center rounded-[20px] border border-dashed border-slate-700 bg-slate-950 text-slate-500 transition hover:border-slate-500"
                      >
                        {client.profileImagePreview || client.profileImage ? (
                          <img
                            src={client.profileImagePreview || client.profileImage}
                            alt="Client"
                            className="h-full w-full rounded-[20px] object-cover"
                          />
                        ) : (
                          <span className="text-xl">📷</span>
                        )}
                      </div>
                      <p className="mt-2 text-center text-xs uppercase tracking-[0.15em] text-slate-500">
                        Click image to update photo
                      </p>
                      <input
                        id="profileImageInput"
                        ref={profileImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6">
                  <label className="block text-slate-300">
                    Client Name
                    <input
                      name="clientName"
                      value={client.clientName}
                      onChange={handleChange}
                      placeholder="Client name"
                      required
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Client Type
                    <select
                      name="clientType"
                      value={client.clientType}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Business">Business</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">LLP</option>
                      <option value="Private Limited">Private Limited</option>
                    </select>
                  </label>

                  <label className="block text-slate-300">
                    Status
                    <select
                      name="status"
                      value={client.status}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </label>

                  <label className="block text-slate-300">
                    Relationship Manager
                    <input
                      name="relationshipManager"
                      value={client.relationshipManager}
                      onChange={handleChange}
                      placeholder="Relationship manager"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Tax Details</h2>
                  <p className="text-slate-400">Add PAN, GSTIN and other fiscal identifiers.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300">
                    PAN
                    <input
                      name="pan"
                      value={client.pan}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      required
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    GSTIN
                    <input
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
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    TAN
                    <input
                      name="tan"
                      value={client.tan}
                      onChange={handleChange}
                      placeholder="ABCD12345E"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    CIN
                    <input
                      name="cin"
                      value={client.cin}
                      onChange={handleChange}
                      placeholder="U12345MH2024PTC000000"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    MSME Number
                    <input
                      name="msmeNumber"
                      value={client.msmeNumber}
                      onChange={handleChange}
                      placeholder="MSME123456789"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Contact Details</h2>
                  <p className="text-slate-400">Add phone, email and website details.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300">
                    Primary Mobile
                    <input
                      name="mobile"
                      value={client.mobile}
                      onChange={handleChange}
                      placeholder="Primary mobile"
                      required
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Secondary Mobile
                    <input
                      name="alternateMobile"
                      value={client.alternateMobile}
                      onChange={handleChange}
                      placeholder="Secondary mobile"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Email
                    <input
                      name="email"
                      type="email"
                      value={client.email}
                      onChange={handleChange}
                      placeholder="client@example.com"
                      required
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Alternate Email
                    <input
                      name="alternateEmail"
                      type="email"
                      value={client.alternateEmail}
                      onChange={handleChange}
                      placeholder="alternate@example.com"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    Website
                    <input
                      name="website"
                      value={client.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Address Details</h2>
                  <p className="text-slate-400">Fill in the client's registered address information.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300 md:col-span-2">
                    Address Line 1
                    <input
                      name="addressLine1"
                      value={client.addressLine1}
                      onChange={handleChange}
                      placeholder="Address Line 1"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    Address Line 2
                    <input
                      name="addressLine2"
                      value={client.addressLine2}
                      onChange={handleChange}
                      placeholder="Address Line 2"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    City
                    <input
                      name="city"
                      value={client.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    State
                    <input
                      name="state"
                      value={client.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Pincode
                    <input
                      name="pincode"
                      value={client.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Country
                    <input
                      name="country"
                      value={client.country}
                      onChange={handleChange}
                      placeholder="Country"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Contact Person</h2>
                  <p className="text-slate-400">Add the primary contact for this client.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300">
                    Contact Person Name
                    <input
                      name="contactPersonName"
                      value={client.contactPersonName}
                      onChange={handleChange}
                      placeholder="Name"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Designation
                    <input
                      name="contactPersonDesignation"
                      value={client.contactPersonDesignation}
                      onChange={handleChange}
                      placeholder="Designation"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Mobile
                    <input
                      name="contactPersonMobile"
                      value={client.contactPersonMobile}
                      onChange={handleChange}
                      placeholder="Contact mobile"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Email
                    <input
                      name="contactPersonEmail"
                      type="email"
                      value={client.contactPersonEmail}
                      onChange={handleChange}
                      placeholder="Contact email"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    Date Of Birth
                    <input
                      name="contactPersonDob"
                      type="date"
                      value={client.contactPersonDob}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Business Information</h2>
                  <p className="text-slate-400">Capture company details and financial metadata.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300">
                    Business Start Date
                    <input
                      name="businessStartDate"
                      type="date"
                      value={client.businessStartDate}
                      onChange={handleChange}
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Industry Type
                    <input
                      name="industryType"
                      value={client.industryType}
                      onChange={handleChange}
                      placeholder="Industry type"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    Annual Turnover
                    <input
                      name="annualTurnover"
                      value={client.annualTurnover}
                      onChange={handleChange}
                      placeholder="Annual turnover"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Service Assignment</h2>
                  <p className="text-slate-400">Choose the services this client will receive.</p>
                </div>
                <div className="grid gap-6">
                  <label className="block text-slate-300">
                    Selected Services
                    <input
                      name="services"
                      value={client.services}
                      onChange={handleChange}
                      placeholder="GST Filing, Audit"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {serviceOptions.map((service) => (
                      <label key={service} className="flex items-center gap-3 rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-4 text-slate-200 transition hover:border-slate-500">
                        <input
                          type="checkbox"
                          checked={client.assignedServices.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-indigo-500"
                        />
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Team Assignment</h2>
                  <p className="text-slate-400">Assign employees and managers for this client.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="block text-slate-300">
                    Assigned Employees
                    <input
                      name="assignedEmployees"
                      value={client.assignedEmployees}
                      onChange={handleChange}
                      placeholder="Employee IDs or names"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>

                  <label className="block text-slate-300">
                    Assigned Manager
                    <input
                      name="assignedManager"
                      value={client.assignedManager}
                      onChange={handleChange}
                      placeholder="Manager name"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Client Portal Settings</h2>
                  <p className="text-slate-400">Control client access and portal credentials.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-4 text-slate-300 transition hover:border-slate-500">
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
                      className="h-5 w-5 rounded border-slate-600 bg-slate-800 text-indigo-500"
                    />
                    <span>Allow Login Access</span>
                  </label>

                  <label className="block text-slate-300 md:col-span-2">
                    Generate Temporary Password
                    <input
                      name="temporaryPassword"
                      value={client.temporaryPassword}
                      onChange={handleChange}
                      placeholder="Temporary password"
                      className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                    />
                  </label>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col gap-2 border-b border-slate-800 pb-5 mb-6">
                  <h2 className="text-xl font-semibold text-white">Notes & Submit</h2>
                  <p className="text-slate-400">Add internal comments and save the client profile.</p>
                </div>
                <label className="block text-slate-300">
                  Internal Notes
                  <textarea
                    name="notes"
                    value={client.notes}
                    onChange={handleChange}
                    placeholder="Internal notes about this client"
                    rows="4"
                    className="mt-3 w-full rounded-[24px] border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-slate-500"
                  />
                </label>

                {error && (
                  <div className="rounded-[24px] border border-rose-500 bg-rose-950 px-4 py-3 text-rose-200 mt-4">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    className="rounded-[24px] border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    onClick={() => navigate("/dashboard/clients")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-[24px] bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save client"}
                  </button>
                </div>
              </section>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AddClient;

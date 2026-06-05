import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import DashboardLayout from "../../layouts/DashboardLayout.jsx";

import {
  getClients,
} from "../../services/clientService.js";

import {
  getTasks,
} from "../../services/taskService.js";

import {
  uploadDocument,
} from "../../services/documentService.js";



const categories = [
  "GST",
  "Income Tax",
  "TDS",
  "Invoice",
  "Bank Statement",
  "Audit",
  "Payroll",
  "ROC",
  "Legal",
  "Other",
];



const UploadDocument = () => {

  const navigate = useNavigate();



  const [clients, setClients] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [error, setError] =
    useState("");



  const [formData, setFormData] =
    useState({

      file: null,

      client: "",

      task: "",

      category: "GST",

      description: "",

      tags: "",

      expiryDate: "",

      isConfidential: false,

    });



  useEffect(() => {

    const loadData = async () => {

      try {

        const [
          clientsResponse,
          tasksResponse,
        ] = await Promise.all([

          getClients({ limit: 100 }),

          getTasks(),

        ]);



        setClients(
          clientsResponse.clients ||
          clientsResponse ||
          []
        );

        setTasks(
          tasksResponse || []
        );

      } catch (err) {

        setError(
          err.response?.data?.message ||
          "Failed to load upload form data."
        );

      } finally {

        setPageLoading(false);

      }
    };

    loadData();

  }, []);



  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;



    setFormData((current) => ({

      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,

    }));
  };



  const handleFileChange = (
    event
  ) => {

    const file =
      event.target.files[0];

    setFormData((current) => ({
      ...current,
      file,
    }));
  };



  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");



    if (!formData.file) {

      setError(
        "Please select a file."
      );

      return;
    }



    if (!formData.client) {

      setError(
        "Please select a client."
      );

      return;
    }



    if (!formData.task) {

      setError(
        "Please select a task."
      );

      return;
    }



    setLoading(true);



    try {

      await uploadDocument({

        file: formData.file,

        client: formData.client,

        task: formData.task,

        category:
          formData.category,

        description:
          formData.description,

        tags: formData.tags
          .split(",")
          .map((tag) =>
            tag.trim()
          )
          .filter(Boolean),

        expiryDate:
          formData.expiryDate,

        isConfidential:
          formData.isConfidential,

      });



      toast.success(
        "Document uploaded successfully."
      );



      navigate(
        "/dashboard/documents"
      );

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "Failed to upload document."
      );

      toast.error(
        err.response?.data?.message ||
        "Failed to upload document."
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
              Documents
            </p>

            <h1>
              Upload Document
            </h1>

            <p>
              Upload and organize
              client-related documents.
            </p>

          </div>

        </div>



        {pageLoading ? (

          <div className="alert">
            Loading upload form...
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

            {/* FILE */}


            <div className="upload-dropzone">

            <input
                type="file"
                id="document-upload"
                onChange={handleFileChange}
                required
                hidden
            />

            <label
                htmlFor="document-upload"
                className="upload-dropzone-label"
            >

                <div className="upload-icon">
                📄
                </div>

                <h3>
                {formData.file
                    ? formData.file.name
                    : "Choose a document"}
                </h3>

                <p>
                Drag & drop or click to upload
                </p>

            </label>

            </div>

            {/* CLIENT */}

            <label>

              Client

              <select
                name="client"
                value={formData.client}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Client
                </option>

                {clients.map((client) => (

                  <option
                    key={client._id}
                    value={client._id}
                  >
                    {client.clientName}
                  </option>

                ))}

              </select>

            </label>



            {/* TASK */}

            <label>

              Related Task

              <select
                name="task"
                value={formData.task}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select Task
                </option>

                {tasks.map((task) => (

                  <option
                    key={task._id}
                    value={task._id}
                  >
                    {task.title}
                  </option>

                ))}

              </select>

            </label>



            {/* CATEGORY */}

            <label>

              Category

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >

                {categories.map(
                  (category) => (

                    <option
                      key={category}
                      value={category}
                    >
                      {category}
                    </option>

                  )
                )}

              </select>

            </label>



            {/* TAGS */}

            <label>

              Tags

              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="gst, invoice, fy24"
              />

            </label>



            {/* DESCRIPTION */}

            <label>

              Description

              <textarea
                name="description"
                rows="4"
                value={
                  formData.description
                }
                onChange={handleChange}
                placeholder="Document notes..."
              />

            </label>



            {/* EXPIRY */}

            <label>

              Expiry Date

              <input
                type="date"
                name="expiryDate"
                value={
                  formData.expiryDate
                }
                onChange={handleChange}
              />

            </label>



            {/* CONFIDENTIAL */}

            <label className="checkbox-label">

              <input
                type="checkbox"
                name="isConfidential"
                checked={
                  formData.isConfidential
                }
                onChange={handleChange}
              />

              Mark as confidential

            </label>



            {/* ACTIONS */}

            <div className="form-actions">

              <button
                type="submit"
                className="button primary"
                disabled={loading}
              >

                {loading
                  ? "Uploading..."
                  : "Upload Document"}

              </button>



              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  navigate(
                    "/dashboard/documents"
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

export default UploadDocument;
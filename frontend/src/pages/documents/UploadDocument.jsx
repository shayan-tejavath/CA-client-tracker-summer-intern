import { useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

const UploadDocument = () => {
  const [fileName, setFileName] = useState("");

  return (
    <DashboardLayout>
      <section className="page-card">
        <h1>Upload Document</h1>
        <p>Use this page to upload documents to the system.</p>
        <div style={{ marginTop: 16 }}>
          <input
            type="file"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
          />
          {fileName && <p>Selected: {fileName}</p>}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default UploadDocument;

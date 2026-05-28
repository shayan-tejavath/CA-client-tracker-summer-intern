import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDirectory = "uploads";
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${timestamp}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".pdf", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".gif"];
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/png",
    "image/jpeg",
    "image/gif",
  ];

  const isValid = allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype);
  if (!isValid) {
    return cb(new Error("Unsupported file type. Only PDF, Excel, and image files are allowed."), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export default upload;


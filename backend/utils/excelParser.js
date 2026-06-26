import XLSX from "xlsx";

/**
 * Reads an Excel/CSV file and converts it into
 * an array of client objects.
 */

const getCellValue = (row, keys = []) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) {
      const trimmed = String(value).toString().trim();
      if (trimmed) return trimmed;
    }
  }
  return "";
};

export const parseClientExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);

  const firstSheetName = workbook.SheetNames[0];

  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  return rows.map((row, index) => ({
    rowNumber: index + 2, // Header is row 1

    clientName:
      getCellValue(row, ["Client Name", "Name", "Full Name"]),

    email:
      getCellValue(row, ["Email", "Email Address", "E-mail"]).toLowerCase(),

    mobile:
      getCellValue(row, ["Mobile", "Mobile Number", "Phone", "Phone Number", "Contact Number"]),

    pan:
      getCellValue(row, ["PAN", "Pan", "Pan Number"]).toUpperCase(),

    gstin:
      getCellValue(row, ["GSTIN", "GSTIN Number", "GST No", "GST Number"]).toUpperCase(),

    tan:
      getCellValue(row, ["TAN", "TAN Number"]).toUpperCase(),

    clientType:
      getCellValue(row, ["Client Type", "Type"]) || "Business",

    status:
      getCellValue(row, ["Status"]) || "Active",

    clientCode:
      getCellValue(row, ["Client Code", "Client ID", "File Number"]),

    address:
      getCellValue(row, ["Address"]),

    city:
      getCellValue(row, ["City"]),

    state:
      getCellValue(row, ["State"]),

    country:
      getCellValue(row, ["Country"]),

    pincode:
      getCellValue(row, ["Pincode", "Pin Code", "Postal Code"]),

    contactPerson:
      getCellValue(row, ["Contact Person", "Contact Name"]),

    designation:
      getCellValue(row, ["Designation", "Role"]),

    contactPersonEmail:
      getCellValue(row, ["Contact Person Email", "Contact Email"]).toLowerCase(),

    contactPersonMobile:
      getCellValue(row, ["Contact Person Mobile", "Contact Mobile", "Contact Number"]),

    assignedManager:
      getCellValue(row, ["Assigned Manager", "Manager"]),

    notes:
      getCellValue(row, ["Notes", "Remarks"]),

    serviceCategory:
      getCellValue(row, ["Service Category", "Category", "Service"]).replace(/\s+/g, " "),

    /**
     * Example:
     * GST Filing, Audit, TDS
     */

    assignedServices:
      getCellValue(row, ["Assigned Services", "Services", "Service Names"])
        .split(/[;,\r\n]+/)
        .map((service) => service.toString().trim())
        .filter(Boolean),
  }));
};
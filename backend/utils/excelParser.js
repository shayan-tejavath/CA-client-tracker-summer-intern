import XLSX from "xlsx";

/**
 * Reads an Excel/CSV file and converts it into
 * an array of client objects.
 */

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
      row["Client Name"]?.toString().trim() || "",

    email:
      row["Email"]?.toString().trim().toLowerCase() || "",

    mobile:
      row["Mobile"]?.toString().trim() || "",

    pan:
      row["PAN"]?.toString().trim().toUpperCase() || "",

    gstin:
      row["GSTIN"]?.toString().trim().toUpperCase() || "",

    tan:
      row["TAN"]?.toString().trim().toUpperCase() || "",

    clientType:
      row["Client Type"]?.toString().trim() ||
      "Business",

    status:
      row["Status"]?.toString().trim() ||
      "Active",

    clientCode:
      row["Client Code"]?.toString().trim() || "",

    address:
      row["Address"]?.toString().trim() || "",

    city:
      row["City"]?.toString().trim() || "",

    state:
      row["State"]?.toString().trim() || "",

    country:
      row["Country"]?.toString().trim() || "",

    pincode:
      row["Pincode"]?.toString().trim() || "",

    contactPerson:
      row["Contact Person"]?.toString().trim() ||
      "",

    designation:
      row["Designation"]?.toString().trim() || "",

    contactPersonEmail:
      row["Contact Person Email"]
        ?.toString()
        .trim()
        .toLowerCase() || "",

    contactPersonMobile:
      row["Contact Person Mobile"]
        ?.toString()
        .trim() || "",

    assignedManager:
      row["Assigned Manager"]?.toString().trim() ||
      "",

    notes:
      row["Notes"]?.toString().trim() || "",

    /**
     * Example:
     * GST Filing, Audit, TDS
     */

    assignedServices:
      row["Assigned Services"]
        ?.split(",")
        .map((service) => service.trim())
        .filter(Boolean) || [],
  }));
};
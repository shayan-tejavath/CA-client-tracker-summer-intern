import fs from "fs";

import Client from "../models/Client.js";
import Service from "../models/Service.js";
import ServiceAssignment from "../models/ServiceAssignment.js";

import { parseClientExcel } from "../utils/excelParser.js";
import {
  notifyBulkImportCompleted,
  notifyServiceAssigned,
} from "./notificationService.js";

/* -------------------------------------------------------
   REGEX
------------------------------------------------------- */

const PAN_REGEX =
  /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const EMAIL_REGEX =
  /.+@.+\..+/;

const MOBILE_REGEX =
  /^[0-9]{10,15}$/;

/* -------------------------------------------------------
   VALIDATE SINGLE ROW
------------------------------------------------------- */

const validateClient = (client) => {
  const errors = [];

  if (!client.clientName)
    errors.push("Client Name is required");

  if (!client.email)
    errors.push("Email is required");

  if (!client.mobile)
    errors.push("Mobile is required");

  if (!client.pan)
    errors.push("PAN is required");

  if (!client.gstin)
    errors.push("GSTIN is required");

  if (
    client.email &&
    !EMAIL_REGEX.test(client.email)
  )
    errors.push("Invalid Email");

  if (
    client.mobile &&
    !MOBILE_REGEX.test(client.mobile)
  )
    errors.push("Invalid Mobile");

  if (
    client.pan &&
    !PAN_REGEX.test(client.pan)
  )
    errors.push("Invalid PAN");

  if (
    client.gstin &&
    !GST_REGEX.test(client.gstin)
  )
    errors.push("Invalid GSTIN");

  return errors;
};

/* -------------------------------------------------------
   FIND SERVICES
------------------------------------------------------- */

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeServiceString = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const serviceMatchesName = (service, serviceName) => {
  const normalizedName = normalizeServiceString(serviceName);
  if (!normalizedName) return false;

  const normalizedSubService = normalizeServiceString(
    service.subService || ""
  );
  const normalizedCategory = normalizeServiceString(
    service.serviceCategory || ""
  );

  if (
    normalizedSubService === normalizedName ||
    normalizedCategory === normalizedName
  ) {
    return true;
  }

  if (
    normalizedSubService.includes(normalizedName) ||
    normalizedName.includes(normalizedSubService) ||
    normalizedCategory.includes(normalizedName) ||
    normalizedName.includes(normalizedCategory)
  ) {
    return true;
  }

  const normalizedTokens = normalizedName.split(" ").filter(Boolean);
  const serviceTokens = Array.from(
    new Set(
      `${normalizedSubService} ${normalizedCategory}`
        .split(" ")
        .filter(Boolean)
    )
  );

  if (
    normalizedTokens.length > 0 &&
    normalizedTokens.every((token) => serviceTokens.includes(token))
  ) {
    return true;
  }

  return false;
};

const findServices = async (
  serviceNames = []
) => {
  const foundServices = [];
  const seenIds = new Set();
  const matchedNames = new Set();

  const normalizedServiceNames = serviceNames
    .map((name) => String(name || "").trim())
    .filter(Boolean);

  const allServices = await Service.find().lean();

  for (const serviceName of normalizedServiceNames) {
    const escapedName = escapeRegExp(serviceName);

    const exactMatch = await Service.findOne({
      $or: [
        {
          subService: {
            $regex: new RegExp(`^${escapedName}$`, "i"),
          },
        },
        {
          serviceCategory: {
            $regex: new RegExp(`^${escapedName}$`, "i"),
          },
        },
      ],
    });

    const service =
      exactMatch ||
      (await Service.findOne({
        $or: [
          {
            subService: {
              $regex: new RegExp(escapedName, "i"),
            },
          },
          {
            serviceCategory: {
              $regex: new RegExp(escapedName, "i"),
            },
          },
        ],
      })) ||
      allServices.find((candidate) =>
        serviceMatchesName(candidate, serviceName)
      );

    if (service) {
      matchedNames.add(serviceName);
      const serviceId = String(service._id);
      if (!seenIds.has(serviceId)) {
        foundServices.push(service);
        seenIds.add(serviceId);
      }
    }
  }

  return {
    foundServices,
    matchedNames,
    normalizedServiceNames,
  };
};

const findServicesByCategory = async (serviceCategory) => {
  const normalizedCategory = String(serviceCategory || "").trim();
  if (!normalizedCategory) return [];

  const escapedCategory = escapeRegExp(normalizedCategory);

  return Service.find({
    serviceCategory: {
      $regex: new RegExp(`^${escapedCategory}$`, "i"),
    },
  });
};

/* -------------------------------------------------------
   DUPLICATE CHECK
------------------------------------------------------- */

const normalizeImportIdentifier = (
  value,
  type = "string"
) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (type === "email") return trimmed.toLowerCase();
  if (type === "pan" || type === "gstin") return trimmed.toUpperCase();
  return trimmed;
};

const isDuplicateKeyError = (error) => {
  if (!error) return false;
  return (
    error.code === 11000 ||
    error.code === "11000" ||
    error.name === "MongoServerError" ||
    error.name === "MongoError" ||
    error.name === "BulkWriteError" ||
    /E11000|duplicate key/i.test(error.message || "")
  );
};

const exactMatchRegex = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new RegExp(`^\\s*${escapeRegExp(trimmed)}\\s*$`, "i");
};

const normalizeClientIdentifiers = (client) => {
  client.pan = normalizeImportIdentifier(
    client.pan,
    "pan"
  );
  client.gstin = normalizeImportIdentifier(
    client.gstin,
    "gstin"
  );
  client.email = normalizeImportIdentifier(
    client.email,
    "email"
  );
  client.mobile = normalizeImportIdentifier(
    client.mobile
  );
  client.assignedServices = Array.isArray(
    client.assignedServices
  )
    ? client.assignedServices
        .map((service) =>
          normalizeImportIdentifier(service)
        )
        .filter(Boolean)
    : [];

  return client;
};

const checkDuplicate = async (
  client
) => {
  const criteria = [];

  const panRegex = exactMatchRegex(client.pan);
  const gstinRegex = exactMatchRegex(client.gstin);
  const emailRegex = exactMatchRegex(client.email);

  if (panRegex) {
    criteria.push({ pan: panRegex });
  }
  if (gstinRegex) {
    criteria.push({ gstin: gstinRegex });
  }
  if (emailRegex) {
    criteria.push({ email: emailRegex });
  }

  if (!criteria.length) {
    return null;
  }

  const existing = await Client.findOne({
    $or: criteria,
    isArchived: false,
  });

  return existing;
};

const findArchivedDuplicate = async (
  client
) => {
  const criteria = [];

  const panRegex = exactMatchRegex(client.pan);
  const gstinRegex = exactMatchRegex(client.gstin);
  const emailRegex = exactMatchRegex(client.email);

  if (panRegex) {
    criteria.push({ pan: panRegex });
  }
  if (gstinRegex) {
    criteria.push({ gstin: gstinRegex });
  }
  if (emailRegex) {
    criteria.push({ email: emailRegex });
  }

  if (!criteria.length) {
    return null;
  }

  return Client.findOne({
    $or: criteria,
    isArchived: true,
  });
};

/* -------------------------------------------------------
   CREATE SERVICE ASSIGNMENTS
------------------------------------------------------- */

const assignServices = async (
  clientId,
  services,
  assignedBy = "Bulk Import"
) => {
  let assignmentCount = 0;

  for (const service of services) {
    if (!service || !service._id) continue;

    const alreadyAssigned =
      await ServiceAssignment.findOne({
        clientId,
        serviceId: service._id,
      });

    if (alreadyAssigned) continue;

    await ServiceAssignment.create({
      clientId,
      serviceId: service._id,
      package: "Standard",
      status: "Active",
      assignedBy,
      assignedUsers: [],
    });

    assignmentCount += 1;
  }

  return assignmentCount;
};

/* -------------------------------------------------------
   BULK IMPORT CLIENTS
------------------------------------------------------- */

export const importClientsFromExcel =
  async (filePath, assignedBy = "Bulk Import") => {
    const rows =
      parseClientExcel(filePath);

    const summary = {
      totalRows: rows.length,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      assignedServicesCount: 0,
      assignmentWarnings: [],
      createdClients: [],
      failedClients: [],
    };

    const processedIdentifiers = new Set();

    try {
      for (const rawClient of rows) {
        const client = normalizeClientIdentifiers(
          rawClient
        );

        /* -----------------------------
           Validate Row
        ----------------------------- */

        const validationErrors =
          validateClient(client);

        if (validationErrors.length) {
          summary.failedCount++;

          summary.failedClients.push({
            row: client.rowNumber,

            clientName:
              client.clientName,

            reason:
              validationErrors.join(
                ", "
              ),
          });

          continue;
        }

        /* -----------------------------
           Duplicate Check
        ----------------------------- */

        const duplicate =
          await checkDuplicate(
            client
          );

        if (duplicate) {
          summary.skippedCount++;

          summary.failedClients.push({
            row: client.rowNumber,

            clientName:
              client.clientName,

            reason:
              "Duplicate PAN / GSTIN / Email",
          });

          continue;
        }

        const identifierKey = JSON.stringify({
          pan: client.pan,
          gstin: client.gstin,
          email: client.email,
        });

        if (processedIdentifiers.has(identifierKey)) {
          summary.skippedCount++;
          summary.failedClients.push({
            row: client.rowNumber,
            clientName: client.clientName,
            reason:
              "Duplicate record in import file",
          });
          continue;
        }

        processedIdentifiers.add(identifierKey);

        /* -----------------------------
           Find Services
        ----------------------------- */

        const foundServices = [];
        const invalidServiceNames = [];

        if (client.assignedServices.length) {
          const {
            foundServices: fallbackServices,
            matchedNames,
            normalizedServiceNames,
          } = await findServices(client.assignedServices);

          foundServices.push(...fallbackServices);

          invalidServiceNames.push(
            ...normalizedServiceNames.filter(
              (serviceName) => !matchedNames.has(serviceName)
            )
          );

          if (invalidServiceNames.length) {
            summary.assignmentWarnings.push(
              `Row ${client.rowNumber}: Assigned service names not found: ${invalidServiceNames.join(", ")}`
            );
            console.warn(
              `Client import row ${client.rowNumber}: Assigned service names not found: ${invalidServiceNames.join(", ")}`
            );
          }
        }

        if (!foundServices.length && client.serviceCategory) {
          const categoryServices = await findServicesByCategory(
            client.serviceCategory
          );

          if (categoryServices.length) {
            foundServices.push(...categoryServices);
          } else {
            if (!client.assignedServices.length) {
              invalidServiceNames.push(client.serviceCategory);
              summary.assignmentWarnings.push(
                `Row ${client.rowNumber}: Service category "${client.serviceCategory}" not found.`
              );
              console.warn(
                `Client import row ${client.rowNumber}: Service category "${client.serviceCategory}" not found.`
              );
            }
          }
        }

        /* -----------------------------
           Create Client
        ----------------------------- */

        let newClient;
        let restoredFromArchive = false;

        const archivedClient = await findArchivedDuplicate(
          client
        );

        if (archivedClient) {
          restoredFromArchive = true;
          archivedClient.isArchived = false;
          archivedClient.status =
            client.status || "Active";
          archivedClient.clientName =
            client.clientName;
          archivedClient.email =
            client.email;
          archivedClient.mobile =
            client.mobile;
          archivedClient.pan =
            client.pan;
          archivedClient.gstin =
            client.gstin;
          archivedClient.tan = client.tan;
          archivedClient.clientType =
            client.clientType;
          archivedClient.clientCode =
            client.clientCode;
          archivedClient.address =
            client.address;
          archivedClient.city = client.city;
          archivedClient.state = client.state;
          archivedClient.country = client.country;
          archivedClient.pincode =
            client.pincode;
          archivedClient.contactPerson =
            client.contactPerson;
          archivedClient.designation =
            client.designation;
          archivedClient.contactPersonEmail =
            client.contactPersonEmail;
          archivedClient.contactPersonMobile =
            client.contactPersonMobile;
          archivedClient.assignedManager =
            client.assignedManager;
          archivedClient.notes = client.notes;
          archivedClient.assignedServices =
            foundServices.map(
              (service) =>
                service.subService
            );
          archivedClient.services =
            foundServices.map(
              (service) =>
                service.subService
            );

          try {
            newClient = await archivedClient.save();
          } catch (error) {
            if (isDuplicateKeyError(error)) {
              summary.skippedCount++;
              summary.failedClients.push({
                row: client.rowNumber,
                clientName: client.clientName,
                reason:
                  "Duplicate PAN / GSTIN / Email",
              });
              continue;
            }
            throw error;
          }
        } else {
          try {
            newClient = await Client.create({
              clientName:
                client.clientName,

              email:
                client.email,

              mobile:
                client.mobile,

              pan:
                client.pan,

              gstin:
                client.gstin,

              tan:
                client.tan,

              clientType:
                client.clientType,

              status:
                client.status,

              clientCode:
                client.clientCode,

              address:
                client.address,

              city:
                client.city,

              state:
                client.state,

              country:
                client.country,

              pincode:
                client.pincode,

              contactPerson:
                client.contactPerson,

              designation:
                client.designation,

              contactPersonEmail:
                client.contactPersonEmail,

              contactPersonMobile:
                client.contactPersonMobile,

              assignedManager:
                client.assignedManager,

              notes:
                client.notes,

              assignedServices:
                foundServices.map(
                  (service) =>
                    service.subService
                ),

              services:
                foundServices.map(
                  (service) =>
                    service.subService
                ),
            });
          } catch (error) {
            if (isDuplicateKeyError(error)) {
              summary.skippedCount++;
              summary.failedClients.push({
                row: client.rowNumber,
                clientName: client.clientName,
                reason:
                  "Duplicate PAN / GSTIN / Email",
              });
              continue;
            }
            throw error;
          }
        }

        /* -----------------------------
           Assign Services
        ----------------------------- */

        const createdAssignmentCount = await assignServices(
          newClient._id,
          foundServices,
          assignedBy
        );
                  /* -----------------------------
            SEND CLIENT WELCOME MESSAGE
          ----------------------------- */

          try {
            await notifyBulkImportCompleted({
              client: newClient,
            });
          } catch (err) {
            console.error(
              "Bulk import notification failed:",
              err.message
            );
          }

          /* -----------------------------
            SEND SERVICE ASSIGNMENT MESSAGES
          ----------------------------- */

          for (const service of services) {
            try {
              await notifyServiceAssigned({
                client: newClient,
                service,
              });
            } catch (err) {
              console.error(
                "Service notification failed:",
                err.message
              );
            }
          }

        summary.assignedServicesCount += createdAssignmentCount;
        summary.successCount++;

        summary.createdClients.push({
          row:
            client.rowNumber,

          id:
            newClient._id,

          clientName:
            newClient.clientName,

          services:
            foundServices.map(
              (service) =>
                service.subService
            ),

          invalidServiceNames,
        });
      }      return summary;
    } catch (error) {
      throw error;
    } finally {
      /* ---------------------------------------
         Delete Uploaded Excel File
      --------------------------------------- */

      try {
        if (
          filePath &&
          fs.existsSync(filePath)
        ) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(
          "Unable to delete uploaded excel:",
          err.message
        );
      }
    }
  };

/* -------------------------------------------------------
   DOWNLOAD TEMPLATE HEADERS
------------------------------------------------------- */

export const getClientImportTemplate =
  () => {
    return [
      "Client Name",
      "Email",
      "Mobile",
      "PAN",
      "GSTIN",
      "TAN",
      "Client Type",
      "Status",
      "Client Code",
      "Address",
      "City",
      "State",
      "Country",
      "Pincode",
      "Contact Person",
      "Designation",
      "Contact Person Email",
      "Contact Person Mobile",
      "Assigned Manager",
      "Service Category",
      "Assigned Services",
      "Notes",
    ];
  };

/* -------------------------------------------------------
   PREVIEW IMPORT
------------------------------------------------------- */

export const previewImport =
  async (filePath) => {
    const rows =
      parseClientExcel(filePath);

    const preview =
      rows.map((client) => ({
        row:
          client.rowNumber,

        clientName:
          client.clientName,

        email:
          client.email,

        mobile:
          client.mobile,

        pan:
          client.pan,

        gstin:
          client.gstin,

        serviceCategory:
          client.serviceCategory,

        assignedServices:
          client.assignedServices,

        validationErrors:
          validateClient(client),
      }));

    try {
      if (
        filePath &&
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {}

    return preview;
  };

/* -------------------------------------------------------
   EXPORTS
------------------------------------------------------- */

export default {
  importClientsFromExcel,
  previewImport,
  getClientImportTemplate,
};
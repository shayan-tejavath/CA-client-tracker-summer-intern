import fs from "fs";

import Client from "../models/Client.js";
import Service from "../models/Service.js";
import ServiceAssignment from "../models/ServiceAssignment.js";

import { parseClientExcel } from "../utils/excelParser.js";

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

const findServices = async (
  serviceNames = []
) => {
  const foundServices = [];
  const seenIds = new Set();
  const matchedNames = new Set();

  const normalizedServiceNames = serviceNames
    .map((name) => String(name || "").trim())
    .filter(Boolean);

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
      }));

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

const checkDuplicate = async (
  client
) => {
  const existing =
    await Client.findOne({
      $or: [
        {
          pan: client.pan,
        },
        {
          gstin: client.gstin,
        },
        {
          email: client.email,
        },
      ],
    });

  return existing;
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

    try {
      for (const client of rows) {
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

        /* -----------------------------
           Find Services
        ----------------------------- */

        const foundServices = [];
        const invalidServiceNames = [];

        if (client.serviceCategory) {
          const categoryServices = await findServicesByCategory(
            client.serviceCategory
          );

          if (categoryServices.length) {
            foundServices.push(...categoryServices);
          } else {
            invalidServiceNames.push(client.serviceCategory);
            summary.assignmentWarnings.push(
              `Row ${client.rowNumber}: Service category "${client.serviceCategory}" not found.`
            );
            console.warn(
              `Client import row ${client.rowNumber}: Service category "${client.serviceCategory}" not found.`
            );
          }
        } else if (client.assignedServices.length) {
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

        /* -----------------------------
           Create Client
        ----------------------------- */

        const newClient =
          await Client.create({
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

        /* -----------------------------
           Assign Services
        ----------------------------- */

        const createdAssignmentCount = await assignServices(
          newClient._id,
          foundServices,
          assignedBy
        );

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
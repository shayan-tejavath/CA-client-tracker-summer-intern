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

const findServices = async (
  serviceNames = []
) => {
  const foundServices = [];

  for (const serviceName of serviceNames) {
    const service =
      await Service.findOne({
        subService: {
          $regex: new RegExp(
            `^${serviceName}$`,
            "i"
          ),
        },
      });

    if (service) {
      foundServices.push(service);
    }
  }

  return foundServices;
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
  services
) => {
  for (const service of services) {
    const alreadyAssigned =
      await ServiceAssignment.findOne({
        clientId,
        serviceId: service._id,
      });

    if (alreadyAssigned)
      continue;

    await ServiceAssignment.create({
      clientId,

      serviceId: service._id,

      package: "Standard",

      status: "Active",

      assignedBy: "Bulk Import",

      assignedUsers: [],
    });
  }
};

/* -------------------------------------------------------
   BULK IMPORT CLIENTS
------------------------------------------------------- */

export const importClientsFromExcel =
  async (filePath) => {
    const rows =
      parseClientExcel(filePath);

    const summary = {
      totalRows: rows.length,

      successCount: 0,

      failedCount: 0,

      skippedCount: 0,

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

        const services =
          await findServices(
            client.assignedServices
          );

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
              services.map(
                (service) =>
                  service.subService
              ),

            services:
              services.map(
                (service) =>
                  service.subService
              ),
          });

        /* -----------------------------
           Assign Services
        ----------------------------- */

        await assignServices(
          newClient._id,
          services
        );

        summary.successCount++;

        summary.createdClients.push({
          row:
            client.rowNumber,

          id:
            newClient._id,

          clientName:
            newClient.clientName,

          services:
            services.map(
              (service) =>
                service.subService
            ),
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
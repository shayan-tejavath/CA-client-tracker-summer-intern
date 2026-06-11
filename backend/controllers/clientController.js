import mongoose from "mongoose";
import Client from "../models/Client.js";
import { ROLES } from "../middleware/roleMiddleware.js";

const validateClientData = (data) => {
  const requiredFields = [
    "clientName",
    "pan",
    "gstin",
    "mobile",
    "email",
  ];

  const missingFields = requiredFields.filter(
    (field) =>
      !data[field] ||
      String(data[field]).trim() === ""
  );

  if (missingFields.length) {
    return `Missing required fields: ${missingFields.join(
      ", "
    )}`;
  }

  if (
    data.assignedServices &&
    !Array.isArray(data.assignedServices)
  ) {
    return "assignedServices must be an array of strings";
  }

  return null;
};



// GET CLIENTS

export const getClients = async (
  req,
  res,
  next
) => {
  try {
    // QUERY PARAMS

    const search =
      req.query.search?.trim() || "";

    const status =
      req.query.status || "All";

    const type =
      req.query.type || "All";

    const includeArchived =
      req.query.includeArchived === "true";

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    // QUERY OBJECT

    const query = {};

    if (req.user?.role === ROLES.Client) {
      const client = await Client.findOne({ email: req.user.email });
      if (!client) {
        return res.status(403).json({ message: "Forbidden" });
      }
      return res.json({
        clients: [client],
        pagination: {
          totalClients: 1,
          currentPage: 1,
          totalPages: 1,
          limit,
        },
      });
    }

    // ARCHIVE FILTER

    if (!includeArchived) {
      query.isArchived = false;
    }

    // SEARCH

    if (search) {
      query.$or = [
        {
          clientName: new RegExp(
            search,
            "i"
          ),
        },
        {
          email: new RegExp(
            search,
            "i"
          ),
        },
        {
          pan: new RegExp(
            search,
            "i"
          ),
        },
        {
          gstin: new RegExp(
            search,
            "i"
          ),
        },
      ];
    }

    // STATUS FILTER

    if (status !== "All") {
      query.status = status;
    }

    // TYPE FILTER

    if (type !== "All") {
      query.clientType = type;
    }

    // TOTAL COUNT

    const totalClients =
      await Client.countDocuments(
        query
      );

    // FETCH CLIENTS

    const clients = await Client.find(
      query
    )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit);

    // RESPONSE

    res.json({
      clients,

      pagination: {
        totalClients,

        currentPage: page,

        totalPages: Math.ceil(
          totalClients / limit
        ),

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};


// GET CLIENT BY ID

export const getClientById = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid client ID",
        });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res
        .status(404)
        .json({
          message: "Client not found",
        });
    }

    if (req.user?.role === ROLES.Client) {
      const currentClient = await Client.findOne({ email: req.user.email });
      if (!currentClient || currentClient._id.toString() !== client._id.toString()) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
};



// CREATE CLIENT

export const createClient = async (
  req,
  res,
  next
) => {
  try {
    const validationError =
      validateClientData(req.body);

    if (validationError) {
      return res
        .status(400)
        .json({
          message: validationError,
        });
    }

    const existingClient =
      await Client.findOne({
        $or: [
          {
            pan: req.body.pan.toUpperCase(),
          },
          {
            gstin:
              req.body.gstin.toUpperCase(),
          },
        ],
      });

    if (existingClient) {
      return res
        .status(409)
        .json({
          message:
            "Client with same PAN or GSTIN already exists",
        });
    }

    const client = await Client.create({
      ...req.body,

      pan: req.body.pan.toUpperCase(),

      gstin:
        req.body.gstin.toUpperCase(),

      tan: req.body.tan?.toUpperCase(),
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
};



// UPDATE CLIENT

export const updateClient = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid client ID",
        });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res
        .status(404)
        .json({
          message: "Client not found",
        });
    }

    const validationError =
      validateClientData({
        ...client.toObject(),
        ...req.body,
      });

    if (validationError) {
      return res
        .status(400)
        .json({
          message: validationError,
        });
    }

    if (
      req.body.pan ||
      req.body.gstin
    ) {
      const normalizedPan =
        req.body.pan?.toUpperCase() ||
        client.pan;

      const normalizedGstin =
        req.body.gstin?.toUpperCase() ||
        client.gstin;

      const duplicateClient =
        await Client.findOne({
          _id: { $ne: id },

          $or: [
            { pan: normalizedPan },

            {
              gstin: normalizedGstin,
            },
          ],
        });

      if (duplicateClient) {
        return res
          .status(409)
          .json({
            message:
              "Another client with same PAN or GSTIN exists",
          });
      }
    }

    const updatedClient =
      await Client.findByIdAndUpdate(
        id,
        {
          ...req.body,

          pan:
            req.body.pan?.toUpperCase() ??
            client.pan,

          gstin:
            req.body.gstin?.toUpperCase() ??
            client.gstin,

          tan:
            req.body.tan?.toUpperCase() ??
            client.tan,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    res.json(updatedClient);
  } catch (error) {
    next(error);
  }
};



// ARCHIVE CLIENT

export const archiveClient = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid client ID",
        });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res
        .status(404)
        .json({
          message: "Client not found",
        });
    }

    client.isArchived = true;

    client.status = "Archived";

    await client.save();

    res.json({
      message:
        "Client archived successfully",
    });
  } catch (error) {
    next(error);
  }
};



// RESTORE CLIENT

export const restoreClient = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid client ID",
        });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res
        .status(404)
        .json({
          message: "Client not found",
        });
    }

    client.isArchived = false;

    client.status = "Active";

    await client.save();

    res.json({
      message:
        "Client restored successfully",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE CLIENT

export const deleteClient = async (
  req,
  res,
  next
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res
        .status(400)
        .json({
          message: "Invalid client ID",
        });
    }

    const client = await Client.findById(id);

    if (!client) {
      return res
        .status(404)
        .json({
          message: "Client not found",
        });
    }

    await client.deleteOne();

    res.json({
      message:
        "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
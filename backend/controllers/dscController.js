import mongoose from "mongoose";

import Client from "../models/Client.js";
import DscRecord from "../models/DscRecord.js";
import { ROLES } from "../middleware/roleMiddleware.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

const dscPopulate = (query) =>
  query
    .populate("client", "clientName email mobile pan gstin")
    .populate("createdBy", "name role");

const getRenewalWindowDays = () =>
  Number(process.env.DSC_RENEWAL_NOTICE_DAYS) > 0
    ? Number(process.env.DSC_RENEWAL_NOTICE_DAYS)
    : 30;

const buildAccessFilter = async (req) => {
  const companyId = getCompanyId(req);
  if (req.user?.role !== ROLES.Client) return { companyId };

  const client = await Client.findOne({ email: req.user.email, companyId });
  if (!client) return null;

  return { companyId, client: client._id };
};

export const getDscRecords = async (req, res, next) => {
  try {
    const {
      clientId,
      status,
      dateFrom,
      dateTo,
      expiringSoon,
      page = 1,
      limit = 100,
    } = req.query;

    const accessFilter = await buildAccessFilter(req);
    if (accessFilter === null) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const filter = { ...accessFilter };

    if (clientId && mongoose.Types.ObjectId.isValid(clientId)) {
      filter.client = clientId;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (dateFrom || dateTo || expiringSoon === "true") {
      filter.expiryDate = {};
      if (dateFrom) filter.expiryDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.expiryDate.$lte = endDate;
      }
      if (expiringSoon === "true") {
        const now = new Date();
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + getRenewalWindowDays());
        filter.expiryDate.$gte = now;
        filter.expiryDate.$lte = dueDate;
      }
    }

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    const [records, total] = await Promise.all([
      dscPopulate(
        DscRecord.find(filter)
          .sort({ expiryDate: 1, updatedAt: -1 })
          .skip(skip)
          .limit(pageSize)
      ),
      DscRecord.countDocuments(filter),
    ]);

    res.json({
      records,
      settings: {
        renewalWindowDays: getRenewalWindowDays(),
      },
      pagination: {
        total,
        currentPage,
        totalPages: Math.ceil(total / pageSize),
        limit: pageSize,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDscRecord = async (req, res, next) => {
  try {
    const { client, dscClass, password, issueDate, expiryDate, status, notes } =
      req.body;

    if (!client || !mongoose.Types.ObjectId.isValid(client)) {
      return res.status(400).json({ message: "Valid client is required" });
    }

    const record = await DscRecord.create({
      companyId: getCompanyId(req),
      client,
      dscClass,
      password: password || "",
      issueDate,
      expiryDate,
      status: status || "New created",
      notes: notes || "",
      createdBy: req.user?._id || null,
    });

    const populated = await dscPopulate(DscRecord.findById(record._id));
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateDscRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid DSC record ID" });
    }

    const record = await DscRecord.findOneAndUpdate(
      { _id: id, ...getCompanyFilter(req) },
      {
        dscClass: req.body.dscClass,
        password: req.body.password,
        issueDate: req.body.issueDate,
        expiryDate: req.body.expiryDate,
        status: req.body.status,
        notes: req.body.notes,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!record) {
      return res.status(404).json({ message: "DSC record not found" });
    }

    const populated = await dscPopulate(DscRecord.findById(record._id));
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

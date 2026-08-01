import Attendance from "../models/Attendance.js";
import SelfAttendancePermission from "../models/SelfAttendancePermission.js";
import User from "../models/User.js";
import { getCompanyFilter, getCompanyId } from "../utils/companyScope.js";

// Get all users for attendance management
export const getAllUsersForAttendance = async (req, res, next) => {
  try {
    const companyFilter = getCompanyFilter(req);
    const users = await User.find({
      ...companyFilter,
      role: { $in: ["Employee", "Partner", "Manager"] },
      isActive: true,
    })
      .select("_id name email photo role")
      .lean();

    // Get self-permission status for each user
    const usersWithPermission = await Promise.all(
      users.map(async (user) => {
        const permission = await SelfAttendancePermission.findOne({
          userId: user._id,
          companyId: getCompanyId(req),
        }).lean();
        return {
          ...user,
          hasSelfPermission: permission?.hasSelfPermission || false,
        };
      })
    );

    res.json(usersWithPermission);
  } catch (error) {
    next(error);
  }
};

// Get attendance records for a specific date
export const getAttendanceByDate = async (req, res, next) => {
  try {
    const { date } = req.query; // YYYY-MM-DD format

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const companyFilter = getCompanyFilter(req);
    const companyUsers = await User.find({
      ...companyFilter,
      role: { $in: ["Employee", "Partner", "Manager"] },
    }).select("_id").lean();
    const companyUserIds = companyUsers.map((user) => user._id);

    const attendanceRecords = await Attendance.find({
      companyId: getCompanyId(req),
      userId: { $in: companyUserIds },
      date: { $gte: startDate, $lte: endDate },
    })
      .populate("userId", "name email photo role")
      .populate("markedBy", "name")
      .lean();

    res.json(attendanceRecords);
  } catch (error) {
    next(error);
  }
};

// Mark attendance manually by SuperAdmin
export const markAttendance = async (req, res, next) => {
  try {
    const { userId, date, status, checkInTime, checkOutTime, notes } = req.body;

    if (!userId || !date || !status) {
      return res
        .status(400)
        .json({ message: "userId, date, and status are required" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOneAndUpdate(
      { companyId: getCompanyId(req), userId, date: attendanceDate },
      {
        status,
        checkInTime,
        checkOutTime,
        notes,
        markedBy: req.user._id,
        markedAt: new Date(),
        isSelfMarked: false,
      },
      { upsert: true, new: true }
    )
      .populate("userId", "name email photo")
      .populate("markedBy", "name");

    res.json(attendance);
  } catch (error) {
    next(error);
  }
};

// Grant self-attendance permission
export const grantSelfPermission = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const permission = await SelfAttendancePermission.findOneAndUpdate(
      { userId, companyId: getCompanyId(req) },
      {
        hasSelfPermission: true,
        grantedBy: req.user._id,
        grantedAt: new Date(),
        revokedBy: null,
        revokedAt: null,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Self-attendance permission granted",
      permission,
    });
  } catch (error) {
    next(error);
  }
};

// Revoke self-attendance permission
export const revokeSelfPermission = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const permission = await SelfAttendancePermission.findOneAndUpdate(
      { userId, companyId: getCompanyId(req) },
      {
        hasSelfPermission: false,
        revokedBy: req.user._id,
        revokedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Self-attendance permission revoked",
      permission,
    });
  } catch (error) {
    next(error);
  }
};

// Self check-in
export const selfCheckIn = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { date } = req.body;

    // Check if user has self-permission
    const permission = await SelfAttendancePermission.findOne({
      userId,
      companyId: getCompanyId(req),
    });
    if (!permission?.hasSelfPermission) {
      return res
        .status(403)
        .json({ message: "Self-attendance permission not granted" });
    }

    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    const currentTime = new Date();
    const checkInTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(
      currentTime.getMinutes()
    ).padStart(2, "0")}`;

    const attendance = await Attendance.findOneAndUpdate(
      { companyId: getCompanyId(req), userId, date: attendanceDate },
      {
        $set: {
          checkInTime,
          status: "Present",
          isSelfMarked: true,
          hasSelfPermission: true,
        },
      },
      { upsert: true, new: true }
    ).populate("userId", "name email photo");

    res.json({
      message: "Checked in successfully",
      checkInTime,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// Self check-out
export const selfCheckOut = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { date } = req.body;

    // Check if user has self-permission
    const permission = await SelfAttendancePermission.findOne({
      userId,
      companyId: getCompanyId(req),
    });
    if (!permission?.hasSelfPermission) {
      return res
        .status(403)
        .json({ message: "Self-attendance permission not granted" });
    }

    const attendanceDate = new Date(date || new Date());
    attendanceDate.setHours(0, 0, 0, 0);

    const currentTime = new Date();
    const checkOutTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(
      currentTime.getMinutes()
    ).padStart(2, "0")}`;

    const attendance = await Attendance.findOneAndUpdate(
      { companyId: getCompanyId(req), userId, date: attendanceDate },
      {
        $set: {
          checkOutTime,
          isSelfMarked: true,
          hasSelfPermission: true,
        },
      },
      { new: true }
    ).populate("userId", "name email photo");

    if (!attendance) {
      return res.status(404).json({ message: "No check-in record found for today" });
    }

    res.json({
      message: "Checked out successfully",
      checkOutTime,
      attendance,
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly attendance report
export const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year, userId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "month and year are required" });
    }

    const monthNum = parseInt(month) - 1;
    const yearNum = parseInt(year);

    const startDate = new Date(yearNum, monthNum, 1);
    const endDate = new Date(yearNum, monthNum + 1, 0);

    let query = {
      companyId: getCompanyId(req),
      date: { $gte: startDate, $lte: endDate },
    };

    if (userId) {
      query.userId = userId;
    }

    const records = await Attendance.find(query)
      .populate("userId", "name email photo role")
      .populate("markedBy", "name")
      .sort({ date: 1 })
      .lean();

    // Group by user
    const reportByUser = {};
    records.forEach((record) => {
      const userKey = record.userId._id.toString();
      if (!reportByUser[userKey]) {
        reportByUser[userKey] = {
          userId: record.userId._id,
          userName: record.userId.name,
          userEmail: record.userId.email,
          userPhoto: record.userId.photo,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            halfDay: 0,
            leave: 0,
            overtime: 0,
            paidLeave: 0,
          },
        };
      }
      reportByUser[userKey].records.push(record);
      reportByUser[userKey].summary[record.status.toLowerCase().replace(" ", "")] += 1;
    });

    res.json(Object.values(reportByUser));
  } catch (error) {
    next(error);
  }
};

// Bulk mark attendance
export const bulkMarkAttendance = async (req, res, next) => {
  try {
    const { attendanceData } = req.body; // Array of { userId, date, status, checkInTime, checkOutTime }

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ message: "attendanceData array is required" });
    }

    const results = await Promise.all(
      attendanceData.map(async (data) => {
        const attendanceDate = new Date(data.date);
        attendanceDate.setHours(0, 0, 0, 0);

        return Attendance.findOneAndUpdate(
          { companyId: getCompanyId(req), userId: data.userId, date: attendanceDate },
          {
            status: data.status,
            checkInTime: data.checkInTime,
            checkOutTime: data.checkOutTime,
            notes: data.notes,
            markedBy: req.user._id,
            markedAt: new Date(),
            isSelfMarked: false,
          },
          { upsert: true, new: true }
        )
          .populate("userId", "name email")
          .lean();
      })
    );

    res.json({
      message: `${results.length} attendance records updated`,
      results,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's attendance for date range
export const getUserAttendance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const query = { userId, companyId: getCompanyId(req) };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();

    res.json(records);
  } catch (error) {
    next(error);
  }
};

// Get self-permission status
export const getSelfPermissionStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const permission = await SelfAttendancePermission.findOne({
      userId,
      companyId: getCompanyId(req),
    }).lean();

    res.json({
      hasSelfPermission: permission?.hasSelfPermission || false,
      permission,
    });
  } catch (error) {
    next(error);
  }
};

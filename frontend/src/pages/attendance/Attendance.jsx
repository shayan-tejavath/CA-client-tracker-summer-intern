import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  getAllUsersForAttendance,
  getAttendanceByDate,
  markAttendance,
  grantSelfPermission,
  revokeSelfPermission,
  getMonthlyReport,
  bulkMarkAttendance,
  getSelfPermissionStatus,
} from "../../services/attendanceService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AttendanceDailyView from "../../components/attendance/AttendanceDailyView.jsx";
import AttendanceMonthlyView from "../../components/attendance/AttendanceMonthlyView.jsx";
import AttendanceModal from "../../components/attendance/AttendanceModal.jsx";
import BulkAttendanceModal from "../../components/attendance/BulkAttendanceModal.jsx";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const Attendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Daily");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selfPermissionStatus, setSelfPermissionStatus] = useState(false);

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.role === "SuperAdmin";

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [user, isSuperAdmin, navigate]);

  // Fetch users for attendance
  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  // Fetch daily attendance
  useEffect(() => {
    if (activeTab === "Daily" && isSuperAdmin) {
      fetchAttendanceByDate();
    }
  }, [selectedDate, activeTab, isSuperAdmin]);

  // Fetch monthly report
  useEffect(() => {
    if (activeTab === "Monthly" && isSuperAdmin) {
      fetchMonthlyReport();
    }
  }, [selectedMonth, selectedYear, activeTab, isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAllUsersForAttendance();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    try {
      setLoading(true);
      const data = await getAttendanceByDate(selectedDate);
      setAttendanceRecords(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyReport(selectedMonth, selectedYear);
      setMonthlyReport(data);
    } catch (error) {
      console.error("Error fetching monthly report:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (data) => {
    try {
      await markAttendance(data);
      setShowModal(false);
      if (activeTab === "Daily") {
        fetchAttendanceByDate();
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleGrantPermission = async (userId) => {
    try {
      await grantSelfPermission(userId);
      fetchUsers();
      fetchAttendanceByDate();
    } catch (error) {
      console.error("Error granting permission:", error);
    }
  };

  const handleRevokePermission = async (userId) => {
    try {
      await revokeSelfPermission(userId);
      fetchUsers();
      fetchAttendanceByDate();
    } catch (error) {
      console.error("Error revoking permission:", error);
    }
  };

  const handleBulkMark = async (data) => {
    try {
      await bulkMarkAttendance(data);
      setShowBulkModal(false);
      fetchAttendanceByDate();
    } catch (error) {
      console.error("Error bulk marking attendance:", error);
    }
  };

  const handlePrevDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-blue-600 mb-2">
              ← Attendance
            </button>
            <h1 className="text-3xl font-bold">Attendance</h1>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Bulk Attendance
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab("Daily")}
            className={`px-6 py-2 font-semibold transition-colors ${
              activeTab === "Daily"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveTab("Monthly")}
            className={`px-6 py-2 font-semibold transition-colors ${
              activeTab === "Monthly"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Content */}
        {activeTab === "Daily" ? (
          <AttendanceDailyView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            attendanceRecords={attendanceRecords}
            users={users}
            loading={loading}
            onMarkAttendance={(user) => {
              setSelectedUser(user);
              setShowModal(true);
            }}
            onGrantPermission={handleGrantPermission}
            onRevokePermission={handleRevokePermission}
            onPrevDate={handlePrevDate}
            onNextDate={handleNextDate}
          />
        ) : (
          <AttendanceMonthlyView
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            monthlyReport={monthlyReport}
            loading={loading}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
          />
        )}

        {/* Modals */}
        {showModal && (
          <AttendanceModal
            user={selectedUser}
            onClose={() => {
              setShowModal(false);
              setSelectedUser(null);
            }}
            onSave={handleMarkAttendance}
            date={selectedDate}
          />
        )}

        {showBulkModal && (
          <BulkAttendanceModal
            onClose={() => setShowBulkModal(false)}
            onSave={handleBulkMark}
            users={users}
            date={selectedDate}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Attendance;

import { useState, useEffect } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import {
  getSelfPermissionStatus,
  selfCheckIn,
  selfCheckOut,
  getUserAttendance,
} from "../../services/attendanceService.js";
import { useAuth } from "../../context/AuthContext.jsx";

const SelfAttendance = () => {
  const { user } = useAuth();
  const [hasSelfPermission, setHasSelfPermission] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchPermissionStatus();
    fetchTodayAttendance();
  }, []);

  const fetchPermissionStatus = async () => {
    try {
      const data = await getSelfPermissionStatus();
      setHasSelfPermission(data.hasSelfPermission);
    } catch (error) {
      console.error("Error fetching permission status:", error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const data = await getUserAttendance(today, today);
      if (data.length > 0) {
        setAttendanceToday(data[0]);
      }
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!hasSelfPermission) {
      setMessage("You don't have self-attendance permission. Please contact admin.");
      return;
    }

    try {
      setLoading(true);
      const response = await selfCheckIn(today);
      setMessage(`✓ Checked in at ${response.checkInTime}`);
      fetchTodayAttendance();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error checking in: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!hasSelfPermission) {
      setMessage("You don't have self-attendance permission. Please contact admin.");
      return;
    }

    try {
      setLoading(true);
      const response = await selfCheckOut(today);
      setMessage(`✓ Checked out at ${response.checkOutTime}`);
      fetchTodayAttendance();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Error checking out: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Header */}
          <h1 className="text-3xl font-bold mb-2">My Attendance</h1>
          <p className="text-gray-600 mb-8">Today: {today}</p>

          {/* Permission Status */}
          {!hasSelfPermission && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ You don't have self-attendance permission yet. Contact your administrator to enable self check-in/check-out.
              </p>
            </div>
          )}

          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.startsWith("✓")
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          {/* Today's Attendance */}
          {attendanceToday && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="font-semibold text-lg mb-4">Today's Status</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {attendanceToday.status}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Check In</div>
                  <div className="text-2xl font-bold text-green-600">
                    {attendanceToday.checkInTime || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Check Out</div>
                  <div className="text-2xl font-bold text-red-600">
                    {attendanceToday.checkOutTime || "—"}
                  </div>
                </div>
              </div>
              {attendanceToday.notes && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-sm text-gray-600">Notes</div>
                  <p className="text-gray-800">{attendanceToday.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Check-in/Check-out Buttons */}
          {hasSelfPermission && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleCheckIn}
                disabled={loading || (attendanceToday?.checkInTime)}
                className={`px-6 py-4 rounded-lg font-bold text-white text-lg transition-all ${
                  attendanceToday?.checkInTime
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Processing..." : "Check In"}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading || !attendanceToday?.checkInTime || attendanceToday?.checkOutTime}
                className={`px-6 py-4 rounded-lg font-bold text-white text-lg transition-all ${
                  !attendanceToday?.checkInTime || attendanceToday?.checkOutTime
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? "Processing..." : "Check Out"}
              </button>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Click "Check In" when you arrive at work</li>
              <li>✓ Click "Check Out" when you leave work</li>
              <li>✓ Only one check-in and one check-out per day</li>
              <li>✓ Your supervisor can adjust times if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SelfAttendance;

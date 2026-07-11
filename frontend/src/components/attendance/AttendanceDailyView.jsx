import { useState } from "react";
import { FaArrowLeft, FaArrowRight, FaEllipsisV } from "react-icons/fa";

const AttendanceDailyView = ({
  selectedDate,
  setSelectedDate,
  attendanceRecords,
  users,
  loading,
  onMarkAttendance,
  onGrantPermission,
  onRevokePermission,
  onPrevDate,
  onNextDate,
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedUserMenu, setSelectedUserMenu] = useState(null);

  // Calculate day name
  const dayName = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long" }
  );

  // Count attendance statuses
  const statusCounts = {
    Present: 0,
    "Half Day": 0,
    Overtime: 0,
    Absent: 0,
    Leave: 0,
    "Paid Leave": 0,
  };

  attendanceRecords.forEach((record) => {
    statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  });

  // Get attendance for a user
  const getAttendanceForUser = (userId) => {
    return attendanceRecords.find((r) => r.userId._id === userId);
  };

  // Handle right-click context menu
  const handleContextMenu = (e, user) => {
    e.preventDefault();
    setSelectedUserMenu(user._id);
    setContextMenu({ x: e.pageX, y: e.pageY, user });
  };

  // Close context menu when clicking elsewhere
  const handleClickOutside = () => {
    setContextMenu(null);
    setSelectedUserMenu(null);
  };

  return (
    <div onClick={handleClickOutside}>
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
          <button
            onClick={onPrevDate}
            className="p-2.5 hover:bg-blue-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FaArrowLeft size={18} />
          </button>
          <button
            onClick={onNextDate}
            className="p-2.5 hover:bg-blue-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FaArrowRight size={18} />
          </button>
        </div>

        <div className="text-right">
          <div className="text-blue-600 font-bold text-lg">{dayName}</div>
          <div className="text-sm text-gray-600 font-medium">{selectedDate}</div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-6 gap-3 mb-8">
        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-300 shadow-sm">
          <div className="text-3xl font-bold text-green-700">
            {statusCounts["Present"]}
          </div>
          <div className="text-xs font-bold text-green-800 uppercase tracking-wide">Present</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-300 shadow-sm">
          <div className="text-3xl font-bold text-blue-700">
            {statusCounts["Half Day"]}
          </div>
          <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">Half Day</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-300 shadow-sm">
          <div className="text-3xl font-bold text-purple-700">
            {statusCounts["Overtime"]}
          </div>
          <div className="text-xs font-bold text-purple-800 uppercase tracking-wide">Overtime</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-300 shadow-sm">
          <div className="text-3xl font-bold text-red-700">
            {statusCounts["Absent"]}
          </div>
          <div className="text-xs font-bold text-red-800 uppercase tracking-wide">Absent</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300 shadow-sm">
          <div className="text-3xl font-bold text-orange-700">
            {statusCounts["Leave"]}
          </div>
          <div className="text-xs font-bold text-orange-800 uppercase tracking-wide">Leave</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border-2 border-pink-300 shadow-sm">
          <div className="text-3xl font-bold text-pink-700">
            {statusCounts["Paid Leave"]}
          </div>
          <div className="text-xs font-bold text-pink-800 uppercase tracking-wide">Paid Leave</div>
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-md overflow-hidden">
        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No employees found
            </div>
          ) : (
            <div>
              {users.map((user) => {
                const attendance = getAttendanceForUser(user._id);
                const hasSelfPermission = user.hasSelfPermission;

                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-blue-50 transition-colors relative"
                    onContextMenu={(e) => handleContextMenu(e, user)}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={user.photo || "https://via.placeholder.com/40"}
                        alt={user.name}
                        className="w-11 h-11 rounded-full shadow-md border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-sm text-gray-800">{user.name}</div>
                        <div className="text-xs text-gray-600 font-medium flex gap-2">
                          {attendance ? (
                            <>
                              <span>
                                Check In: {attendance.checkInTime || "—"}
                              </span>
                              <span>
                                Check Out: {attendance.checkOutTime || "—"}
                              </span>
                            </>
                          ) : (
                            <span>No attendance marked</span>
                          )}
                          {hasSelfPermission && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                              Self
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {attendance && (
                          <div className="text-sm font-bold">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                attendance.status === "Present"
                                  ? "bg-green-100 text-green-700"
                                  : attendance.status === "Half Day"
                                  ? "bg-blue-100 text-blue-700"
                                  : attendance.status === "Overtime"
                                  ? "bg-purple-100 text-purple-700"
                                  : attendance.status === "Absent"
                                  ? "bg-red-100 text-red-700"
                                  : attendance.status === "Leave"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-pink-100 text-pink-700"
                              }`}
                            >
                              {attendance.status}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onMarkAttendance(user)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                      >
                        Mark Attendance
                      </button>
                    </div>

                    {/* Context Menu */}
                    {selectedUserMenu === user._id && contextMenu && (
                      <div
                        className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        style={{ top: contextMenu.y + "px", left: contextMenu.x + "px" }}
                      >
                        {hasSelfPermission ? (
                          <button
                            onClick={() => {
                              onRevokePermission(user._id);
                              setContextMenu(null);
                              setSelectedUserMenu(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                          >
                            Disassign Self
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onGrantPermission(user._id);
                              setContextMenu(null);
                              setSelectedUserMenu(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-600"
                          >
                            Assign Self
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceDailyView;

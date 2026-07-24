import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

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

  const statusClassNames = {
    Present: "attendance-status-badge--present",
    "Half Day": "attendance-status-badge--half-day",
    Overtime: "attendance-status-badge--overtime",
    Absent: "attendance-status-badge--absent",
    Leave: "attendance-status-badge--leave",
    "Paid Leave": "attendance-status-badge--paid-leave",
  };

  const summaryItems = [
    { label: "Present", className: "attendance-summary-card--present" },
    { label: "Half Day", className: "attendance-summary-card--half-day" },
    { label: "Overtime", className: "attendance-summary-card--overtime" },
    { label: "Absent", className: "attendance-summary-card--absent" },
    { label: "Leave", className: "attendance-summary-card--leave" },
    { label: "Paid Leave", className: "attendance-summary-card--paid-leave" },
  ];

  attendanceRecords.forEach((record) => {
    statusCounts[record.status] = (statusCounts[record.status] || 0) + 1;
  });

  // Get attendance for a user
  const getAttendanceForUser = (userId) => {
    return attendanceRecords.find((r) => (r.userId?._id || r.userId) === userId);
  };

  // Handle right-click context menu
  const handleContextMenu = (e, user) => {
    e.preventDefault();
    setSelectedUserMenu(user._id);
    setContextMenu({ x: e.clientX, y: e.clientY, user });
  };

  // Close context menu when clicking elsewhere
  const handleClickOutside = () => {
    setContextMenu(null);
    setSelectedUserMenu(null);
  };

  return (
    <div onClick={handleClickOutside}>
      {/* Date Navigation */}
      <div className="attendance-controls">
        <div className="attendance-control-group">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="attendance-date-input"
          />
          <button
            type="button"
            onClick={onPrevDate}
            className="attendance-icon-button"
            aria-label="Previous date"
          >
            <FaArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNextDate}
            className="attendance-icon-button"
            aria-label="Next date"
          >
            <FaArrowRight size={18} />
          </button>
        </div>

        <div className="attendance-date-display">
          <div className="attendance-date-day">{dayName}</div>
          <div className="attendance-date-value">{selectedDate}</div>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="attendance-summary-grid">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className={`attendance-summary-card ${item.className}`}
          >
            <div className="attendance-summary-value">
              {statusCounts[item.label]}
            </div>
            <div className="attendance-summary-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Employees List */}
      <div className="attendance-panel">
        <div className="attendance-list">
          {loading ? (
            <div className="attendance-empty-state">Loading...</div>
          ) : users.length === 0 ? (
            <div className="attendance-empty-state">
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
                    className="attendance-employee-row"
                    onContextMenu={(e) => handleContextMenu(e, user)}
                  >
                    {/* User Info */}
                    <div className="attendance-user-info">
                      <img
                        src={user.photo || "https://via.placeholder.com/40"}
                        alt={user.name}
                        className="attendance-avatar"
                      />
                      <div className="attendance-user-copy">
                        <div className="attendance-user-name">{user.name}</div>
                        <div className="attendance-user-meta">
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
                            <span className="attendance-chip attendance-chip--self">
                              Self
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="attendance-row-actions">
                      {attendance && (
                        <span
                          className={`attendance-status-badge ${
                            statusClassNames[attendance.status] ||
                            "attendance-status-badge--paid-leave"
                          }`}
                        >
                          {attendance.status}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(user)}
                        className="attendance-primary-action"
                      >
                        Mark Attendance
                      </button>
                    </div>

                    {/* Context Menu */}
                    {selectedUserMenu === user._id && contextMenu && (
                      <div
                        className="attendance-context-menu"
                        style={{ top: contextMenu.y + "px", left: contextMenu.x + "px" }}
                      >
                        {hasSelfPermission ? (
                          <button
                            type="button"
                            onClick={() => {
                              onRevokePermission(user._id);
                              setContextMenu(null);
                              setSelectedUserMenu(null);
                            }}
                            className="attendance-context-action attendance-context-action--danger"
                          >
                            Disassign Self
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onGrantPermission(user._id);
                              setContextMenu(null);
                              setSelectedUserMenu(null);
                            }}
                            className="attendance-context-action"
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

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const AttendanceMonthlyView = ({
  selectedMonth,
  selectedYear,
  monthlyReport,
  loading,
  onPrevMonth,
  onNextMonth,
}) => {
  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // Get days in month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Get first day of month
  const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  // Create calendar grid
  const calendarDays = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // Get attendance for user on specific day
  const getAttendanceStatus = (userRecords, day) => {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    const dateStr = date.toISOString().split("T")[0];

    const record = userRecords.find((r) => {
      const recordDate = new Date(r.date).toISOString().split("T")[0];
      return recordDate === dateStr;
    });

    return record?.status || null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Present":
        return "attendance-status-pill--present";
      case "Half Day":
        return "attendance-status-pill--half-day";
      case "Overtime":
        return "attendance-status-pill--overtime";
      case "Absent":
        return "attendance-status-pill--absent";
      case "Leave":
        return "attendance-status-pill--leave";
      case "Paid Leave":
        return "attendance-status-pill--paid-leave";
      default:
        return "";
    }
  };

  return (
    <div>
      {/* Month Navigation */}
      <div className="attendance-controls attendance-month-header">
        <div className="attendance-control-group">
          <button
            type="button"
            onClick={onPrevMonth}
            className="attendance-icon-button"
            aria-label="Previous month"
          >
            <FaArrowLeft size={18} />
          </button>
          <h2 className="attendance-month-title">{monthName}</h2>
          <button
            type="button"
            onClick={onNextMonth}
            className="attendance-icon-button"
            aria-label="Next month"
          >
            <FaArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* User Selection Dropdown */}
      <div className="attendance-filter">
        <label className="attendance-label">User</label>
        <select className="attendance-select">
          <option value="">All Users</option>
          {monthlyReport.map((item) => (
            <option key={item.userId} value={item.userId}>
              {item.userName}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="attendance-empty-state">Loading...</div>
      ) : monthlyReport.length === 0 ? (
        <div className="attendance-empty-state">No attendance data</div>
      ) : (
        <div className="attendance-monthly-grid">
          {monthlyReport.map((userReport) => (
            <div
              key={userReport.userId}
              className="attendance-user-card"
            >
              {/* User Header */}
              <div className="attendance-card-header">
                <img
                  src={userReport.userPhoto || "https://via.placeholder.com/40"}
                  alt={userReport.userName}
                  className="attendance-avatar"
                />
                <div className="attendance-user-copy">
                  <div className="attendance-user-name">{userReport.userName}</div>
                  <div className="attendance-user-email">{userReport.userEmail}</div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="attendance-mini-stats">
                <div className="attendance-mini-stat attendance-mini-stat--present">
                  <strong>{userReport.summary.present}</strong>
                  <span>Present</span>
                </div>
                <div className="attendance-mini-stat attendance-mini-stat--absent">
                  <strong>{userReport.summary.absent}</strong>
                  <span>Absent</span>
                </div>
                <div className="attendance-mini-stat attendance-mini-stat--leave">
                  <strong>{userReport.summary.leave}</strong>
                  <span>Leave</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="attendance-calendar-grid">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="attendance-calendar-day-name"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="attendance-calendar-day attendance-calendar-day--empty"
                      />
                    );
                  }

                  const status = getAttendanceStatus(userReport.records, day);

                  return (
                    <div
                      key={day}
                      className={`attendance-calendar-day ${status ? getStatusColor(status) : ""}`}
                      title={status || "No record"}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="attendance-legend">
                <div className="attendance-legend-item">
                  <div className="attendance-legend-dot attendance-status-pill--present"></div>
                  <span>Present</span>
                </div>
                <div className="attendance-legend-item">
                  <div className="attendance-legend-dot attendance-status-pill--absent"></div>
                  <span>Absent</span>
                </div>
                <div className="attendance-legend-item">
                  <div className="attendance-legend-dot attendance-status-pill--half-day"></div>
                  <span>Half Day</span>
                </div>
                <div className="attendance-legend-item">
                  <div className="attendance-legend-dot attendance-status-pill--leave"></div>
                  <span>Leave</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceMonthlyView;

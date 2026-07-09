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
        return "bg-green-100 text-green-700";
      case "Half Day":
        return "bg-blue-100 text-blue-700";
      case "Overtime":
        return "bg-purple-100 text-purple-700";
      case "Absent":
        return "bg-red-100 text-red-700";
      case "Leave":
        return "bg-orange-100 text-orange-700";
      case "Paid Leave":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4 items-center">
          <button onClick={onPrevMonth} className="p-2.5 hover:bg-blue-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors">
            <FaArrowLeft size={18} />
          </button>
          <h2 className="text-xl font-bold w-48 text-center text-gray-800">{monthName}</h2>
          <button onClick={onNextMonth} className="p-2.5 hover:bg-blue-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors">
            <FaArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* User Selection Dropdown */}
      <div className="mb-8">
        <label className="block text-sm font-bold mb-2 text-gray-700 uppercase tracking-wide">User</label>
        <select className="w-72 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
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
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : monthlyReport.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No attendance data</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {monthlyReport.map((userReport) => (
            <div
              key={userReport.userId}
              className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md"
            >
              {/* User Header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-200">
                <img
                  src={userReport.userPhoto || "https://via.placeholder.com/40"}
                  alt={userReport.userName}
                  className="w-11 h-11 rounded-full shadow-md border-2 border-gray-200"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{userReport.userName}</div>
                  <div className="text-xs text-gray-600 font-medium">{userReport.userEmail}</div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 mb-5 text-sm">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="font-bold text-green-700 text-lg">
                    {userReport.summary.present}
                  </div>
                  <div className="text-xs font-bold text-green-600 uppercase">Present</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-bold text-red-700 text-lg">
                    {userReport.summary.absent}
                  </div>
                  <div className="text-xs font-bold text-red-600 uppercase">Absent</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="font-bold text-orange-700 text-lg">
                    {userReport.summary.leave}
                  </div>
                  <div className="text-xs font-bold text-orange-600 uppercase">Leave</div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 bg-gray-50 p-3 rounded-lg">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-bold text-gray-700 py-2 bg-gradient-to-b from-gray-200 to-gray-100 rounded"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return (
                      <div key={`empty-${index}`} className="aspect-square bg-gray-100 rounded" />
                    );
                  }

                  const status = getAttendanceStatus(userReport.records, day);

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold cursor-pointer transition-all hover:shadow-md border ${
                        status
                          ? getStatusColor(status) + " border-opacity-50"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                      title={status || "No record"}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 rounded border border-green-300"></div>
                  <span>Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 rounded border border-red-300"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 rounded border border-blue-300"></div>
                  <span>Half Day</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-100 rounded border border-orange-300"></div>
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

import { useState } from "react";
import { FaX } from "react-icons/fa6";

const BulkAttendanceModal = ({ onClose, onSave, users, date }) => {
  const [bulkData, setBulkData] = useState(
    users.map((user) => ({
      userId: user._id,
      status: "Present",
      checkInTime: "09:00",
      checkOutTime: "17:00",
    }))
  );

  const handleStatusChange = (index, status) => {
    const updated = [...bulkData];
    updated[index].status = status;
    setBulkData(updated);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...bulkData];
    updated[index][field] = value;
    setBulkData(updated);
  };

  const handleSave = () => {
    const dataToSave = bulkData.map((data) => ({
      ...data,
      date,
    }));
    onSave(dataToSave);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-3xl max-h-96 overflow-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-800">Bulk Mark Attendance</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <FaX size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Info */}
        <div className="text-sm text-gray-600 mb-5 font-medium bg-blue-50 p-3 rounded-lg border border-blue-200">
          📅 Marking attendance for date: <strong className="text-blue-700 text-base">{date}</strong>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-6 border border-gray-200 rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                <th className="px-4 py-3 text-left font-bold text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left font-bold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700">Check In</th>
                <th className="px-4 py-3 text-center font-bold text-gray-700">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.photo || "https://via.placeholder.com/32"}
                        alt={user.name}
                        className="w-8 h-8 rounded-full shadow-sm border border-gray-200"
                      />
                      <span className="font-bold text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={bulkData[index]?.status || "Present"}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Half Day</option>
                      <option>Leave</option>
                      <option>Overtime</option>
                      <option>Paid Leave</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="time"
                      value={bulkData[index]?.checkInTime || "09:00"}
                      onChange={(e) =>
                        handleTimeChange(index, "checkInTime", e.target.value)
                      }
                      className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm w-28 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="time"
                      value={bulkData[index]?.checkOutTime || "17:00"}
                      onChange={(e) =>
                        handleTimeChange(index, "checkOutTime", e.target.value)
                      }
                      className="px-3 py-1.5 border-2 border-gray-300 rounded-lg text-sm w-28 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-bold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;

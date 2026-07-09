import { useState } from "react";
import { FaX } from "react-icons/fa6";

const AttendanceModal = ({ user, date, onClose, onSave }) => {
  const [status, setStatus] = useState("Present");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSave({
      userId: user._id,
      date,
      status,
      checkInTime,
      checkOutTime,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaX size={18} className="text-gray-600" />
          </button>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-4 mb-7 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <img
            src={user?.photo || "https://via.placeholder.com/40"}
            alt={user?.name}
            className="w-12 h-12 rounded-full shadow-md border-2 border-white"
          />
          <div>
            <div className="font-bold text-gray-800 text-base">{user?.name}</div>
            <div className="text-sm text-gray-600 font-medium">{date}</div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="mb-7">
          <label className="block text-sm font-bold mb-3 text-gray-700 uppercase tracking-wider">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {["Present", "Absent", "Half Day", "Leave", "Overtime", "Paid Leave"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 border-2 ${
                    status === s
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow-md"
                  }`}
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>

        {/* Check-in/Check-out Times */}
        <div className="grid grid-cols-2 gap-4 mb-7">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Check In Time</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-700">Check Out Time</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="mb-7">
          <label className="block text-sm font-bold mb-2 text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            rows={3}
          />
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;

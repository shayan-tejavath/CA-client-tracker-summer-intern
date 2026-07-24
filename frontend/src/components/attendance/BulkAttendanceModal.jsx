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
    <div className="attendance-modal-backdrop">
      <div className="attendance-modal-card attendance-modal-card--wide">
        {/* Header */}
        <div className="attendance-modal-header">
          <h2 className="attendance-modal-title">Bulk Mark Attendance</h2>
          <button
            type="button"
            onClick={onClose}
            className="attendance-close-button"
            aria-label="Close bulk attendance modal"
          >
            <FaX size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Info */}
        <div className="attendance-info-banner">
          Marking attendance for date: <strong>{date}</strong>
        </div>

        {/* Table */}
        <div className="attendance-table-shell">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user._id}>
                  <td>
                    <div className="attendance-user-info">
                      <img
                        src={user.photo || "https://via.placeholder.com/32"}
                        alt={user.name}
                        className="attendance-avatar"
                      />
                      <span className="attendance-user-name">{user.name}</span>
                    </div>
                  </td>
                  <td>
                    <select
                      value={bulkData[index]?.status || "Present"}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      className="attendance-select"
                    >
                      <option>Present</option>
                      <option>Absent</option>
                      <option>Half Day</option>
                      <option>Leave</option>
                      <option>Overtime</option>
                      <option>Paid Leave</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="time"
                      value={bulkData[index]?.checkInTime || "09:00"}
                      onChange={(e) =>
                        handleTimeChange(index, "checkInTime", e.target.value)
                      }
                      className="attendance-time-input"
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      value={bulkData[index]?.checkOutTime || "17:00"}
                      onChange={(e) =>
                        handleTimeChange(index, "checkOutTime", e.target.value)
                      }
                      className="attendance-time-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Buttons */}
        <div className="attendance-modal-actions">
          <button
            type="button"
            onClick={onClose}
            className="attendance-secondary-action"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="attendance-primary-action"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkAttendanceModal;

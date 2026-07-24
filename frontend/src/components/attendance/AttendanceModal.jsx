import { useState } from "react";
import { FaX } from "react-icons/fa6";

const AttendanceModal = ({ user, date, onClose, onSave }) => {
  const [status, setStatus] = useState("Present");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");

  const statusClassNames = {
    Present: "attendance-status-pill--present",
    Absent: "attendance-status-pill--absent",
    "Half Day": "attendance-status-pill--half-day",
    Leave: "attendance-status-pill--leave",
    Overtime: "attendance-status-pill--overtime",
    "Paid Leave": "attendance-status-pill--paid-leave",
  };

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
    <div className="attendance-modal-backdrop">
      <div className="attendance-modal-card">
        {/* Header */}
        <div className="attendance-modal-header">
          <h2 className="attendance-modal-title">Mark Attendance</h2>
          <button
            type="button"
            onClick={onClose}
            className="attendance-close-button"
            aria-label="Close attendance modal"
          >
            <FaX size={18} className="text-gray-600" />
          </button>
        </div>

        {/* User Info */}
        <div className="attendance-modal-user">
          <img
            src={user?.photo || "https://via.placeholder.com/40"}
            alt={user?.name}
            className="attendance-avatar"
          />
          <div className="attendance-user-copy">
            <div className="attendance-user-name">{user?.name}</div>
            <div className="attendance-user-email">{date}</div>
          </div>
        </div>

        {/* Status Selection */}
        <div className="attendance-field-group">
          <label className="attendance-label">Status</label>
          <div className="attendance-status-grid">
            {["Present", "Absent", "Half Day", "Leave", "Overtime", "Paid Leave"].map(
              (s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`attendance-status-pill ${
                    status === s
                      ? "attendance-status-pill--active"
                      : statusClassNames[s]
                  }`}
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>

        {/* Check-in/Check-out Times */}
        <div className="attendance-time-grid attendance-field-group">
          <div>
            <label className="attendance-label">Check In Time</label>
            <input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              className="attendance-time-input"
            />
          </div>
          <div>
            <label className="attendance-label">Check Out Time</label>
            <input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              className="attendance-time-input"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="attendance-field-group">
          <label className="attendance-label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            className="attendance-notes"
            rows={3}
          />
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;

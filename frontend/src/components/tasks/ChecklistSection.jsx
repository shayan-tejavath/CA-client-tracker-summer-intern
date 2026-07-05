import { useEffect, useState } from "react";
import { CheckSquare2, Trash2, Plus, AlertCircle } from "lucide-react";
import {
  getChecklistsByTask,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "../../services/checklistService";
import "../../styles/checklist.css";

const ChecklistSection = ({ taskId, canEdit }) => {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getChecklistsByTask(taskId);
      setChecklists(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load checklist items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadChecklists();
    }
  }, [taskId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    setSubmitting(true);
    try {
      const newItem = await createChecklistItem(taskId, {
        title: newItemTitle.trim(),
      });
      setChecklists([...checklists, newItem]);
      setNewItemTitle("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add checklist item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (checklistId, currentCompleted) => {
    try {
      const updated = await updateChecklistItem(checklistId, {
        completed: !currentCompleted,
      });
      setChecklists(
        checklists.map((item) => (item._id === checklistId ? updated : item))
      );
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update checklist item");
    }
  };

  const handleDeleteItem = async (checklistId) => {
    try {
      await deleteChecklistItem(checklistId);
      setChecklists(checklists.filter((item) => item._id !== checklistId));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete checklist item");
    }
  };

  const completedCount = checklists.filter((item) => item.completed).length;
  const totalCount = checklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <article className="task-details-card task-details-card--placeholder">
        <div className="task-card-header">
          <div>
            <h3 className="task-card-title">Checklist</h3>
            <p className="task-card-description">Track task items</p>
          </div>
          <CheckSquare2 size={20} className="task-card-icon" />
        </div>
        <div className="task-placeholder-content">
          <div className="task-placeholder-icon">
            <CheckSquare2 size={24} />
          </div>
          <p className="task-placeholder-text">Loading checklist items...</p>
        </div>
      </article>
    );
  }

  return (
    <article className="task-details-card">
      <div className="task-card-header">
        <div>
          <h3 className="task-card-title">Checklist</h3>
          <p className="task-card-description">
            {completedCount} of {totalCount} completed
          </p>
        </div>
        <CheckSquare2 size={20} className="task-card-icon" />
      </div>

      {error && (
        <div className="checklist-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {totalCount > 0 && (
        <div className="checklist-progress">
          <div className="checklist-progress-bar">
            <div
              className="checklist-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="checklist-progress-text">{progressPercent}% Complete</span>
        </div>
      )}

      {totalCount === 0 ? (
        <div className="checklist-empty">
          <p className="checklist-empty-text">No checklist items yet</p>
          <p className="checklist-empty-subtext">Add items below to track progress</p>
        </div>
      ) : (
        <div className="checklist-items">
          {checklists.map((item) => (
            <div key={item._id} className="checklist-item">
              <label className="checklist-checkbox">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    handleToggleComplete(item._id, item.completed)
                  }
                  disabled={!canEdit}
                />
                <span className="checkbox-custom" />
              </label>
              <div className="checklist-item-content">
                <p
                  className={`checklist-item-title ${
                    item.completed ? "completed" : ""
                  }`}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="checklist-item-description">
                    {item.description}
                  </p>
                )}
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="checklist-delete-btn"
                  onClick={() => handleDeleteItem(item._id)}
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleAddItem} className="checklist-form">
          <input
            type="text"
            className="checklist-input"
            placeholder="Add a new checklist item..."
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            className="checklist-add-btn"
            disabled={submitting || !newItemTitle.trim()}
          >
            <Plus size={16} />
            Add Item
          </button>
        </form>
      )}
    </article>
  );
};

export default ChecklistSection;

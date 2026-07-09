import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createInvoice,
  getUnbilledTasks,
} from "../../../services/invoiceService";

import { getClients } from "../../../services/clientService";

import "../../../styles/billing.css";

const InvoiceForm = () => {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [form, setForm] = useState({
    client: "",
    dueDate: "",
    notes: "",
  });

  const [selectedTasks, setSelectedTasks] =
    useState([]);

  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGST] = useState(0);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const data = await getClients();
    setClients(
      Array.isArray(data)
        ? data
        : data.clients || []
    );
  };

  const loadTasks = async (clientId) => {
    const data =
      await getUnbilledTasks(clientId);

    setTasks(Array.isArray(data) ? data : []);
  };

  const handleClientChange = async (e) => {
    const clientId = e.target.value;

    setForm({
      ...form,
      client: clientId,
    });

    await loadTasks(clientId);
  };

  const handleTaskSelection = (
    taskId,
    checked
  ) => {
    if (checked) {
      const task = tasks.find(
        (t) => t._id === taskId
      );

      const updated = [
        ...selectedTasks,
        task,
      ];

      setSelectedTasks(updated);

      calculateTotals(updated);
    } else {
      const updated =
        selectedTasks.filter(
          (t) => t._id !== taskId
        );

      setSelectedTasks(updated);

      calculateTotals(updated);
    }
  };

  const calculateTotals = (taskList) => {
    let subtotalValue = 0;
    let gstValue = 0;

    taskList.forEach((task) => {
      const amount =
        task.billableAmount || 0;

      const gstPercent =
        task.service?.gstPercentage ||
        18;

      subtotalValue += amount;

      gstValue +=
        amount *
        (gstPercent / 100);
    });

    setSubtotal(subtotalValue);
    setGST(gstValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      client: form.client,
      dueDate: form.dueDate,
      notes: form.notes,

      items: selectedTasks.map(
        (task) => ({
          taskId: task._id,
          description: task.title,
          amount:
            task.billableAmount,
          gstPercentage:
            task.service
              ?.gstPercentage || 18,
        })
      ),
    };

    await createInvoice(payload);

    navigate("/dashboard/invoices");
  };

  return (
    <div className="billing-page">
      <div className="billing-card">
        <h2>Create Invoice</h2>

        <form
          onSubmit={handleSubmit}
          className="billing-form"
        >
          <label>
            Client
            <select
              value={form.client}
              onChange={
                handleClientChange
              }
              required
            >
              <option value="">
                Select Client
              </option>

              {clients.map(
                (client) => (
                  <option
                    key={client._id}
                    value={client._id}
                  >
                    {
                      client.clientName
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Due Date
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  dueDate:
                    e.target.value,
                })
              }
            />
          </label>

          <div className="billing-task-box">
            <h3>
              Unbilled Tasks
            </h3>

            {tasks.map((task) => (
              <div
                key={task._id}
                className="billing-task-row"
              >
                <input
                  type="checkbox"
                  onChange={(e) =>
                    handleTaskSelection(
                      task._id,
                      e.target.checked
                    )
                  }
                />

                <span>
                  {task.title}
                </span>

                <span>
                  ₹
                  {
                    task.billableAmount
                  }
                </span>
              </div>
            ))}
          </div>

          <label>
            Notes
            <textarea
              rows="4"
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes:
                    e.target.value,
                })
              }
            />
          </label>

          <div className="invoice-summary">
            <div>
              Subtotal :
              ₹{subtotal}
            </div>

            <div>
              GST : ₹
              {gst.toFixed(2)}
            </div>

            <div>
              Grand Total : ₹
              {(
                subtotal + gst
              ).toFixed(2)}
            </div>
          </div>

          <button
            className="billing-primary-btn"
            type="submit"
          >
            Create Invoice
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;
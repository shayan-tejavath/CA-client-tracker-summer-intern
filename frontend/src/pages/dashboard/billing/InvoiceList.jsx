import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, FileText } from "lucide-react";

import { getInvoices, deleteInvoice } from "../../../services/invoiceService";

import "../../../styles/billing.css";

const InvoiceList = () => {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this invoice?"
    );

    if (!confirmDelete) return;

    try {
      await deleteInvoice(id);
      loadInvoices();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoiceNumber
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="billing-page">
      <div className="billing-header">
        <div>
          <h1>Invoices</h1>
          <p>Manage all invoices</p>
        </div>

        <button
          className="billing-primary-btn"
          onClick={() =>
            navigate("/dashboard/invoices/create")
          }
        >
          <Plus size={16} />
          New Invoice
        </button>
      </div>

      <div className="billing-toolbar">
        <div className="billing-search">
          <Search size={16} />
          <input
            placeholder="Search invoice..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="billing-card">
          Loading invoices...
        </div>
      ) : (
        <div className="billing-card">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>

                  <td>
                    {invoice.client?.clientName}
                  </td>

                  <td>
                    {new Date(
                      invoice.invoiceDate
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    ₹{invoice.grandTotal}
                  </td>

                  <td>
                    <span
                      className={`invoice-status ${invoice.status}`}
                    >
                      {invoice.status}
                    </span>
                  </td>

                  <td>
                    <div className="billing-actions">
                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/invoices/view/${invoice._id}`
                          )
                        }
                      >
                        View
                      </button>

                      <button
                        onClick={() =>
                          navigate(
                            `/dashboard/invoices/edit/${invoice._id}`
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          handleDelete(invoice._id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredInvoices.length && (
                <tr>
                  <td colSpan="6">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
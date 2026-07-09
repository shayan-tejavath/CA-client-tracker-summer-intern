import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  FileText,
  Calendar,
  User,
  IndianRupee,
} from "lucide-react";

import {
  getInvoiceById,
  updateInvoice,
} from "../../../services/invoiceService";

import "../../../styles/billing.css";

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, []);

  const loadInvoice = async () => {
    try {
      const data = await getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const markAsPaid = async () => {
    try {
      await updateInvoice(id, {
        ...invoice,
        status: "Paid",
        paidAmount: invoice.grandTotal,
        balanceAmount: 0,
      });

      await loadInvoice();
    } catch (error) {
      console.error(error);
    }
  };

  const markPartiallyPaid = async () => {
    const amount = prompt(
      "Enter amount received:"
    );

    if (!amount) return;

    const paidAmount =
      Number(invoice.paidAmount || 0) +
      Number(amount);

    try {
      await updateInvoice(id, {
        ...invoice,
        paidAmount,
        balanceAmount:
          invoice.grandTotal - paidAmount,
        status:
          paidAmount >= invoice.grandTotal
            ? "Paid"
            : "Partially Paid",
      });

      await loadInvoice();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="billing-page">
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="billing-page">
        Invoice not found
      </div>
    );
  }

  return (
    <div className="billing-page invoice-print-area">
      <div className="billing-header no-print">
        <button
          className="billing-primary-btn"
          onClick={() =>
            navigate("/dashboard/invoices")
          }
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            className="billing-primary-btn"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print
          </button>

          <button
            className="billing-primary-btn"
            onClick={markPartiallyPaid}
          >
            Partial Payment
          </button>

          <button
            className="billing-primary-btn"
            onClick={markAsPaid}
          >
            Mark Paid
          </button>
        </div>
      </div>

      <div className="billing-card">
        <div className="invoice-header">
          <div>
            <h1>INVOICE</h1>

            <div className="invoice-number">
              #{invoice.invoiceNumber}
            </div>
          </div>

          <div className="invoice-status-box">
            {invoice.status}
          </div>
        </div>

        <hr />

        <div className="invoice-meta-grid">
          <div>
            <h4>
              <User size={16} />
              Client
            </h4>

            <p>
              {
                invoice.client?.clientName
              }
            </p>
          </div>

          <div>
            <h4>
              <Calendar size={16} />
              Invoice Date
            </h4>

            <p>
              {new Date(
                invoice.invoiceDate
              ).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h4>
              <Calendar size={16} />
              Due Date
            </h4>

            <p>
              {new Date(
                invoice.dueDate
              ).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="invoice-items">
          <table className="billing-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>GST %</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {invoice.items?.map(
                (item, index) => {
                  const gst =
                    item.amount *
                    ((item.gstPercentage ||
                      0) /
                      100);

                  return (
                    <tr key={index}>
                      <td>
                        {
                          item.description
                        }
                      </td>

                      <td>
                        ₹{item.amount}
                      </td>

                      <td>
                        {
                          item.gstPercentage
                        }
                        %
                      </td>

                      <td>
                        ₹
                        {(
                          item.amount +
                          gst
                        ).toFixed(2)}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-total-box">
          <div>
            Subtotal :
            ₹{invoice.subtotal}
          </div>

          <div>
            GST :
            ₹{invoice.totalGST}
          </div>

          <div>
            Discount :
            ₹
            {invoice.discount ||
              0}
          </div>

          <div className="grand-total">
            <IndianRupee size={18} />
            Grand Total :
            ₹{invoice.grandTotal}
          </div>

          <div>
            Paid :
            ₹
            {invoice.paidAmount ||
              0}
          </div>

          <div>
            Balance :
            ₹
            {invoice.balanceAmount ||
              invoice.grandTotal}
          </div>
        </div>

        {invoice.notes && (
          <div className="invoice-notes">
            <h4>
              <FileText size={16} />
              Notes
            </h4>

            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
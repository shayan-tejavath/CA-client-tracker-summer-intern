import DashboardLayout from "../../layouts/DashboardLayout";
import InvoiceList from "./billing/InvoiceList";

const Invoices = () => {
  return (
    <DashboardLayout>
      <InvoiceList />
    </DashboardLayout>
  );
};

export default Invoices;
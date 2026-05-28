import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

const DashboardLayout = ({ children }) => {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="content-area">
        <Navbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

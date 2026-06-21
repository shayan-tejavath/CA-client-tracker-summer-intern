import Sidebar from "../components/Sidebar.jsx";
import Navbar from "../components/Navbar.jsx";

import "../styles/theme.css";
import "../styles/dashboard.css";

const DashboardLayout = ({
  children,
}) => {
  return (
    <div className="dashboard-shell">

      {/* Sidebar */}

      <Sidebar />

      {/* Main Content */}

      <div className="content-area">

        {/* Top Navigation */}

        <Navbar />

        {/* Page Content */}

        <main className="page-content">

          {children}

        </main>

      </div>

    </div>
  );
};

export default DashboardLayout;
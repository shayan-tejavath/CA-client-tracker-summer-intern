import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import {
  ArrowRight,
  CheckCircle2,
  Users,
  FileText,
  ClipboardCheck,
  BarChart3,
  ShieldCheck,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";



const stats = [
  {
    number: "500+",
    label: "CA Firms",
  },
  {
    number: "25K+",
    label: "Clients Managed",
  },
  {
    number: "99.9%",
    label: "Uptime",
  },
  {
    number: "40%",
    label: "Productivity Boost",
  },
];

const highlights = [
  "Client Management",
  "Task Automation",
  "Document Storage",
  "Compliance Tracking",
  "Reports & Analytics",
];

export default function LandingPage() {
  return (
    <div className="landing-page">

      {/* ================= NAVBAR ================= */}

      <header className="landing-navbar">

        <div className="container navbar-content">

          <Link
            to="/"
            className="logo"
          >
            <div className="logo-box">
              Q
            </div>

            <div>
              <h3>QwikCA</h3>
              <span>
                Practice Suite
              </span>
            </div>
          </Link>

          <nav>

            <a href="#features">
              Features
            </a>

            <a href="#dashboard">
              Dashboard
            </a>

            <a href="#contact">
              Contact
            </a>

          </nav>

          <div className="nav-actions">

            <Button
              variant="ghost"
              asChild
            >
              <Link to="/login">
                Login
              </Link>
            </Button>

            <Button asChild>

              <Link to="/login">

                Get Started

              </Link>

            </Button>

          </div>

        </div>

      </header>

      {/* ================= HERO ================= */}

      <section className="hero">

        <div className="container hero-grid">

          <motion.div
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: .7,
            }}
            className="hero-left"
          >

            <span className="hero-badge">

              <ShieldCheck
                size={16}
              />

              Built for Chartered Accountants

            </span>

            <h1>

              Modern Practice
              Management

              <span>

                For CA Firms

              </span>

            </h1>

            <p>

              Manage clients, automate
              workflows, organize
              documents, assign tasks,
              monitor compliance and
              generate reports —

              all from one secure platform.

            </p>

            <div className="hero-buttons">

              <Button
                size="lg"
                asChild
              >

                <Link to="/login">

                  Login

                  <ArrowRight
                    size={18}
                  />

                </Link>

              </Button>

              <Button
                variant="outline"
                size="lg"
              >

                Watch Demo

              </Button>

            </div>

            <div className="hero-highlights">

              {highlights.map(item => (

                <div
                  key={item}
                  className="highlight"
                >

                  <CheckCircle2
                    size={18}
                  />

                  {item}

                </div>

              ))}

            </div>

          </motion.div>

          {/* ================= RIGHT ================= */}

          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: .8,
            }}
            className="hero-right"
          >

            <div className="dashboard-preview">

              <div className="preview-header">

                <div className="preview-title">

                  Dashboard

                </div>

                <div className="preview-status">

                  Live

                </div>

              </div>

              <div className="preview-cards">

                <div className="metric-card">

                  <Users
                    size={22}
                  />

                  <h2>

                    245

                  </h2>

                  <span>

                    Active Clients

                  </span>

                </div>

                <div className="metric-card">

                  <ClipboardCheck
                    size={22}
                  />

                  <h2>

                    48

                  </h2>

                  <span>

                    Pending Tasks

                  </span>

                </div>

                <div className="metric-card">

                  <FileText
                    size={22}
                  />

                  <h2>

                    1365

                  </h2>

                  <span>

                    Documents

                  </span>

                </div>

                <div className="metric-card">

                  <BarChart3
                    size={22}
                  />

                  <h2>

                    92%

                  </h2>

                  <span>

                    Completion

                  </span>

                </div>

              </div>

              <div className="activity-card">

                <h4>

                  Recent Activity

                </h4>

                <div className="activity-item">

                  <Clock3
                    size={16}
                  />

                  GST Filing Completed

                </div>

                <div className="activity-item">

                  <Clock3
                    size={16}
                  />

                  New Client Added

                </div>

                <div className="activity-item">

                  <Clock3
                    size={16}
                  />

                  Income Tax Task Assigned

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </section>

      {/* ================= STATS ================= */}

      <section className="landing-stats">

        <div className="container stats-grid">

          {stats.map((item) => (

            <motion.div

              whileHover={{
                y: -8,
              }}

              className="stat-card"

              key={item.label}

            >

              <h2>

                {item.number}

              </h2>

              <p>

                {item.label}

              </p>

            </motion.div>

          ))}

        </div>

      </section>

            {/* ================= FEATURES ================= */}

      <section
        id="features"
        className="features-section"
      >

        <div className="container">

          <div className="section-heading">

            <span>
              FEATURES
            </span>

            <h2>
              Everything your CA firm needs
            </h2>

            <p>
              Designed to simplify operations,
              improve collaboration,
              and help your team stay productive.
            </p>

          </div>

          <div className="features-grid">

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >
              <Users size={34} />

              <h3>
                Client Management
              </h3>

              <p>
                Manage all your clients,
                contact information,
                GST, PAN,
                assignments,
                and communication
                from one place.
              </p>

            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >

              <ClipboardCheck size={34} />

              <h3>
                Task Management
              </h3>

              <p>

                Assign work,
                monitor deadlines,
                prioritize tasks,
                and improve
                team collaboration.

              </p>

            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >

              <FileText size={34} />

              <h3>
                Document Repository
              </h3>

              <p>

                Securely upload,
                organize,
                search,
                and manage
                client documents.

              </p>

            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >

              <BarChart3 size={34} />

              <h3>

                Reports & Analytics

              </h3>

              <p>

                Monitor productivity,
                task completion,
                client growth,
                and firm performance.

              </p>

            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >

              <ShieldCheck size={34} />

              <h3>

                Role Based Access

              </h3>

              <p>

                Secure your practice
                with permission management
                and multiple user roles.

              </p>

            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
            >

              <Clock3 size={34} />

              <h3>

                Workflow Automation

              </h3>

              <p>

                Reduce manual work,
                improve turnaround time,
                and automate repetitive tasks.

              </p>

            </motion.div>

          </div>

        </div>

      </section>

      {/* ================= WHY SECTION ================= */}

      <section className="why-section">

        <div className="container why-grid">

          <div>

            <span className="section-tag">
              WHY QWIKCA
            </span>

            <h2>

              Built specifically
              for Chartered
              Accountants

            </h2>

            <p>

              Unlike generic CRMs,
              QwikCA understands
              the workflow of
              CA firms.

              Manage taxation,
              compliance,
              client documentation,
              audit work,
              payroll,
              GST,
              ROC filings
              and much more.

            </p>

          </div>

          <div className="why-list">

            <div>

              ✅ Secure Cloud Storage

            </div>

            <div>

              ✅ Centralized Dashboard

            </div>

            <div>

              ✅ Deadline Tracking

            </div>

            <div>

              ✅ Team Collaboration

            </div>

            <div>

              ✅ Compliance Management

            </div>

            <div>

              ✅ Analytics Dashboard

            </div>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="cta-section">

        <motion.div

          initial={{
            opacity:0,
            y:30,
          }}

          whileInView={{
            opacity:1,
            y:0,
          }}

          viewport={{
            once:true,
          }}

          className="cta-card"

        >

          <h2>

            Ready to modernize
            your CA practice?

          </h2>

          <p>

            Join firms that manage
            clients,
            tasks,
            documents,
            and reporting
            using QwikCA.

          </p>

          <Button
            size="lg"
            asChild
          >

            <Link to="/login">

              Get Started

              <ArrowRight size={18} />

            </Link>

          </Button>

        </motion.div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer
        id="contact"
        className="landing-footer"
      >

        <div className="container footer-grid">

          <div>

            <h3>

              QwikCA

            </h3>

            <p>

              Professional Practice
              Management Platform
              for Chartered Accountants.

            </p>

          </div>

          <div>

            <h4>

              Product

            </h4>

            <a href="#features">
              Features
            </a>

            <a href="#">
              Pricing
            </a>

            <a href="#">
              Security
            </a>

          </div>

          <div>

            <h4>

              Company

            </h4>

            <a href="#">
              About
            </a>

            <a href="#">
              Careers
            </a>

            <a href="#">
              Contact
            </a>

          </div>

          <div>

            <h4>

              Support

            </h4>

            <a href="#">
              Documentation
            </a>

            <a href="#">
              Help Center
            </a>

            <a href="#">
              Privacy Policy
            </a>

          </div>

        </div>

        <div className="footer-bottom">

          © 2026 QwikCA.
          All rights reserved.

        </div>

      </footer>

    </div>
  );
}
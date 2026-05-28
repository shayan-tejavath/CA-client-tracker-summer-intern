import React from "react";
import { Link } from "react-router-dom";

function LandingPage() {
  const features = [
    {
      title: "Compliance Tracking",
      description:
        "Monitor GST, Income Tax, TDS, ROC, PF, ESI and recurring compliance from one dashboard.",
    },
    {
      title: "Workflow Automation",
      description:
        "Automatically generate tasks, reminders, approvals, and due dates with reusable templates.",
    },
    {
      title: "Client Portal",
      description:
        "Allow clients to upload documents, approve filings, track status, and stay informed.",
    },
    {
      title: "Document Management",
      description:
        "Centralize documents with tagging, version history, and fast retrieval.",
    },
    {
      title: "Team Collaboration",
      description:
        "Manage employees, assign workloads, monitor progress, and keep everyone aligned.",
    },
    {
      title: "Real-Time Dashboards",
      description:
        "Get instant visibility into pending filings, overdue tasks, and compliance health.",
    },
  ];

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="landing-brand">
          <h1>QwikCA</h1>
          <p>Practice management built for CA firms.</p>
        </div>

        <nav className="landing-nav">
          <Link to="/login" className="button secondary">
            Login
          </Link>
          <Link to="/login" className="button primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow">Trusted by CA teams nationwide</span>
          <h1>
            Modern practice management software for <span>CA firms</span>
          </h1>
          <p>
            Automate compliance workflows, manage clients, track filings,
            organize documents, and streamline your firm operations — all from
            one centralized platform.
          </p>
          <div className="landing-actions">
            <Link to="/login" className="button primary">
              Login to Dashboard
            </Link>
            <a href="#features" className="button secondary">
              Explore Features
            </a>
          </div>
        </div>

        <div className="landing-hero-panel">
          <div className="landing-panel-card">
            <h2>Ready to simplify your practice?</h2>
            <p>
              QwikCA brings compliance, clients, documents, and team workflows
              into a single, polished dashboard.
            </p>
          </div>
        </div>
      </main>

      <section id="features" className="landing-features">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <footer className="landing-footer">
        © 2026 QwikCA. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
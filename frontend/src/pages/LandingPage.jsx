import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
    title: "Compliance Tracking",
    description: "Monitor GST, Income Tax, TDS, ROC, PF, ESI and recurring compliance from one dashboard.",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: "Workflow Automation",
    description: "Automatically generate tasks, reminders, approvals, and due dates with reusable templates.",
    color: "#F97316",
    bg: "rgba(249,115,22,0.1)",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    title: "Client Portal",
    description: "Allow clients to upload documents, approve filings, track status, and stay informed.",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.1)",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: "Document Management",
    description: "Centralize documents with tagging, version history, and fast retrieval.",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.1)",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: "Team Collaboration",
    description: "Manage employees, assign workloads, monitor progress, and keep everyone aligned.",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: "Real-Time Dashboards",
    description: "Get instant visibility into pending filings, overdue tasks, and compliance health.",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.1)",
  },
];

const stats = [
  { value: "2,400+", label: "CA Firms" },
  { value: "98%", label: "Uptime SLA" },
  { value: "40hrs", label: "Saved / month" },
];

function FeatureCard({ feature, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotateX = ((y - cy) / cy) * -8;
    const rotateY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.02)`;
    card.style.setProperty("--shine-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--shine-y", `${(y / rect.height) * 100}%`);
    card.style.setProperty("--card-accent", feature.color);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
  };

  return (
    <article
      ref={cardRef}
      className="qca-feature-card qca-card-init"
      data-index={index}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ "--card-accent": feature.color, transitionDelay: `${index * 70}ms` }}
    >
      <div className="qca-card-shine" aria-hidden="true" />
      <div className="qca-feature-icon" style={{ background: feature.bg, color: feature.color }}>
        {feature.icon}
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
      <div className="qca-card-arrow" aria-hidden="true">
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
    </article>
  );
}

function LandingPage() {
  const heroRef = useRef(null);
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const cards = document.querySelectorAll(".qca-card-init");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("qca-card-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        .qca-shell {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #09090f;
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ━━━━━━━━━━ HEADER ━━━━━━━━━━ */
        .qca-header {
          position: fixed;
          top: 16px; left: 50%; transform: translateX(-50%);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 0 16px;
          height: 60px;
          width: min(960px, calc(100% - 48px));
          background: rgba(18, 10, 35, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
          animation: qca-header-in 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }

        @keyframes qca-header-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .qca-brand {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }

        .qca-logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #F97316 100%);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 16px;
          box-shadow: 0 0 20px rgba(124,58,237,0.5);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .qca-logo-mark::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%);
        }

        .qca-brand-text {
          font-size: 17px; font-weight: 800; color: #fff;
          letter-spacing: -0.4px;
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .qca-nav { display: flex; align-items: center; gap: 8px; }

        .qca-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 0 20px; height: 38px; border-radius: 10px;
          font-size: 14px; font-weight: 600; text-decoration: none;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          cursor: pointer; border: none; white-space: nowrap;
          font-family: inherit;
        }

        .qca-btn-ghost {
          color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .qca-btn-ghost:hover {
          background: rgba(255,255,255,0.12); color: #fff;
          border-color: rgba(255,255,255,0.2); transform: translateY(-1px);
        }

        .qca-btn-primary {
          background: linear-gradient(135deg, #7C3AED, #9333EA);
          color: #fff;
          box-shadow: 0 0 0 0 rgba(124,58,237,0), 0 2px 12px rgba(124,58,237,0.4);
          position: relative; overflow: hidden;
        }
        .qca-btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .qca-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(124,58,237,0.55); }
        .qca-btn-primary:hover::before { opacity: 1; }
        .qca-btn-primary:active { transform: translateY(0); }

        .qca-btn-lg { height: 52px; padding: 0 32px; font-size: 15px; border-radius: 14px; }

        .qca-btn-coral {
          background: linear-gradient(135deg, #F97316, #EF4444);
          color: #fff;
          box-shadow: 0 2px 12px rgba(249,115,22,0.4);
          position: relative; overflow: hidden;
        }
        .qca-btn-coral::after {
          content: '';
          position: absolute; top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.5s ease;
        }
        .qca-btn-coral:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(249,115,22,0.55); }
        .qca-btn-coral:hover::after { left: 150%; }

        .qca-btn-outline-light {
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(8px);
        }
        .qca-btn-outline-light:hover {
          background: rgba(255,255,255,0.12); color: #fff;
          border-color: rgba(255,255,255,0.35); transform: translateY(-2px);
        }

        /* ━━━━━━━━━━ HERO ━━━━━━━━━━ */
        .qca-hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 130px clamp(1.5rem, 5vw, 4rem) 90px;
          position: relative; overflow: hidden;
          background: radial-gradient(ellipse 120% 80% at 50% -10%, #2D0A6B 0%, #09090f 55%);
        }

        /* Animated background orbs */
        .qca-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); pointer-events: none;
          animation: qca-orb-float linear infinite;
          opacity: 0.55;
        }
        .qca-orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, #7C3AED 0%, transparent 70%);
          top: -120px; left: -100px;
          animation-duration: 18s; animation-delay: 0s;
        }
        .qca-orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #F97316 0%, transparent 70%);
          top: -60px; right: -80px;
          animation-duration: 14s; animation-delay: -4s;
          opacity: 0.3;
        }
        .qca-orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #06B6D4 0%, transparent 70%);
          bottom: 80px; left: 50%;
          animation-duration: 20s; animation-delay: -8s;
          opacity: 0.2;
        }

        @keyframes qca-orb-float {
          0%   { transform: translate(0, 0) scale(1); }
          25%  { transform: translate(30px, -20px) scale(1.05); }
          50%  { transform: translate(10px, 30px) scale(0.97); }
          75%  { transform: translate(-20px, 10px) scale(1.03); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* Dot grid */
        .qca-dot-grid {
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, #000 20%, transparent 100%);
        }

        .qca-hero-content {
          position: relative; z-index: 2; max-width: 820px;
        }

        /* Hero entrance animations */
        .qca-hero-content > * {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .qca-hero-ready .qca-eyebrow   { opacity: 1; transform: none; transition-delay: 0.05s; }
        .qca-hero-ready h1             { opacity: 1; transform: none; transition-delay: 0.18s; }
        .qca-hero-ready .qca-hero-sub  { opacity: 1; transform: none; transition-delay: 0.30s; }
        .qca-hero-ready .qca-hero-actions { opacity: 1; transform: none; transition-delay: 0.42s; }

        .qca-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(124,58,237,0.15);
          border: 1px solid rgba(124,58,237,0.35);
          color: #C4B5FD;
          font-size: 13px; font-weight: 600;
          padding: 6px 16px; border-radius: 100px;
          margin-bottom: 28px;
          letter-spacing: 0.01em;
        }

        .qca-eyebrow-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #A855F7;
          box-shadow: 0 0 8px #A855F7;
          animation: qca-pulse 2.2s ease-in-out infinite;
        }
        @keyframes qca-pulse {
          0%,100% { opacity: 1; box-shadow: 0 0 8px #A855F7; transform: scale(1); }
          50% { opacity: 0.6; box-shadow: 0 0 3px #A855F7; transform: scale(0.75); }
        }

        .qca-hero h1 {
          font-size: clamp(2.6rem, 6vw, 4.4rem);
          font-weight: 800;
          line-height: 1.1;
          color: #fff;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
        }

        .qca-gradient-text {
          background: linear-gradient(135deg, #A855F7 0%, #EC4899 40%, #F97316 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          position: relative;
        }

        .qca-hero-sub {
          font-size: clamp(1rem, 2vw, 1.15rem);
          color: rgba(255,255,255,0.55);
          line-height: 1.75;
          max-width: 580px; margin: 0 auto 40px;
          font-weight: 400;
        }

        .qca-hero-actions {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; flex-wrap: wrap;
        }

        /* ━━━━━━━━━━ STATS BAR ━━━━━━━━━━ */
        .qca-stats-bar {
          position: relative; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          gap: 0; margin-top: 80px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 0 8px;
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .qca-stats-bar::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(249,115,22,0.05) 100%);
        }

        .qca-stat {
          padding: 24px 40px;
          text-align: center; position: relative;
        }
        .qca-stat + .qca-stat::before {
          content: '';
          position: absolute; left: 0; top: 25%; height: 50%;
          width: 1px; background: rgba(255,255,255,0.1);
        }

        .qca-stat-value {
          font-size: 2rem; font-weight: 800; color: #fff;
          letter-spacing: -0.05em; line-height: 1;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .qca-stat-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 6px; font-weight: 500; }

        /* ━━━━━━━━━━ FEATURES ━━━━━━━━━━ */
        .qca-features-section {
          padding: clamp(5rem, 8vw, 8rem) clamp(1.5rem, 5vw, 4rem);
          background: #09090f;
          position: relative;
        }

        .qca-features-section::before {
          content: '';
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 1px; height: 80px;
          background: linear-gradient(to bottom, transparent, rgba(124,58,237,0.5), transparent);
        }

        .qca-section-header {
          text-align: center; max-width: 560px; margin: 0 auto 64px;
        }

        .qca-section-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; letter-spacing: 0.12em;
          color: #A855F7; text-transform: uppercase;
          background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.25);
          padding: 5px 14px; border-radius: 100px;
          margin-bottom: 20px;
        }

        .qca-section-header h2 {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800; color: #fff;
          letter-spacing: -0.04em; line-height: 1.15;
          margin-bottom: 18px;
        }

        .qca-section-header p {
          font-size: 1rem; color: rgba(255,255,255,0.45); line-height: 1.75;
        }

        .qca-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 18px; max-width: 1120px; margin: 0 auto;
        }

        /* ━━━━━━━━━━ FEATURE CARD ━━━━━━━━━━ */
        .qca-feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 32px;
          position: relative; overflow: hidden;
          cursor: default;
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.3s ease,
                      box-shadow 0.35s ease;
          will-change: transform;
        }

        .qca-card-init {
          opacity: 0; transform: translateY(28px) scale(0.97);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1),
                      transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .qca-card-visible {
          opacity: 1 !important; transform: none !important;
        }

        /* Override transition for hover after visible */
        .qca-card-visible {
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1),
                      transform 0.35s cubic-bezier(0.16,1,0.3,1),
                      border-color 0.3s ease,
                      box-shadow 0.35s ease !important;
        }

        .qca-feature-card:hover {
          border-color: var(--card-accent, #7C3AED);
          box-shadow: 0 0 0 1px var(--card-accent, #7C3AED),
                      0 24px 48px rgba(0,0,0,0.5),
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* Shine overlay */
        .qca-card-shine {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(200px circle at var(--shine-x, 50%) var(--shine-y, 50%), rgba(255,255,255,0.06), transparent 70%);
          opacity: 0; transition: opacity 0.3s ease; border-radius: inherit;
        }
        .qca-feature-card:hover .qca-card-shine { opacity: 1; }

        /* Bottom gradient bar */
        .qca-feature-card::after {
          content: '';
          position: absolute; bottom: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, var(--card-accent, #7C3AED), transparent);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .qca-feature-card:hover::after { opacity: 1; }

        .qca-feature-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 22px;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
        }
        .qca-feature-card:hover .qca-feature-icon {
          transform: scale(1.12) rotate(-3deg);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .qca-feature-card h3 {
          font-size: 1.05rem; font-weight: 700; color: #fff;
          margin-bottom: 10px; letter-spacing: -0.02em;
        }
        .qca-feature-card p {
          font-size: 0.9rem; color: rgba(255,255,255,0.45); line-height: 1.75;
        }

        .qca-card-arrow {
          position: absolute; bottom: 24px; right: 24px;
          color: var(--card-accent, #7C3AED);
          opacity: 0; transform: translate(-8px, 8px);
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1);
        }
        .qca-feature-card:hover .qca-card-arrow {
          opacity: 1; transform: translate(0, 0);
        }

        /* ━━━━━━━━━━ CTA BAND ━━━━━━━━━━ */
        .qca-cta-band {
          margin: 0 clamp(1.5rem, 4vw, 4rem) clamp(3rem, 5vw, 5rem);
          border-radius: 28px;
          position: relative; overflow: hidden;
          padding: clamp(4rem, 6vw, 6rem) clamp(2rem, 5vw, 5rem);
          text-align: center;
          background: linear-gradient(135deg, #1a0533 0%, #2D0A6B 50%, #1a0533 100%);
          border: 1px solid rgba(124,58,237,0.3);
          box-shadow: 0 0 80px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.06);
        }

        .qca-cta-band::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
        }

        /* CTA orbs */
        .qca-cta-orb1 {
          position: absolute; width: 350px; height: 350px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%);
          top: -100px; left: -60px; filter: blur(60px); pointer-events: none;
        }
        .qca-cta-orb2 {
          position: absolute; width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%);
          bottom: -80px; right: -40px; filter: blur(60px); pointer-events: none;
        }

        .qca-cta-inner {
          position: relative; z-index: 1; max-width: 580px; margin: 0 auto;
        }

        .qca-cta-inner h2 {
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 800; color: #fff;
          letter-spacing: -0.04em; line-height: 1.2; margin-bottom: 16px;
        }
        .qca-cta-inner p {
          font-size: 1rem; color: rgba(255,255,255,0.5);
          line-height: 1.75; margin-bottom: 40px;
        }
        .qca-cta-actions {
          display: flex; align-items: center; justify-content: center;
          gap: 14px; flex-wrap: wrap;
        }

        /* ━━━━━━━━━━ FOOTER ━━━━━━━━━━ */
        .qca-footer {
          background: #09090f;
          padding: 28px clamp(1.5rem, 5vw, 4rem);
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .qca-footer-brand { display: flex; align-items: center; gap: 10px; }

        .qca-footer p {
          font-size: 13px; color: rgba(255,255,255,0.25);
        }

        /* ━━━━━━━━━━ RESPONSIVE ━━━━━━━━━━ */
        @media (max-width: 640px) {
          .qca-stat { padding: 20px 24px; }
          .qca-stat-value { font-size: 1.6rem; }
          .qca-features-grid { grid-template-columns: 1fr; }
          .qca-footer { justify-content: center; text-align: center; }
          .qca-cta-band { margin: 0 1rem 3rem; padding: 3rem 1.5rem; }
          .qca-hero h1 { letter-spacing: -0.03em; }
        }

        @media (max-width: 420px) {
          .qca-stats-bar { flex-direction: column; padding: 8px; }
          .qca-stat + .qca-stat::before { display: none; }
          .qca-stat { padding: 16px 24px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .qca-orb { animation: none; }
          .qca-hero-content > * { transition: none; }
          .qca-feature-card { transition: border-color 0.2s, box-shadow 0.2s; }
        }
      `}</style>

      <div className="qca-shell">

        {/* ── HEADER ── */}
        <header className="qca-header">
          <Link to="/" className="qca-brand" style={{ textDecoration: "none" }}>
            <div className="qca-logo-mark">Q</div>
            <span className="qca-brand-text">QwikCA</span>
          </Link>
          <nav className="qca-nav">
            <Link to="/login" className="qca-btn qca-btn-ghost">Login</Link>
            <Link to="/login" className="qca-btn qca-btn-primary">Get Started</Link>
          </nav>
        </header>

        <main>
          {/* ── HERO ── */}
          <section className="qca-hero" ref={heroRef}>
            <div className="qca-dot-grid" aria-hidden="true" />
            <div className="qca-orb qca-orb-1" aria-hidden="true" />
            <div className="qca-orb qca-orb-2" aria-hidden="true" />
            <div className="qca-orb qca-orb-3" aria-hidden="true" />

            <div className={`qca-hero-content${heroReady ? " qca-hero-ready" : ""}`}>
              <div className="qca-eyebrow">
                <span className="qca-eyebrow-dot" aria-hidden="true" />
                Trusted by CA teams nationwide
              </div>

              <h1>
                Modern practice workflow
                <br />
                software for{" "}
                <span className="qca-gradient-text">CA firms</span>
              </h1>

              <p className="qca-hero-sub">
                Automate compliance workflows, manage clients, track filings,
                organize documents, and streamline your firm operations — all
                from one centralized platform.
              </p>

              <div className="qca-hero-actions">
                <Link to="/login" className="qca-btn qca-btn-coral qca-btn-lg">
                  Login to Dashboard
                </Link>
                <a href="#features" className="qca-btn qca-btn-outline-light qca-btn-lg">
                  Explore Features
                </a>
              </div>
            </div>

            <div className="qca-stats-bar">
              {stats.map((s) => (
                <div className="qca-stat" key={s.label}>
                  <div className="qca-stat-value">{s.value}</div>
                  <div className="qca-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section id="features" className="qca-features-section">
            <div className="qca-section-header">
              <div className="qca-section-eyebrow">Platform Features</div>
              <h2>Everything your firm needs</h2>
              <p>
                One platform to handle compliance, clients, documents, and team
                workflows — built specifically for chartered accountants.
              </p>
            </div>

            <div className="qca-features-grid">
              {features.map((feature, i) => (
                <FeatureCard key={feature.title} feature={feature} index={i} />
              ))}
            </div>
          </section>

          {/* ── CTA BAND ── */}
          <section className="qca-cta-band">
            <div className="qca-cta-orb1" aria-hidden="true" />
            <div className="qca-cta-orb2" aria-hidden="true" />
            <div className="qca-cta-inner">
              <h2>Ready to simplify your workflow?</h2>
              <p>
                QwikCA brings compliance, clients, documents, and team workflows
                into a single, polished dashboard.
              </p>
              <div className="qca-cta-actions">
                <Link to="/login" className="qca-btn qca-btn-primary qca-btn-lg">
                  Login to Dashboard
                </Link>
                <a href="#features" className="qca-btn qca-btn-outline-light qca-btn-lg">
                  Learn More
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <footer className="qca-footer">
          <div className="qca-footer-brand">
            <div className="qca-logo-mark">Q</div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "14px", fontWeight: 600 }}>QwikCA</span>
          </div>
          <p>© 2026 QwikCA. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

export default LandingPage;
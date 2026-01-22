"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const role = (user?.["mikro/roles"] as string[] | undefined)?.[0] || "user";
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "validator") {
        router.push("/validator/dashboard");
      } else {
        router.push("/user/dashboard");
      }
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "white" }}>
        <div style={{ width: 48, height: 48, border: "2px solid #ff6b35", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backgroundColor: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div className="container-main">
          <div style={{ display: "flex", height: 64, alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Image src="/mikro-logo.png" alt="Mikro" width={40} height={40} />
              <span style={{ fontSize: 20, fontWeight: 600, color: "#111827" }}>Mikro</span>
            </div>

            {/* Nav Links - Hidden on mobile */}
            <nav className="hide-mobile" style={{ alignItems: "center", gap: 32 }}>
              <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none" }}>
                Features
              </a>
              <a href="#how-it-works" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none" }}>
                How It Works
              </a>
              <a href="https://tasks.kaart.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, fontWeight: 500, color: "#4b5563", textDecoration: "none" }}>
                Tasking Manager
              </a>
            </nav>

            {/* Auth Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/api/auth/login" style={{ fontSize: 14, fontWeight: 500, color: "#374151", textDecoration: "none" }}>
                Log in
              </Link>
              <Link
                href="/api/auth/login"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#004e89", padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "white", textDecoration: "none" }}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: "80px 0 100px", background: "linear-gradient(to bottom, white, #f9fafb)" }}>
        <div className="container-main">
          <div style={{ textAlign: "center", maxWidth: 768, margin: "0 auto" }}>
            {/* Logo Icon */}
            <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
              <Image src="/mikro-logo.png" alt="Mikro" width={112} height={112} style={{ filter: "drop-shadow(0 10px 25px rgba(255, 107, 53, 0.4))" }} />
            </div>

            {/* Mikro Title */}
            <h1 style={{ fontSize: "clamp(3.5rem, 7vw, 5rem)", fontWeight: "bold", letterSpacing: "-0.02em", color: "#111827", marginBottom: 16, lineHeight: 1 }}>
              Mikro
            </h1>

            {/* Subtitle */}
            <h2 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: "600", letterSpacing: "-0.01em", color: "#111827", marginBottom: 24, lineHeight: 1.2 }}>
              OSM Micropayments
              <br />
              <span style={{ color: "#ff6b35" }}>Made Simple</span>
            </h2>

            {/* Description */}
            <p style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)", color: "#4b5563", maxWidth: 640, margin: "0 auto 48px", lineHeight: 1.6 }}>
              Track your OpenStreetMap mapping and validation tasks, earn rewards,
              and manage payments all in one place.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
              <Link
                href="/api/auth/login"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#ff6b35", padding: "14px 32px", fontSize: 16, fontWeight: 500, color: "white", textDecoration: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
              >
                Get Started
              </Link>
              <a
                href="https://tasks.kaart.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid #d1d5db", backgroundColor: "white", padding: "14px 32px", fontSize: 16, fontWeight: 500, color: "#374151", textDecoration: "none" }}
              >
                View Tasking Manager
              </a>
            </div>
          </div>

          {/* Stats Row - commented out for now
          <div className="grid-responsive-4" style={{ marginTop: 80, maxWidth: 896, marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#ff6b35" }}>100+</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>Active Mappers</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#ff6b35" }}>50+</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>Projects</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#ff6b35" }}>10K+</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>Tasks Completed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#ff6b35" }}>$50K+</div>
              <div style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>Paid Out</div>
            </div>
          </div>
          */}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: "100px 0", backgroundColor: "white" }}>
        <div className="container-main">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#111827", marginBottom: 16 }}>
              Everything you need to manage your mapping work
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 640, margin: "0 auto" }}>
              Mikro streamlines the payment process for OpenStreetMap contributors,
              making it easy to track your work and get paid.
            </p>
          </div>

          <div className="grid-responsive-3">
            {/* Feature Card 1 */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "rgba(255, 107, 53, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <svg style={{ width: 32, height: 32, color: "#ff6b35" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Track Tasks</h3>
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Automatically sync your mapping and validation contributions from
                the Tasking Manager. See your progress in real-time.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "rgba(255, 107, 53, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <svg style={{ width: 32, height: 32, color: "#ff6b35" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Earn Rewards</h3>
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Get paid for your contributions to OpenStreetMap mapping projects.
                Transparent rates and timely payments.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: 32 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "rgba(255, 107, 53, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
                <svg style={{ width: 32, height: 32, color: "#ff6b35" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Learn & Grow</h3>
              <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
                Complete training modules and checklists to improve your mapping
                skills and unlock new opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: "100px 0", backgroundColor: "#f9fafb" }}>
        <div className="container-main">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontSize: "clamp(1.875rem, 3vw, 2.25rem)", fontWeight: "bold", color: "#111827", marginBottom: 16 }}>
              How It Works
            </h2>
            <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 640, margin: "0 auto" }}>
              Getting started with Mikro is easy. Follow these simple steps to begin
              earning from your mapping contributions.
            </p>
          </div>

          <div className="grid-responsive-3" style={{ maxWidth: 896, margin: "0 auto" }}>
            {/* Step 1 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#004e89", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", margin: "0 auto 24px" }}>
                1
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Sign Up</h3>
              <p style={{ color: "#6b7280" }}>
                Create your account and connect your OpenStreetMap username.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#004e89", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", margin: "0 auto 24px" }}>
                2
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Map</h3>
              <p style={{ color: "#6b7280" }}>
                Complete mapping and validation tasks on the Tasking Manager.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#004e89", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", margin: "0 auto 24px" }}>
                3
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, color: "#111827", marginBottom: 12 }}>Get Paid</h3>
              <p style={{ color: "#6b7280" }}>
                Track your earnings and receive payments directly.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 64, textAlign: "center" }}>
            <Link
              href="/api/auth/login"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#ff6b35", padding: "14px 32px", fontSize: 16, fontWeight: 500, color: "white", textDecoration: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
            >
              Start Mapping Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#111827", color: "white", padding: "64px 0" }}>
        <div className="container-main">
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Image src="/mikro-logo.png" alt="Mikro" width={32} height={32} />
                <span style={{ fontSize: 18, fontWeight: 600 }}>Mikro</span>
              </div>
              <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.6 }}>
                OSM micropayments platform by Kaart. Track tasks, earn rewards,
                and manage payments.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Links</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 8 }}>
                  <a href="https://tasks.kaart.com" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", fontSize: 14, textDecoration: "none" }}>
                    Tasking Manager
                  </a>
                </li>
                <li style={{ marginBottom: 8 }}>
                  <a href="https://kaart.com" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", fontSize: 14, textDecoration: "none" }}>
                    Kaart
                  </a>
                </li>
                <li>
                  <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" style={{ color: "#9ca3af", fontSize: 14, textDecoration: "none" }}>
                    OpenStreetMap
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 16 }}>Contact</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li>
                  <a href="mailto:support@kaart.com" style={{ color: "#9ca3af", fontSize: 14, textDecoration: "none" }}>
                    support@kaart.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #374151", marginTop: 48, paddingTop: 32, textAlign: "center" }}>
            <p style={{ color: "#9ca3af", fontSize: 14 }}>
              &copy; {new Date().getFullYear()} Kaart. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

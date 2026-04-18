"use client";

import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SLIDES = [
  { image: "/landing-slide-1.png", tagline: "Manage your global workforce — assign roles, teams, and track every contributor." },
  { image: "/landing-slide-2.png", tagline: "Detailed contributor profiles with changeset analytics, activity trends, and performance stats." },
  { image: "/landing-slide-3.png", tagline: "Built-in time tracking with live clocking, task switching, and exportable timesheets." },
  { image: "/landing-slide-4.png", tagline: "Organize mapping projects with automatic TM4 and MapRoulette sync." },
  { image: "/landing-slide-5.png", tagline: "Flexible payment management — per-task micropayments and hourly rate tracking in one place." },
  { image: "/landing-slide-6.png", tagline: "Generate weekly reports with automated stats, changeset summaries, and team-wide insights." },
  { image: "/landing-slide-7.png", tagline: "Track top contributors, flag quality issues, and build community with Punks and Friends lists." },
];

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!user) return;
    const orgId =
      (user["mikro/org_id"] as string | undefined) ??
      (user.org_id as string | undefined);
    if (!orgId) {
      router.replace("/no-org");
      return;
    }
    const role = (user?.["mikro/roles"] as string[] | undefined)?.[0] || "user";
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "validator") {
      router.push("/validator/dashboard");
    } else {
      router.push("/user/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (SLIDES.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom right, #0a0a0a, #333)" }}>
        <div style={{ width: 48, height: 48, border: "2px solid #ff6b35", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(to bottom right, #0a0a0a, #444)" }}>
      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "12px 32px", gap: 12, flexShrink: 0 }}>
        <a
          href="/auth/login"
          style={{
            color: "black", fontWeight: 600, padding: "8px 24px", borderRadius: 6,
            backgroundColor: "#ff6b35", textDecoration: "none", fontSize: 14,
            transition: "filter 0.15s",
          }}
        >
          Log in
        </a>
      </div>

      {/* Content wrapper — fills remaining space after nav and centers the upper-area + bottom-row GROUP vertically so the laptop sits at viewport middle */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>

      {/* Upper content — Kaart/text on the left, laptop on the right. Both columns pin their content to the BOTTOM so they rest just above the shared bottom row. */}
      <div style={{ display: "flex", flexDirection: "row", flexShrink: 0, minHeight: 0 }}>
        {/* Left — Kaart logo, h2, Mikro line (caption lives in the shared bottom row) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "35%", paddingLeft: "5vw", boxSizing: "border-box" }}>
          {/* Kaart logo */}
          <Image
            src="/kaart-logo-light.svg"
            width={200}
            height={200}
            alt="Kaart"
            style={{ width: "20vw", height: "auto", marginBottom: "-2vh", marginRight: "3vw", alignSelf: "center" }}
          />

          {/* Text block — shifted right so its left edge sits under the Kaart logo's left edge */}
          <div style={{ marginLeft: "5vw", marginBottom: "2vh" }}>
            <h2 style={{ color: "white", fontSize: "2.2vw", fontWeight: 300, lineHeight: 1.2, margin: 0, whiteSpace: "nowrap" }}>
              Manage Your Team
              <br />
              Track Every Task
              <br />
              Streamline Your
              <br />
              GIS Workflow with
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginTop: "1.05vh" }}>
              <span style={{ fontSize: "5.75vw", fontWeight: 700, color: "#ff6b35", whiteSpace: "nowrap", lineHeight: 1 }}>
                Mikro
              </span>
              <Image
                src="/mikro-logo.png"
                width={60}
                height={60}
                alt="Mikro logo"
                style={{ width: "4.9vw", height: "auto" }}
              />
            </div>
          </div>
        </div>

        {/* Right — laptop with screenshot carousel (pinned to bottom of upper content) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", marginRight: "2vw" }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "626 / 382",
              height: "65vh",
            }}
          >
            {/* Screenshots behind the laptop frame */}
            <div
              style={{
                position: "absolute",
                top: "4.375%",
                left: "13.375%",
                width: "73.75%",
                height: "79%",
                zIndex: 1,
                overflow: "hidden",
                backgroundColor: "#1a1a2e",
              }}
            >
              {SLIDES.map((slide, i) => (
                <Image
                  key={slide.image}
                  src={slide.image}
                  alt={slide.tagline}
                  fill
                  style={{
                    objectFit: "fill",
                    opacity: i === currentSlide ? 1 : 0,
                    transition: "opacity 0.7s ease-in-out",
                  }}
                  priority={i === 0}
                />
              ))}
            </div>

            {/* Hollow laptop frame on top */}
            <Image
              src="/hollow-laptop.png"
              alt="Laptop"
              fill
              style={{ objectFit: "contain", zIndex: 2, pointerEvents: "none" }}
              priority
            />
          </div>
        </div>
      </div>

      {/* Shared bottom row — caption on left, tagline + dots on right. Because both sit in this single flex row, they are guaranteed to share the same Y regardless of viewport aspect ratio. */}
      <div style={{ display: "flex", flexDirection: "row", flexShrink: 0, marginTop: "1vh", paddingBottom: "2vh" }}>
        {/* Left column — caption (matches upper-left column width/padding so caption lines up with text block above) */}
        <div style={{ width: "35%", paddingLeft: "5vw", boxSizing: "border-box" }}>
          <div style={{ marginLeft: "5vw" }}>
            <p style={{ color: "#ddd", fontSize: "1.4vw", margin: 0, fontWeight: 400, whiteSpace: "nowrap" }}>
              GIS Work Management Platform by Kaart
            </p>
          </div>
        </div>

        {/* Right column — cycling tagline + dots (matches upper-right column width so they sit centered under the laptop) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginRight: "2vw", gap: 8 }}>
          <p style={{ color: "#ddd", fontSize: "1.4vw", textAlign: "center", margin: 0, minHeight: "1.5em", transition: "opacity 0.4s", opacity: 1, fontWeight: 400 }}>
            {SLIDES[currentSlide].tagline}
          </p>

          {SLIDES.length > 1 && (
            <div style={{ display: "flex", gap: 6 }}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  style={{
                    width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                    backgroundColor: i === currentSlide ? "#ff6b35" : "#666",
                    transition: "background-color 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      </div>
    </div>
  );
}

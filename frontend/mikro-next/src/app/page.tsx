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
    if (!user.org_id) {
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

  // Auto-advance carousel
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
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(to bottom right, #0a0a0a, #444)" }}>
      {/* Top nav */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "16px 32px", gap: 12, flexShrink: 0 }}>
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

      {/* Main content — text left, laptop right */}
      <div style={{ display: "flex", flexDirection: "row", flex: 1, minHeight: 0, alignItems: "center", justifyContent: "center", padding: "0 5vw 2vh", gap: "4vw", overflow: "hidden" }}>
        {/* Left side — title and description */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flexShrink: 0 }}>
          <h2 style={{ color: "white", fontSize: "clamp(1.4rem, 2.8vw, 3.25rem)", fontWeight: 300, lineHeight: 1.2, margin: 0, whiteSpace: "nowrap" }}>
            Manage Your Team
            <br />
            Track Every Task
            <br />
            Streamline Your
            <br />
            <span style={{ color: "white" }}>GIS Workflow with</span>
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginTop: "1.5vh" }}>
            <span style={{ fontSize: "clamp(2.5rem, 4.5vw, 5rem)", fontWeight: 700, color: "#ff6b35", whiteSpace: "nowrap" }}>
              Mikro
            </span>
            <Image
              src="/mikro-logo.png"
              width={60}
              height={60}
              alt="Mikro logo"
              style={{ width: "clamp(36px, 4vw, 64px)", height: "auto" }}
            />
          </div>

          <div style={{ marginTop: "2vh" }}>
            <p style={{ color: "white", fontSize: "clamp(0.8rem, 1.2vw, 1.05rem)", margin: 0 }}>
              GIS Work Management Platform
            </p>
            <p style={{ color: "white", fontSize: "clamp(0.8rem, 1.2vw, 1.05rem)", margin: "4px 0 0" }}>
              by Kaart
            </p>
          </div>
        </div>

        {/* Right side — laptop with screenshot carousel */}
        <div style={{ flex: "1 1 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
          <div
            style={{
              position: "relative",
              aspectRatio: "626 / 382",
              width: "85%",
              maxHeight: "calc(100vh - 240px)",
              maxWidth: "calc((100vh - 240px) * 626 / 382)",
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

          {/* Tagline + dot indicators below laptop */}
          <div style={{ marginTop: "1vh", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <p style={{ color: "#ccc", fontSize: "clamp(0.7rem, 0.9vw, 0.85rem)", textAlign: "center", margin: 0, minHeight: "1.2em", transition: "opacity 0.4s", opacity: 1 }}>
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

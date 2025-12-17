"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to their dashboard
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-kaart-orange">Mikro</span>
          </div>
          <Link
            href="/api/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-kaart-orange px-4 py-2 text-sm font-medium text-white hover:bg-kaart-orange-dark transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            OSM Micropayments
            <br />
            <span className="text-kaart-orange">Made Simple</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your OpenStreetMap mapping and validation tasks, earn rewards,
            and manage payments all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/api/auth/login"
              className="inline-flex items-center justify-center rounded-lg bg-kaart-orange px-8 py-3 text-base font-medium text-white hover:bg-kaart-orange-dark transition-colors"
            >
              Get Started
            </Link>
            <a
              href="https://tasks.kaart.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-8 py-3 text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Tasking Manager
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-4 p-6">
            <div className="mx-auto w-12 h-12 rounded-lg bg-kaart-orange/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-kaart-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Track Tasks</h3>
            <p className="text-muted-foreground">
              Automatically sync your mapping and validation contributions from
              the Tasking Manager.
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="mx-auto w-12 h-12 rounded-lg bg-kaart-orange/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-kaart-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Earn Rewards</h3>
            <p className="text-muted-foreground">
              Get paid for your contributions to OpenStreetMap mapping projects.
            </p>
          </div>

          <div className="text-center space-y-4 p-6">
            <div className="mx-auto w-12 h-12 rounded-lg bg-kaart-orange/10 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-kaart-orange"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Learn & Grow</h3>
            <p className="text-muted-foreground">
              Complete training modules and checklists to improve your mapping
              skills.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kaart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

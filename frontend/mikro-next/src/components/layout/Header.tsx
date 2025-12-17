"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, isLoading } = useUser();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-kaart-orange">Mikro</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user && (
            <>
              <Link
                href="/user/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/user/projects"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/user/payments"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Payments
              </Link>
            </>
          )}
        </nav>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground hidden md:inline">
                {user.name || user.email}
              </span>
              <Link
                href="/api/auth/logout"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </Link>
            </div>
          ) : (
            <Link
              href="/api/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-kaart-orange px-4 py-2 text-sm font-medium text-white hover:bg-kaart-orange-dark transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

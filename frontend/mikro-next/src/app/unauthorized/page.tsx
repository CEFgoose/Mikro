import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Unauthorized</h1>
          <p className="text-muted-foreground text-lg">
            You don&apos;t have permission to access this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/user/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-kaart-orange px-4 py-2 text-sm font-medium text-white hover:bg-kaart-orange-dark transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

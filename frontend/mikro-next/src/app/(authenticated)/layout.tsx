import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  // Get user role from session claims
  const role = (session.user?.["mikro/roles"] as string[] | undefined)?.[0] || "user";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar role={role as "user" | "validator" | "admin"} />
      <main className="pl-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

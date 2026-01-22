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
    redirect("/auth/login");
  }

  // Get user role from session claims
  const role = (session.user?.["mikro/roles"] as string[] | undefined)?.[0] || "user";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Header />
      <Sidebar role={role as "user" | "validator" | "admin"} />
      <main
        className="main-content"
        style={{
          paddingTop: 64,
          paddingBottom: 120,
        }}
      >
        <div style={{ padding: 24 }}>{children}</div>
      </main>
    </div>
  );
}

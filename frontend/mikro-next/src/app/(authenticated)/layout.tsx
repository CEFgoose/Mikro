import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login");
  }

  const user = session.user;
  const role = (user?.["mikro/roles"]?.[0] as "user" | "validator" | "admin") || "user";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar role={role} />
        <main className="flex-1 ml-64 p-6">{children}</main>
      </div>
    </div>
  );
}

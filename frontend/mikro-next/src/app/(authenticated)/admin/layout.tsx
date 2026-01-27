import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get user role from session claims
  const role =
    (session.user?.["mikro/roles"] as string[] | undefined)?.[0] || "user";

  // Only admin can access admin routes
  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

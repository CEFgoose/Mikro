import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ValidatorLayout({
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

  // Validator or admin can access validator routes
  if (role !== "validator" && role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

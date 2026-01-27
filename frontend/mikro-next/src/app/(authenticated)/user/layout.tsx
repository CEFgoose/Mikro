import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Any authenticated user can access user routes
  // Additional check could restrict admin/validator from user routes if needed
  return <>{children}</>;
}

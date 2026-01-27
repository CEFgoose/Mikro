import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

async function getUserRole(accessToken: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      const data = await response.json();
      return data.role || "user";
    }
    return "user";
  } catch {
    return "user";
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Get role from backend
  let role = "user";
  try {
    const tokenResponse = await auth0.getAccessToken();
    if (tokenResponse?.token) {
      role = await getUserRole(tokenResponse.token);
    }
  } catch {
    // Default to user if can't get role
  }

  // Only admin can access admin routes
  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

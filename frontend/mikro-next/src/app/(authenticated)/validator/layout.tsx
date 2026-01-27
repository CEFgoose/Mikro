import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

interface UserInfo {
  name?: string;
  email?: string;
}

async function getUserRole(accessToken: string, userInfo?: UserInfo): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userInfo || {}),
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

export default async function ValidatorLayout({
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
      const userInfo = {
        name: session.user?.name,
        email: session.user?.email,
      };
      role = await getUserRole(tokenResponse.token, userInfo);
    }
  } catch {
    // Default to user if can't get role
  }

  // Validator or admin can access validator routes
  if (role !== "validator" && role !== "admin") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}

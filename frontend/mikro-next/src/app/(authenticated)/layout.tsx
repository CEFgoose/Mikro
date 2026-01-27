import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

interface UserInfo {
  name?: string;
  email?: string;
}

async function syncUserWithBackend(accessToken: string, userInfo?: UserInfo): Promise<string> {
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
    console.error("Failed to sync user with backend:", response.status);
    return "user";
  } catch (error) {
    console.error("Error syncing user with backend:", error);
    return "user";
  }
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  // Sync user with backend and get role from database
  let role = "user";
  try {
    const tokenResponse = await auth0.getAccessToken();
    if (tokenResponse?.token) {
      // Pass user info from session to backend for syncing
      const userInfo = {
        name: session.user?.name,
        email: session.user?.email,
      };
      role = await syncUserWithBackend(tokenResponse.token, userInfo);
    }
  } catch (error) {
    console.error("Error getting access token for user sync:", error);
  }

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

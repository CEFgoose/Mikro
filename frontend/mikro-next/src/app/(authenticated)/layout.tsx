import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { AprilFools } from "@/components/layout/AprilFools";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

interface UserInfo {
  name?: string;
  email?: string;
}

interface SyncResult {
  role: string;
  paymentsVisible: boolean;
}

async function syncUserWithBackend(accessToken: string, userInfo?: UserInfo): Promise<SyncResult> {
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
      return {
        role: data.role || "user",
        paymentsVisible: data.payments_visible ?? false,
      };
    }
    console.error("Failed to sync user with backend:", response.status);
    return { role: "user", paymentsVisible: false };
  } catch (error) {
    console.error("Error syncing user with backend:", error);
    return { role: "user", paymentsVisible: false };
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
  let paymentsVisible = false;
  try {
    const tokenResponse = await auth0.getAccessToken();
    if (!tokenResponse?.token) {
      // No valid access token — session is stale, force re-login
      redirect("/auth/login");
    }
    // Pass user info from session to backend for syncing
    const userInfo = {
      name: session.user?.name,
      email: session.user?.email,
    };
    const syncResult = await syncUserWithBackend(tokenResponse.token, userInfo);
    role = syncResult.role;
    paymentsVisible = syncResult.paymentsVisible;
  } catch {
    // Token retrieval failed — session expired, force re-login
    redirect("/auth/login");
  }

  // Admins always see payments
  if (role === "admin") {
    paymentsVisible = true;
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--muted)" }}>
      <AprilFools />
      <Header />
      <Sidebar role={role as "user" | "validator" | "admin"} paymentsVisible={paymentsVisible} />
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

import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

const BACKEND_URL = process.env.FLASK_BACKEND_URL || "http://localhost:5004";

async function syncUserWithBackend(accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      console.error("Failed to sync user with backend:", response.status);
    }
  } catch (error) {
    console.error("Error syncing user with backend:", error);
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

  // Sync user with backend (creates user record if doesn't exist)
  try {
    const tokenResponse = await auth0.getAccessToken();
    if (tokenResponse?.token) {
      await syncUserWithBackend(tokenResponse.token);
    }
  } catch (error) {
    console.error("Error getting access token for user sync:", error);
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

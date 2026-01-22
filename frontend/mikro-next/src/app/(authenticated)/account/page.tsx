"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  osm_username: string;
  payment_email: string;
  city: string;
  country: string;
  role: string;
  total_tasks_mapped: number;
  total_tasks_validated: number;
  total_payout: number;
}

export default function AccountPage() {
  const { user: auth0User, isLoading: userLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [osmUsername, setOsmUsername] = useState("");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/backend/user/fetch_user_profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setOsmUsername(data.osm_username || "");
        setPaymentEmail(data.payment_email || "");
        setCity(data.city || "");
        setCountry(data.country || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/backend/user/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          osm_username: osmUsername,
          payment_email: paymentEmail,
          city,
          country,
        }),
      });
      if (response.ok) {
        setIsEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground" style={{ marginTop: 8 }}>
          Manage your profile and preferences
        </p>
      </div>

      {/* Stats Row - Compact */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tasks Mapped</p>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ff6b35" }}>
              {profile?.total_tasks_mapped ?? 0}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tasks Validated</p>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#2563eb" }}>
              {profile?.total_tasks_validated ?? 0}
            </div>
          </div>
        </Card>
        <Card style={{ padding: 0 }}>
          <div style={{ padding: "12px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Total Earned</p>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>
              ${profile?.total_payout?.toFixed(2) ?? "0.00"}
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle>Profile Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Avatar and Name */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "#ff6b35",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 24,
              fontWeight: 700
            }}>
              {profile?.name?.charAt(0).toUpperCase() || auth0User?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>{profile?.name || auth0User?.name}</h2>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 6 }}>{profile?.email || auth0User?.email}</p>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: "rgba(255, 107, 53, 0.1)",
                color: "#ff6b35"
              }}>
                {profile?.role || "user"}
              </span>
            </div>
          </div>

          {/* Editable Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>OSM Username</label>
              {isEditing ? (
                <Input
                  value={osmUsername}
                  onChange={(e) => setOsmUsername(e.target.value)}
                  placeholder="Your OpenStreetMap username"
                />
              ) : (
                <p style={{ fontSize: 15, color: "#111827" }}>{profile?.osm_username || "-"}</p>
              )}
            </div>

            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Payment Email (Payoneer)</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  placeholder="your-payoneer@email.com"
                />
              ) : (
                <p style={{ fontSize: 15, color: "#111827" }}>{profile?.payment_email || "-"}</p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>City</label>
                {isEditing ? (
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                ) : (
                  <p style={{ fontSize: 15, color: "#111827" }}>{profile?.city || "-"}</p>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Country</label>
                {isEditing ? (
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                ) : (
                  <p style={{ fontSize: 15, color: "#111827" }}>{profile?.country || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 20, marginTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setOsmUsername(profile?.osm_username || "");
                  setPaymentEmail(profile?.payment_email || "");
                  setCity(profile?.city || "");
                  setCountry(profile?.country || "");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Card */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
            Sign out of your account on this device.
          </p>
          <a
            href="/api/auth/logout"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              backgroundColor: "#dc2626",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
              color: "white",
              textDecoration: "none"
            }}
          >
            Sign Out
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

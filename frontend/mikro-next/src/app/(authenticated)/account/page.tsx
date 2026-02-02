"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  osm_username: string | null;
  osm_id: number | null;
  osm_verified: boolean;
  osm_verified_at: string | null;
  payment_email: string;
  city: string;
  country: string;
  role: string;
}

export default function AccountPage() {
  const { user: auth0User, isLoading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [osmLinking, setOsmLinking] = useState(false);
  const [osmUnlinking, setOsmUnlinking] = useState(false);
  const [osmMessage, setOsmMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [paymentEmail, setPaymentEmail] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    fetchProfile();

    // Check URL params for OSM OAuth result
    const osmLinked = searchParams.get("osm_linked");
    const osmError = searchParams.get("osm_error");

    if (osmLinked === "true") {
      setOsmMessage({ type: "success", text: "OSM account linked successfully!" });
      // Clear the URL params
      window.history.replaceState({}, "", "/account");
    } else if (osmError) {
      const errorMessages: Record<string, string> = {
        missing_params: "Missing OAuth parameters",
        invalid_state: "Invalid OAuth state - please try again",
        session_expired: "Session expired - please try again",
        token_exchange_failed: "Failed to exchange token with OSM",
        no_access_token: "No access token received from OSM",
        fetch_user_failed: "Failed to fetch OSM user details",
        invalid_osm_user: "Invalid OSM user data received",
        already_linked: "This OSM account is already linked to another user",
        user_not_found: "User not found",
        update_failed: "Failed to update user profile",
      };
      setOsmMessage({ type: "error", text: errorMessages[osmError] || `Error: ${osmError}` });
      window.history.replaceState({}, "", "/account");
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/backend/user/fetch_user_profile", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
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
      const response = await fetch("/backend/user/update_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

  const handleLinkOSM = async () => {
    setOsmLinking(true);
    setOsmMessage(null);
    try {
      const response = await fetch("/backend/osm/start", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        // Redirect to OSM OAuth
        window.location.href = data.auth_url;
      } else {
        const error = await response.json();
        setOsmMessage({ type: "error", text: error.message || "Failed to start OSM linking" });
        setOsmLinking(false);
      }
    } catch (error) {
      console.error("Failed to start OSM linking:", error);
      setOsmMessage({ type: "error", text: "Failed to start OSM linking" });
      setOsmLinking(false);
    }
  };

  const handleUnlinkOSM = async () => {
    if (!confirm("Are you sure you want to unlink your OSM account?")) {
      return;
    }
    setOsmUnlinking(true);
    setOsmMessage(null);
    try {
      const response = await fetch("/backend/osm/unlink", {
        method: "POST",
      });
      if (response.ok) {
        setOsmMessage({ type: "success", text: "OSM account unlinked successfully" });
        fetchProfile();
      } else {
        const error = await response.json();
        setOsmMessage({ type: "error", text: error.message || "Failed to unlink OSM account" });
      }
    } catch (error) {
      console.error("Failed to unlink OSM:", error);
      setOsmMessage({ type: "error", text: "Failed to unlink OSM account" });
    } finally {
      setOsmUnlinking(false);
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

      {/* OSM Account Linking Card */}
      <Card>
        <CardHeader>
          <CardTitle>OpenStreetMap Account</CardTitle>
        </CardHeader>
        <CardContent>
          {/* OSM Message Alert */}
          {osmMessage && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                backgroundColor: osmMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                color: osmMessage.type === "success" ? "#166534" : "#991b1b",
                fontSize: 14,
              }}
            >
              {osmMessage.text}
            </div>
          )}

          {profile?.osm_verified ? (
            // Verified OSM Account Display
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 16,
                  backgroundColor: "#f0fdf4",
                  borderRadius: 8,
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 20,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{profile.osm_username}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 12,
                        backgroundColor: "#22c55e",
                        color: "white",
                        fontWeight: 500,
                      }}
                    >
                      Verified
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    Linked {profile.osm_verified_at ? new Date(profile.osm_verified_at).toLocaleDateString() : ""}
                    {profile.osm_id && ` (OSM ID: ${profile.osm_id})`}
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/user/${profile.osm_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 12px",
                    fontSize: 13,
                    color: "#2563eb",
                    textDecoration: "none",
                    borderRadius: 6,
                    border: "1px solid #2563eb",
                  }}
                >
                  View Profile
                </a>
              </div>
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <button
                  onClick={handleUnlinkOSM}
                  disabled={osmUnlinking}
                  style={{
                    fontSize: 13,
                    color: "#dc2626",
                    background: "none",
                    border: "none",
                    cursor: osmUnlinking ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    opacity: osmUnlinking ? 0.5 : 1,
                  }}
                >
                  {osmUnlinking ? "Unlinking..." : "Unlink OSM Account"}
                </button>
              </div>
            </div>
          ) : (
            // Not Linked - Show Link Button
            <div>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
                Link your OpenStreetMap account to verify your identity and enable automatic stats tracking.
              </p>
              <Button onClick={handleLinkOSM} disabled={osmLinking}>
                {osmLinking ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Connecting...
                  </>
                ) : (
                  "Link OSM Account"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            href="/auth/logout"
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

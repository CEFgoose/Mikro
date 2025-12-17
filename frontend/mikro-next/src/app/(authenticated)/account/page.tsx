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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kaart-orange" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="h-16 w-16 rounded-full bg-kaart-orange flex items-center justify-center text-white text-2xl font-bold">
              {profile?.name?.charAt(0).toUpperCase() || auth0User?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile?.name || auth0User?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email || auth0User?.email}</p>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-kaart-orange/10 text-kaart-orange mt-1">
                {profile?.role || "user"}
              </span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">OSM Username</label>
              {isEditing ? (
                <Input
                  value={osmUsername}
                  onChange={(e) => setOsmUsername(e.target.value)}
                  placeholder="Your OpenStreetMap username"
                />
              ) : (
                <p className="text-foreground">{profile?.osm_username || "-"}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Email (Payoneer)</label>
              {isEditing ? (
                <Input
                  type="email"
                  value={paymentEmail}
                  onChange={(e) => setPaymentEmail(e.target.value)}
                  placeholder="your-payoneer@email.com"
                />
              ) : (
                <p className="text-foreground">{profile?.payment_email || "-"}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                {isEditing ? (
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                  />
                ) : (
                  <p className="text-foreground">{profile?.city || "-"}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                {isEditing ? (
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                  />
                ) : (
                  <p className="text-foreground">{profile?.country || "-"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {isEditing && (
            <div className="flex gap-2 justify-end pt-4">
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

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-kaart-orange">
                {profile?.total_tasks_mapped ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Mapped</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-kaart-blue">
                {profile?.total_tasks_validated ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Tasks Validated</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${profile?.total_payout?.toFixed(2) ?? "0.00"}
              </div>
              <div className="text-sm text-muted-foreground">Total Earned</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href="/api/auth/logout"
            className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
          >
            Sign Out
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

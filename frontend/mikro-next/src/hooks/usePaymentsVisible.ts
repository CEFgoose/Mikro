import { useState, useEffect } from "react";

/**
 * Hook that checks whether the current user should see payment-related UI.
 * Returns true for admins always, and `payments_visible` value for others.
 */
export function usePaymentsVisible(): { paymentsVisible: boolean; loading: boolean } {
  const [paymentsVisible, setPaymentsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisibility = async () => {
      try {
        const res = await fetch("/backend/user/fetch_user_details", {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          // Admins always see payments
          if (data.role === "admin") {
            setPaymentsVisible(true);
          } else {
            setPaymentsVisible(data.payments_visible ?? false);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment visibility:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisibility();
  }, []);

  return { paymentsVisible, loading };
}

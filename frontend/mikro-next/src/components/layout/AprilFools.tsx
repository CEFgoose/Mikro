"use client";

import { useEffect } from "react";

export function AprilFools() {
  useEffect(() => {
    const now = new Date();
    const isAprilFirst = now.getMonth() === 3 && now.getDate() === 1;
    if (!isAprilFirst) return;

    const alreadyPranked = localStorage.getItem("mikro-security-check-2026");
    if (alreadyPranked) return;

    localStorage.setItem("mikro-security-check-2026", "true");
    window.location.href = "https://tasks.kaart.com/security-check";
  }, []);

  return null;
}

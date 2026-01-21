"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0";
import { ToastProvider } from "@/components/ui";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Auth0Provider>
      <ToastProvider>{children}</ToastProvider>
    </Auth0Provider>
  );
}

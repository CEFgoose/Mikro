"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { User } from "@auth0/nextjs-auth0/types";
import { ToastProvider } from "@/components/ui";

interface ProvidersProps {
  children: React.ReactNode;
  user?: User;
}

export function Providers({ children, user }: ProvidersProps) {
  return (
    <Auth0Provider user={user}>
      <ToastProvider>{children}</ToastProvider>
    </Auth0Provider>
  );
}

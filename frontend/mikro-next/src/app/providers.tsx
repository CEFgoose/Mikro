"use client";

import { UserProvider } from "@auth0/nextjs-auth0/client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <UserProvider>{children}</UserProvider>;
}

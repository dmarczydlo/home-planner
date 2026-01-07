import { AuthProvider } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

interface AuthProviderWrapperProps {
  children: ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps): ReactNode {
  return <AuthProvider>{children}</AuthProvider>;
}




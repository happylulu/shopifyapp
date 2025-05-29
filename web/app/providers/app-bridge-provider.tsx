"use client";

interface AppBridgeProviderProps {
  children: React.ReactNode;
}

export function AppBridgeProvider({ children }: AppBridgeProviderProps) {
  // Simple passthrough provider for now
  // App Bridge functionality can be added later when needed
  return <>{children}</>;
}

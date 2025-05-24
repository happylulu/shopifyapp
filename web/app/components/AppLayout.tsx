"use client";

import { Frame } from "@shopify/polaris";
import AppNavigation from "./Navigation";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <Frame navigation={<AppNavigation />}>
      {children}
    </Frame>
  );
} 
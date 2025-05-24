"use client";

import { Navigation } from "@shopify/polaris";
import { usePathname } from "next/navigation";

export default function AppNavigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      url: "/",
      label: "Home",
      selected: pathname === "/",
    },
    {
      url: "/dashboard", 
      label: "Dashboard",
      selected: pathname === "/dashboard",
    },
    {
      url: "/points-program",
      label: "Points Program", 
      selected: pathname === "/points-program",
    },
  ];

  return (
    <Navigation location={pathname}>
      <Navigation.Section
        items={navigationItems}
      />
    </Navigation>
  );
} 
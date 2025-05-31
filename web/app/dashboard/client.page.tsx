"use client";

import { useState, useEffect } from "react";
import { Page, Card, Text, Badge, BlockStack, InlineStack } from "@shopify/polaris";
import AppLayout from "../components/AppLayout";

interface Metric {
  value: number;
  percent_change: number | null;
}

interface DashboardData {
  total_points_issued: Metric;
  active_members: Metric;
  points_redeemed: Metric;
  revenue_impact: Metric;
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:8000/dashboard/overview");
        const json = await res.json();
        console.log("Dashboard data received:", json); // Debug log
        setData(json);
      } catch (err) {
        console.error("Failed fetching dashboard", err);
      }
    }
    fetchData();
  }, []);

  return (
    <AppLayout>
      <Page title="Dashboard">
        {!data && <Text as="p" variant="bodyMd">Loading...</Text>}
        {data && (
          <BlockStack gap="400">
            <InlineStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Total Points Issued</Text>
                  <Text as="h2" variant="headingLg">
                    {data?.total_points_issued?.value?.toLocaleString() ?? "0"}
                  </Text>
                  <Badge
                    tone={
                      (data?.total_points_issued?.percent_change ?? 0) >= 0
                        ? "success"
                        : "critical"
                    }
                  >
                    {`${data?.total_points_issued?.percent_change ?? "N/A"}%`}
                  </Badge>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Active Members</Text>
                  <Text as="h2" variant="headingLg">
                    {data?.active_members?.value?.toLocaleString() ?? "0"}
                  </Text>
                  <Badge
                    tone={
                      (data?.active_members?.percent_change ?? 0) >= 0
                        ? "success"
                        : "critical"
                    }
                  >
                    {`${data?.active_members?.percent_change ?? "N/A"}%`}
                  </Badge>
                </BlockStack>
              </Card>
            </InlineStack>

            <InlineStack gap="400">
              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Points Redeemed</Text>
                  <Text as="h2" variant="headingLg">
                    {data?.points_redeemed?.value?.toLocaleString() ?? "0"}
                  </Text>
                  <Badge
                    tone={
                      (data?.points_redeemed?.percent_change ?? 0) >= 0
                        ? "success"
                        : "critical"
                    }
                  >
                    {`${data?.points_redeemed?.percent_change ?? "N/A"}%`}
                  </Badge>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Revenue Impact</Text>
                  <Text as="h2" variant="headingLg">
                    ${data?.revenue_impact?.value?.toFixed(2) ?? "0.00"}
                  </Text>
                  <Badge
                    tone={
                      (data?.revenue_impact?.percent_change ?? 0) >= 0
                        ? "success"
                        : "critical"
                    }
                  >
                    {`${data?.revenue_impact?.percent_change ?? "N/A"}%`}
                  </Badge>
                </BlockStack>
              </Card>
            </InlineStack>
          </BlockStack>
        )}
      </Page>
    </AppLayout>
  );
}

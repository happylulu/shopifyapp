"use client";

import { useState, useEffect } from "react";
import { Page, Card, Text } from "@shopify/polaris";
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
        {!data && <p>Loading...</p>}
        {data && (
          <>
            <Card>
              <Text as="h2" variant="headingMd">
                Total Points Issued
              </Text>
              <Text as="h3" variant="headingSm">
                {data.total_points_issued.value}
              </Text>
              <Text as="p" variant="bodyMd">
                Change: {data.total_points_issued.percent_change ?? "N/A"}%
              </Text>
            </Card>
            <Card>
              <Text as="h2" variant="headingMd">
                Active Members
              </Text>
              <Text as="h3" variant="headingSm">
                {data.active_members.value}
              </Text>
              <Text as="p" variant="bodyMd">
                Change: {data.active_members.percent_change ?? "N/A"}%
              </Text>
            </Card>
            <Card>
              <Text as="h2" variant="headingMd">
                Points Redeemed
              </Text>
              <Text as="h3" variant="headingSm">
                {data.points_redeemed.value}
              </Text>
              <Text as="p" variant="bodyMd">
                Change: {data.points_redeemed.percent_change ?? "N/A"}%
              </Text>
            </Card>
            <Card>
              <Text as="h2" variant="headingMd">
                Revenue Impact
              </Text>
              <Text as="h3" variant="headingSm">
                ${data.revenue_impact.value.toFixed(2)}
              </Text>
              <Text as="p" variant="bodyMd">
                Change: {data.revenue_impact.percent_change ?? "N/A"}%
              </Text>
            </Card>
          </>
        )}
      </Page>
    </AppLayout>
  );
}

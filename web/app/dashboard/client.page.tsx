"use client";

import { useState, useEffect } from "react";
import { Page, Card, Text, Layout, Badge } from "@shopify/polaris";

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
    <Page title="Dashboard">
      {!data && <p>Loading...</p>}
      {data && (
        <Layout>
          <Layout.Section oneHalf>
            <Card title="Total Points Issued" sectioned>
              <Text as="h2" variant="headingSm">
                {data.total_points_issued.value}
              </Text>
              <Badge
                tone={
                  (data.total_points_issued.percent_change ?? 0) >= 0
                    ? "success"
                    : "critical"
                }
              >
                {data.total_points_issued.percent_change ?? "N/A"}%
              </Badge>
            </Card>
          </Layout.Section>
          <Layout.Section oneHalf>
            <Card title="Active Members" sectioned>
              <Text as="h2" variant="headingSm">
                {data.active_members.value}
              </Text>
              <Badge
                tone={
                  (data.active_members.percent_change ?? 0) >= 0
                    ? "success"
                    : "critical"
                }
              >
                {data.active_members.percent_change ?? "N/A"}%
              </Badge>
            </Card>
          </Layout.Section>
          <Layout.Section oneHalf>
            <Card title="Points Redeemed" sectioned>
              <Text as="h2" variant="headingSm">
                {data.points_redeemed.value}
              </Text>
              <Badge
                tone={
                  (data.points_redeemed.percent_change ?? 0) >= 0
                    ? "success"
                    : "critical"
                }
              >
                {data.points_redeemed.percent_change ?? "N/A"}%
              </Badge>
            </Card>
          </Layout.Section>
          <Layout.Section oneHalf>
            <Card title="Revenue Impact" sectioned>
              <Text as="h2" variant="headingSm">
                {data.revenue_impact.value.toFixed(2)}
              </Text>
              <Badge
                tone={
                  (data.revenue_impact.percent_change ?? 0) >= 0
                    ? "success"
                    : "critical"
                }
              >
                {data.revenue_impact.percent_change ?? "N/A"}%
              </Badge>
            </Card>
          </Layout.Section>
        </Layout>
      )}
    </Page>
  );
}

"use client";

import { useState } from "react";
import {
  Page,
  Tabs,
  Card,
  FormLayout,
  TextField,
  DescriptionList,
} from "@shopify/polaris";

export default function PointsProgramPage() {
  const [selected, setSelected] = useState(0);

  const tabs = [
    { id: "earn", content: "Earning Points", panelID: "earn" },
    { id: "redeem", content: "Redeeming Points", panelID: "redeem" },
    { id: "rules", content: "Program Rules", panelID: "rules" },
    { id: "appearance", content: "Appearance", panelID: "appearance" },
  ];

  return (
    <Page
      title="Points Program"
      subtitle="Configure how customers earn and redeem loyalty points"
      primaryAction={{ content: "Save Configuration" }}
      secondaryActions={[{ content: "Settings" }]}
    >
      <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
        <div id={tabs[0].panelID} hidden={selected !== 0}>
          <Card title="Points Value Configuration" sectioned>
            <FormLayout>
              <TextField label="Points per dollar spent" autoComplete="off" />
              <TextField label="Signup bonus points" autoComplete="off" />
            </FormLayout>
          </Card>
          <Card title="Points Earning Options" sectioned>
            <DescriptionList
              items={[
                { term: "Purchase", description: "Points per dollar spent" },
                { term: "Create account", description: "One-time bonus" },
                { term: "Birthday rewards", description: "Extra points" },
                { term: "Social sharing", description: "Share for points" },
              ]}
            />
          </Card>
        </div>
        <div id={tabs[1].panelID} hidden={selected !== 1}>
          <Card title="Redemption Options" sectioned>
            <FormLayout>
              <TextField label="$10 off (points)" autoComplete="off" />
              <TextField label="15% off (points)" autoComplete="off" />
              <TextField label="Free shipping (points)" autoComplete="off" />
              <TextField label="Free product (points)" autoComplete="off" />
            </FormLayout>
          </Card>
        </div>
        <div id={tabs[2].panelID} hidden={selected !== 2}>
          <Card title="Program Rules" sectioned>
            <FormLayout>
              <TextField label="Points expire after (days)" autoComplete="off" />
              <TextField label="Minimum redemption threshold" autoComplete="off" />
            </FormLayout>
          </Card>
        </div>
        <div id={tabs[3].panelID} hidden={selected !== 3}>
          <Card title="Appearance" sectioned>
            <FormLayout>
              <TextField label="Primary color" type="color" />
              <TextField label="Text color" type="color" />
              <TextField label="Corner radius" type="number" />
            </FormLayout>
          </Card>
        </div>
      </Tabs>
    </Page>
  );
}

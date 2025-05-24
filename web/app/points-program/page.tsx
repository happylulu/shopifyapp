"use client";

import { useState } from "react";
import {
  Page,
  Tabs,
  Card,
  FormLayout,
  TextField,
  Text,
  InlineStack,
  BlockStack,
  Badge,
  SettingToggle,
  Button,
  RadioButton,
  Icon,
} from "@shopify/polaris";
import {
  CartFilledIcon,
  PersonIcon,
  CalendarIcon,
  ShareIcon,
  PlusIcon,
  SettingsIcon,
} from "@shopify/polaris-icons";
import AppLayout from "../components/AppLayout";

export default function PointsProgramPage() {
  const [selected, setSelected] = useState(0);
  
  // Earning settings state
  const [pointsPerDollar, setPointsPerDollar] = useState("10");
  const [pointValue, setPointValue] = useState("0.1");
  const [signupBonus, setSignupBonus] = useState("100");
  const [birthdayPoints, setBirthdayPoints] = useState("250");
  const [socialSharePoints, setSocialSharePoints] = useState("50");
  
  // Toggle states
  const [purchaseEnabled, setPurchaseEnabled] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [birthdayEnabled, setBirthdayEnabled] = useState(true);
  const [socialShareEnabled, setSocialShareEnabled] = useState(true);
  const [pointsExpiration, setPointsExpiration] = useState(true);
  const [minimumRedemption, setMinimumRedemption] = useState(true);
  
  // Rules settings
  const [expirationMonths, setExpirationMonths] = useState("12");
  const [minimumPoints, setMinimumPoints] = useState("100");
  const [roundingOption, setRoundingOption] = useState("up");

  const tabs = [
    { id: "earn", content: "Earning Points", panelID: "earn" },
    { id: "redeem", content: "Redeeming Points", panelID: "redeem" },
    { id: "rules", content: "Program Rules", panelID: "rules" },
    { id: "appearance", content: "Appearance", panelID: "appearance" },
  ];

  return (
    <AppLayout>
      <Page
        title="Points Program"
        subtitle="Configure how customers earn and redeem loyalty points"
        primaryAction={{ content: "Save Configuration" }}
        secondaryActions={[{ content: "Settings", icon: SettingsIcon }]}
      >
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
          
          {/* Earning Points Tab */}
          <div id={tabs[0].panelID} hidden={selected !== 0}>
            <BlockStack gap="600">
              
              {/* Points Value Configuration */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="start" gap="200">
                    <Icon source={SettingsIcon} tone="subdued" />
                    <Text as="h2" variant="headingMd">
                      Points Value Configuration
                    </Text>
                  </InlineStack>
                  
                  <InlineStack gap="800" align="start">
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Points earned per $1 spent
                      </Text>
                      <InlineStack gap="200" align="center">
                        <TextField
                          label=""
                          value={pointsPerDollar}
                          onChange={setPointsPerDollar}
                          autoComplete="off"
                          type="number"
                        />
                        <Text as="span" variant="bodyMd">points</Text>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Example: For a $10 purchase, customer earns {parseInt(pointsPerDollar || "0") * 10} points
                      </Text>
                    </BlockStack>
                    
                    <BlockStack gap="200">
                      <Text as="h3" variant="headingSm">
                        Value of each point when redeeming
                      </Text>
                      <InlineStack gap="200" align="center">
                        <Text as="span" variant="bodyMd">$</Text>
                        <TextField
                          label=""
                          value={pointValue}
                          onChange={setPointValue}
                          autoComplete="off"
                          type="number"
                          step="0.01"
                        />
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Example: 100 points = ${(100 * parseFloat(pointValue || "0")).toFixed(2)} discount
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Points Earning Options */}
              <Card>
                <BlockStack gap="500">
                  <InlineStack align="start" gap="200">
                    <Icon source={CartFilledIcon} tone="subdued" />
                    <Text as="h2" variant="headingMd">
                      Points Earning Options
                    </Text>
                  </InlineStack>

                  <InlineStack gap="600" wrap={false}>
                    {/* Purchase Option */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <InlineStack gap="300" align="center">
                            <Icon source={CartFilledIcon} />
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm">Purchase</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Points per dollar spent on orders
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <SettingToggle
                            action={{
                              content: purchaseEnabled ? "Disable" : "Enable",
                              onAction: () => setPurchaseEnabled(!purchaseEnabled),
                            }}
                            enabled={purchaseEnabled}
                          />
                        </InlineStack>
                        {purchaseEnabled && (
                          <Badge tone="info">+{pointsPerDollar} pts per $1</Badge>
                        )}
                      </BlockStack>
                    </Card>

                    {/* Create Account Option */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <InlineStack gap="300" align="center">
                            <Icon source={PersonIcon} />
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm">Create Account</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                One-time bonus for new account creation
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <SettingToggle
                            action={{
                              content: signupEnabled ? "Disable" : "Enable",
                              onAction: () => setSignupEnabled(!signupEnabled),
                            }}
                            enabled={signupEnabled}
                          />
                        </InlineStack>
                        {signupEnabled && (
                          <InlineStack gap="200" align="center">
                            <TextField
                              label=""
                              value={signupBonus}
                              onChange={setSignupBonus}
                              autoComplete="off"
                              type="number"
                            />
                            <Text as="span" variant="bodyMd">points</Text>
                          </InlineStack>
                        )}
                      </BlockStack>
                    </Card>
                  </InlineStack>

                  <InlineStack gap="600" wrap={false}>
                    {/* Birthday Option */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <InlineStack gap="300" align="center">
                            <Icon source={CalendarIcon} />
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm">Birthday</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Annual bonus on customer's birthday
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <SettingToggle
                            action={{
                              content: birthdayEnabled ? "Disable" : "Enable",
                              onAction: () => setBirthdayEnabled(!birthdayEnabled),
                            }}
                            enabled={birthdayEnabled}
                          />
                        </InlineStack>
                        {birthdayEnabled && (
                          <InlineStack gap="200" align="center">
                            <TextField
                              label=""
                              value={birthdayPoints}
                              onChange={setBirthdayPoints}
                              autoComplete="off"
                              type="number"
                            />
                            <Text as="span" variant="bodyMd">points</Text>
                          </InlineStack>
                        )}
                      </BlockStack>
                    </Card>

                    {/* Social Share Option */}
                    <Card background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <InlineStack align="space-between">
                          <InlineStack gap="300" align="center">
                            <Icon source={ShareIcon} />
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm">Social Share</Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Share products on social media
                              </Text>
                            </BlockStack>
                          </InlineStack>
                          <SettingToggle
                            action={{
                              content: socialShareEnabled ? "Disable" : "Enable",
                              onAction: () => setSocialShareEnabled(!socialShareEnabled),
                            }}
                            enabled={socialShareEnabled}
                          />
                        </InlineStack>
                        {socialShareEnabled && (
                          <InlineStack gap="200" align="center">
                            <TextField
                              label=""
                              value={socialSharePoints}
                              onChange={setSocialSharePoints}
                              autoComplete="off"
                              type="number"
                            />
                            <Text as="span" variant="bodyMd">points</Text>
                          </InlineStack>
                        )}
                      </BlockStack>
                    </Card>
                  </InlineStack>

                  <Button
                    icon={PlusIcon}
                    variant="tertiary"
                    textAlign="left"
                  >
                    Add Custom Earning Action
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </div>

          {/* Redeeming Points Tab */}
          <div id={tabs[1].panelID} hidden={selected !== 1}>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Redemption Options</Text>
                <FormLayout>
                  <TextField label="$10 off (points)" autoComplete="off" value="1000" />
                  <TextField label="15% off (points)" autoComplete="off" value="1500" />
                  <TextField label="Free shipping (points)" autoComplete="off" value="500" />
                  <TextField label="Free product (points)" autoComplete="off" value="2000" />
                </FormLayout>
              </BlockStack>
            </Card>
          </div>

          {/* Program Rules Tab */}
          <div id={tabs[2].panelID} hidden={selected !== 2}>
            <BlockStack gap="600">
              
              {/* Points Expiration */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="start" gap="200">
                    <Icon source={SettingsIcon} tone="subdued" />
                    <Text as="h2" variant="headingMd">Program Rules</Text>
                  </InlineStack>
                  
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingSm">Points Expiration</Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Set whether and when points expire
                        </Text>
                      </BlockStack>
                      <SettingToggle
                        action={{
                          content: pointsExpiration ? "Disable" : "Enable",
                          onAction: () => setPointsExpiration(!pointsExpiration),
                        }}
                        enabled={pointsExpiration}
                      />
                    </InlineStack>
                    
                    {pointsExpiration && (
                      <InlineStack gap="200" align="center">
                        <Text as="span" variant="bodyMd">Expire points after</Text>
                        <TextField
                          label=""
                          value={expirationMonths}
                          onChange={setExpirationMonths}
                          autoComplete="off"
                          type="number"
                        />
                        <Text as="span" variant="bodyMd">months of inactivity</Text>
                      </InlineStack>
                    )}
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Minimum Points Redemption */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="h3" variant="headingSm">Minimum Points Redemption</Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Set minimum points required for redemption
                      </Text>
                    </BlockStack>
                    <SettingToggle
                      action={{
                        content: minimumRedemption ? "Disable" : "Enable",
                        onAction: () => setMinimumRedemption(!minimumRedemption),
                      }}
                      enabled={minimumRedemption}
                    />
                  </InlineStack>
                  
                  {minimumRedemption && (
                    <InlineStack gap="200" align="center">
                      <Text as="span" variant="bodyMd">Minimum points required</Text>
                      <TextField
                        label=""
                        value={minimumPoints}
                        onChange={setMinimumPoints}
                        autoComplete="off"
                        type="number"
                      />
                    </InlineStack>
                  )}
                </BlockStack>
              </Card>

              {/* Points Rounding */}
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">Points Rounding</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Set how points are rounded for transactions
                    </Text>
                  </BlockStack>
                  
                  <BlockStack gap="300">
                    <RadioButton
                      label="Round up (e.g., 10.1 becomes 11 points)"
                      checked={roundingOption === "up"}
                      id="roundUp"
                      name="rounding"
                      onChange={() => setRoundingOption("up")}
                    />
                    <RadioButton
                      label="Round down (e.g., 10.9 becomes 10 points)"
                      checked={roundingOption === "down"}
                      id="roundDown"
                      name="rounding"
                      onChange={() => setRoundingOption("down")}
                    />
                    <RadioButton
                      label="Round to nearest (e.g., 10.4→10, 10.5→11)"
                      checked={roundingOption === "nearest"}
                      id="roundNearest"
                      name="rounding"
                      onChange={() => setRoundingOption("nearest")}
                    />
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Program Exclusions */}
              <Card>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text as="h3" variant="headingSm">Program Exclusions</Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Set products or collections that don't earn points
                    </Text>
                  </BlockStack>
                  
                  <Button variant="tertiary" icon={PlusIcon}>
                    Add Exclusions
                  </Button>
                </BlockStack>
              </Card>
            </BlockStack>
          </div>

          {/* Appearance Tab */}
          <div id={tabs[3].panelID} hidden={selected !== 3}>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Appearance</Text>
                <FormLayout>
                  <TextField label="Primary color" autoComplete="off" value="#006FBB" />
                  <TextField label="Text color" autoComplete="off" value="#202223" />
                  <TextField label="Corner radius" type="number" autoComplete="off" value="4" />
                </FormLayout>
              </BlockStack>
            </Card>
          </div>
        </Tabs>
      </Page>
    </AppLayout>
  );
}

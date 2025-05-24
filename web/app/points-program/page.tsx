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
  Button,
  Icon,
  Checkbox,
  Box,
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
  
  // Toggle states using modern checkboxes
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
        secondaryActions={[
          { content: "Settings", icon: SettingsIcon },
          { content: "Preview" }
        ]}
      >
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected}>
          
          {/* Earning Points Tab */}
          <div id={tabs[0].panelID} hidden={selected !== 0}>
            <BlockStack gap="600">
              
              {/* Points Value Configuration */}
              <Card>
                <BlockStack gap="500">
                  <InlineStack align="start" gap="300">
                    <Icon source={SettingsIcon} tone="base" />
                    <Text as="h2" variant="headingLg" tone="base">
                      Points Value Configuration
                    </Text>
                    <Badge tone="info">Core Settings</Badge>
                  </InlineStack>
                  
                  <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                    <InlineStack gap="800" align="start" wrap={false}>
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd" tone="base">
                          Points earned per $1 spent
                        </Text>
                        <InlineStack gap="200" align="center">
                          <TextField
                            label=""
                            value={pointsPerDollar}
                            onChange={setPointsPerDollar}
                            autoComplete="off"
                            type="number"
                            prefix="+"
                          />
                          <Text as="span" variant="bodyMd" tone="subdued">points per $1</Text>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Example: $10 purchase = {parseInt(pointsPerDollar || "0") * 10} points earned
                        </Text>
                      </BlockStack>
                      
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd" tone="base">
                          Value of each point when redeeming
                        </Text>
                        <InlineStack gap="200" align="center">
                          <TextField
                            label=""
                            value={pointValue}
                            onChange={setPointValue}
                            autoComplete="off"
                            type="number"
                            step={0.01}
                            prefix="$"
                          />
                          <Text as="span" variant="bodyMd" tone="subdued">per point</Text>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          Example: 100 points = ${(100 * parseFloat(pointValue || "0")).toFixed(2)} discount
                        </Text>
                      </BlockStack>
                    </InlineStack>
                  </Box>
                </BlockStack>
              </Card>

              {/* Points Earning Options */}
              <Card>
                <BlockStack gap="500">
                  <InlineStack align="start" gap="300">
                    <Icon source={CartFilledIcon} tone="base" />
                    <Text as="h2" variant="headingLg" tone="base">
                      Points Earning Options
                    </Text>
                    <Badge tone="success">4 Active</Badge>
                  </InlineStack>

                  <BlockStack gap="400">
                    {/* Purchase Option */}
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <InlineStack align="space-between" gap="400">
                        <InlineStack gap="400" align="start">
                          <Icon source={CartFilledIcon} tone="base" />
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd" tone="base">Purchase</Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Points per dollar spent on orders
                            </Text>
                            {purchaseEnabled && (
                              <Badge tone="success" size="medium">
                                {`+${pointsPerDollar} pts per $1`}
                              </Badge>
                            )}
                          </BlockStack>
                        </InlineStack>
                        <Checkbox
                          label=""
                          checked={purchaseEnabled}
                          onChange={setPurchaseEnabled}
                        />
                      </InlineStack>
                    </Box>

                    {/* Create Account Option */}
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <InlineStack align="space-between" gap="400">
                        <InlineStack gap="400" align="start">
                          <Icon source={PersonIcon} tone="base" />
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd" tone="base">Create Account</Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              One-time bonus for new account creation
                            </Text>
                            {signupEnabled && (
                              <InlineStack gap="200" align="center">
                                <TextField
                                  label=""
                                  value={signupBonus}
                                  onChange={setSignupBonus}
                                  autoComplete="off"
                                  type="number"
                                />
                                <Text as="span" variant="bodyMd" tone="subdued">points</Text>
                                <Badge tone="warning">One-time</Badge>
                              </InlineStack>
                            )}
                          </BlockStack>
                        </InlineStack>
                        <Checkbox
                          label=""
                          checked={signupEnabled}
                          onChange={setSignupEnabled}
                        />
                      </InlineStack>
                    </Box>

                    {/* Birthday Option */}
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <InlineStack align="space-between" gap="400">
                        <InlineStack gap="400" align="start">
                          <Icon source={CalendarIcon} tone="base" />
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd" tone="base">Birthday</Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Annual bonus on customer&apos;s birthday
                            </Text>
                            {birthdayEnabled && (
                              <InlineStack gap="200" align="center">
                                <TextField
                                  label=""
                                  value={birthdayPoints}
                                  onChange={setBirthdayPoints}
                                  autoComplete="off"
                                  type="number"
                                />
                                <Text as="span" variant="bodyMd" tone="subdued">points</Text>
                                <Badge tone="info">Annual</Badge>
                              </InlineStack>
                            )}
                          </BlockStack>
                        </InlineStack>
                        <Checkbox
                          label=""
                          checked={birthdayEnabled}
                          onChange={setBirthdayEnabled}
                        />
                      </InlineStack>
                    </Box>

                    {/* Social Share Option */}
                    <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                      <InlineStack align="space-between" gap="400">
                        <InlineStack gap="400" align="start">
                          <Icon source={ShareIcon} tone="base" />
                          <BlockStack gap="200">
                            <Text as="h3" variant="headingMd" tone="base">Social Share</Text>
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Share products on social media
                            </Text>
                            {socialShareEnabled && (
                              <InlineStack gap="200" align="center">
                                <TextField
                                  label=""
                                  value={socialSharePoints}
                                  onChange={setSocialSharePoints}
                                  autoComplete="off"
                                  type="number"
                                />
                                <Text as="span" variant="bodyMd" tone="subdued">points</Text>
                                <Badge tone="attention">Per Share</Badge>
                              </InlineStack>
                            )}
                          </BlockStack>
                        </InlineStack>
                        <Checkbox
                          label=""
                          checked={socialShareEnabled}
                          onChange={setSocialShareEnabled}
                        />
                      </InlineStack>
                    </Box>
                  </BlockStack>

                  {/* Add Custom Earning Action */}
                  <InlineStack align="center" gap="200">
                    <Icon source={PlusIcon} tone="base" />
                    <Button variant="plain" textAlign="left">
                      Add Custom Earning Action
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </div>

          {/* Redeeming Points Tab */}
          <div id={tabs[1].panelID} hidden={selected !== 1}>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <div>
                    <Text as="h2" variant="headingLg">Redemption Options</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Configure how customers can redeem their loyalty points
                    </Text>
                  </div>
                  <Badge tone="success">4 Rewards</Badge>
                </InlineStack>
                
                <FormLayout>
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="$10 off discount (points required)" 
                      value="1000"
                      autoComplete="off" 
                    />
                    <Badge tone="success">Popular</Badge>
                  </InlineStack>
                  
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="15% off discount (points required)" 
                      value="1500"
                      autoComplete="off" 
                    />
                    <Badge tone="warning">Premium</Badge>
                  </InlineStack>
                  
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="Free shipping (points required)" 
                      value="500"
                      autoComplete="off" 
                    />
                    <Badge tone="info">Basic</Badge>
                  </InlineStack>
                  
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="Free product (points required)" 
                      value="2000"
                      autoComplete="off" 
                    />
                    <Badge tone="attention">Exclusive</Badge>
                  </InlineStack>
                </FormLayout>

                <Button variant="secondary" icon={PlusIcon}>
                  Add New Reward
                </Button>
              </BlockStack>
            </Card>
          </div>

          {/* Program Rules Tab */}
          <div id={tabs[2].panelID} hidden={selected !== 2}>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <div>
                    <Text as="h2" variant="headingLg">Program Rules</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Set up rules and limitations for your loyalty program
                    </Text>
                  </div>
                  <Badge tone="info">2 Rules Active</Badge>
                </InlineStack>
                
                <FormLayout>
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="Points expire after (months)" 
                      value={expirationMonths}
                      onChange={setExpirationMonths}
                      type="number"
                      autoComplete="off" 
                    />
                    <Badge tone="warning">Expiration</Badge>
                  </InlineStack>
                  
                  <InlineStack gap="200" align="center">
                    <TextField 
                      label="Minimum points required for redemption" 
                      value={minimumPoints}
                      onChange={setMinimumPoints}
                      type="number"
                      autoComplete="off" 
                    />
                    <Badge tone="attention">Threshold</Badge>
                  </InlineStack>
                </FormLayout>

                <InlineStack gap="300">
                  <Button variant="primary">Save Rules</Button>
                  <Button variant="secondary">Reset to Defaults</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </div>

          {/* Appearance Tab */}
          <div id={tabs[3].panelID} hidden={selected !== 3}>
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <div>
                    <Text as="h2" variant="headingLg">Appearance & Branding</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Customize how your loyalty program appears to customers
                    </Text>
                  </div>
                  <Badge tone="success">Green & Orange Theme</Badge>
                </InlineStack>
                
                <FormLayout>
                  <TextField 
                    label="Widget primary color" 
                    value="#22c55e"
                    autoComplete="off" 
                    helpText="Current: Green Theme"
                  />
                  <TextField 
                    label="Widget accent color" 
                    value="#fb923c"
                    autoComplete="off" 
                    helpText="Current: Orange Accent"
                  />
                  <TextField 
                    label="Corner radius (px)" 
                    type="number"
                    value="12"
                    autoComplete="off" 
                    helpText="Rounded corners for modern look"
                  />
                </FormLayout>
                
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd" tone="base">Preview</Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      This is how your loyalty widget will appear to customers
                    </Text>
                    <InlineStack gap="200">
                      <Badge tone="success">+10 Points Earned</Badge>
                      <Badge tone="warning">Level Up!</Badge>
                      <Badge tone="info">1,250 Points Available</Badge>
                    </InlineStack>
                  </BlockStack>
                </Box>

                <InlineStack gap="300">
                  <Button variant="primary">Apply Theme</Button>
                  <Button variant="secondary">Preview Live</Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </div>
        </Tabs>
      </Page>
    </AppLayout>
  );
}

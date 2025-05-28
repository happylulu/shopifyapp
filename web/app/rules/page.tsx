"use client";

import { useState, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  DataTable,
  Badge,
  Modal,
  FormLayout,
  TextField,
  Select,
  TextContainer,
  Heading,
  Stack,
  Banner,
  Spinner,
  ButtonGroup,
  Tooltip,
} from "@shopify/polaris";
import { PlusIcon, EditIcon, DeleteIcon, PlayIcon, PauseIcon } from "@shopify/polaris-icons";

interface Rule {
  id: string;
  name: string;
  description?: string;
  event_type: string;
  status: "draft" | "active" | "paused" | "archived";
  priority: number;
  version: number;
  execution_count: number;
  last_executed_at?: string;
  created_at: string;
  conditions: any;
  actions: any[];
}

interface RuleFormData {
  name: string;
  description: string;
  event_type: string;
  priority: number;
  conditions: string;
  actions: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    event_type: "order_created",
    priority: 100,
    conditions: "",
    actions: "",
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const eventTypeOptions = [
    { label: "Order Created", value: "order_created" },
    { label: "Order Paid", value: "order_paid" },
    { label: "Customer Created", value: "customer_created" },
    { label: "Referral Signup", value: "referral_signup" },
    { label: "Product Review", value: "product_review" },
  ];

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/rules");
      const data = await response.json();
      
      if (data.success) {
        setRules(data.data.rules);
      } else {
        setError("Failed to load rules");
      }
    } catch (err) {
      setError("Failed to load rules");
      console.error("Error loading rules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      description: "",
      event_type: "order_created",
      priority: 100,
      conditions: JSON.stringify({
        type: "order_total",
        operator: "greater_than",
        value: 100
      }, null, 2),
      actions: JSON.stringify([{
        type: "points",
        operation: "add",
        amount: 500,
        reason: "Rule-based points award"
      }], null, 2),
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const handleEditRule = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      event_type: rule.event_type,
      priority: rule.priority,
      conditions: JSON.stringify(rule.conditions, null, 2),
      actions: JSON.stringify(rule.actions, null, 2),
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const handleSaveRule = async () => {
    try {
      // Validate JSON
      let conditions, actions;
      try {
        conditions = JSON.parse(formData.conditions);
        actions = JSON.parse(formData.actions);
      } catch (err) {
        setValidationErrors(["Invalid JSON in conditions or actions"]);
        return;
      }

      const ruleData = {
        name: formData.name,
        description: formData.description,
        event_type: formData.event_type,
        priority: formData.priority,
        conditions,
        actions,
      };

      // Validate rule first
      const validateResponse = await fetch("/api/rules/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });
      const validateData = await validateResponse.json();

      if (!validateData.success) {
        setValidationErrors(validateData.data.errors || ["Validation failed"]);
        return;
      }

      // Save rule
      const url = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
      const method = editingRule ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });
      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        loadRules();
      } else {
        setValidationErrors([data.detail || "Failed to save rule"]);
      }
    } catch (err) {
      setValidationErrors(["Failed to save rule"]);
      console.error("Error saving rule:", err);
    }
  };

  const handleToggleRule = async (rule: Rule) => {
    try {
      const action = rule.status === "active" ? "deactivate" : "activate";
      const response = await fetch(`/api/rules/${rule.id}/${action}`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        loadRules();
      }
    } catch (err) {
      console.error("Error toggling rule:", err);
    }
  };

  const handleDeleteRule = async (rule: Rule) => {
    if (confirm(`Are you sure you want to delete "${rule.name}"?`)) {
      try {
        const response = await fetch(`/api/rules/${rule.id}`, {
          method: "DELETE",
        });
        const data = await response.json();

        if (data.success) {
          loadRules();
        }
      } catch (err) {
        console.error("Error deleting rule:", err);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { status: "success" as const, children: "Active" },
      draft: { status: "info" as const, children: "Draft" },
      paused: { status: "warning" as const, children: "Paused" },
      archived: { status: "critical" as const, children: "Archived" },
    };
    return <Badge {...statusMap[status as keyof typeof statusMap]} />;
  };

  const rows = rules.map((rule) => [
    rule.name,
    rule.event_type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    getStatusBadge(rule.status),
    rule.priority,
    rule.execution_count,
    rule.last_executed_at ? new Date(rule.last_executed_at).toLocaleDateString() : "Never",
    <ButtonGroup key={rule.id}>
      <Tooltip content="Edit Rule">
        <Button
          icon={EditIcon}
          onClick={() => handleEditRule(rule)}
          accessibilityLabel="Edit rule"
        />
      </Tooltip>
      <Tooltip content={rule.status === "active" ? "Pause Rule" : "Activate Rule"}>
        <Button
          icon={rule.status === "active" ? PauseIcon : PlayIcon}
          onClick={() => handleToggleRule(rule)}
          accessibilityLabel={rule.status === "active" ? "Pause rule" : "Activate rule"}
        />
      </Tooltip>
      <Tooltip content="Delete Rule">
        <Button
          icon={DeleteIcon}
          onClick={() => handleDeleteRule(rule)}
          destructive
          accessibilityLabel="Delete rule"
        />
      </Tooltip>
    </ButtonGroup>,
  ]);

  if (loading) {
    return (
      <Page title="Rule Engine">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <Spinner size="large" />
                <p>Loading rules...</p>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Rule Engine"
      subtitle="Automate loyalty program actions with custom rules"
      primaryAction={{
        content: "Create Rule",
        icon: PlusIcon,
        onAction: handleCreateRule,
      }}
    >
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical" title="Error">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={["text", "text", "text", "numeric", "numeric", "text", "text"]}
              headings={["Name", "Event Type", "Status", "Priority", "Executions", "Last Run", "Actions"]}
              rows={rows}
              footerContent={`${rules.length} rule${rules.length !== 1 ? "s" : ""}`}
            />
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? "Edit Rule" : "Create Rule"}
        primaryAction={{
          content: "Save",
          onAction: handleSaveRule,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowModal(false),
          },
        ]}
        large
      >
        <Modal.Section>
          {validationErrors.length > 0 && (
            <Banner status="critical" title="Validation Errors">
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Banner>
          )}

          <FormLayout>
            <TextField
              label="Rule Name"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: value })}
              placeholder="e.g., First Order Bonus"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Describe what this rule does"
              multiline={2}
            />

            <Select
              label="Event Type"
              options={eventTypeOptions}
              value={formData.event_type}
              onChange={(value) => setFormData({ ...formData, event_type: value })}
            />

            <TextField
              label="Priority"
              type="number"
              value={formData.priority.toString()}
              onChange={(value) => setFormData({ ...formData, priority: parseInt(value) || 100 })}
              helpText="Lower numbers = higher priority (1-1000)"
            />

            <TextField
              label="Conditions (JSON)"
              value={formData.conditions}
              onChange={(value) => setFormData({ ...formData, conditions: value })}
              multiline={8}
              helpText="Define when this rule should trigger"
            />

            <TextField
              label="Actions (JSON)"
              value={formData.actions}
              onChange={(value) => setFormData({ ...formData, actions: value })}
              multiline={6}
              helpText="Define what actions to take when conditions are met"
            />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

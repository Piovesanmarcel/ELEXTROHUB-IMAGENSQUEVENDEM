---
name: n8n MCP Tools Expert
description: Expert guide for using n8n-mcp MCP tools effectively to manage, create, and debug workflows.
params:
  N8N_API_URL: Link to your n8n instance
  N8N_API_KEY: Your API Key
---

# n8n MCP Tools Expert

This skill helps you navigate and utilize the `n8n-mcp` server tools.

## 📡 Core Tools (Available to everyone)

These tools are essential for researching nodes and templates.

*   **`tools_documentation`**: Start here if you don't know what a tool does.
*   **`search_nodes`**: Find nodes by keyword. Use `source: 'community'` for special nodes.
*   **`get_node`**: Get detailed info about a node's parameters.
    *   `mode: 'search_properties'` helps find specific settings like 'auth'.
*   **`validate_node`**: Check if your node JSON is valid.
*   **`search_templates`**: Find similar workflows to learn from.
*   **`get_template`**: Download a workflow JSON to study.

## 🔧 Management Tools (Requires API Config)

These tools control your n8n instance directly.

### Workflow Management
*   **`n8n_create_workflow`**: Build new flows from scratch.
*   **`n8n_get_workflow`**: Fetch existing flows. Use `mode: 'structure'` for a quick overview.
*   **`n8n_update_partial_workflow`**: precise edits (safer than full update).
*   **`n8n_list_workflows`**: Find workflows by tag or name.
*   **`n8n_autofix_workflow`**: Magic fix for common errors.

### Execution Management
*   **`n8n_test_workflow`**: Trigger a test run (Webhooks, Chat, etc.).
*   **`n8n_executions`**: Check past run logs (`action: 'list'`).

## 💡 Best Practices
1.  **Always Search First**: Before creating a node, use `search_nodes` to find the correct name.
2.  **Validate**: Use `validate_node` before `n8n_update_full_workflow` to avoid breaking things.
3.  **Test Safely**: Use `n8n_test_workflow` instead of waiting for real triggers.

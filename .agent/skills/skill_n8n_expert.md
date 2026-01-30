---
name: n8n Workflow Expert
description: Expert guide for n8n best practices, expressions, and coding patterns.
---

# n8n Workflow Expert

Use this skill to design robust, efficient, and error-free n8n workflows.

## 1. Expression Syntax (`{{ }}`)
*   **Variables**: `$json`, `$node["NodeName"].json`, `$env`.
*   **GOTCHA**: Webhook data is usually under `{{ $json.body }}` key, not top-level.
*   **Dates**: Use `{{ $now }}` and DateTime library.

## 2. Workflow Patterns
Always design using one of the 5 core patterns:
1.  **Webhook Processing**: Receive -> Validate -> Process -> Respond.
2.  **HTTP API Integration**: Auth -> Request -> Pagination Loop.
3.  **Database Sync**: Get Last Sync Time -> Fetch New -> Upsert -> Update Timestamp.
4.  **AI Agent**: Chat Trigger -> Agent Node -> Memory -> Output.
5.  **Scheduled**: Cron Trigger -> Fetch -> Process -> Report.

## 3. Code Nodes (JavaScript vs Python)
*   **JavaScript (Preferred)**:
    *   Fast, native JSON handling.
    *   Use accessors: `$input.all()`, `$input.first()`.
    *   **Return Format**: Must be an array of objects `[{ json: { ... } }]`.
*   **Python**:
    *   Use only when necessary (complex math, specific libs).
    *   **Limitation**: No external pip packages (pandas/numpy) usually available in default image.

## 4. Validation & Errors
*   **Auto-sanitization**: n8n automatically cleans some inputs. Check documentation.
*   **Error Handling**: Always use "Error Trigger" workflow or "Continue On Fail" nodes for critical paths.

## 5. Node Configuration
*   **Dependencies**: Some fields hide others. Use `get_node` tool to see "display options".
*   **AI Agents**: Ensure correct connection type (Memory, Tool, Model) is connected to the right input on the Agent node.

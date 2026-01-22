# MCP Tools Reference

This document details all configured MCP (Model Context Protocol) servers and tools available to Claude Code. Use this as a reference for reinstallation, configuration, and understanding tool capabilities.

**Last Updated:** 2026-01-22
**Config Location:** `~/.claude.json`

---

## Quick Reference: Currently Connected Servers

| Server | Scope | Status | Requires API Key |
|--------|-------|--------|------------------|
| UnityMCP | User (global) | Connected | No |
| Playwright | Local (project) | Connected | No |
| Context7 | Local (project) | Connected | No |
| Firecrawl | Local (project) | Connected | **Yes** |
| Puppeteer | Local (project) | Connected | No |

---

## MCP CLI Commands

```bash
# List all configured servers and their status
claude mcp list

# Get details about a specific server
claude mcp get <server-name>

# Add a new server (stdio)
claude mcp add <name> -- <command> [args...]

# Add with environment variables
claude mcp add <name> -e KEY=value -- <command> [args...]

# Remove a server
claude mcp remove <name>
claude mcp remove <name> -s user    # Remove from user config
claude mcp remove <name> -s local   # Remove from local/project config

# Import from Claude Desktop (Mac only)
claude mcp add-from-claude-desktop
```

---

## 1. UnityMCP

**Purpose:** Interact with Unity Game Engine Editor
**Scope:** User config (available in all projects)
**Source:** Python server via `uv`

### Installation

```bash
# UnityMCP is typically installed via the Unity MCP package
# Server location: /Users/goose/Library/Application Support/UnityMCP/UnityMcpServer/src

# If reinstalling:
claude mcp add UnityMCP -s user -- /opt/homebrew/bin/uv --directory "/Users/goose/Library/Application Support/UnityMCP/UnityMcpServer/src" run server.py
```

### Configuration (in ~/.claude.json)

```json
{
  "mcpServers": {
    "UnityMCP": {
      "type": "stdio",
      "command": "/opt/homebrew/bin/uv",
      "args": [
        "--directory",
        "/Users/goose/Library/Application Support/UnityMCP/UnityMcpServer/src",
        "run",
        "server.py"
      ],
      "env": {}
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `mcp__UnityMCP__manage_editor` | Control Unity Editor state (play/pause/stop, get state, manage tags/layers) |
| `mcp__UnityMCP__manage_scene` | CRUD operations on Unity scenes |
| `mcp__UnityMCP__manage_gameobject` | CRUD operations on GameObjects and components |
| `mcp__UnityMCP__manage_prefabs` | Prefab operations (create, modify, delete) |
| `mcp__UnityMCP__manage_asset` | Asset operations (import, create, modify, delete, search) |
| `mcp__UnityMCP__manage_script` | C# script management (create, read, delete) |
| `mcp__UnityMCP__script_apply_edits` | Structured C# edits (methods/classes) - **preferred for code changes** |
| `mcp__UnityMCP__apply_text_edits` | Raw text edits to C# scripts |
| `mcp__UnityMCP__create_script` | Create new C# scripts |
| `mcp__UnityMCP__delete_script` | Delete C# scripts |
| `mcp__UnityMCP__validate_script` | Validate C# script and return diagnostics |
| `mcp__UnityMCP__manage_shader` | Shader script management |
| `mcp__UnityMCP__read_console` | Get/clear Unity Editor console messages |
| `mcp__UnityMCP__run_tests` | Run Unity tests (EditMode/PlayMode) |
| `mcp__UnityMCP__list_resources` | List project URIs under a folder |
| `mcp__UnityMCP__read_resource` | Read a resource by URI |
| `mcp__UnityMCP__find_in_file` | Search file with regex pattern |
| `mcp__UnityMCP__execute_menu_item` | Execute Unity menu items |
| `mcp__UnityMCP__get_sha` | Get SHA256 and metadata for a script |
| `mcp__UnityMCP__set_active_instance` | Set active Unity instance |
| `mcp__UnityMCP__manage_script_capabilities` | Get script management capabilities |
| `mcp__UnityMCP__debug_request_context` | Debug request context details |

### Usage Notes

- Always check `read_console` after script changes for compilation errors
- Use `script_apply_edits` for structured code changes (safer than raw text edits)
- Poll `editor_state` resource's `isCompiling` field to check domain reload status
- Include Camera and Directional Light when creating new scenes

---

## 2. Playwright

**Purpose:** Browser automation and web testing
**Scope:** Local config (Mikro project) + User config
**NPM Package:** `@playwright/mcp@latest`

### Installation

```bash
# Add to current project
claude mcp add playwright -- npx -y @playwright/mcp@latest

# Add globally (user scope)
claude mcp add playwright -s user -- npx -y @playwright/mcp@latest

# If browser not installed
# Use the browser_install tool or:
npx playwright install chromium
```

### Configuration

```json
{
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"],
    "env": {}
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `mcp__playwright__browser_navigate` | Navigate to a URL |
| `mcp__playwright__browser_navigate_back` | Go back to previous page |
| `mcp__playwright__browser_snapshot` | **Capture accessibility snapshot (preferred over screenshot)** |
| `mcp__playwright__browser_take_screenshot` | Take screenshot of page or element |
| `mcp__playwright__browser_click` | Click on an element |
| `mcp__playwright__browser_type` | Type text into editable element |
| `mcp__playwright__browser_fill_form` | Fill multiple form fields |
| `mcp__playwright__browser_hover` | Hover over element |
| `mcp__playwright__browser_drag` | Drag and drop between elements |
| `mcp__playwright__browser_select_option` | Select dropdown option |
| `mcp__playwright__browser_press_key` | Press keyboard key |
| `mcp__playwright__browser_file_upload` | Upload files |
| `mcp__playwright__browser_evaluate` | Evaluate JavaScript on page |
| `mcp__playwright__browser_run_code` | Run Playwright code snippet |
| `mcp__playwright__browser_tabs` | Manage browser tabs (list, new, close, select) |
| `mcp__playwright__browser_wait_for` | Wait for text/element/time |
| `mcp__playwright__browser_console_messages` | Get console messages |
| `mcp__playwright__browser_network_requests` | Get network requests |
| `mcp__playwright__browser_handle_dialog` | Handle browser dialogs |
| `mcp__playwright__browser_resize` | Resize browser window |
| `mcp__playwright__browser_close` | Close the page |
| `mcp__playwright__browser_install` | Install the browser |

### Usage Notes

- **Use `browser_snapshot` instead of screenshots** - it returns an accessibility tree that's better for understanding page structure
- Elements are referenced by `ref` values from the snapshot
- Always provide `element` (human-readable description) and `ref` (exact reference) for interactions

---

## 3. Context7

**Purpose:** Fetch up-to-date documentation for libraries and frameworks
**Scope:** Local config (Mikro project)
**NPM Package:** `@upstash/context7-mcp`

### Installation

```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp
```

### Configuration

```json
{
  "context7": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"],
    "env": {}
  }
}
```

### Available Tools

Context7 provides tools for fetching documentation:

| Tool | Description |
|------|-------------|
| `resolve-library-id` | Search for a library and get its Context7-compatible ID |
| `get-library-docs` | Fetch documentation for a library using its ID |

### Usage Notes

- Use when you need current documentation for a library (React, Next.js, etc.)
- First resolve the library ID, then fetch docs
- Helpful for getting up-to-date API references beyond training data cutoff

---

## 4. Firecrawl

**Purpose:** Web scraping and crawling with JavaScript rendering
**Scope:** Local config (Mikro project)
**NPM Package:** `firecrawl-mcp`
**Requires:** API Key from https://firecrawl.dev

### Installation

```bash
# With API key
claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-api-key-here -- npx -y firecrawl-mcp
```

### Configuration

```json
{
  "firecrawl": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "firecrawl-mcp"],
    "env": {
      "FIRECRAWL_API_KEY": "fc-5bfc460feef54d04ac6291b216b4ad0d"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `firecrawl_scrape` | Scrape a single URL with JS rendering |
| `firecrawl_map` | Map/discover URLs on a website |
| `firecrawl_crawl` | Crawl multiple pages starting from a URL |
| `firecrawl_batch_scrape` | Batch scrape multiple URLs |
| `firecrawl_search` | Search and scrape results |
| `firecrawl_extract` | Extract structured data from pages |

### Usage Notes

- **Requires API key** - get one at https://firecrawl.dev
- Handles JavaScript-rendered content (unlike simple fetch)
- Good for scraping SPAs and dynamic websites
- Has rate limits based on your plan
- Environment variable: `FIRECRAWL_API_KEY`

### Current API Key

```
FIRECRAWL_API_KEY=fc-5bfc460feef54d04ac6291b216b4ad0d
```

---

## 5. Puppeteer

**Purpose:** Browser automation (alternative to Playwright)
**Scope:** Local config (Mikro project)
**NPM Package:** `@modelcontextprotocol/server-puppeteer`
**Status:** Deprecated (prefer Playwright)

### Installation

```bash
# Add server
claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer

# May need to install globally first if connection fails
npm install -g @modelcontextprotocol/server-puppeteer
```

### Configuration

```json
{
  "puppeteer": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
    "env": {}
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `puppeteer_navigate` | Navigate to URL |
| `puppeteer_screenshot` | Take screenshot |
| `puppeteer_click` | Click element |
| `puppeteer_fill` | Fill input field |
| `puppeteer_select` | Select dropdown option |
| `puppeteer_hover` | Hover over element |
| `puppeteer_evaluate` | Run JavaScript |

### Usage Notes

- **Deprecated** - the official package shows deprecation warnings
- **Prefer Playwright** for browser automation - it's more actively maintained
- Use Puppeteer only if you need specific Puppeteer-only features

---

## When to Use Which Tool

| Task | Recommended Tool |
|------|------------------|
| Web scraping (JS-heavy sites) | Firecrawl |
| Web scraping (simple sites) | WebFetch (built-in) |
| Browser automation/testing | Playwright |
| Form filling, clicking | Playwright |
| Screenshots | Playwright |
| Page accessibility analysis | Playwright (`browser_snapshot`) |
| Library documentation lookup | Context7 |
| Unity Editor interaction | UnityMCP |
| Unity script editing | UnityMCP (`script_apply_edits`) |

---

## Troubleshooting

### Server Won't Connect

1. Check if the package is installed:
   ```bash
   npx -y <package-name> --help
   ```

2. Try installing globally:
   ```bash
   npm install -g <package-name>
   ```

3. Restart Claude Code session after adding servers

### Firecrawl API Key Issues

- Verify key is set: `echo $FIRECRAWL_API_KEY`
- Re-add with correct key:
  ```bash
  claude mcp remove firecrawl
  claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-key -- npx -y firecrawl-mcp
  ```

### Browser Not Installed (Playwright/Puppeteer)

```bash
# For Playwright
npx playwright install chromium

# For Puppeteer (usually auto-installs)
npm install -g puppeteer
```

### Check Server Health

```bash
claude mcp list
```

---

## Configuration File Locations

| File | Purpose |
|------|---------|
| `~/.claude.json` | Main config (user-level servers in `mcpServers`, project configs in `projects`) |
| `~/.claude/settings.json` | Claude Code settings |
| `~/.claude/settings.local.json` | Local permissions |
| Project `.mcp.json` | Project-specific MCP config (alternative to ~/.claude.json) |

---

## Full JSON Config for Mikro Project

The following is the complete MCP configuration for this project (found in `~/.claude.json` under `projects["/Users/goose/Documents/PROJECTS/KAART/Mikro"].mcpServers`):

```json
{
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"],
    "env": {}
  },
  "context7": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"],
    "env": {}
  },
  "firecrawl": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "firecrawl-mcp"],
    "env": {
      "FIRECRAWL_API_KEY": "fc-5bfc460feef54d04ac6291b216b4ad0d"
    }
  },
  "puppeteer": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
    "env": {}
  }
}
```

User-level servers (in `~/.claude.json` under `mcpServers`):

```json
{
  "UnityMCP": {
    "type": "stdio",
    "command": "/opt/homebrew/bin/uv",
    "args": [
      "--directory",
      "/Users/goose/Library/Application Support/UnityMCP/UnityMcpServer/src",
      "run",
      "server.py"
    ],
    "env": {}
  },
  "playwright": {
    "type": "stdio",
    "command": "npx",
    "args": ["-y", "@playwright/mcp@latest"],
    "env": {}
  }
}
```

---

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Playwright MCP](https://www.npmjs.com/package/@playwright/mcp)
- [Firecrawl](https://firecrawl.dev) / [firecrawl-mcp](https://www.npmjs.com/package/firecrawl-mcp)
- [Context7 MCP](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Puppeteer MCP](https://www.npmjs.com/package/@modelcontextprotocol/server-puppeteer)

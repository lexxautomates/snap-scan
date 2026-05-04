# SnapScan `chatgptapp`

MCP server for your ChatGPT App Directory submission.

This package exposes five noauth tools aligned to your `CHATGPT_APP_SPEC.md`:

- `check_eligibility`
- `check_list`
- `get_state_rules`
- `compare_states`
- `list_states`

The server reuses your existing monetized SnapScan REST API (`api/`) for eligibility/search calls, so B2B billing logic stays centralized.

## Why this helps monetization

- Consumer users get free utility in ChatGPT.
- Tool responses can drive traffic to `snapscan.app/pricing`.
- Retailers and POS teams can validate quality in-chat, then upgrade to paid API access.
- You keep one source of truth for state rules and product classification.

## Local run

```bash
cd chatgptapp
cp .env.example .env
npm install
npm start
```

Server endpoints:

- `POST /mcp` (tool execution)
- `GET /healthz` (health check)
- `GET /` (basic metadata)

## No API key yet (works now)

You can run this today without a paid SnapScan API key:

1. Run `api/` in demo mode (do not set Supabase/Stripe secrets yet).
2. Keep `SNAPSCAN_API_KEY=demo_chatgpt_app` in `chatgptapp/.env`.
3. Start both services locally:

```bash
# terminal 1
cd api
cp .env.example .env
npm install
npm start

# terminal 2
cd chatgptapp
cp .env.example .env
npm install
npm start
```

In this mode, your MCP app still works and you can test all tools before billing is live.

## Environment variables

- `PORT` default `9393`
- `HOST` default `0.0.0.0`
- `SNAPSCAN_API_BASE` default `http://localhost:8787`
- `SNAPSCAN_API_KEY` default `demo_chatgpt_app`
- `MCP_RATE_LIMIT_PER_MINUTE` default `60`
- `UPSTREAM_TIMEOUT_MS` default `10000`
- `WEBSITE_URL` default `https://snapscan.app`

## Production notes

- Deploy this package as a separate service (e.g., Railway/Fly/Render) and point `SNAPSCAN_API_BASE` to your deployed `api/`.
- For production, set `SNAPSCAN_API_KEY` to a real key provisioned in your billing backend.
- Keep a public privacy policy and terms page live on `snapscan.app` before submission.

## Deploy to ChatGPT (2026 flow)

There are two tracks:

1. Internal workspace testing (Developer Mode)
2. Public App Directory submission

### 1) Internal testing in ChatGPT

Based on current OpenAI Help Center guidance, MCP developer mode is available in ChatGPT Business and Enterprise/Edu workspaces.

Steps:

1. Deploy `chatgptapp` publicly over HTTPS (example: `https://mcp.snapscan.app/mcp`).
2. In ChatGPT workspace settings, enable Developer Mode (admin/owner permissions).
3. Create a custom app/connector and set MCP endpoint to your `/mcp` URL.
4. Choose noauth for this v1 server.
5. Save as draft and test with prompts:
   - "Is Pepsi SNAP eligible in Florida?"
   - "Compare FL and TX SNAP restrictions"
6. Confirm all 5 tools work in chat.

### 2) Submit to App Directory

Steps:

1. Use a verified OpenAI platform account.
2. Submit app details from the OpenAI app submission page.
3. Include working MCP URL, app metadata, privacy policy, terms, and test cases.
4. After approval email, publish from OpenAI platform dashboard.

OpenAI references:

- Developer mode + MCP apps: https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-apps-in-chatgpt-beta
- App submission process: https://help.openai.com/en/articles/20001040-submitting-apps-to-the-chatgpt-app-directory

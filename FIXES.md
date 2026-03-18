# SHARK-Fin — Critical Fixes Log

## Issue 1: GitHub + Google Dork collectors implemented

**Problem:** Only 2 of 4 OSINT sources were active (Telegram, Paste Site). GitHub collector was a stub, HIBP requires paid subscription.

**Fix:**
- `backend/app/collectors/github.py` — Full implementation using GitHub Code Search API via httpx. Rotates through 6 Indonesian financial data leak queries, fetches raw content (truncated to 2000 chars), SHA-256 dedup, exponential backoff on rate limits.
- `backend/app/collectors/google_dork.py` — New collector using Google Custom Search API (free 100 queries/day). 5 dork queries targeting Indonesian financial data leaks on paste sites and public forums.
- `backend/app/scheduler.py` — Both collectors registered with configurable intervals (GitHub: 30min, Google Dork: 1hr).
- `backend/app/config.py` — Added `GITHUB_POLL_INTERVAL`, `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_ID`, `GOOGLE_DORK_INTERVAL` settings.
- `backend/app/models/threat.py` — Added `GOOGLE_DORK` to `SourceType` enum.
- Frontend updated: Dashboard scanning popover, Landing page, SourceChart, ThreatFeed filter, ThreatDetail labels.

## Issue 2: Raw content replaced with masked content_preview

**Problem:** `raw_content` stored and returned via API — contradicts data protection narrative.

**Fix:**
- `backend/app/models/threat.py` — Added `mask_sensitive()` function (masks credit cards, NIK, passwords) and `content_preview` column.
- `backend/app/scheduler.py` — Applies `mask_sensitive()` before DB storage.
- `backend/app/api/threats.py` — `ThreatResponse` schema returns `content_preview` instead of `raw_content`.
- `backend/app/api/reports.py` — Intel report shows "INDIKATOR TEKNIS" with hash + masked preview + UU PDP data minimization notice.
- `frontend/src/components/ThreatDetail.jsx` — Displays `content_preview` with UU PDP disclaimer.

## Issue 3: X-API-Key authentication added to write endpoints

**Problem:** No auth on operational endpoints — fatal for a cybersecurity hackathon.

**Fix:**
- `backend/app/middleware/auth.py` — `require_api_key` FastAPI dependency validating `X-API-Key` header.
- `backend/app/config.py` — `API_KEYS` setting (default: `sharkfin-demo-key-2026`).
- Protected endpoints: `PATCH /threats/{id}/status`, `GET /threats/{id}/report`, `POST /alerts/webhook/register`, `GET /alerts/webhook/subscriptions`, `DELETE /alerts/webhook/{id}`.
- Public endpoints (no auth): `GET /threats`, `GET /threats/{id}`, `GET /stats/summary`.
- `frontend/src/api/client.js` — Sends `X-API-Key` header on all requests.

## Issue 4: TEST_DATABASE_URL env var for local test runs

**Problem:** Tests hardcode `postgres` hostname, fail outside Docker.

**Fix:**
- `backend/tests/conftest.py` — Reads `TEST_DATABASE_URL` from environment with Docker default as fallback.
- Non-DB tests (`test_patterns.py`, `test_scorer.py`) run without any database connection.

## Issue 5: Webhook registration + dispatch implemented

**Problem:** `/alerts/webhook` was a placeholder returning "registered" with no persistence.

**Fix:**
- `backend/app/models/webhook.py` — `WebhookSubscription` model (url, institution, min_severity, api_key, active).
- `backend/app/api/alerts.py` — Full CRUD: `POST /webhook/register`, `GET /webhook/subscriptions`, `DELETE /webhook/{id}`, all auth-protected.
- `backend/app/services/webhook.py` — `dispatch_webhooks()` function: queries active subscribers, filters by severity, POSTs via httpx with `X-SHARK-Fin-Key` header.

## Issue 6: Frontend bundle split, target <400KB per chunk

**Problem:** Single monolithic JS bundle.

**Fix:**
- `frontend/vite.config.js` — Added `manualChunks` splitting: react-vendor, router, query, charts.
- `frontend/src/App.jsx` — Lazy loading for Landing and Dashboard pages with `React.lazy()` + `Suspense`.
- Loading screen with SHARK-Fin logo as fallback.

## Before/After Metrics

| Metric | Before | After |
|--------|--------|-------|
| Active OSINT sources | 2 | 4 |
| Authenticated endpoints | 0 | 5 |
| Raw content exposed via API | Yes | No (masked) |
| Largest JS chunk | ~695 KB | 382 KB |
| Webhook persistence | None | Full CRUD |
| Tests outside Docker | Fail | Configurable |

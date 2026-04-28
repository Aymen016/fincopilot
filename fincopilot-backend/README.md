---
title: FinCopilot API
emoji: 💰
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 8000
pinned: false
---

# FinCopilot API

FastAPI backend for FinCopilot — AI personal finance manager.

Set the following Space secrets (Settings → Variables and secrets):

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | your Supabase connection string |
| `SECRET_KEY` | any random 32-char string |
| `ALLOWED_ORIGINS` | your Vercel frontend URL |

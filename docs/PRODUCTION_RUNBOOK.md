# Digitalness CRM — Production Operations Runbook

## 1. Global & Domain Emergency Write Locks

In the event of an unexpected external mutation or rate-limit spike:
- **Global Write Lock**: Set `EXTERNAL_WRITES_ENABLED=false` in environment/config. This instantly stops all new outbound social publishing, review replies, WhatsApp dispatches, and ad creations while maintaining read-only dashboards and inbound webhook ingestion.
- **Domain Kill Switches**:
  - `META_WRITES_ENABLED=false` (Halts Instagram & Facebook publishing)
  - `GOOGLE_ADS_WRITES_ENABLED=false` (Halts Google Ads mutations)
  - `WHATSAPP_WRITES_ENABLED=false` (Halts outbound WhatsApp auto-messaging)
  - `GBP_WRITES_ENABLED=false` (Halts GBP local post creation and review replies)
  - `CANVA_WRITES_ENABLED=false` (Halts Canva draft transaction commits)

## 2. Emergency Paid Campaign Pause Procedure

To instantly pause active ad spend across all accounts:
1. Navigate to **Campaign Operations** or trigger `AdsAgent.emergencyPauseAllCampaigns()`.
2. The system executes immediate GAQL / Graph API `PAUSED` mutations on Campaign, AdSet, and Ad levels.
3. Verify that external status is `PAUSED` using read-only GAQL inspection.

## 3. Redis / BullMQ Failure Recovery

If Redis connection drops:
1. The BullMQ worker logs `ioredis reconnecting` and enters exponential backoff retry.
2. In production (`NODE_ENV=production`), fail-closed guards reject external write dispatches with `QUEUE_INFRASTRUCTURE_UNAVAILABLE` rather than silently dropping tasks.
3. Once Redis recovers, delayed jobs in the queue resume automatically without duplicating past dispatches.

## 4. WhatsApp Cloud API Webhook Troubleshooting

- If webhook delivery fails, verify Meta App Dashboard webhook callback URL (`https://your-domain.com/webhook/whatsapp`).
- Ensure `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches the token configured in Meta App settings.
- Check that raw-body HMAC SHA-256 signature verification passes.

## 5. MongoDB Credential Rotation Protocol

1. Create a new database user / password in MongoDB Atlas Console.
2. Update `MONGO_URI` in `Backend/.env` with the new password.
3. Restart the Node application.
4. Verify `MongoDB Atlas: CONNECTED` in server startup logs.
5. Delete the old database user in MongoDB Atlas.

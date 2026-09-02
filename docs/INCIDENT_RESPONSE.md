# Digitalness CRM — Incident Response Protocol

## Incident Classification Matrix

| Severity | Definition | Target Resolution | Immediate Action |
| :--- | :--- | :--- | :--- |
| **SEV1** | Wrong client/account mutation, uncontrolled ad spend, or credential exposure. | < 15 minutes | **Lock global writes (`EXTERNAL_WRITES_ENABLED=false`)** and trigger emergency pause. |
| **SEV2** | Failed emergency pause, duplicate customer messages, or incorrect branch destination. | < 1 hour | Lock domain write switch (`WHATSAPP_WRITES_ENABLED=false`). |
| **SEV3** | Provider API outage, failed scheduled post, or reporting sync lag. | < 4 hours | Flag `DATA_STALE` on dashboards; queue for automatic backoff retry. |
| **SEV4** | Minor UI rendering issue or non-blocking metric display glitch. | Next release | Log ticket in development backlog. |

## 8-Step Emergency Triage Workflow

```
1. STOP DAMAGE     → Engage Global or Domain Write Lock
2. PAUSE SPEND     → Execute Emergency Pause on Ad Campaigns
3. PRESERVE LOGS   → Export server logs, queue metrics, and webhook payloads
4. IDENTIFY SCOPE  → Determine affected tenants (customerId / locationId)
5. MITIGATE        → Deploy hotfix or update connection settings
6. RECOVER         → Reconcile execution jobs and re-enable domain kill switch
7. VERIFY          → Run test_production_certification_suite.js
8. POST-MORTEM     → Log resolution in ProductionIncident model
```

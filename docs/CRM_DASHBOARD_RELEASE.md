# CRM first release: dashboard accuracy and daily actions

## Implemented
- Executive delivery/compliance and health scores preserve zero. Missing values say Unavailable; empty progress bars do not imply perfect performance.
- Removed duplicate /daily-update registration. Existing alternate URLs remain compatible.
- Dashboard source failures display an incomplete-data warning rather than silently implying a complete empty result.
- GET /api/dashboard/actions uses authenticated server-side scope: company administrators, managers with a configured branch, or assigned employee queues. Client access and managers without branches fail closed.
- Follow-ups due today or earlier, delayed work, both approval queues, and overdue invoices. Completed/closed records are excluded. Financial actions are limited to company administrators and branch managers.
- India business-day boundaries; each category has an exact count and the oldest ten records, owner, date, module link, independent failure state, and manual refresh.

## Module status review (route configuration, not production certification)
These routes remain marked Upcoming and require enabling the existing preview mode:
- /auto-reports
- /workflow
- /content-calendar
- /creative-studio
- /scheduler
- /ai-workspace
- /agent-activity
- /ads and /ad-campaigns

Core sales, customer, billing, work, approval and reporting routes are accessible without that guard. This does not establish live service readiness. The preview flag controls visibility; it is not proof of isolated test data or disabled external execution. Keep the existing production certification and activation checks before enabling these modules.

## Validation and rollout
- Run node --test Backend/test_dashboard_actions.js for role/branch isolation, client denial, India midnight/year rollover, zero counts and partial source failures. Tests use model doubles; they do not require or modify a database.
- Build frontend with npm run build in frontend.
- Full frontend type check is currently blocked by a syntax error in the existing src/components/automation/AutomationCenterSkeleton.tsx at line 250.
- Deploy backend and frontend together: the action panel requires the new endpoint.
- Before production acceptance, verify with staff accounts and representative database records: due/overdue boundaries, completed and paid exclusions, scoped totals, both approval queues, owner names, navigation, empty states and failed requests.
- Links open the relevant module list. They do not yet focus an individual record.

## Next
Validate this release in a running environment, then add follow-up escalation and renewal reminders with duplicate-send prevention.

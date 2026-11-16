# Employee client and service permissions

## Assigning access

Sign in as an administrator, open Employees, and select Access on an employee card. Add a row for each client and service, choose the permitted actions, and save. Supported services are Google Ads, Meta Ads, and Social Media. View is required before Edit, Approve, Publish, or Export can be granted. Removing all rows revokes service access. Duplicate client/service rows and unknown actions are rejected.

The editor displays the complete assignment summary. It uses an access version to reject a stale save if another administrator has changed the same employee's permissions. Changes are audited. Grants are read from the database on every API request, so revocation does not depend on logging the employee out or issuing a new token. The UI refreshes its access summary every thirty seconds; the server rejects revoked actions immediately on their next request.

Only administrators can change access, register employees, delete accounts, or reset another user's password. Ordinary profile updates cannot change roles, branch, status, employment/security fields, or grants. Existing administrator/company and manager/branch role access remains broader than employee grants; this editor does not reduce management roles to individual client assignments.

## Employee workspace and rollout

Non-management staff are redirected to My Clients and Services at `/my-services`. This workspace shows only the selected assigned client and service and exposes actions allowed by the saved grant. With no grants, the employee sees an empty assignment message. Employees cannot open the broad administration, billing, company reporting, integration, AI, calendar, or other legacy endpoints to bypass this workspace. The server applies a default-deny endpoint boundary; own profile reading/basic edits, own attendance API, and logout remain permitted.

This is a significant rollout change: every non-management employee needs an assignment before using the new service workspace. Roles such as sales, support, development, or SEO do not yet have dedicated service types or scoped versions of their old modules. Do not deploy this access boundary to those teams until their required service types/workflows have been added or the rollout scope has been agreed. No existing employee grants or production records were changed by the implementation.

Existing work records are classified conservatively using these exact workType values:

| Service | Recognized work types |
|---|---|
| Google Ads | Google Ads, Google Ads Management |
| Meta Ads | Meta Ads, Facebook Ads, Meta Ads Management |
| Social Media | Social Media, Social Media Marketing, Social Media Management, Poster, Reel |

Ambiguous records such as Performance Marketing are excluded rather than exposing another service's work. Administrators must classify those records using an appropriate work type. Ad campaigns are filtered by their explicit Google or Meta platform; Omnichannel campaigns are excluded from single-service access. Social content excludes ad creatives, blogs, Google Business posts, and records targeting Website, Google Business, or Other destinations.

## Actions and limits

View reads selected fields from the assigned service's work, campaigns, or social posts. It does not expose billing records, credentials, unrelated clients, or other services. Lists and exports include at most one thousand records of each type, and the UI states that limit.

Edit allows campaign name, offer, and daily budget; social title/caption; and work title, description, due date, or non-approval progress status. Editing approved content requires approval again. Scheduled/live records require administrator handling. Approval, completion, identifiers, platform, client ownership, and other protected fields cannot be injected through Edit. Updates compare the record's updatedAt timestamp to reject stale saves.

Approve is a separate action and does not publish. Publish requires approval of the current record, and social scheduling also requires approval of the attached creative for the same client. Delegated publishing cannot use the legacy scheduler's automatic approval behavior. Social publishing schedules for a future time and uses the existing queue integration; queue availability is reported by the API. Meta publishing creates paused platform objects and does not activate spending. Google Ads publishing is explicitly unavailable in the current dispatch integration. Work records themselves are not publishable.

Export requires its own permission, rechecks the same client/service boundaries, and produces CSV containing client, service, record type, title, status, and due/scheduled date. CSV cells are quoted and formula-like values are escaped.

Authenticated employee sockets cannot join customer-wide rooms because those streams mix services. Management socket connections require a token, and branch managers can join only customers in their branch. Existing admin frontend sockets now supply the current token. Raw static upload URLs retain the existing hosting policy; this work does not add file-level authorization or revoke copies of previously downloaded content.

## Validation

Run `node --test Backend/test_service_permissions.js Backend/test_renewal_workflow.js Backend/test_ads_workflow_regressions.js Backend/test_client_reports.js` from the repository root. These suites use mocked models/providers and run real Express route handlers in process. They do not contact external providers or write a live database. They cover client/service isolation, independent actions, export safety, stale saves, revocation, self-escalation, current-token authorization, socket restrictions, delegated approval rules, and regressions in reporting, expiry, and Meta dispatch.

Run `npx tsc --noEmit`, `node --test test_client_reports.cjs`, and `npm run build` from frontend. Before production sign-off, verify persistence and real browser interactions with an isolated administrator and a test employee assigned only Google Ads for one client. Confirm direct URLs, API requests, export, revocation, and all applicable actions. No deployment, live access changes, advertising dispatch, or publishing was performed during implementation.

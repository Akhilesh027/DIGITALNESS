# AI workspace review — 3 November 2026

## Fixed in this pass
- Workspace requests and client loading use the configured API; removed hardcoded localhost requests and sample client fallback.
- Conversation reads, deletion and turn processing enforce authenticated ownership. Client accounts cannot use these conversation endpoints. Command sessions are scoped to their conversation; revision lookup is scoped to its requesting user.
- Account-specific chat IDs/storage prevent agency/client threads colliding across users. Old shared IDs are retained in existing data, not migrated or deleted.
- Chat request errors propagate to the UI. Switching context clears the previous transcript and ignores stale history responses; chat switching is blocked during active operations.
- Scheduling confirms success only when the server returns a saved job. Missing jobs and invalid/past dates fail explicitly. Default scheduling uses India time. Updates check creator/branch access, preserve terminal/processing jobs, and mark mixed payload changes for persistence.
- Calendar persistence failure no longer silently produces a completion response. Partial records may remain because this multi-record operation is not transactional yet.
- Unsupported floating-copilot intake_skip now sends intake_answer with isSkip.
- Closed the automation skeleton's missing JSX condition and restored its missing toast import. Corrected policy name rendering and AI UI payload types.
- Provider status now describes configuration, not verified readiness; text provider order matches the actual implementation.
- The old image revision handler did not edit an image: it changed copy text, referenced the wrong output shape and returned completion. It now preserves the original creative and explicitly reports that image revision is not connected. Real image revision remains to be implemented.

## Validation
- Seven offline regression tests pass: conversation ownership, client denial, status propagation, missing schedule failure, invalid/past schedule dates, service-level ownership and preservation of assets on unsupported revision.
- Frontend production build passes. Existing bundle size/import warnings remain.
- TypeScript check now passes the AI workspace/components changed here; the full project still reports errors in inbox, marketing connections, approvals and other existing pages.
- No provider calls, publishing, messaging, production database mutations or deployment were performed. Browser visual QA and live integrated tests remain.

## Next priorities before AI production acceptance
1. Verify role and branch permissions throughout commands, entity search, agent runs and automation endpoints, not only conversation ownership. The central AI router uses authentication; a complete per-action authorization audit is still required.
2. Implement real image revisions with version history and original-asset preservation.
3. Exercise text generation with configured providers and one authorized draft image; verify provider failure reporting, image provenance and output validation. Configuration alone does not establish provider availability.
4. Make creative/content/job persistence transactional or idempotent so retries cannot create partial or duplicate records.
5. Test scheduling against the real persistent worker queue, including rescheduling an already queued job and enforcing publishing approvals at dispatch.
6. Review automatic pilot-customer creation, fallback contact details, default-client selection and deterministic campaign/task branches in the conversation service before allowing unrestricted agency commands.
7. Keep preview modules labelled Upcoming until these journeys have been validated with real staff accounts and scoped client data.

## Follow-up feature check
- Added a staff gate to the AI router and requester checks to run/command routes. Company administrators retain oversight; other staff histories list their own records. Service-level and branch/entity authorization still require a wider audit.
- Structured Pollinations results accept nonempty JSON objects for general CRM tasks. Fallback prompts preserve the requested schema instead of substituting poster requirements. This checks the JSON envelope, not the full task schema.
- Fixed inbox WhatsApp API arguments, approved template names/languages, customer template filtering, and approval submission wording. Normalized inbox/WhatsApp roots to avoid duplicate /api segments.
- Fixed the missing Google Business OAuth import and undefined location variable.
- All 17 offline regressions passed, including four new access/provider tests. Backend route/controller syntax checks passed. Frontend build and TypeScript results are reported separately; full project typing still has existing errors.
- Production acceptance remains open: live providers, real image revisions, isolated database workflows, queue retries, branch-scoped automation permissions and browser journeys are not certified. No deployment or live external actions were performed.

## Meta asset discovery follow-up
- Corrected the callback destination to the configured frontend customer onboarding route; returning discovery sessions open step 8 automatically.
- Discovery now detects HTTP/Graph errors, follows cursor pagination, uses Authorization headers, and preserves successful Pages/ad results when the other lookup fails. Failed lookups are stored as explicit warnings, distinct from successful empty results.
- Empty discovery results show access/permission guidance and a reconnect action. Customers with no branch locations see an explanation. Empty selections cannot be saved or reported as connected.
- Eight offline discovery/redirect regression tests pass. Browser verification confirmed the empty state and disabled save button; Facebook Edit settings was opened for the user to review asset access. No asset grants or account connections were submitted.
- Live diagnostic against the configured database timed out. The exact granted permissions and cause of the user's empty session remain unverified; reconnecting after reviewing Facebook asset selection is required for fresh evidence.

Live Meta follow-up: required scopes were granted; /me/accounts returned zero Pages. The ad-account request failed with Meta code 100 because the optional business field requires business_management. Removed that field; corrected live discovery returned one ad account. Refreshed only the active temporary discovery session and verified Akhilesh Reddy (INR) appears in the CRM dropdown. No connection was saved. Nine discovery/redirect tests pass.

Page/Instagram recovery: live /me/accounts returned zero, but the managed Facebook Page Akhileshreddy.k was readable directly and linked to @akhilesh_reddy.dev. Added numeric Page ID lookup using the owner's unexpired discovery session and existing Meta token; Page credentials remain encrypted and are omitted from API output. Browser lookup recovered and selected both accounts for review without saving connections. Fixed HTTP req.client socket misclassification in staff access checks. Thirty targeted regressions and frontend production build pass.

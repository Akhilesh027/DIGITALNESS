# Ads workspace review — 3 November 2026

## Implemented
- Ads routes open the real workspace without a demo unlock. Added campaign search, customer filters, errors/retry, independent auxiliary loading, and customer-bound connected-account selection.
- Validated draft customers, budget and duration. Invalid AI blueprints fail explicitly. Removed sample account IDs and invented contact/discount/performance defaults from changed flows. Manual creation exposes its objective.
- Ads APIs require authentication and administrator/branch-manager access; managers are scoped to branch customers. Edits use an allowlist and schema validation and invalidate approval. Creative linking checks the owning customer and attaches its current image.
- Approval does not create or activate platform ads. Read-only preflight checks saved setup without platform writes.
- Replaced the legacy fake-success dispatcher. Meta creation requires the customer's real MetaAds connection, required scope, connected Page, valid account settings, supported image/objective, destination, lead form where needed, targeting and budget checks.
- Campaign, creative, ad-set and ad IDs are recorded after confirmed responses. Objects start PAUSED, budget weights sum exactly to the selected daily amount, dates are anchored across retries, and recorded checkpoints are reused. Atomic operation locks prevent overlapping operations. Ambiguous network results block automatic retry for reconciliation.
- Activation requires a budget confirmation in the product. Pause/activate call Meta. Failed activation attempts pause the parent where possible; unknown delivery status is reported. The schema now persists platform IDs, errors, locks, metrics and sync/delivery state. Dispatch inserts no invented metrics.
- Performance review calls the existing evidence evaluator on scoped campaigns, reporting missing/insufficient data and failures instead of claiming always-on optimization.

## Verification
- 41 offline regression tests pass, including 11 Ads tests covering validation, protected fields, budget totals, approval/connection requirements, paused creation with mocked provider responses, retries, failures, activation rollback, platform and branch isolation, schema persistence, and non-mutating preflight.
- Frontend production build passes; existing bundle/import/browser-data warnings remain. The completed full TypeScript check had no Ads errors but still reported existing errors in unrelated pages.
- Browser checks covered direct access, data loading/retry, customer selection, and AI/manual controls. No external campaign was created or activated; no ad spend was authorized.

## Remaining acceptance work
- Real Meta creation and delivery have not been exercised. API versions, geographical IDs, account-specific objectives, lead forms, placements and eligibility require live-account acceptance.
- Google and Omnichannel execution remain planning drafts in this workspace. Separate Google execution/approval services need integration and account acceptance here.
- This Meta path supports single-image lead and traffic execution. Broader draft objectives and media formats fail preflight explicitly.
- External AI image URLs are previews, not evidence that an asset is rendered or policy approved. Review or attach finished creative before publication.
- Performance review consumes existing snapshots; scheduled insights synchronization is outside this change.
- A crash between an external write and its database checkpoint requires reconciliation. Locks are not automatically expired; investigate before clearing them to avoid duplicates.
- Full real-account browser journeys and deployment remain open. Unrelated TypeScript errors remain.

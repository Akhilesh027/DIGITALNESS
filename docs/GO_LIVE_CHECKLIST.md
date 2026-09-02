# Digitalness CRM — Go-Live Pre-Deployment Checklist

## 1. Security & Credentials
- [ ] MongoDB Atlas database password rotated and `.env` updated.
- [ ] No raw credentials or secret tokens present in source code or client bundles.
- [ ] AES-256 vault encryption key configured for marketing connection tokens.
- [ ] Public HTTPS webhook endpoints active with HMAC signature verification.

## 2. Infrastructure & Persistence
- [ ] Redis cluster / instance active (`QUEUE_MODE=REDIS`).
- [ ] BullMQ workers operational with job retry and persistence across process restarts.
- [ ] Database indexes created with zero Mongoose duplicate index warnings.

## 3. Governance & Invariant Guards
- [ ] $R1$ Creative Commit approval required for Canva revisions.
- [ ] $R2$ Social & GBP publishing approval required before any external post dispatch.
- [ ] $R3$ Financial spend approval required for Meta Ads and Google Ads.
- [ ] Google Ads Production Activation Lock enforced (`GOOGLE_ADS_REAL_ACTIVATION_ENABLED=false`).
- [ ] Tenant & Branch isolation verified (cross-client mutations blocked).

## 4. Certification & Rollout
- [ ] All mandatory pilot certification gates marked `PASS` in `ProductionCertification`.
- [ ] Client execution map verified with explicit customer confirmation.
- [ ] Authorized Admin / Owner final go-live sign-off completed.

# Customer renewal and portal expiry

## Confirmed policy

The Service End Date is a calendar date. Clients retain access throughout that date and three additional full days in Asia/Kolkata. Access stops at midnight IST after the third grace day. For example, 30 November expires into a grace period on 1 December and access stops on 4 December at 00:00 IST, which is 3 December at 18:30 UTC.

An expiry hold restricts client portal APIs and the client interface only. Internal staff remain authorized under their existing permissions and servicesSuspended remains false. Accounts without an expiry are not automatically held. This is the global agreed expiry policy for all dated accounts; the legacy per-customer autoHoldOnExpiry flag is not an opt-out.

## Save and renew

An administrator or manager in the customer's branch chooses Service End Date in Recharge. The screen previews the expiry and exact access cutoff. Saving a past date requires acknowledgement. The server validates the date and amount, persists the date, increments the renewal revision, and replaces pending reminders for the previous revision. Customers and ordinary employees cannot use renewal management endpoints.

Renewal restores only EXPIRY holds when the new date is still active or within grace. Manual and payment holds remain for separate review. Payment verification alone does not extend service dates and cannot clear expiry or manual holds. An expired account is held again on the next protected request even if someone explicitly unlocks it without renewing its date.

Saved expiry appears on customer cards, profiles, exports, and Recharge. Missing amounts display Not set. Existing legitimate zero-valued retainers remain zero; historical defaults cannot reliably distinguish an unset amount from an intentional zero.

## Reminders and delivery

WhatsApp and email reminders are scheduled for 09:00 IST seven days before, three days before, and on the expiry date. The time of day is an implementation default; the user selected the channels and day offsets. Past reminder days are recorded as Cancelled rather than sending an outdated burst. Reminders still due today can send after creation or restart. The next background pass retries scheduling if a save succeeded but scheduling failed.

Renewal Notices shows Scheduled, Sending, Sent, Delivered, Read, Failed, Cancelled, or Unknown. Sent means the provider accepted the message, not that the recipient read it. WhatsApp delivery/read/failure webhooks update the status. SMTP email acceptance is shown as Sent; there is no email delivery/read tracking integration.

Failed notices for the current renewal can be retried. Unknown means the request may have reached the provider before a timeout or process interruption; it must be checked with the provider before any manual resend. There is no automatic resend of Unknown messages. A notice already submitted to a provider cannot be recalled if the expiry changes at the same instant.

The background process starts after MongoDB connects, runs immediately and every minute, and claims notices atomically. A compound unique index prevents duplicate schedule records. Expiry is also checked on each authenticated client request and at login, so access enforcement does not rely on the timer being punctual. The client refreshes its account profile periodically to update the hold screen. Keep the backend running continuously; scheduled messages cannot send while it is offline.

## Sender configuration

Email uses MAIL_HOST, MAIL_PORT, MAIL_FROM, MAIL_USER, and MAIL_PASS. Existing local email settings were found, but no live send was attempted or validated.

WhatsApp uses an agency-owned sender, separate from customers' lead-messaging accounts:

- RENEWAL_WHATSAPP_ACCESS_TOKEN
- RENEWAL_WHATSAPP_PHONE_NUMBER_ID
- RENEWAL_WHATSAPP_TEMPLATE
- RENEWAL_WHATSAPP_LANGUAGE, optional, defaults to en_US

The approved template needs three body text parameters in this order: customer name, expiry date in YYYY-MM-DD, and portal cutoff date/time in IST. Customer contact numbers must include country code, for example 919876543210. Configure the existing signed WhatsApp webhook for this sender to receive delivery updates. Mock/test placeholder credentials are rejected for renewal sends.

The three required RENEWAL_WHATSAPP settings were missing in the local backend configuration at implementation time. Until a real agency sender and approved template are configured, WhatsApp notices will show Failed with a setup error. Credentials must be configured securely in the deployment environment, not committed to source.

## Verification

Run node --test test_renewal_workflow.js test_client_reports.js from Backend. Tests use mocked models and providers; they do not write customer records or send messages. They cover IST boundaries across host timezones, all six scheduled reminders, manual-hold preservation, portal-only enforcement, date replacement, provider failures and uncertainty, retry restrictions, renewal restoration, date validation, and active-session restrictions.

Run npx tsc --noEmit and npm run build from frontend, and npm run build from client-web. Before production sign-off, use an isolated customer to verify database save/reopen, actual sender acceptance and webhook delivery, access through the grace boundary, renewal restoration, and persistence after a server restart. No production deployment or live notice send is part of these local checks.

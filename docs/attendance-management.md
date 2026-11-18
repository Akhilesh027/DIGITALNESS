# Manual attendance

Employees open **Attendance & profile** in their workspace. Administrators and managers open **Attendance**; their own clock is under **My attendance**.

- Check in at the start of work. One work session is allowed per check-in date.
- Use Start break and End break during the day. Break time is excluded from net working hours.
- Check out at the end of work. Checking out during a break also ends that break.
- Login, logout and closing the browser do not start or stop attendance. Attendance hours and task hours are independent.
- Overnight sessions retain their original check-in date. An open session over 18 hours is flagged for missed checkout. Sessions over 24 hours must be resolved through a correction request rather than recording an excessive checkout time.

## Corrections

An employee can request a missing attendance record or corrected times from monthly history. Enter the actual start/end in IST, total break minutes and a reason. Shifts must be completed, no longer than 24 hours, and have positive net working time.

Attendance remains unchanged until another administrator or the appropriate branch manager approves. Self-approval is prohibited. A reviewer must provide a note. Rejection leaves attendance unchanged; the employee can withdraw a pending request. A stale request must be rejected/withdrawn and resubmitted with current times.

Approvals retain before/after snapshots, employee reason, reviewer, review note and timestamps. Interrupted approval finalization can be retried by the approving reviewer without applying the correction twice. Admins see pending and reviewed requests. The per-record Audit view shows clock events and approved changes.

## Existing records and scope

Existing automatic login/logout attendance remains labelled Legacy. An explicit check-in on a date with a legacy record retains the original times and status in `legacySnapshot` and records the transition in the audit. Other past records are unchanged.

Employees can access only their own attendance and requests. Branch managers see records and requests within their branch; company administrators see company attendance. Historical rows for former employees are retained in the monitor.

Shift schedules, grace periods, late/half-day rules, leave, holidays and payroll/monthly exports are not part of this phase. Missing records are shown as **Not checked in**, without assuming absence or leave. Manual clock entries use Present rather than inventing late/half-day rules.

## Verification

From `Backend`: `node --test test_manual_attendance.js test_service_permissions.js`.

From `frontend`: `npm run build`.

Route tests use in-memory model stubs and do not create live attendance punches or approve real requests.

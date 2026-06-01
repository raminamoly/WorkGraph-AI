# WorkGraph AI - API Design

This document defines the first API design for WorkGraph AI.

The goal is to guide Codex when generating the ASP.NET Core Web API.

The API should support:

```text
Multi-tenancy
RBAC
Windows Agent communication
Monitoring sessions
Screenshot/activity ingestion
Manager dashboard
Employee transparency portal
Billing and usage metering
Audit and compliance
Privacy and retention settings
Multi-language/multi-region tenants
```

---

## API Design Principles

1. Keep the API simple for MVP.
2. Do not expose TenantId in normal tenant user routes.
3. Resolve TenantId from authentication/device context.
4. Use versioned routes.
5. Use neutral, non-spyware naming.
6. Validate authorization in the server, not only the UI.
7. Audit sensitive data access.
8. Meter billable operations.
9. Prefer summaries over raw screenshots.
10. Keep request/response DTOs separate from domain entities.

---

## Base Route

Use versioned API routes:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/agent/devices/register
/api/v1/monitoring/sessions
/api/v1/activity/snapshots
/api/v1/dashboard/team/{teamId}
```

---

## API Naming Rules

Use these words:

```text
monitoring-session
activity-snapshot
workforce-insight
dashboard
analysis
summary
audit-log
privacy-rule
retention-policy
```

Avoid these words:

```text
spy
stealth
watcher
screenlogger
surveillance
keylogger
```

---

## Authentication Types

The API has two main authentication types.

### 1. User Authentication

Used by:

```text
Owner
Admin
Manager
Auditor
Employee
```

Recommended MVP:

```text
JWT access token
Refresh token
```

Later:

```text
SSO / OIDC / SAML
Microsoft Entra ID
Google Workspace
```

---

### 2. Agent Device Authentication

Used by:

```text
Windows Agent
```

The Agent should not use a human username/password.

Recommended flow:

```text
Device registration
Admin approval
Device credential
Short-lived upload token
```

---

## Tenant Resolution

Do not trust TenantId from request body for normal APIs.

Tenant should be resolved from:

```text
User token claim
Device credential claim
Tenant subdomain later
Validated tenant header for internal/admin use only
```

---

## Standard Response Shape

For simple successful responses:

```json
{
  "data": {},
  "requestId": "trace-id"
}
```

For list responses:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 50,
  "totalCount": 100,
  "requestId": "trace-id"
}
```

For errors:

```json
{
  "error": {
    "code": "validation_error",
    "message": "One or more validation errors occurred.",
    "details": []
  },
  "requestId": "trace-id"
}
```

---

## Common HTTP Status Codes

```text
200 OK
201 Created
202 Accepted
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

Use:

```text
202 Accepted
```

for async work such as premium AI analysis, report export, or long-running jobs.

---

# API Groups

Recommended API groups:

```text
Auth
Tenancy
Users & Roles
Teams & Employees
Agent Devices
Monitoring Policies
Monitoring Sessions
Activity Ingestion
Analysis & Summaries
Dashboard
Employee Portal
Billing & Usage
Audit & Compliance
Privacy & Retention
Localization
```

---

# 1. Auth APIs

## Login

```text
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "manager@company.com",
  "password": "password"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "refresh-token",
  "expiresAtUtc": "2026-06-01T12:00:00Z",
  "user": {
    "id": "user-id",
    "fullName": "Manager Name",
    "email": "manager@company.com",
    "roles": ["Manager"],
    "language": "en-US"
  }
}
```

---

## Refresh Token

```text
POST /api/v1/auth/refresh
```

---

## Logout

```text
POST /api/v1/auth/logout
```

---

## Current User

```text
GET /api/v1/auth/me
```

Returns current user, roles, tenant settings, language, and permissions.

---

# 2. Tenant APIs

Normal tenant users should not pass TenantId in routes.

## Get Tenant Settings

```text
GET /api/v1/tenant/settings
```

Response includes:

```text
Tenant name
Region code
Default language
Allowed languages
Compliance mode
Employee portal enabled
Default retention policy
Default monitoring policy
```

---

## Update Tenant Settings

```text
PUT /api/v1/tenant/settings
```

Allowed roles:

```text
Owner
Admin
```

---

# 3. User and Role APIs

## List Users

```text
GET /api/v1/users
```

Query parameters:

```text
role
status
search
page
pageSize
```

---

## Invite User

```text
POST /api/v1/users/invitations
```

Request:

```json
{
  "email": "admin@company.com",
  "fullName": "Admin Name",
  "roles": ["Admin"],
  "language": "en-US"
}
```

---

## Assign Role

```text
POST /api/v1/users/{userId}/roles
```

Request:

```json
{
  "role": "Manager"
}
```

---

## Disable User

```text
POST /api/v1/users/{userId}/disable
```

---

# 4. Team and Employee APIs

## List Teams

```text
GET /api/v1/teams
```

---

## Create Team

```text
POST /api/v1/teams
```

Request:

```json
{
  "name": "Support Team",
  "managerUserId": "user-id"
}
```

---

## List Employees

```text
GET /api/v1/employees
```

Query parameters:

```text
teamId
status
search
page
pageSize
```

---

## Create Employee Profile

```text
POST /api/v1/employees
```

Request:

```json
{
  "displayName": "Employee Name",
  "workEmail": "employee@company.com",
  "jobTitle": "Support Agent",
  "teamId": "team-id",
  "userId": null
}
```

---

## Get Employee Details

```text
GET /api/v1/employees/{employeeId}
```

---

## Assign Employee to Team

```text
POST /api/v1/employees/{employeeId}/team
```

Request:

```json
{
  "teamId": "team-id"
}
```

---

# 5. Agent Device APIs

## Register Agent Device

Used by Windows Agent.

```text
POST /api/v1/agent/devices/register
```

Request:

```json
{
  "registrationCode": "optional-registration-code",
  "deviceName": "DESKTOP-123",
  "deviceFingerprintHash": "hash",
  "agentVersion": "1.0.0",
  "employeeWorkEmail": "employee@company.com"
}
```

Response:

```json
{
  "deviceId": "device-id",
  "status": "PendingApproval",
  "message": "Device registration submitted for approval."
}
```

---

## Approve Agent Device

Used by Admin.

```text
POST /api/v1/agent/devices/{deviceId}/approve
```

---

## Revoke Agent Device

```text
POST /api/v1/agent/devices/{deviceId}/revoke
```

Request:

```json
{
  "reason": "Device replaced"
}
```

---

## Agent Heartbeat

Used by Windows Agent.

```text
POST /api/v1/agent/heartbeat
```

Request:

```json
{
  "deviceId": "device-id",
  "agentVersion": "1.0.0",
  "status": "Healthy",
  "message": null
}
```

Response:

```json
{
  "serverTimeUtc": "2026-06-01T10:00:00Z",
  "deviceStatus": "Active"
}
```

---

## Get Agent Configuration

Used by Windows Agent.

```text
GET /api/v1/agent/configuration
```

Response:

```json
{
  "deviceId": "device-id",
  "activeSession": {
    "sessionId": "session-id",
    "captureMode": "Standard",
    "screenshotIntervalSeconds": 180,
    "allowBrowserDomainCapture": true,
    "enablePrivacyMasking": true
  },
  "privacyRules": [],
  "language": "en-US"
}
```

If no active session:

```json
{
  "activeSession": null,
  "message": "No active monitoring session."
}
```

---

# 6. Monitoring Policy APIs

## List Monitoring Policies

```text
GET /api/v1/monitoring/policies
```

---

## Create Monitoring Policy

```text
POST /api/v1/monitoring/policies
```

Request:

```json
{
  "name": "Standard Remote Work Review",
  "description": "Standard session-based monitoring policy.",
  "defaultCaptureMode": "Standard",
  "screenshotIntervalSeconds": 180,
  "allowBrowserDomainCapture": true,
  "enablePrivacyMasking": true,
  "requireEmployeeConsent": true,
  "requireManagerJustification": true,
  "maxSessionDurationMinutes": 480
}
```

---

## Update Monitoring Policy

```text
PUT /api/v1/monitoring/policies/{policyId}
```

---

# 7. Monitoring Session APIs

## Request Monitoring Session

```text
POST /api/v1/monitoring/sessions
```

Request:

```json
{
  "employeeProfileId": "employee-id",
  "agentDeviceId": "device-id",
  "monitoringPolicyId": "policy-id",
  "justification": "Temporary quality review for customer delivery.",
  "requestedStartAtUtc": "2026-06-01T09:00:00Z",
  "requestedEndAtUtc": "2026-06-01T13:00:00Z"
}
```

Response:

```json
{
  "sessionId": "session-id",
  "status": "AwaitingConsent",
  "message": "Monitoring session requested. Waiting for consent."
}
```

---

## Start Monitoring Session

```text
POST /api/v1/monitoring/sessions/{sessionId}/start
```

Allowed when:

```text
Session is Approved
Consent/authorization requirement is satisfied
Manager has access to employee
Device is Active
```

---

## Pause Monitoring Session

```text
POST /api/v1/monitoring/sessions/{sessionId}/pause
```

---

## Stop Monitoring Session

```text
POST /api/v1/monitoring/sessions/{sessionId}/stop
```

---

## Get Session Details

```text
GET /api/v1/monitoring/sessions/{sessionId}
```

---

## List Sessions

```text
GET /api/v1/monitoring/sessions
```

Query parameters:

```text
employeeId
teamId
status
fromUtc
toUtc
page
pageSize
```

---

# 8. Employee Consent APIs

## Submit Consent Decision

Used by Employee Portal.

```text
POST /api/v1/employee/monitoring/sessions/{sessionId}/consent
```

Request:

```json
{
  "decision": "Accepted",
  "employeeNote": "Acknowledged."
}
```

Possible decisions:

```text
Accepted
Declined
Revoked
```

---

# 9. Activity Ingestion APIs

These APIs are used by Windows Agent.

## Upload Activity Snapshot

```text
POST /api/v1/activity/snapshots
```

Request:

```json
{
  "deviceId": "device-id",
  "monitoringSessionId": "session-id",
  "capturedAtUtc": "2026-06-01T10:15:00Z",
  "clientSequenceNumber": 12345,
  "activeWindowTitle": "WorkGraph.Api - MonitoringSessionCommandHandler.cs",
  "processName": "devenv.exe",
  "applicationName": "Visual Studio",
  "browserDomain": null,
  "activityState": "Active",
  "captureTrigger": "Interval"
}
```

Response:

```json
{
  "activitySnapshotId": "snapshot-id",
  "accepted": true,
  "serverReceivedAtUtc": "2026-06-01T10:15:02Z"
}
```

Server must validate:

```text
Tenant
Device
Employee
Session
Session active at CapturedAtUtc
Capture mode
Privacy policy
Idempotency
```

---

## Upload Screenshot

MVP simple upload:

```text
POST /api/v1/activity/snapshots/{snapshotId}/screenshot
```

Content type:

```text
multipart/form-data
```

Fields:

```text
file
contentHash
perceptualHash
format
width
height
isBlurred
isSensitive
```

Response:

```json
{
  "screenshotAssetId": "screenshot-id",
  "accepted": true,
  "isDuplicate": false
}
```

Later enterprise option:

```text
POST /api/v1/activity/snapshots/{snapshotId}/screenshot/upload-url
```

returns short-lived pre-signed upload URL.

---

# 10. Analysis APIs

## Get Activity Analysis

```text
GET /api/v1/activity/snapshots/{snapshotId}/analysis
```

---

## Request Deep Analysis

```text
POST /api/v1/analysis/deep
```

Request:

```json
{
  "scopeType": "MonitoringSession",
  "scopeId": "session-id",
  "reason": "Manager requested deeper review for anomaly explanation."
}
```

Response:

```json
{
  "analysisJobId": "job-id",
  "status": "Queued"
}
```

This should return:

```text
202 Accepted
```

---

# 11. Dashboard APIs

## Get Team Dashboard

```text
GET /api/v1/dashboard/teams/{teamId}
```

Query parameters:

```text
workDate
fromUtc
toUtc
```

Response includes:

```text
Team focus trend
Work category breakdown
Software usage breakdown
Idle/activity timeline
Context switching trend
Daily summaries
Anomaly alerts
Usage summary
```

---

## Get Employee Timeline

```text
GET /api/v1/dashboard/employees/{employeeId}/timeline
```

Query parameters:

```text
workDate
fromUtc
toUtc
```

Response includes:

```text
Time blocks
Dominant work category
Focus score
Context switching score
Idle percentage
Potential non-work percentage
Summary
```

---

## Get Software Usage Breakdown

```text
GET /api/v1/dashboard/employees/{employeeId}/software-usage
```

---

## Get Daily Employee Summary

```text
GET /api/v1/dashboard/employees/{employeeId}/daily-summary
```

Query parameters:

```text
workDate
```

---

# 12. Screenshot Access APIs

Raw screenshot access is sensitive.

## Request Screenshot View

```text
POST /api/v1/screenshots/{screenshotAssetId}/view-request
```

Request:

```json
{
  "reason": "Reviewing activity flagged in daily summary."
}
```

Response:

```json
{
  "screenshotAssetId": "screenshot-id",
  "accessUrl": "short-lived-signed-url-or-proxy-url",
  "expiresAtUtc": "2026-06-01T10:20:00Z",
  "isBlurred": false,
  "isSensitive": false
}
```

Rules:

```text
Validate RBAC
Validate manager scope
Validate retention
Write audit log before access
Use short-lived access URL or secure streaming
Do not expose object storage key
```

---

# 13. Employee Portal APIs

## Get My Monitoring Status

```text
GET /api/v1/employee/me/monitoring-status
```

Response:

```json
{
  "isMonitoringActive": true,
  "activeSession": {
    "sessionId": "session-id",
    "startedAtUtc": "2026-06-01T09:00:00Z",
    "justification": "Temporary quality review",
    "captureMode": "Standard"
  }
}
```

---

## Get My Session History

```text
GET /api/v1/employee/me/monitoring-sessions
```

---

## Get My Collected Data Summary

```text
GET /api/v1/employee/me/collected-data-summary
```

---

## Get My Data Access History

```text
GET /api/v1/employee/me/access-history
```

---

## Report Privacy Concern

```text
POST /api/v1/employee/me/privacy-concerns
```

Request:

```json
{
  "relatedSessionId": "session-id",
  "message": "A personal page may have been captured."
}
```

---

# 14. Billing and Usage APIs

## Get Billing Balance

```text
GET /api/v1/billing/balance
```

---

## Get Usage Report

```text
GET /api/v1/billing/usage
```

Query parameters:

```text
fromUtc
toUtc
usageEventType
page
pageSize
```

---

## Add Credits

```text
POST /api/v1/billing/credits
```

Allowed roles:

```text
Owner
```

Request:

```json
{
  "packageCode": "Business-100k",
  "paymentReference": "payment-id"
}
```

---

# 15. Audit and Compliance APIs

## Get Audit Logs

```text
GET /api/v1/audit/logs
```

Query parameters:

```text
action
actorUserId
entityType
entityId
fromUtc
toUtc
page
pageSize
```

Allowed roles:

```text
Owner
Auditor
Admin with permission
```

---

## Get Screenshot Access History

```text
GET /api/v1/audit/screenshots/{screenshotAssetId}/access-history
```

---

## Request Compliance Report Export

```text
POST /api/v1/compliance/reports/export
```

Request:

```json
{
  "reportType": "MonitoringSessionCompliance",
  "scopeType": "MonitoringSession",
  "scopeId": "session-id"
}
```

Response:

```json
{
  "reportExportId": "report-id",
  "status": "Queued"
}
```

---

# 16. Privacy and Retention APIs

## List Privacy Rules

```text
GET /api/v1/privacy/rules
```

---

## Create Privacy Rule

```text
POST /api/v1/privacy/rules
```

Request:

```json
{
  "name": "Blur banking domains",
  "type": "BrowserDomain",
  "pattern": "bank-example.com",
  "action": "BlurScreenshot",
  "priority": 10,
  "isEnabled": true
}
```

---

## List Retention Policies

```text
GET /api/v1/retention/policies
```

---

## Create Retention Policy

```text
POST /api/v1/retention/policies
```

Request:

```json
{
  "name": "Default 30 Day Policy",
  "screenshotRetentionDays": 30,
  "metadataRetentionDays": 90,
  "ocrRetentionDays": 30,
  "reportRetentionDays": 180,
  "auditRetentionDays": 365,
  "autoDeleteEnabled": true
}
```

---

# 17. Localization APIs

Because WorkGraph AI is multi-country and multi-language, localization should be part of the API model.

## Get Supported Languages

```text
GET /api/v1/localization/languages
```

Response:

```json
{
  "items": [
    { "code": "en-US", "name": "English" },
    { "code": "fa-IR", "name": "Persian" },
    { "code": "ar-SA", "name": "Arabic" },
    { "code": "tr-TR", "name": "Turkish" }
  ]
}
```

---

## Get Localized Notice

```text
GET /api/v1/localization/notices/{noticeType}?language=fa-IR
```

Notice types:

```text
MonitoringStarted
MonitoringStopped
ConsentRequest
DataCollectionExplanation
RetentionPolicyExplanation
PrivacyConcernSubmitted
```

---

# API Security Rules

Every endpoint must enforce:

```text
Authentication
Tenant resolution
Authorization
Input validation
Rate limiting where needed
Audit logging for sensitive access
```

---

## Agent Upload Security

Agent upload endpoints must enforce:

```text
Device authentication
Device status is Active
Device belongs to tenant
Session belongs to tenant
Session belongs to device and employee
Session is Active at captured time
Capture mode allows upload
File size and type validation
Idempotency key
```

---

## Idempotency

Use idempotency for:

```text
Activity snapshot upload
Screenshot upload
Usage event recording
AI job creation
Billing credit transaction
```

Recommended header:

```text
Idempotency-Key: tenantId:deviceId:sequenceNumber
```

For Agent uploads:

```text
tenantId:deviceId:monitoringSessionId:clientSequenceNumber
```

---

## Pagination

Use standard pagination for list endpoints:

```text
page
pageSize
```

Example:

```text
GET /api/v1/employees?page=1&pageSize=50
```

Default:

```text
page = 1
pageSize = 50
maxPageSize = 200
```

---

## Filtering Dates

Use UTC timestamps in APIs:

```text
fromUtc
toUtc
```

Use tenant timezone only for display and work date grouping.

---

# MVP Endpoint Priority

Build first:

```text
POST /auth/login
GET /auth/me
GET /tenant/settings
GET /teams
POST /teams
GET /employees
POST /employees
POST /agent/devices/register
POST /agent/devices/{id}/approve
POST /agent/heartbeat
GET /agent/configuration
GET /monitoring/policies
POST /monitoring/policies
POST /monitoring/sessions
POST /monitoring/sessions/{id}/start
POST /monitoring/sessions/{id}/stop
POST /activity/snapshots
POST /activity/snapshots/{id}/screenshot
GET /dashboard/teams/{id}
GET /dashboard/employees/{id}/timeline
POST /screenshots/{id}/view-request
GET /employee/me/monitoring-status
GET /employee/me/monitoring-sessions
GET /billing/balance
GET /billing/usage
GET /audit/logs
GET /privacy/rules
POST /privacy/rules
```

Build later:

```text
SSO APIs
Advanced report export APIs
Advanced compliance APIs
Advanced localization management APIs
Webhook APIs
External integration APIs
Admin platform APIs
```

---

# Codex Rules

Codex must follow these rules when generating API code:

1. Do not expose domain entities directly as API responses.
2. Use request/response DTOs.
3. Do not put business logic in controllers or minimal API endpoints.
4. Use Application commands and queries.
5. Resolve TenantId from context, not request body.
6. Validate authorization in handlers or policies.
7. Audit sensitive actions.
8. Meter billable operations.
9. Do not expose object storage keys.
10. Use safe endpoint names.
11. Keep Agent APIs separate from User APIs.
12. Return 202 for async jobs.
13. Use UTC timestamps.
14. Support language/region fields where relevant.
15. Keep MVP simple.

---

## Final API Rule

The API should make the product feel like:

```text
Enterprise workforce intelligence
```

not:

```text
A screenshot spying backend
```

Therefore, endpoint names, DTOs, response messages, and documentation must use safe, professional, neutral language.

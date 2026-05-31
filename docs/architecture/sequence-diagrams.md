# WorkGraph AI - Runtime Sequence Diagrams

This document defines the most important runtime flows for **WorkGraph AI**.

These flows are intended to guide Codex when implementing the Web API, Windows Agent, background workers, queues, billing, audit logging, and dashboard behavior.

The platform must remain:

- Transparent
- Consent-based or authorization-based
- Session-bound
- Auditable
- Privacy-aware
- Usage-metered

---

## Actors and Components

```text
Manager
Employee
Admin
Auditor
Windows Agent
Manager Dashboard
Employee Portal
Web API
Application Layer
Database
Object Storage
Message Queue
AI Worker
OCR Worker
Billing Service
Audit Service
Notification Service
```

---

# 1. Agent Device Registration Flow

## Purpose

Register a Windows Agent installation and wait for Admin approval before it can participate in monitoring sessions.

```mermaid
sequenceDiagram
    autonumber
    participant Employee
    participant Agent as Windows Agent
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Audit as Audit Service
    participant Admin as Admin

    Employee->>Agent: Install visible Windows Agent
    Agent->>Agent: Generate device fingerprint hash
    Agent->>API: POST /agent/devices/register
    API->>App: RegisterAgentDeviceCommand
    App->>DB: Create AgentDevice with PendingApproval status
    App->>Audit: Write AgentRegistered audit entry
    Audit->>DB: Save AuditLogEntry
    API-->>Agent: Registration accepted, status PendingApproval

    Admin->>API: Approve device
    API->>App: ApproveAgentDeviceCommand
    App->>DB: Update AgentDevice status to Active
    App->>Audit: Write AgentDeviceApproved audit entry
    Audit->>DB: Save AuditLogEntry
    API-->>Admin: Device approved

    Agent->>API: Send heartbeat
    API->>App: RecordAgentHeartbeatCommand
    App->>DB: Update LastSeenAtUtc
    API-->>Agent: Return current agent configuration
```

## Important Rules

1. The Agent must be visible to the employee.
2. Device fingerprint must be hashed, not stored as raw sensitive fingerprint.
3. Device starts as `PendingApproval`.
4. Admin approval is required before active use.
5. Registration and approval must be audited.

---

# 2. Monitoring Session Request and Approval Flow

## Purpose

A Manager requests a monitoring session for an employee. The system checks policy, consent requirements, and authorization before the session can start.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Employee
    participant Portal as Employee Portal
    participant Notify as Notification Service
    participant Audit as Audit Service

    Manager->>Dashboard: Request monitoring session
    Dashboard->>API: POST /monitoring/sessions
    API->>App: RequestMonitoringSessionCommand
    App->>DB: Load employee, device, policy, manager permissions
    App->>App: Validate justification and policy rules

    alt Employee consent required
        App->>DB: Create MonitoringSession with AwaitingConsent
        App->>DB: Create ConsentRecord with Requested status
        App->>Notify: Notify employee of consent request
        App->>Audit: Write MonitoringSessionRequested audit entry
        API-->>Dashboard: Session awaiting consent

        Employee->>Portal: Review consent request
        Portal->>API: POST /monitoring/sessions/{id}/consent
        API->>App: SubmitConsentDecisionCommand
        App->>DB: Update ConsentRecord

        alt Consent accepted
            App->>DB: Update MonitoringSession to Approved
            App->>Audit: Write ConsentAccepted audit entry
            API-->>Portal: Consent accepted
        else Consent declined
            App->>DB: Update MonitoringSession to Rejected
            App->>Audit: Write ConsentDeclined audit entry
            API-->>Portal: Consent declined
        end

    else Company authorization policy applies
        App->>DB: Create MonitoringSession with Approved status
        App->>DB: Create ConsentRecord with NotRequiredByPolicy status
        App->>Audit: Write MonitoringSessionApproved audit entry
        API-->>Dashboard: Session approved
    end
```

## Important Rules

1. Every session must have a business justification.
2. No monitoring should start before approval/consent rules are satisfied.
3. Consent or authorization decision must be recorded.
4. Employee notification should be sent when policy requires it.
5. Session request and approval must be audited.

---

# 3. Start Monitoring Session Flow

## Purpose

Start an approved monitoring session and make the Windows Agent aware of active capture configuration.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Agent as Windows Agent
    participant Audit as Audit Service
    participant Notify as Notification Service

    Manager->>Dashboard: Start approved session
    Dashboard->>API: POST /monitoring/sessions/{id}/start
    API->>App: StartMonitoringSessionCommand
    App->>DB: Load session, policy, device, permissions
    App->>App: Validate status is Approved or Paused
    App->>DB: Update MonitoringSession to Active
    App->>Audit: Write MonitoringSessionStarted audit entry
    App->>Notify: Notify employee monitoring started
    API-->>Dashboard: Session active

    Agent->>API: Poll/fetch monitoring configuration
    API->>App: GetAgentConfigurationQuery
    App->>DB: Load active session and policy
    API-->>Agent: Active session, capture mode, interval, privacy rules
    Agent->>Agent: Show visible active monitoring status
```

## Important Rules

1. Start is allowed only for approved sessions.
2. Employee-facing visibility is required.
3. Agent must show active monitoring status.
4. Session start must be audited.
5. Agent receives only the configuration it is allowed to use.

---

# 4. Pause or Stop Monitoring Session Flow

## Purpose

Stop capture when the session is paused or completed.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Agent as Windows Agent
    participant Audit as Audit Service
    participant Notify as Notification Service

    Manager->>Dashboard: Pause or stop session
    Dashboard->>API: POST /monitoring/sessions/{id}/stop
    API->>App: StopMonitoringSessionCommand
    App->>DB: Load session and validate permissions
    App->>DB: Update MonitoringSession to Completed
    App->>Audit: Write MonitoringSessionStopped audit entry
    App->>Notify: Notify employee monitoring stopped
    API-->>Dashboard: Session completed

    Agent->>API: Fetch monitoring configuration
    API->>App: GetAgentConfigurationQuery
    App->>DB: No active session found
    API-->>Agent: No active monitoring session
    Agent->>Agent: Stop capture and show inactive status
```

## Important Rules

1. Agent must stop capture when no active session exists.
2. Session stop must be audited.
3. Employee should see stopped/inactive status.
4. Uploads after stop should be rejected unless they belong to queued captures from a valid active period.

---

# 5. Activity Metadata and Screenshot Upload Flow

## Purpose

Upload activity metadata and screenshot asset during an active monitoring session.

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Windows Agent
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Storage as Object Storage
    participant Queue as Message Queue
    participant Billing as Billing Service
    participant Audit as Audit Service

    Agent->>Agent: Capture metadata during active session
    Agent->>Agent: Capture screenshot if policy allows
    Agent->>Agent: Apply local privacy rules
    Agent->>Agent: Resize and compress screenshot

    Agent->>API: POST /activity/snapshots with metadata
    API->>App: UploadActivitySnapshotCommand
    App->>DB: Validate tenant, device, employee, active session
    App->>DB: Save ActivitySnapshot
    App->>Billing: Record Screenshot/Metadata usage event
    Billing->>DB: Save UsageEvent
    App->>Queue: Publish activity.snapshot.uploaded
    API-->>Agent: ActivitySnapshotId

    Agent->>API: Upload screenshot binary or request upload URL
    API->>App: UploadScreenshotAssetCommand
    App->>DB: Validate ActivitySnapshot and session
    App->>Storage: Store screenshot object
    Storage-->>App: StorageKey
    App->>DB: Save ScreenshotAsset metadata
    App->>Billing: Record screenshot upload usage event
    Billing->>DB: Save UsageEvent
    App->>Queue: Publish screenshot.asset.uploaded
    API-->>Agent: Upload accepted
```

## Important Rules

1. Server must validate active session, tenant, device, and employee.
2. Screenshots must not be stored in relational database.
3. Use object storage for screenshot binaries.
4. Metadata and screenshot upload should be idempotent.
5. Billable events must be recorded.
6. Uploaded data must be queued for async processing.
7. Upload should reject invalid or unauthorized sessions.

---

# 6. Offline Upload Sync Flow

## Purpose

Allow the Agent to queue encrypted data locally when offline and upload later without breaking session integrity.

```mermaid
sequenceDiagram
    autonumber
    participant Agent as Windows Agent
    participant LocalQueue as Encrypted Local Queue
    participant API as Web API
    participant App as Application Layer
    participant DB as Database

    Agent->>Agent: Capture during active session
    Agent->>LocalQueue: Store encrypted metadata/screenshot package
    Agent->>Agent: Network unavailable

    loop Until network restored
        Agent->>Agent: Retry connection with backoff
    end

    Agent->>API: Submit queued upload package
    API->>App: UploadActivitySnapshotCommand with captured timestamp and sequence number
    App->>DB: Validate session was active at CapturedAtUtc

    alt Capture was valid during active session
        App->>DB: Save ActivitySnapshot and ScreenshotAsset metadata
        API-->>Agent: Upload accepted
        Agent->>LocalQueue: Remove uploaded item
    else Capture not valid
        App->>DB: Reject or mark invalid upload attempt
        API-->>Agent: Upload rejected
        Agent->>LocalQueue: Remove or quarantine item
    end
```

## Important Rules

1. Offline queue must be encrypted.
2. Server validates that the session was active when the capture happened.
3. Client sequence number helps preserve ordering.
4. Duplicate uploads must not create duplicate billing.
5. Invalid queued data should not be silently accepted.

---

# 7. OCR Processing Flow

## Purpose

Run OCR asynchronously after a screenshot is uploaded.

```mermaid
sequenceDiagram
    autonumber
    participant Queue as Message Queue
    participant Worker as OCR Worker
    participant DB as Database
    participant Storage as Object Storage
    participant OCR as OCR Engine
    participant Billing as Billing Service
    participant NextQueue as Message Queue

    Queue->>Worker: screenshot.asset.uploaded
    Worker->>DB: Load ScreenshotAsset and ActivitySnapshot
    Worker->>Storage: Download screenshot object
    Worker->>OCR: Run OCR if policy allows
    OCR-->>Worker: Extracted text and confidence
    Worker->>Worker: Apply OCR masking rules
    Worker->>DB: Save OcrResult
    Worker->>Billing: Record OCR usage event
    Billing->>DB: Save UsageEvent
    Worker->>NextQueue: Publish ocr.processing.completed
    Worker->>NextQueue: Publish classification.requested
```

## Important Rules

1. OCR may be skipped based on policy or privacy rule.
2. OCR text is sensitive and must be protected.
3. Masked OCR text should be preferred for reporting.
4. OCR usage should be metered.
5. Worker should be idempotent.

---

# 8. Deterministic Classification Flow

## Purpose

Classify app, domain, idle state, and simple work category using cheap deterministic rules before AI.

```mermaid
sequenceDiagram
    autonumber
    participant Queue as Message Queue
    participant Worker as Classification Worker
    participant DB as Database
    participant Rules as Rule Engine
    participant Billing as Billing Service
    participant NextQueue as Message Queue

    Queue->>Worker: classification.requested
    Worker->>DB: Load ActivitySnapshot, OcrResult, policy, privacy rules
    Worker->>Rules: Classify process/app/domain/window title
    Rules-->>Worker: WorkCategory, RiskSignal, FocusLevel, confidence
    Worker->>DB: Save AnalysisResult with Stage = Deterministic
    Worker->>Billing: Record BasicClassification usage event
    Billing->>DB: Save UsageEvent

    alt Needs lightweight AI
        Worker->>NextQueue: Publish lightweight.ai.requested
    else Enough confidence
        Worker->>NextQueue: Publish timeblock.summary.requested if needed
    end
```

## Important Rules

1. Deterministic processing should run before expensive AI.
2. High-confidence deterministic results may avoid AI cost.
3. Classification language must stay neutral.
4. Bill basic classification if configured as billable.

---

# 9. Lightweight AI Classification Flow

## Purpose

Use low-cost AI or local model only when deterministic classification is insufficient.

```mermaid
sequenceDiagram
    autonumber
    participant Queue as Message Queue
    participant Worker as AI Worker
    participant DB as Database
    participant AI as Lightweight AI Provider
    participant Billing as Billing Service
    participant NextQueue as Message Queue

    Queue->>Worker: lightweight.ai.requested
    Worker->>DB: Load ActivitySnapshot, OCR summary, deterministic result
    Worker->>Worker: Build minimal prompt/input
    Worker->>AI: Classify screen context or work category
    AI-->>Worker: Category, focus signal, confidence, short summary
    Worker->>DB: Save AnalysisResult with Stage = LightweightAI
    Worker->>Billing: Record AI usage event
    Billing->>DB: Save UsageEvent
    Worker->>NextQueue: Publish timeblock.summary.requested
```

## Important Rules

1. Send minimal necessary data to AI.
2. Prefer metadata and OCR snippets over raw screenshots when possible.
3. Do not send every screenshot to expensive multimodal models.
4. Store model provider, model name, prompt version, and token usage when available.

---

# 10. Premium Deep Analysis Flow

## Purpose

Run premium AI reasoning only when requested or triggered by policy.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Queue as Message Queue
    participant Worker as Premium AI Worker
    participant AI as Premium AI Provider
    participant Billing as Billing Service
    participant Audit as Audit Service

    Manager->>Dashboard: Request deep analysis
    Dashboard->>API: POST /analysis/deep
    API->>App: RequestDeepAnalysisCommand
    App->>DB: Validate manager permission and tenant credits
    App->>Audit: Write DeepAnalysisRequested audit entry
    App->>Queue: Publish premium.analysis.requested
    API-->>Dashboard: Deep analysis queued

    Queue->>Worker: premium.analysis.requested
    Worker->>DB: Load summaries, snapshots, OCR, selected screenshots if required
    Worker->>Worker: Minimize AI input
    Worker->>AI: Run premium reasoning
    AI-->>Worker: Deep analysis summary and review signals
    Worker->>DB: Save AnalysisResult with Stage = PremiumAI
    Worker->>Billing: Record DeepReasoning usage event
    Billing->>DB: Save UsageEvent
    Worker->>Audit: Write DeepAnalysisCompleted audit entry
```

## Important Rules

1. Premium analysis should be explicit, policy-triggered, or anomaly-triggered.
2. Validate tenant credit/billing state before expensive jobs.
3. Audit deep analysis requests.
4. Avoid final moral judgment about employees.

---

# 11. Time Block Summary Flow

## Purpose

Aggregate many activity snapshots into manager-friendly time blocks.

```mermaid
sequenceDiagram
    autonumber
    participant Queue as Message Queue
    participant Worker as Summary Worker
    participant DB as Database
    participant Billing as Billing Service

    Queue->>Worker: timeblock.summary.requested
    Worker->>DB: Load snapshots and analysis results for employee/session/time window
    Worker->>Worker: Calculate dominant work category
    Worker->>Worker: Calculate focus score
    Worker->>Worker: Calculate context switching score
    Worker->>Worker: Calculate idle percentage
    Worker->>DB: Save TimeBlockSummary
    Worker->>Billing: Record summary usage if billable
    Billing->>DB: Save UsageEvent
```

## Important Rules

1. Dashboards should use summaries, not raw screenshot scans.
2. Time blocks reduce manager cognitive load.
3. Summary generation should be idempotent for the same time window.

---

# 12. Daily Employee Summary Flow

## Purpose

Generate a daily summary from aggregated metadata and time blocks.

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as Scheduler
    participant Queue as Message Queue
    participant Worker as Summary Worker
    participant DB as Database
    participant AI as Summary AI Provider
    participant Billing as Billing Service

    Scheduler->>Queue: Publish daily.summary.requested
    Queue->>Worker: daily.summary.requested
    Worker->>DB: Load TimeBlockSummaries for employee/work date
    Worker->>DB: Load usage breakdown and focus metrics
    Worker->>Worker: Build compact daily summary input
    Worker->>AI: Generate daily summary from aggregated data
    AI-->>Worker: Neutral daily summary
    Worker->>DB: Save DailyEmployeeSummary
    Worker->>Billing: Record DailySummary usage event
    Billing->>DB: Save UsageEvent
```

## Important Rules

1. Daily summary should be generated from aggregated data.
2. Do not send all screenshots to AI for daily summary.
3. Summary should use safe language.
4. Daily summary is a premium or semi-premium billable operation.

---

# 13. Manager Dashboard View Flow

## Purpose

Manager views team and employee summaries without directly browsing raw screenshots.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Audit as Audit Service

    Manager->>Dashboard: Open team dashboard
    Dashboard->>API: GET /dashboard/team/{teamId}
    API->>App: GetTeamDashboardQuery
    App->>DB: Validate manager access to team
    App->>DB: Load DailyEmployeeSummaries, TimeBlockSummaries, usage breakdowns
    App-->>API: Dashboard read model
    API-->>Dashboard: Team dashboard data

    Manager->>Dashboard: Open employee timeline
    Dashboard->>API: GET /employees/{id}/timeline
    API->>App: GetEmployeeTimelineQuery
    App->>DB: Validate manager access to employee
    App->>DB: Load timeline summaries and analysis results
    App->>Audit: Optionally log EmployeeDataAccessed
    API-->>Dashboard: Employee timeline read model
```

## Important Rules

1. Dashboard should prefer summaries over screenshots.
2. Manager must only access employees within authorized scope.
3. Sensitive employee data access should be audited based on policy.

---

# 14. Raw Screenshot View With Audit Flow

## Purpose

A Manager views a raw screenshot only after authorization and audit logging.

```mermaid
sequenceDiagram
    autonumber
    participant Manager
    participant Dashboard as Manager Dashboard
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Audit as Audit Service
    participant Storage as Object Storage

    Manager->>Dashboard: Click view screenshot
    Dashboard->>Dashboard: Ask for access reason if required
    Dashboard->>API: POST /screenshots/{id}/view-request with reason
    API->>App: RequestScreenshotViewCommand
    App->>DB: Validate tenant, RBAC, team scope, retention status
    App->>DB: Load ScreenshotAsset metadata
    App->>Audit: Write ScreenshotViewed audit entry with reason
    Audit->>DB: Save AuditLogEntry
    App->>Storage: Generate short-lived signed URL or stream object
    Storage-->>App: Signed URL or stream
    API-->>Dashboard: Screenshot access response
    Dashboard->>Storage: Load screenshot through authorized URL
```

## Important Rules

1. Raw screenshot viewing must be audited.
2. Access reason should be required for sensitive access.
3. Use short-lived signed URLs or secure streaming.
4. Do not expose storage keys directly.
5. Authorization must happen before audit and storage access.

---

# 15. Employee Transparency Portal Flow

## Purpose

Employee views monitoring status, session history, retention policy, and data access history.

```mermaid
sequenceDiagram
    autonumber
    participant Employee
    participant Portal as Employee Portal
    participant API as Web API
    participant App as Application Layer
    participant DB as Database

    Employee->>Portal: Open transparency portal
    Portal->>API: GET /employee/me/monitoring-status
    API->>App: GetMyMonitoringStatusQuery
    App->>DB: Resolve employee profile from authenticated user
    App->>DB: Load active sessions and policy
    API-->>Portal: Active/inactive monitoring status

    Employee->>Portal: View session history
    Portal->>API: GET /employee/me/sessions
    API->>App: GetMyMonitoringSessionHistoryQuery
    App->>DB: Load employee session history
    API-->>Portal: Session history with justification where allowed

    Employee->>Portal: View who accessed my data
    Portal->>API: GET /employee/me/access-history
    API->>App: GetMyDataAccessHistoryQuery
    App->>DB: Load related audit entries
    API-->>Portal: Data access history
```

## Important Rules

1. Employee should be able to see monitoring status.
2. Employee should see collected data summary where policy allows.
3. Employee should see retention policy.
4. Employee-facing access history increases trust.

---

# 16. Usage Metering and Credit Deduction Flow

## Purpose

Record usage and deduct credits for billable operations.

```mermaid
sequenceDiagram
    autonumber
    participant App as Application Layer
    participant Billing as Billing Service
    participant DB as Database
    participant Notify as Notification Service

    App->>Billing: RecordUsageEvent(operation, tenant, units, idempotencyKey)
    Billing->>DB: Check existing usage event by idempotency key

    alt Usage event already exists
        Billing-->>App: Return existing usage event, no duplicate charge
    else New usage event
        Billing->>DB: Load BillingAccount
        Billing->>DB: Insert UsageEvent
        Billing->>DB: Insert CreditTransaction
        Billing->>DB: Update BillingAccount balance

        alt Balance below threshold
            Billing->>Notify: Send low credit warning
        end

        Billing-->>App: Usage recorded
    end
```

## Important Rules

1. Billing must be idempotent.
2. UsageEvents are append-only.
3. CreditTransactions are append-only.
4. BillingAccount balance update must be transactional.
5. Failed processing should not be billed unless policy explicitly says so.

---

# 17. Retention Cleanup Flow

## Purpose

Delete expired screenshots, OCR, reports, and metadata according to tenant policy.

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as Scheduler
    participant Worker as Retention Worker
    participant DB as Database
    participant Storage as Object Storage
    participant Audit as Audit Service

    Scheduler->>Worker: Run retention cleanup
    Worker->>DB: Load tenants and retention policies

    loop For each tenant
        Worker->>DB: Find expired ScreenshotAssets
        Worker->>Storage: Delete expired screenshot objects
        Worker->>DB: Mark/delete ScreenshotAsset records according to policy
        Worker->>DB: Delete or anonymize expired OCR/metadata if policy allows
        Worker->>Audit: Write RetentionCleanupCompleted audit entry
    end
```

## Important Rules

1. Retention cleanup must respect tenant policy.
2. Deletion should be auditable.
3. Audit logs usually have longer retention than screenshots.
4. Object storage and database metadata must not become inconsistent.

---

# 18. Privacy Rule Update Flow

## Purpose

Admin updates privacy rules and the Agent receives updated configuration.

```mermaid
sequenceDiagram
    autonumber
    participant Admin
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Cache as Redis Cache
    participant Audit as Audit Service
    participant Agent as Windows Agent

    Admin->>API: POST /privacy/rules
    API->>App: CreatePrivacyRuleCommand
    App->>DB: Save PrivacyRule
    App->>Cache: Invalidate tenant privacy config cache
    App->>Audit: Write PrivacyRuleChanged audit entry
    API-->>Admin: Privacy rule saved

    Agent->>API: Fetch monitoring configuration
    API->>App: GetAgentConfigurationQuery
    App->>DB: Load active policy and privacy rules
    App->>Cache: Cache tenant privacy config
    API-->>Agent: Updated privacy rules
```

## Important Rules

1. Privacy rule changes must be audited.
2. Agent should receive updated rules quickly.
3. Cache invalidation is required after policy changes.
4. Server-side privacy checks still matter even if local agent masking exists.

---

# 19. Compliance Report Export Flow

## Purpose

Auditor or Owner exports compliance evidence.

```mermaid
sequenceDiagram
    autonumber
    participant Auditor
    participant API as Web API
    participant App as Application Layer
    participant DB as Database
    participant Queue as Message Queue
    participant Worker as Report Worker
    participant Storage as Object Storage
    participant Audit as Audit Service

    Auditor->>API: Request compliance report export
    API->>App: RequestComplianceReportExportCommand
    App->>DB: Validate auditor permission
    App->>DB: Create ReportExport with Requested status
    App->>Audit: Write ReportExportRequested audit entry
    App->>Queue: Publish report.export.requested
    API-->>Auditor: Report export queued

    Queue->>Worker: report.export.requested
    Worker->>DB: Load sessions, consent records, audit logs, policy changes
    Worker->>Worker: Generate report file
    Worker->>Storage: Store report export
    Worker->>DB: Update ReportExport to Completed
    Worker->>Audit: Write ReportExportCompleted audit entry
```

## Important Rules

1. Report exports must be audited.
2. Exported reports should have retention expiry.
3. Compliance reports should include monitoring justification, consent/authorization, policy, and access history.

---

# 20. End-to-End Happy Path

## Purpose

Show the full MVP runtime path from device setup to manager insight.

```mermaid
sequenceDiagram
    autonumber
    participant Employee
    participant Agent as Windows Agent
    participant Admin
    participant Manager
    participant API as Web API
    participant DB as Database
    participant Storage as Object Storage
    participant Queue as Message Queue
    participant Worker as Workers
    participant Dashboard as Manager Dashboard

    Employee->>Agent: Install visible agent
    Agent->>API: Register device
    API->>DB: Save PendingApproval device
    Admin->>API: Approve device
    API->>DB: Mark device Active

    Manager->>API: Request monitoring session with justification
    API->>DB: Save Approved/AwaitingConsent session
    Employee->>API: Accept consent if required
    API->>DB: Mark session Approved
    Manager->>API: Start session
    API->>DB: Mark session Active

    Agent->>API: Fetch active config
    API-->>Agent: Capture rules and privacy rules
    Agent->>API: Upload metadata and screenshot
    API->>DB: Save ActivitySnapshot and ScreenshotAsset metadata
    API->>Storage: Store screenshot
    API->>Queue: Publish processing jobs

    Queue->>Worker: Process OCR/classification/summary
    Worker->>DB: Save OcrResult, AnalysisResult, TimeBlockSummary
    Worker->>DB: Save UsageEvents

    Manager->>Dashboard: Open dashboard
    Dashboard->>API: Get team/employee summaries
    API->>DB: Load summaries and trends
    API-->>Dashboard: Workforce intelligence dashboard
```

---

## Implementation Guidance for Codex

Codex should implement flows in this order:

```text
1. Agent registration
2. Device approval
3. Monitoring policy creation
4. Monitoring session request
5. Consent or authorization record
6. Start/stop monitoring session
7. Activity metadata upload
8. Screenshot object metadata upload
9. Usage event recording
10. Audit logging
11. Queue message publishing
12. OCR worker skeleton
13. Classification worker skeleton
14. Summary worker skeleton
15. Dashboard read queries
16. Screenshot view with audit
17. Employee transparency queries
```

---

## Non-Negotiable Runtime Rules

1. No active session means no capture.
2. No valid device means no upload.
3. No valid tenant means no data access.
4. No authorization means no dashboard data.
5. No audit log means no raw screenshot view.
6. No idempotency means duplicate billing risk.
7. No retention policy means enterprise compliance risk.
8. No privacy rule enforcement means trust risk.
9. No summary-first dashboard means the product becomes a screenshot viewer.
10. No safe language means the product becomes legally risky.

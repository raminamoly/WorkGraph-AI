# WorkGraph AI - Codex Implementation Instructions

This document tells Codex how to generate code for WorkGraph AI.

Architecture documents explain **what** to build.

This document explains **how** to build it.

---

## Product Identity

WorkGraph AI is an enterprise workforce intelligence platform.

It is not spyware.

Codex must never generate hidden surveillance behavior, stealth monitoring, keylogging, password extraction, or employee accusation features.

Use safe product language:

```text
Monitoring Session
Activity Snapshot
Workforce Insight
Focus Trend
Work Category
Audit Log
Transparency Portal
Privacy Rule
```

Avoid unsafe language:

```text
Spy
Stealth
Watcher
Keylogger
ScreenLogger
Surveillance
Cheating
Lazy
Bad Employee
```

---

## Required Architecture

Use:

```text
.NET / C#
ASP.NET Core Web API
Clean Architecture
Lightweight CQRS
Modular Monolith
EF Core
PostgreSQL or SQL Server
RabbitMQ abstraction
Redis abstraction
Object storage abstraction
Background workers
```

Do not start with microservices.

Do not put business logic in controllers.

Do not put infrastructure code in Domain.

---

## Recommended Solution Structure

```text
src/
├── WorkGraph.Domain
├── WorkGraph.Application
├── WorkGraph.Infrastructure
├── WorkGraph.WebApi
├── WorkGraph.Workers
└── WorkGraph.Contracts

clients/
├── WorkGraph.Agent.Windows
└── WorkGraph.Dashboard

tests/
├── WorkGraph.UnitTests
├── WorkGraph.IntegrationTests
├── WorkGraph.ArchitectureTests
└── WorkGraph.WorkerTests
```

---

## Dependency Rules

```text
Domain depends on nothing except base .NET libraries.
Application depends on Domain.
Infrastructure depends on Application and Domain.
WebApi depends on Application, Infrastructure, and Contracts.
Workers depend on Application, Infrastructure, and Contracts.
Contracts should stay lightweight and independent.
```

Forbidden:

```text
Domain -> Infrastructure
Domain -> EF Core
Domain -> ASP.NET Core
Domain -> Redis
Domain -> RabbitMQ
Domain -> AI SDKs
Domain -> Object Storage SDKs
```

---

## Modular Monolith Contexts

Keep code grouped by bounded context:

```text
Tenancy
Identity
Organization
Agents
Monitoring
Activity
Intelligence
Reporting
Billing
Audit
Privacy
Localization
```

Do not create one giant global folder for all commands or all entities.

Prefer feature/module organization.

---

## Domain Layer Rules

Domain contains:

```text
Entities
Value Objects
Enums
Domain Events
Business Rules
Aggregate behavior
```

Domain must not contain:

```text
EF Core DbContext
Repository implementation
HTTP models
Controllers
Queue implementation
AI provider clients
Storage provider clients
```

---

## Entity Rules

All tenant-owned entities must include:

```text
TenantId
```

Examples:

```text
User
Team
EmployeeProfile
AgentDevice
MonitoringPolicy
MonitoringSession
ActivitySnapshot
ScreenshotAsset
OcrResult
AnalysisResult
UsageEvent
AuditLogEntry
PrivacyRule
RetentionPolicy
```

Use clear entity names. Do not use abbreviations unless common.

---

## CQRS Rules

Use lightweight CQRS.

Commands change state.

Queries read state.

Examples:

```text
RequestMonitoringSessionCommand
StartMonitoringSessionCommand
UploadActivitySnapshotCommand
RecordUsageEventCommand
GetTeamDashboardQuery
GetEmployeeTimelineQuery
GetBillingBalanceQuery
```

Each command/query should have:

```text
Request object
Handler
Validator when needed
Response DTO when needed
```

Do not put command logic in API endpoints.

---

## Application Layer Rules

Application layer contains:

```text
Commands
Queries
Handlers
Validators
Interfaces/Ports
DTOs for use cases
Authorization checks
Tenant checks
Transaction orchestration
```

Application layer defines interfaces such as:

```text
IApplicationDbContext
ICurrentTenant
ICurrentUser
IAuditWriter
IUsageMeter
IObjectStorage
IEventBus
IAiAnalysisProvider
IOcrService
IDateTimeProvider
```

Infrastructure implements these interfaces.

---

## Web API Rules

Controllers or minimal API endpoints should be thin.

Endpoint responsibilities:

```text
Accept request
Call command/query handler
Return response
```

Endpoint should not:

```text
Contain business rules
Directly use DbContext
Directly access object storage
Directly call AI provider
Directly calculate scores
```

---

## Multi-Tenancy Rules

Never trust TenantId from request body.

Resolve TenantId from:

```text
Authenticated user token
Device credential
Server-side tenant context
```

Every query for tenant data must filter by TenantId.

Every queue message must include TenantId.

Every Redis key must include TenantId.

Every object storage key must include TenantId.

Every audit log and usage event must include TenantId.

---

## User Hierarchy Rules

Respect the role hierarchy:

```text
Platform/System Admin - internal only
Tenant Owner
Tenant Admin
Manager
Auditor
Employee
Agent Device
System Worker
```

Managers can access only assigned teams/employees.

Employees can access only their own transparency data.

Auditors are mostly read-only.

Admins configure tenant policies and devices.

Owners control tenant account and billing.

---

## Monitoring Session Rules

No capture without an active approved monitoring session.

Before accepting activity upload, validate:

```text
Tenant exists
Device is Active
Device belongs to tenant
Employee belongs to tenant
Session belongs to tenant
Session belongs to employee and device
Session was active at CapturedAtUtc
Policy allows capture type
```

Reject invalid uploads.

Do not silently accept invalid monitoring data.

---

## Screenshot Rules

Do not store screenshot binary in the database.

Store binary in object storage.

Store metadata in database.

Never expose object storage key directly.

Raw screenshot view must:

```text
Check authorization
Require reason when configured
Write audit log
Return short-lived signed URL or secure stream
```

---

## AI and Scoring Rules

Do not send every screenshot to expensive AI.

Use staged pipeline:

```text
1. Metadata classification
2. Duplicate detection
3. OCR if needed
4. Rule-based classification
5. Lightweight AI only when needed
6. Premium AI only on explicit request or anomaly
```

AI output must use safe language.

Do not generate moral judgments.

Use:

```text
Potential non-work activity
High context switching
Long idle period
Needs manager review
Unclassified activity
```

Do not use:

```text
Lazy
Cheating
Bad employee
Untrustworthy
```

---

## Billing Rules

Every billable operation must create a UsageEvent.

Use idempotency to prevent duplicate billing.

UsageEvents are append-only.

CreditTransactions are append-only.

BillingAccount balance updates must be transactional.

Billable operations include:

```text
ScreenshotUploaded
OcrProcessed
BasicClassification
VisionAnalysis
DeepReasoning
DailySummary
StorageRetention
ReportExport
```

---

## Audit Rules

Audit these actions:

```text
Agent registered
Agent approved
Agent revoked
Monitoring session requested
Monitoring session approved
Monitoring session started
Monitoring session stopped
Consent accepted/declined
Screenshot viewed
OCR text viewed
Report exported
Privacy rule changed
Retention policy changed
Billing changed
Role changed
Employee data accessed
Deep analysis requested
```

Audit logs should be append-only from application perspective.

Sensitive access should include a reason.

---

## Security Rules

Codex must not generate:

```text
Hidden monitoring
Stealth mode
Keylogging
Password extraction
Full URL capture by default
Object storage key exposure
Cross-tenant queries
English-only consent hard-coding
Cloud AI hard-coding
```

Codex should generate:

```text
Visible monitoring status concepts
Tenant isolation
RBAC
Device approval
Session-bound upload validation
Audit logging
Usage metering
Privacy rules
Retention policies
Localized notices foundation
Region-aware tenant settings
```

---

## Localization Rules

The app is multi-country and multi-language.

Do not hard-code user-facing text deeply inside business logic.

Store enum/code values in English/stable identifiers:

```text
HighContextSwitching
PotentialNonWork
MonitoringStarted
```

Display localized text in UI/API localization layer.

Tenant should support:

```text
DefaultLanguage
AllowedLanguages
RegionCode
ComplianceMode
StorageRegion
AllowedAiRegion
```

---

## EF Core Rules

Use separate configuration classes.

Example:

```text
MonitoringSessionConfiguration
ActivitySnapshotConfiguration
ScreenshotAssetConfiguration
UsageEventConfiguration
AuditLogEntryConfiguration
```

Prefer enums stored as strings.

Use UTC timestamps.

Avoid cascade delete for sensitive data.

Use soft delete or status fields for users/employees/devices.

Use retention cleanup for screenshots/activity data.

---

## API Rules

Follow `docs/architecture/api-design.md`.

Use DTOs, not domain entities, for API contracts.

Use versioned routes:

```text
/api/v1
```

Use UTC fields:

```text
StartedAtUtc
EndedAtUtc
CapturedAtUtc
OccurredAtUtc
```

Return `202 Accepted` for async jobs.

---

## Background Worker Rules

Workers should process queue messages idempotently.

Workers must validate TenantId.

Workers should not assume data is valid just because it came from the queue.

Recommended workers:

```text
OcrWorker
ClassificationWorker
SummaryWorker
BillingWorker
RetentionWorker
ReportWorker
```

---

## Testing Rules

Create tests for:

```text
Tenant isolation
RBAC
Manager scope
Employee own-data access
Agent upload validation
Monitoring session lifecycle
Screenshot access audit
Billing idempotency
Usage event creation
Privacy rule matching
Scoring formulas
Domain rules
Architecture dependencies
```

Architecture tests should verify:

```text
Domain does not reference Infrastructure
Domain does not reference EF Core
Application does not reference WebApi
Controllers do not directly use DbContext
```

---

## MVP Build Order

Codex should build in this order:

```text
1. Solution and project structure
2. Domain common abstractions
3. Tenant and tenant settings
4. User, role, and hierarchy model
5. Team and employee profile
6. Agent device model
7. Monitoring policy and session model
8. Activity snapshot and screenshot asset model
9. Billing usage event model
10. Audit log model
11. Privacy and retention model
12. Application interfaces
13. CQRS commands/queries skeleton
14. EF Core persistence
15. Web API endpoints
16. Worker skeletons
17. Basic scoring services
18. Tests
```

---

## Documentation Source of Truth

Before generating code, read these docs:

```text
docs/architecture/class-diagram.md
docs/architecture/bounded-contexts.md
docs/architecture/database-design.md
docs/architecture/sequence-diagrams.md
docs/architecture/security.md
docs/architecture/multi-tenancy.md
docs/architecture/api-design.md
docs/ai/ai-scoring-engine.md
docs/architecture/user-hierarchy.md
```

---

## Final Codex Rule

When unsure, choose:

```text
Privacy over collection
Audit over silent access
Summary over screenshot browsing
Tenant isolation over convenience
Clear domain model over quick hacks
MVP simplicity over over-engineering
```

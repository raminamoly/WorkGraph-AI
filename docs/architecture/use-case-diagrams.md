# WorkGraph AI - MVP Role-Based Use Case Diagrams

This document defines the simple MVP use cases based on the current user hierarchy.

The MVP hierarchy is:

```text
Platform Admin → Tenant Admin → Manager → Employee → Windows Agent
```

The platform must remain transparent, session-based, privacy-aware, and auditable.

---

## Actors

```text
Platform Admin
Tenant Admin
Manager
Employee
Windows Agent
AI Worker
System Worker
```

---

## Role Summary

| Role | Main Purpose |
|---|---|
| Platform Admin | Creates tenants and first tenant admins |
| Tenant Admin | Creates teams and managers, configures tenant policies |
| Manager | Creates employees, requests sessions, reviews summaries |
| Employee | Uses visible agent and transparency portal |
| Windows Agent | Uploads approved session data only |
| AI Worker | Processes OCR, classification, scoring, summaries |
| System Worker | Runs retention, billing, reports, background jobs |

---

# 1. Platform Admin Use Cases

```mermaid
flowchart LR
    PlatformAdmin((Platform Admin))

    subgraph Platform[WorkGraph Platform]
        UC1[Create tenant]
        UC2[Create first tenant admin]
        UC3[Set tenant region]
        UC4[Set tenant default language]
        UC5[Set compliance mode]
        UC6[Enable or disable tenant]
        UC7[View platform tenant list]
    end

    PlatformAdmin --> UC1
    PlatformAdmin --> UC2
    PlatformAdmin --> UC3
    PlatformAdmin --> UC4
    PlatformAdmin --> UC5
    PlatformAdmin --> UC6
    PlatformAdmin --> UC7

    UC1 --> UC2
```

## Platform Admin Use Cases

Platform Admin is internal WorkGraph staff.

Platform Admin creates the customer tenant and the first Tenant Admin.

Platform Admin should not normally browse customer screenshots or employee data.

---

# 2. Tenant Admin Use Cases

```mermaid
flowchart LR
    TenantAdmin((Tenant Admin))

    subgraph Tenant[Customer Tenant]
        UC1[Create team]
        UC2[Create manager]
        UC3[Assign manager to team]
        UC4[Configure monitoring policy]
        UC5[Configure privacy rules]
        UC6[Configure retention policy]
        UC7[Approve agent device]
        UC8[Revoke agent device]
        UC9[View tenant usage]
        UC10[View tenant audit logs]
        UC11[Configure tenant language settings]
    end

    TenantAdmin --> UC1
    TenantAdmin --> UC2
    TenantAdmin --> UC3
    TenantAdmin --> UC4
    TenantAdmin --> UC5
    TenantAdmin --> UC6
    TenantAdmin --> UC7
    TenantAdmin --> UC8
    TenantAdmin --> UC9
    TenantAdmin --> UC10
    TenantAdmin --> UC11

    UC1 --> UC3
    UC2 --> UC3
```

## Tenant Admin Use Cases

Tenant Admin manages setup and configuration for one customer company.

Tenant Admin creates teams and managers.

Tenant Admin approves Windows Agent devices before they can upload data.

Tenant Admin configures monitoring, privacy, retention, language, and region-related tenant settings.

---

# 3. Manager Use Cases

```mermaid
flowchart LR
    Manager((Manager))

    subgraph ManagerScope[Manager Scope]
        UC1[Create employee]
        UC2[Assign employee to own team]
        UC3[Request monitoring session]
        UC4[Provide monitoring justification]
        UC5[Start approved session]
        UC6[Stop session]
        UC7[View team dashboard]
        UC8[View employee timeline]
        UC9[View daily summary]
        UC10[View focus trend]
        UC11[View software usage]
        UC12[View anomaly alerts]
        UC13[Request deep analysis]
        UC14[View screenshot with audit reason]
    end

    Manager --> UC1
    Manager --> UC2
    Manager --> UC3
    Manager --> UC5
    Manager --> UC6
    Manager --> UC7
    Manager --> UC8
    Manager --> UC9
    Manager --> UC10
    Manager --> UC11
    Manager --> UC12
    Manager --> UC13
    Manager --> UC14

    UC3 --> UC4
    UC8 --> UC9
    UC8 --> UC10
    UC8 --> UC11
    UC12 --> UC13
```

## Manager Use Cases

Manager creates employees under assigned teams.

Manager can request monitoring sessions only for employees in assigned teams.

Manager should primarily see summaries, timelines, scores, and alerts.

Raw screenshot access must be authorized and audited.

---

# 4. Employee Use Cases

```mermaid
flowchart LR
    Employee((Employee))

    subgraph EmployeePortal[Employee Transparency Portal]
        UC1[View active monitoring status]
        UC2[View monitoring session history]
        UC3[View session justification]
        UC4[Respond to consent request]
        UC5[View collected data summary]
        UC6[View retention policy]
        UC7[View access history where allowed]
        UC8[Report privacy concern]
        UC9[View agent connection status]
    end

    Employee --> UC1
    Employee --> UC2
    Employee --> UC3
    Employee --> UC4
    Employee --> UC5
    Employee --> UC6
    Employee --> UC7
    Employee --> UC8
    Employee --> UC9
```

## Employee Use Cases

Employee sees monitoring status and transparency information.

Employee can respond to consent requests if tenant policy requires consent.

Employee can report privacy concerns.

Employee cannot access manager dashboard or other employee data.

---

# 5. Windows Agent Use Cases

```mermaid
flowchart LR
    Agent((Windows Agent))

    subgraph AgentSystem[Agent Runtime]
        UC1[Register device]
        UC2[Authenticate device]
        UC3[Send heartbeat]
        UC4[Fetch active monitoring configuration]
        UC5[Show visible monitoring status]
        UC6[Capture activity metadata]
        UC7[Capture screenshot during active session]
        UC8[Apply privacy rules]
        UC9[Compress screenshot]
        UC10[Queue offline upload]
        UC11[Upload activity snapshot]
        UC12[Upload screenshot asset]
        UC13[Stop capture when session ends]
    end

    Agent --> UC1
    Agent --> UC2
    Agent --> UC3
    Agent --> UC4
    Agent --> UC5
    Agent --> UC6
    Agent --> UC7
    Agent --> UC8
    Agent --> UC9
    Agent --> UC10
    Agent --> UC11
    Agent --> UC12
    Agent --> UC13

    UC4 --> UC5
    UC7 --> UC8
    UC8 --> UC9
    UC9 --> UC12
```

## Windows Agent Use Cases

The Agent uploads data only for its assigned employee and active monitoring session.

The Agent must be visible and must stop capture when no active session exists.

---

# 6. AI Worker Use Cases

```mermaid
flowchart LR
    AIWorker((AI Worker))

    subgraph AIProcessing[AI Processing]
        UC1[Consume processing job]
        UC2[Run duplicate detection]
        UC3[Run OCR]
        UC4[Classify app/domain]
        UC5[Classify work category]
        UC6[Calculate focus score]
        UC7[Calculate context switching]
        UC8[Detect idle patterns]
        UC9[Generate time block summary]
        UC10[Generate daily summary]
        UC11[Record usage event]
    end

    AIWorker --> UC1
    AIWorker --> UC2
    AIWorker --> UC3
    AIWorker --> UC4
    AIWorker --> UC5
    AIWorker --> UC6
    AIWorker --> UC7
    AIWorker --> UC8
    AIWorker --> UC9
    AIWorker --> UC10
    AIWorker --> UC11
```

---

# Combined MVP Use Case Diagram

```mermaid
flowchart TB
    PlatformAdmin((Platform Admin))
    TenantAdmin((Tenant Admin))
    Manager((Manager))
    Employee((Employee))
    Agent((Windows Agent))
    AIWorker((AI Worker))

    subgraph Platform[WorkGraph AI]
        Tenant[Create tenant and tenant admin]
        Setup[Create teams and managers]
        Policy[Configure monitoring/privacy/retention]
        People[Create employees]
        Sessions[Request and manage sessions]
        Ingestion[Upload activity data]
        Analysis[Analyze activity]
        Dashboard[View team dashboard]
        Transparency[Employee portal]
        Billing[Usage metering]
        Audit[Audit logging]
    end

    PlatformAdmin --> Tenant
    TenantAdmin --> Setup
    TenantAdmin --> Policy
    Manager --> People
    Manager --> Sessions
    Manager --> Dashboard
    Employee --> Transparency
    Agent --> Ingestion
    AIWorker --> Analysis
    Analysis --> Dashboard
    Ingestion --> Analysis
    Ingestion --> Billing
    Sessions --> Audit
    Dashboard --> Audit
```

---

# Simple Access Matrix

| Area | Platform Admin | Tenant Admin | Manager | Employee | Agent |
|---|---:|---:|---:|---:|---:|
| Create tenant | Yes | No | No | No | No |
| Create tenant admin | Yes | No | No | No | No |
| Create teams | No | Yes | No | No | No |
| Create managers | No | Yes | No | No | No |
| Create employees | No | Optional | Yes | No | No |
| Configure monitoring policy | No | Yes | No | No | No |
| Approve agent device | No | Yes | No | No | No |
| Request monitoring session | No | Optional | Yes | No | No |
| View team dashboard | No | Optional | Own teams | No | No |
| View own transparency portal | No | No | No | Yes | No |
| Upload activity data | No | No | No | No | Yes |
| View raw screenshot | No by default | Policy-based | Policy-based + audited | Own data if allowed | No |

---

# MVP Rule

Keep hierarchy simple:

```text
Platform Admin → Tenant Admin → Manager → Employee
```

Do not introduce Owner, Auditor, Department, Business Unit, or complex enterprise hierarchy until real customers require it.

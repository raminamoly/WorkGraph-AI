# WorkGraph AI - System Explainer Demos

This folder contains small, non-technical animation demos for explaining WorkGraph AI to CEOs, investors, managers, and customers.

Each demo is intentionally simple. Open any `index.html` file directly in a browser. No backend, build tools, or framework are required.

---

## Suggested Presentation Order

1. **01 Big Picture**  
   Explains the whole idea as a simple story: person works, the app observes approved activity, the server understands it, AI summarizes it, and the result comes back.

2. **02 User Journey**  
   Shows what a normal employee experiences step by step: visible app, approved session, activity captured, summary produced, transparency shown.

3. **03 Request Flow**  
   Shows information moving like cards between the employee device, server, AI helper, and dashboard.

4. **04 AI Decision**  
   Shows how AI compares simple clues and turns them into a recommendation or summary.

5. **05 Admin Dashboard**  
   Shows how a manager/admin sees the system: team status, alerts, activity trends, and summaries.

6. **06 Business Value**  
   Explains why the system matters: saves time, reduces mistakes, improves visibility, increases speed, and supports better decisions.

---

## How To Open

Open any file directly:

```text
01-big-picture/index.html
02-user-journey/index.html
03-request-flow/index.html
04-ai-decision/index.html
05-admin-dashboard/index.html
06-business-value/index.html
```

---

## How To Customize

### Labels and Steps

Each demo has its own `script.js` file.

Find the `steps` array and edit titles, descriptions, icons, and labels.

### Colors

Shared colors are in:

```text
shared/styles.css
```

Edit CSS variables at the top.

### Shared Buttons and Animation Helpers

Shared JavaScript helpers are in:

```text
shared/ui.js
```

Each demo uses:

```js
DemoUI.createStepper(...)
```

This provides Play, Pause, Restart, step highlighting, and progress animation.

---

## Design Notes

These demos are not technical architecture diagrams.

They are conceptual explainers using everyday metaphors:

```text
Cards
Bubbles
Timelines
Signals
Summaries
Recommendations
```

Avoid adding technical details like API, JSON, JWT, queue, database, or token unless the audience is technical.

---

## Product Message

The demos should communicate:

```text
WorkGraph AI helps managers understand work patterns.
It is transparent, session-based, auditable, and privacy-aware.
It turns activity into summaries, not surveillance.
```

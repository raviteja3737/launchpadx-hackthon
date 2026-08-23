# Product Requirements Document
## Cross-Sense AI+ Agentic Operations — MVP Version 1

File name: `cross-sense-mvp-v1.prd.md`  
Product: Cross-Sense AI+ Agentic Operations Console  
MVP version: v1  
Target: Hackathon demo / frontend-first MVP  
Related builder prompt: `cross-sense-mvp-v1.prompt.md`  
Status: Ready for code generation

---

## 1. MVP Objective

Build a frontend-first MVP for Cross-Sense AI+ Agentic Operations that demonstrates:

- Interaction with many different types of factory machines.
- Analytics-first viewing of machines, without a traditional dashboard page.
- A working alert system.
- A hacker-style simulation/admin pod to control machine behavior.
- Hard-coded AI responses for demo scenarios.
- Editable AI response rules from the hacker pod.
- Email notification simulation after alerts and actions.
- A worker notification email containing task details, placeholder credentials, and evidence/architecture summary.
- A clean, industrial, beautiful UI that can later connect to a real backend.

This MVP must be buildable by an AI coding agent and must work without a real production backend, real Gmail, real LLM, real machine connection, or real credentials.

---

## 2. Important Rule for the Coding Agent

Use the earlier frontend builder prompt for UI quality, clean architecture, and industrial look.

However, if there is any conflict between the earlier prompt and this PRD, this PRD wins.

Main MVP changes:

1. Do not create a traditional “Dashboard” page.
2. The main operator view should be Analytics / Machines / Alerts / Chat.
3. Add a separate Hacker Pod application.
4. Run the Operator App and Hacker Pod on different ports.
5. Use hard-coded AI responses for MVP, not real LLM calls.
6. Allow the Hacker Pod to modify those hard-coded AI responses.
7. Simulate Gmail/email notifications inside the frontend.
8. Use the recent year, preferably 2026, in all mock dates and analytics.
9. Do not require real credentials. Use placeholders only.

---

## 3. Product Scope

### 3.1 In scope for MVP v1

- Operator frontend app.
- Hacker Pod frontend app.
- Shared mock state/simulation layer.
- Machine list with multiple machine types.
- Machine analytics views.
- Alert system.
- Simple login for hacker.
- Hacker controls to upgrade/downgrade machine performance.
- Hacker controls to turn sensors on/off.
- Hacker controls to edit hard-coded AI responses.
- Simulated email notifications.
- Worker email with placeholder credentials and evidence/architecture summary.
- Hard-coded AI chat responses.
- Clean backend-ready service layer for future API integration.

### 3.2 Out of scope for MVP v1

- Real Gmail sending.
- Real authentication.
- Real database connection.
- Real machine/IoT integration.
- Real camera processing.
- Real LLM API calls.
- Real credentials storage.
- Production-grade security.
- Multi-tenant enterprise features.

---

## 4. Applications / Pods / Ports

The MVP must contain two separate frontend experiences.

### 4.1 Operator App

Port:

```text
http://localhost:3000
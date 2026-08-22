# Factory Storyteller

Cross-Sense AI+ MVP — Implementation Plan
Goal
Build a hackathon-ready factory operations console that demos the Machine #37 story: live degradation → AI detection → investigation → fix → recovery. Frontend-only with mock services.

Key Decisions (From Approved Review)
Stack: Next.js App Router + TypeScript + Tailwind CSS (per PRD — safer, better deployment)
Single app: Hacker Pod lives at /hacker (no second port)
State sync: Zustand + BroadcastChannel API for cross-tab sync
Theme: Light mode default with dark toggle
Scope cuts: No dedicated Missions page, no dedicated Analytics page, no Settings page (demo controls folded into Hacker Pod)
Proposed Changes
Phase 1 — Foundation
[NEW] Project scaffold
npx create-next-app with App Router, TypeScript, Tailwind
Install: recharts, zustand, @tanstack/react-query, lucide-react
[NEW] src/types/index.ts
All TypeScript interfaces: Factory, Mission, Machine, TelemetryPoint, Alert, Investigation, InvestigationStep, AgentProfile, SubAgentRun, ChatMessage, EmailEvent, Approval, WorkOrder, EvidenceItem, ConnectedSource

[NEW] src/services/ — Mock service layer

services/
  mockData.ts          — all seed data (machines, missions, alerts, emails, etc.)
  telemetryService.ts  — live tick simulation, Machine #37 degradation
  machineService.ts    — getMachines, getMachineById, getConnectedSources
  alertService.ts      — getAlerts, acknowledgeAlert
  investigationService.ts — getInvestigations, runInvestigation, approve/reject
  chatService.ts       — sendMessage, rule-based response matching
  emailService.ts      — getEmails, sendEmail, dynamic content from state
  agentService.ts      — getAgentProfiles, spawnSubAgent
Each returns Promises with simulated latency (200–800ms).

[NEW] src/stores/ — Zustand stores

stores/
  simulationStore.ts   — live telemetry values, tick engine, hacker overrides
  uiStore.ts           — theme, role, selected context, sidebar state
  alertStore.ts        — active alerts, acknowledgements
  chatStore.ts         — chat messages, context
  emailStore.ts        — email events, statuses
simulationStore syncs via BroadcastChannel so Hacker Pod tab ↔ Operator tab stay in sync.

[NEW] src/components/layout/

layout/
  Sidebar.tsx          — operator navigation (Overview, Machines, Alerts, Investigations, Chat, Email Trail)
  TopBar.tsx           — app name, factory/mission selector, role switcher, alert count, theme toggle, live indicator
  OperatorLayout.tsx   — wraps operator pages with sidebar + topbar
  HackerLayout.tsx     — minimal dark layout for /hacker (no sidebar)
[NEW] src/components/ui/ — Reusable components

ui/
  Card.tsx, Badge.tsx, Button.tsx, Tabs.tsx, Modal.tsx
  StatCard.tsx         — KPI card with value, trend, color, "what this means" caption
  ChartPanel.tsx       — Recharts wrapper with title + caption
  StatusBadge.tsx      — green/yellow/orange/red with label
  LoadingState.tsx, EmptyState.tsx
Phase 2 — Core Pages (The Demo Story)
[NEW] src/app/page.tsx — Overview
Factory health banner + shift status + live indicator
7 KPI cards (output, cycle time, downtime, machine health, quality, energy, business impact) — all ticking live
Alert banner: "Production down 9.8% in Mission B"
Machine grid: 6 machine cards with sparklines, Machine #37 degrading visually (green → yellow → orange)
Diagnose / Ask AI buttons on each card
[NEW] src/app/machines/page.tsx — Machine List
Table/grid of all 6 machines with status, output, cycle time, vibration, temp, power
Click → machine detail
[NEW] src/app/machines/[machineId]/page.tsx — Machine Detail
Connected sources panel (13 sources: CCTV, vibration sensor, temp sensor, etc.)
Live telemetry charts (4 charts: vibration, cycle time, temp, power)
Evidence panel for Machine #37 (5 evidence items)
AI cost/ROI card (model calls, tokens, estimated cost/savings)
Action buttons: Diagnose, Ask AI, Create Work Order
Maintenance history
[NEW] src/app/alerts/page.tsx — Alerts
Alert list with severity badges, confidence, source signals
4 pre-seeded alerts (production drop, vibration anomaly, cycle time increase, cross-sense correlation)
Status flow: Open → Acknowledged → Investigating → Action Recommended → Resolved
Buttons: Diagnose, Ask AI, Acknowledge, View Evidence, Create Work Order
[NEW] src/app/hacker/page.tsx — Hacker Pod
Simple mock login (any password works)
Machine selector (dropdown of 6 machines)
Preset action buttons: Turn Off, Turn On, Upgrade, Degrade, Inject Vibration, Slow Cycle, Sensor Offline, Restore Normal
KPI direct control panel (nudge output, cycle time, vibration, temp, power)
AI Response editor (view/edit the hardcoded chat responses)
Reset All button
Dark theme, no operator sidebar — visually distinct
[NEW] src/lib/simulation.ts — Live Simulation Engine
Interval-based tick (every 1.5s)
Normal machines: slight random fluctuation around baseline
Machine #37: gradual degradation over time (configurable speed)
Hacker overrides: immediately apply when set
Triggers alerts when thresholds crossed
Drives all KPI card values and chart data
[NEW] src/lib/broadcastSync.ts — Cross-Tab Sync
BroadcastChannel API wrapper
Syncs simulationStore mutations between tabs
Hacker changes machine → Operator tab sees it within 1–2 seconds
Phase 3 — Story Features
[NEW] src/app/investigations/page.tsx — Investigation List
List of investigations with status, confidence, cost, trigger source
[NEW] src/app/investigations/[id]/page.tsx — Investigation Detail
Agent timeline: 6 step cards (Vision → Sensor → Data → Document → Computer → Verification)
Each card: agent name, status, tools used, finding, confidence, cost
Staged reveal: cards appear one by one with delays (simulated agent work)
Conclusion panel: "Machine #37 is the most likely source..." with confidence 84%
Approval panel: Approve / Reject / Ask for More Evidence
Post-approval: simulated execution status (work order created, technician notified, email sent)
[NEW] src/app/email-trail/page.tsx — Email Trail
5 email cards in chronological order (alert → approval → worker → completion → verification)
Email content dynamically reflects current Machine #37 state
Preview modal with full email body, evidence summary, action buttons
Status badges: Draft → Queued → Sent → Approved → Completed
[NEW] src/app/chat/page.tsx — Simplified Chat
Left: context selector + active alerts + quick actions
Center: chat messages with typed cards (analytics result, evidence, diagnosis, approval, email event)
6 hardcoded response patterns (production query, why dropped, diagnose #37, evidence, recommend action, email status)
Suggested questions chips
No right panel (keeping it simple)
Phase 4 — Polish
Theme toggle (light/dark) with localStorage persistence
Status color system (green/yellow/orange/red) consistent everywhere
"What this means" captions on all KPI cards
Responsive layout (works on laptop + projected screen)
Demo reset button in Hacker Pod
Final bug fixes and visual polish
File Structure Summary

cross-sense-mvp/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    (Overview)
│   │   ├── machines/
│   │   │   ├── page.tsx                (Machine list)
│   │   │   └── [machineId]/page.tsx    (Machine detail)
│   │   ├── alerts/page.tsx
│   │   ├── investigations/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── email-trail/page.tsx
│   │   └── hacker/page.tsx
│   ├── components/
│   │   ├── layout/                     (Sidebar, TopBar, layouts)
│   │   ├── ui/                         (Card, Badge, Button, StatCard, etc.)
│   │   ├── overview/                   (KPI grid, machine grid, alert banner)
│   │   ├── machines/                   (MachineCard, TelemetryCharts, etc.)
│   │   ├── alerts/                     (AlertCard, AlertList)
│   │   ├── investigations/             (AgentTimeline, ConclusionPanel, etc.)
│   │   ├── chat/                       (ChatMessage, ChatInput, etc.)
│   │   ├── email/                      (EmailCard, EmailPreview)
│   │   └── hacker/                     (HackerControls, KPIPanel, AIEditor)
│   ├── services/                       (Mock API layer)
│   ├── stores/                         (Zustand stores)
│   ├── types/                          (TypeScript interfaces)
│   └── lib/                            (simulation engine, broadcastSync, utils)
├── tailwind.config.ts
├── next.config.ts
└── package.json
What's NOT Being Built
❌ Missions page (mission info embedded in Overview + Machine cards)
❌ Analytics page (key analytics in Overview KPIs)
❌ Settings page (demo controls in Hacker Pod)
❌ Tour/walkthrough mode
❌ Chat right panel (6 tabs)
❌ Real email/Gmail/OAuth
❌ Real auth, database, LLM, camera, IoT
Verification Plan
Automated
npm run build — TypeScript compilation passes, no errors
npm run lint — no lint errors
Manual
Open Operator App (:3000) — Overview loads with live ticking KPIs
Machine #37 degrades over time (status color changes)
Open Hacker Pod (:3000/hacker) in second tab — degrade Machine #37 → Operator tab reflects change within 2s
Click Diagnose on Machine #37 → Investigation flow runs with staged agent steps
Alerts fire when thresholds crossed
Email Trail shows 5 emails with correct Machine #37 data
Chat responds to 6 suggested questions
Theme toggle works (light ↔ dark)
Responsive on 1280px+ screens

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcf34278-34c3-4267-9a83-3be24369768f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

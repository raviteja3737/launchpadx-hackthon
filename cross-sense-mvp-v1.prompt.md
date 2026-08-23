Build a complete frontend-only, hackathon-ready, industrial-grade web application for a product called “Cross-Sense AI+ Agentic Operations Console”.

The app must demonstrate the following case study scenario:

A smart factory has multiple production missions and machines. During one shift, overall production falls by approximately 10%. Traditional monitoring systems do not report a critical failure. Machine telemetry is mostly within normal thresholds, cameras show no obvious breakdown, and the production dashboard only shows that output has decreased.

The manager asks:
“Find out why production dropped and take the appropriate action.”

The app must show the Cross-Sense AI outcome loop:
Observe → Correlate → Investigate → Verify → Decide → Execute → Monitor → Verify again.

The main story should be based on Machine #37. Machine #37 has a small but persistent vibration anomaly, a gradual increase in cycle time, and a corresponding reduction in output. Camera footage shows longer pauses around the machine. Historical maintenance records contain similar patterns before previous mechanical faults. The AI concludes that Machine #37 is the most likely source of the production loss, with evidence suggesting an emerging mechanical fault rather than a complete failure.

IMPORTANT PRODUCT REQUIREMENTS

This must be frontend-only for now, but it must be built in a backend-ready way.

Do not require a real backend, real database, real Gmail, real LLM API, real camera feed, or real machine connection. All backend-like behavior must be simulated using a clean mock service layer. However, the frontend must be architected so that the mock services can later be replaced with real API endpoints easily.

The frontend must fully work immediately with mock data.

Use this stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts for charts
- Zustand for UI/state management
- TanStack Query for server-state-like data
- Lucide React for icons
- Clean modular component architecture
- Responsive layout
- Dark industrial theme by default
- Beautiful, clean, neat, professional UI
- No overengineering
- No dead buttons
- No empty placeholder pages unless explicitly part of settings future backend connection
- All primary flows must be clickable and functional using mock data

The application must be organized into separate apps/sections/modules. This is very important. The user wants the features arranged in different apps or different sections, not mixed into one messy page.

Create a sidebar navigation with these main apps/sections:

1. Overview
2. Missions
3. Machines
4. Alerts
5. Investigations
6. Analytics
7. Chat
8. Email Trail
9. Settings

The Chat tab must act as a unified command center and must include access to alerts, diagnosis, AI chat, direct analytics, sub-agents, approvals, and email/notification flow.

CORE STORY AND DEMO BEHAVIOR

The factory should have a couple of missions, for example:

- Mission A
- Mission B

Each mission should contain several machines, for example:

- Machine #31
- Machine #32
- Machine #35
- Machine #37
- Machine #41
- Machine #44

Machine #37 should be the main abnormal machine.

The dashboard should have graphs for each mission. The graphs should have values that change every second or every two seconds.

The observer should be able to observe all missions.

If one performance is going down, the user should visually see:

- Some numerical values going up, such as cycle time, vibration, temperature, or power
- Some output/production graphs going down
- Status colors changing while performance goes down

Use colors like:

- Green = healthy
- Yellow = warning
- Orange = risk
- Red = critical

The app should feel like a live operations console.

PAGE 1: OVERVIEW DASHBOARD

Route: /

This is the first page.

It must show a clean dashboard.

Include:

- Factory name
- Shift status
- Overall production health
- Active alert count
- AI system status
- Live update indicator

KPI cards:

- Output
- Cycle Time
- Downtime
- Machine Health
- Quality
- Energy
- Estimated Business Impact

Each KPI card should update live.

Graphs:

- Production output by mission
- Cycle time trend
- Vibration trend
- Temperature trend
- Power consumption trend
- Downtime events

Mission cards:

- Mission A
- Mission B

Each mission card should show:

- Mission name
- Output
- Target
- Efficiency
- Cycle time
- Downtime
- Machine count
- Status color
- Small live chart
- Inspect button
- Diagnose button
- Ask AI button

Machine grid:

Show all machines as cards.

Each machine card should show:

- Machine ID
- Mission
- Status
- Output contribution
- Cycle time
- Vibration
- Temperature
- Power
- Small sparkline or chart
- Inspect button
- Diagnose button
- Ask AI button

Machine #37 should gradually degrade in the demo.

Its behavior should show:

- Output contribution decreasing
- Cycle time increasing
- Vibration increasing slightly
- Status changing from green to yellow to orange

Top-level alert banner:

Example:

“Production down 9.8% in Mission B. No critical machine failure detected.”

Buttons:

- Diagnose
- Ask AI
- View Alerts

PAGE 2: MISSIONS

Route: /missions

Show a list or grid of missions.

Each mission should show:

- Mission ID
- Mission name
- Production line
- Machines
- Output
- Target
- Efficiency
- Downtime
- Active alerts
- Status
- Inspect Mission button
- Diagnose button
- Ask AI button

Route: /missions/[missionId]

Mission detail page should show:

- Mission KPIs
- Machines inside that mission
- Mission production graph
- Cycle time graph
- Downtime graph
- Active alerts related to the mission
- Direct analytics summary for the mission
- AI insights panel
- Diagnose button
- Ask AI button

For Mission B, show that Machine #37 is suspected.

PAGE 3: MACHINES

Route: /machines

Show all machines in a table or card grid.

Each machine row/card should show:

- Machine ID
- Mission
- Status
- Output
- Cycle time
- Vibration
- Temperature
- Power
- Last updated
- Inspect button

Route: /machines/[machineId]

Machine detail page is very important.

When the user clicks and inspects one machine, they must see services and sources connected to it. Do not only show agents. Show connected operational services and evidence sources.

For Machine #37, show connected sources such as:

- CCTV
- Vibration sensor
- Temperature sensor
- Power sensor
- PLC logs
- MES data
- ERP data
- Maintenance history
- SOP documents
- Spare parts inventory
- Work order system
- Shift logs
- Operator notes

Each connected source/service card should show:

- Source name
- Connection status
- Last updated
- Latest signal summary
- Evidence status
- View evidence button

Machine detail page should also show:

- Live telemetry charts
- Machine health status
- Cycle time trend
- Vibration trend
- Temperature trend
- Power trend
- Output contribution
- Active alerts
- Recent investigations
- Assigned agent profiles
- Recommended actions
- Maintenance history
- Evidence panel

Include buttons:

- Diagnose
- Ask AI
- Create Work Order
- View Maintenance History
- Monitor After Action

For Machine #37, show evidence like:

- Vibration anomaly detected
- Cycle time increased from 42s to 49s
- Camera shows longer pauses around machine
- Maintenance history contains similar pattern before mechanical fault
- Output contribution reduced

Also show AI cost/usage if an investigation is running or completed:

- Model calls
- Tool calls
- Tokens used
- Estimated API cost
- Estimated business impact
- Estimated savings

This addresses the requirement that when an AI workflow starts, the AI agent uses some money/cost. Show this as cost/ROI, not as a payment system.

PAGE 4: ALERTS

Route: /alerts

Create an alerts app/section.

Alert list should show:

- Alert ID
- Severity
- Time
- Mission
- Machine
- Title
- Description
- Status
- Confidence
- Source signals

Each alert should have buttons:

- Diagnose
- Ask AI
- Acknowledge
- View Evidence
- Create Work Order

Example alerts:

1. Production drop detected in Mission B
2. Machine #37 vibration anomaly
3. Machine #37 cycle time increasing
4. Cross-sense correlation detected

Severity levels:

- Info
- Warning
- Critical

Status levels:

- Open
- Acknowledged
- Investigating
- Action Recommended
- Resolved

The alert system should be simulated but feel real.

PAGE 5: INVESTIGATIONS

Route: /investigations

Show investigations list.

Each investigation should show:

- Investigation ID
- Trigger source
- Mission
- Machine
- Status
- Confidence
- Started time
- Estimated cost
- View button

Route: /investigations/[investigationId]

Investigation detail page must show the Cross-Sense AI investigation timeline.

Show these agents/steps:

1. Vision Agent
   - Reviews camera footage
   - Identifies abnormal operator behavior, machine motion, queues, or visible changes

2. Sensor Agent
   - Analyzes vibration, temperature, power, and other telemetry against historical patterns

3. Data Agent
   - Queries production databases to compare cycle time, output, downtime, and machine performance

4. Document Agent
   - Checks manuals, SOPs, maintenance history, and previous incident records

5. Computer Agent
   - Uses authorized business applications such as MES, ERP, or maintenance software

6. Verification Agent
   - Cross-checks evidence and tests whether the proposed explanation is supported by multiple independent signals

Each investigation step card should show:

- Agent name
- Status
- Tools used
- Data source
- Finding
- Confidence
- Cost/token usage
- Evidence button

Investigation conclusion panel:

Example:

“Machine #37 is the most likely source of the production loss. Evidence suggests an emerging mechanical fault rather than a complete failure.”

Show:

- Confidence score
- Operational impact
- Evidence summary
- Recommended action
- Approval status

Recommended actions:

- Create maintenance work order
- Assign technician
- Check spare part availability
- Notify supervisor
- Monitor machine after intervention
- Verify production recovery

Approval panel:

Buttons:

- Approve
- Reject
- Ask for More Evidence

After approval, simulate execution:

- Work order created
- Technician notified
- Email sent
- Machine monitored
- Production recovery begins

Show verification result after simulated completion:

- Production recovered
- Cycle time normalized
- Vibration reduced
- Machine status improved

PAGE 6: ANALYTICS

Route: /analytics

Create a Direct Analytics app/section.

This section must provide analytics without AI sitting between the human and machines.

The data should appear to come directly from the production database.

Show a clear badge:

“Direct Database Query”
“No AI-generated numbers”

Include analytics cards and charts for:

- Production this month
- Production last month
- Month-over-month comparison
- Mission-wise production
- Machine-wise production
- Downtime by machine
- Cycle time trend
- Quality rate
- OEE
- Energy consumption
- Target vs actual

Example values:

This month: 128,540 units
Last month: 141,220 units
Change: -8.98%

Mission comparison:

- Mission A: 72,300 units
- Mission B: 56,240 units
- Mission B below target by 10.2%

Machine performance:

- Machine #31: normal
- Machine #32: normal
- Machine #35: minor downtime
- Machine #37: reduced output
- Machine #41: normal
- Machine #44: normal

Each analytics result should show:

- Query name
- Source system
- Time range
- Result
- Chart
- Last refreshed time
- AI explanation optional button

Important:

The raw analytics numbers must be presented as direct database results.

AI may only explain the data if the user clicks “Explain with AI”. Do not mix AI-generated numbers with direct database numbers.

Include mission-specific insights:

For example:

Mission B insight:

“Mission B output is below target. The largest contributing factor is Machine #37 reduced cycle efficiency.”

PAGE 7: CHAT

Route: /chat

This is extremely important.

Create a new tab called Chat.

All major capabilities must be accessible from this Chat tab:

- Alerts
- Diagnose
- AI assistant
- Direct analytics
- Mission insights
- Machine insights
- Sub-agent spawning
- Agent profiles
- Approvals
- Gmail/email notification flow
- Investigation status
- Evidence viewing

The Chat page should be a command center.

Layout:

Left panel:

- Context selector
  - Factory
  - Mission
  - Machine
- Active alerts
- Active investigations
- Quick actions
  - Diagnose
  - Ask AI
  - Generate analytics report
  - Start investigation

Center panel:

- Chat conversation with main AI agent
- Chat input
- Suggested questions
- Special message cards

Right panel:

Use tabs:

1. Context
2. Analytics
3. Evidence
4. Sub-Agents
5. Approvals
6. Email

Context tab:

Show selected factory/mission/machine summary:

- Status
- Output
- Cycle time
- Vibration
- Temperature
- Power
- Active alerts
- Connected sources

Analytics tab:

Show direct analytics cards:

- Production this month
- Production last month
- Month-over-month comparison
- Mission output
- Machine downtime
- Cycle time trend

Evidence tab:

Show Cross-Sense evidence cards:

- Sensor evidence
- Camera evidence
- MES evidence
- Maintenance history evidence
- SOP evidence

Sub-Agents tab:

Show running and completed sub-agents.

Approvals tab:

Show pending approvals:

- Work order approval
- Email approval
- Maintenance action approval
- Agent permission approval

Email tab:

Show email timeline:

- Analytics email
- Owner approval email
- Worker notification email
- Completion email

CHAT BEHAVIOR

The chat must support different message types:

1. User message
2. Main agent message
3. Direct analytics result card
4. Sub-agent spawn card
5. Evidence card
6. Diagnosis summary card
7. Approval card
8. Work order card
9. Email event card
10. Error/clarification message

The main AI agent must behave like an orchestrator.

If the user asks a simple analytics question, such as:

- How much production did we get this month?
- Compare this month to last month
- What is Mission B output?
- What is Machine #37 cycle time?

Then the system should return a Direct Analytics card from the mock production database.

Show:

- Source: Production Database
- AI used: No
- Query result
- Chart

If the user asks a complex question, such as:

- Identify which mission is responsible for the production loss
- Diagnose Machine #37
- Why did production drop this month?
- Which machine caused the issue?
- Investigate Mission B performance

Then the main agent must spawn one or more sub-agents.

SUB-AGENT REQUIREMENT

This is a major feature.

The main agent should not silently answer complex questions. It must visibly launch a specific sub-agent for that topic.

Create agent profiles for the factory, missions, and machines.

Example agent profiles:

1. Production Analytics Agent
   - Scope: factory/mission analytics
   - Tools: production DB, MES, KPI service
   - Permission: read only

2. Machine Health Diagnostic Agent
   - Scope: specific machine
   - Tools: vibration sensor, temperature sensor, power sensor, maintenance history
   - Permission: read and recommend

3. Vision Operations Agent
   - Scope: camera evidence
   - Tools: CCTV snapshots, video metadata
   - Permission: read only

4. Maintenance Planning Agent
   - Scope: work orders and spare parts
   - Tools: ERP, maintenance system, SOP documents
   - Permission: draft work order

5. Notification Agent
   - Scope: Gmail/email notifications
   - Tools: email composer, notification service
   - Permission: send after approval

6. Verification Agent
   - Scope: post-action verification
   - Tools: telemetry, production DB, alert history
   - Permission: read only

For Machine #37, assign a special profile:

Machine #37 Diagnostic Agent

Scope:

- Machine #37
- Mission B

Tools:

- Vibration sensor
- Temperature sensor
- Power sensor
- MES data
- Maintenance history
- CCTV evidence

When the user asks a complex question, show a sub-agent spawn card.

Example:

User asks:

“Identify why Mission B production dropped.”

Main agent replies:

“This is a complex operational question. I will spawn a Production Analytics Agent and a Machine Health Diagnostic Agent.”

Then show sub-agent cards:

Sub-Agent 1:

- Name: Production Analytics Agent
- Status: Running
- Scope: Mission B
- Tools: Production DB, MES
- Model provider: selected provider
- Cost: $0.02
- Progress: Querying mission output

Sub-Agent 2:

- Name: Machine Health Diagnostic Agent
- Status: Running
- Scope: Machine #37
- Tools: vibration, temperature, maintenance history
- Model provider: selected provider
- Cost: $0.03
- Progress: Analyzing sensor patterns

After sub-agents complete, the main agent should consolidate the result.

Example final answer:

“Mission B production dropped by 9.8%. The most likely cause is Machine #37. Evidence shows vibration anomaly, cycle time increase, camera pauses, and matching maintenance history. Confidence: 84%. Recommended action: create maintenance work order and inspect drive assembly.”

The user must be able to ask questions about the agent and diagnosis.

Example questions:

- Why do you think Machine #37 is the cause?
- What evidence do you have?
- How confident are you?
- What are alternative explanations?
- What action do you recommend?
- What happens if we do nothing?
- Which sub-agent found this?
- What model provider is being used?
- How much did this investigation cost?
- Is the spare part available?
- Who should be notified?

The chat should show explainable answers with evidence.

PAGE 8: EMAIL TRAIL

Route: /email-trail

Create an Email Trail app/section.

This must simulate a Gmail-like notification workflow.

Do not send real emails. Simulate them cleanly.

The email workflow must support this flow:

1. When analytics or an alert comes, an email goes to the user/owner.
2. After the owner approves the recommended action, another email goes to the worker working nearby or the assigned technician.
3. After the worker completes the task, another email goes to the main workers/supervisors/owner.

Email types:

1. Analytics/Alert Email
2. Owner Approval Email
3. Worker Notification Email
4. Completion Email
5. Verification Summary Email

Email list should show:

- Email ID
- Type
- Trigger
- From
- To
- CC
- Subject
- Status
- Time
- Related investigation
- Related machine
- Preview button

Email statuses:

- Draft
- Queued
- Sent
- Approved
- Completed
- Failed

Email preview modal should show:

- Subject
- To
- CC
- Body
- Evidence summary
- Related action buttons

Example Email 1:

Subject: Production drop detected in Mission B

To: owner@factory.com

Body:

“Production in Mission B dropped by 9.8%.

Machine #37 shows correlated signals:
- Vibration anomaly
- Cycle time increase
- Output reduction

Recommended action:
Start diagnostic investigation.”

Example Email 2:

Subject: Approval required: Maintenance work order for Machine #37

To: owner@factory.com

Body:

“Cross-Sense AI recommends creating a maintenance work order for Machine #37.

Confidence: 84%
Estimated impact: 10% production loss
Recommended action: Inspect drive assembly and replace worn component if required.

Please approve or reject.”

Buttons:

- Approve
- Reject

Example Email 3:

Subject: Assigned: Inspect Machine #37

To: technician@factory.com

Body:

“A maintenance task has been assigned for Machine #37.

Issue: Emerging mechanical fault
Evidence: Vibration anomaly, cycle time increase, camera pauses
Action: Inspect drive assembly
Priority: High”

Example Email 4:

Subject: Machine #37 maintenance completed

To: owner@factory.com, supervisor@factory.com

Body:

“Maintenance for Machine #37 has been completed.

Action taken: Replaced worn bearing and recalibrated drive assembly.
Current status: Monitoring
Production recovery: In progress”

The Email Trail page must also be accessible inside the Chat tab through the Email panel.

PAGE 9: SETTINGS

Route: /settings

Create a Settings app/section.

It must look industrial-grade.

Settings sections:

1. Model Providers
2. Agent Profiles
3. Approval Policies
4. Gmail/Notification Settings
5. Roles and Permissions
6. Audit Log
7. Demo Controls

Model Providers section:

Allow the user to change model provider settings.

Fields:

- Provider
  - OpenAI
  - Anthropic
  - Azure OpenAI
  - Local Model
  - Custom Endpoint
- Model name
- Temperature
- Max tokens
- Tool use enabled
- Confidence threshold
- Cost limit
- Approval mode
  - Human in loop
  - Auto recommend
  - Restricted execute

Show current active provider.

This should be simulated, but the UI must make it look like the model provider can be changed.

Agent Profiles section:

Show editable-looking agent profile cards.

Each profile card should show:

- Profile name
- Scope
- Allowed tools
- Permissions
- Default model provider
- Cost limit
- Confidence threshold
- Enabled/disabled toggle

Approval Policies section:

Show which actions require approval:

- Create work order
- Send worker notification
- Stop machine
- Replace part
- Execute computer-use action
- Send external email

Gmail/Notification Settings section:

Show simulated Gmail connection.

Fields:

- Connected Gmail account
- From address
- Owner email
- Technician email
- Supervisor email
- Email templates
- Enable analytics email
- Enable approval email
- Enable worker notification email
- Enable completion email

Show a button:

“Connect Gmail”

But make it simulated. Do not implement real OAuth.

Roles and Permissions section:

Show roles:

- Owner
- Supervisor
- Technician
- Observer

Add a simple role switcher in the top bar if possible.

Audit Log section:

Show simulated audit log entries:

- Alert generated
- Investigation started
- Sub-agent spawned
- Evidence retrieved
- Recommendation created
- Approval granted
- Work order created
- Email sent
- Task completed
- Verification completed

Demo Controls section:

Add demo simulation buttons:

- Reset demo
- Start normal production
- Trigger production drop
- Trigger Machine #37 anomaly
- Start investigation
- Complete investigation
- Generate approval
- Approve action
- Send worker email
- Mark worker task complete
- Verify recovery

This is very useful for hackathon demonstration.

GLOBAL TOP BAR

The top bar should include:

- App name
- Factory selector
- Mission selector
- Role switcher
- Model provider indicator
- Alert count
- Live status indicator
- AI status
- Settings shortcut

FRONTEND ARCHITECTURE REQUIREMENTS

Use a clean, modular, backend-ready architecture.

Do not put mock data directly inside components.

Create a service layer.

The flow should be:

UI Component → Hook/Store → Service → Mock API Adapter → Later Real Backend API

Create mock services for:

- telemetryService
- machineService
- missionService
- alertService
- investigationService
- analyticsService
- chatService
- agentService
- emailService
- settingsService
- auditService

Each service should return promises and simulate API latency.

Create TypeScript types for:

- Factory
- Mission
- Machine
- TelemetryPoint
- Kpi
- Alert
- Investigation
- InvestigationStep
- AgentProfile
- SubAgentRun
- ChatMessage
- ChatContext
- AnalyticsResult
- EmailEvent
- Approval
- WorkOrder
- AuditLogEntry
- ModelProviderSettings
- ConnectedSource
- EvidenceItem

Create a mock API layer with endpoint-like functions.

Examples:

- getOverviewKpis()
- getMissions()
- getMissionById()
- getMachines()
- getMachineById()
- getMachineTelemetry()
- getConnectedSources()
- getAlerts()
- acknowledgeAlert()
- startDiagnosis()
- getInvestigations()
- getInvestigationById()
- approveInvestigationAction()
- rejectInvestigationAction()
- getAnalyticsSummary()
- getMonthComparison()
- getMissionPerformance()
- getMachinePerformance()
- sendChatMessage()
- spawnSubAgent()
- getSubAgents()
- getEmails()
- sendEmail()
- approveEmailAction()
- completeWorkerTask()
- getModelProviderSettings()
- updateModelProviderSettings()
- getAgentProfiles()
- updateAgentProfile()
- getAuditLog()

Design these as if they can later be replaced by real HTTP endpoints.

Example future endpoints:

- GET /api/overview/kpis
- GET /api/missions
- GET /api/missions/:missionId
- GET /api/machines
- GET /api/machines/:machineId
- GET /api/machines/:machineId/telemetry
- GET /api/alerts
- POST /api/alerts/:alertId/diagnose
- GET /api/investigations
- POST /api/investigations
- POST /api/investigations/:investigationId/approve
- GET /api/analytics/production-summary
- POST /api/chat
- POST /api/chat/spawn-subagent
- GET /api/emails
- POST /api/emails/send
- GET /api/settings/model-providers
- PUT /api/settings/model-providers

But for now, all of these must be mocked in the frontend.

LIVE DATA SIMULATION

Implement a telemetry simulator.

It should update data every 1 to 2 seconds.

Values to update:

- Output
- Cycle time
- Vibration
- Temperature
- Power
- Machine status
- Mission efficiency
- Alert count
- KPI values

Machine #37 should degrade gradually.

The dashboard should feel alive.

Use smooth chart updates.

Do not make the UI flicker too much.

CHAT MOCK BEHAVIOR

The chat must work without a real LLM.

Use rule-based/mock responses.

If user asks about production analytics:

Return direct analytics card.

If user asks why production dropped:

Spawn sub-agents and return investigation summary.

If user asks about Machine #37:

Return Machine #37 evidence card.

If user asks about cost:

Return agent usage/cost card.

If user asks to approve action:

Return approval card.

If user asks about email:

Return email event card.

Suggested chat questions:

- What is production this month?
- Compare this month to last month
- Why did production drop?
- Which mission is underperforming?
- Diagnose Machine #37
- What evidence do you have?
- What action do you recommend?
- Create work order
- Send approval email
- What is the estimated cost?
- Which sub-agents are running?
- Verify production recovery

DESIGN REQUIREMENTS

The UI must look industrial-grade, clean, neat, and professional.

Use:

- Dark theme
- Rounded cards
- Subtle borders
- Soft shadows
- Clear typography
- Compact KPI cards
- Status badges
- Color-coded alerts
- Live charts
- Minimal clutter
- Strong visual hierarchy

Color meaning:

- Green: healthy
- Yellow: warning
- Orange: risk
- Red: critical
- Blue: AI/agent activity
- Purple: verification
- Gray: neutral/info

Use icons consistently.

Use reusable components:

- Card
- Badge
- Button
- Tabs
- Modal
- Table
- Stat card
- Chart panel
- Empty state
- Loading state
- Toast notification

BUTTONS AND ACTIONS

Every major object should have quick actions.

For mission:

- Inspect
- Diagnose
- Ask AI

For machine:

- Inspect
- Diagnose
- Ask AI
- Create Work Order

For alert:

- Diagnose
- Ask AI
- Acknowledge
- View Evidence

For investigation:

- View
- Approve
- Reject
- Ask for More Evidence

For email:

- Preview
- Approve
- Mark Completed

IMPORTANT: DIAGNOSE BUTTON

The Diagnose button must start an investigation flow.

When clicked:

- Create a mock investigation
- Show loading/running state
- Open investigation detail or investigation panel
- Show agent steps
- Show evidence being collected
- Show final recommendation
- Show approval panel

IMPORTANT: AI BUTTON

The AI button must open the Chat tab or chat drawer with context already selected.

For example:

If clicked on Machine #37, the chat context should be:

- Factory A
- Mission B
- Machine #37

If clicked on Mission B, the chat context should be:

- Factory A
- Mission B

If clicked on an alert, the chat context should include that alert.

IMPORTANT: DIRECT ANALYTICS REQUIREMENT

The app must include analytics without AI sitting between the human and machines.

This means:

- Production numbers
- Monthly comparisons
- Mission analytics
- Machine analytics
- Downtime analytics
- Cycle time analytics

must be shown as direct production database results.

Show source labels:

- Source: Production Database
- Query: monthly_production_summary
- AI Used: No

AI may explain the data only if the user explicitly asks for explanation or clicks “Explain with AI”.

IMPORTANT: GMAIL REQUIREMENT

Simulate Gmail notification flow.

Do not implement real Gmail sending.

But the UI should feel like a real email/notification system.

The flow must be:

1. Analytics/alert email to owner/user
2. Owner approval email
3. Worker notification email after approval
4. Completion email after worker completes task
5. Verification summary email

These emails must appear in:

- Email Trail page
- Chat panel Email tab
- Investigation detail page
- Machine detail page if relevant

IMPORTANT: SUB-AGENT REQUIREMENT

The main agent must spawn sub-agents for complex questions.

The sub-agent must be visible.

The sub-agent must have:

- Name
- Profile
- Scope
- Status
- Tools
- Model provider
- Progress
- Findings
- Confidence
- Cost
- Start time
- End time

The main agent should ask the sub-agent and then consolidate the answer.

The user should be able to inspect each sub-agent.

IMPORTANT: AGENT PROFILE REQUIREMENT

Assign agent profiles to specific factories, missions, or machines.

Examples:

- Factory-level Production Analytics Agent
- Mission-level Operations Agent
- Machine-level Diagnostic Agent
- Machine #37 special diagnostic profile

The main agent should choose the correct profile based on the question.

IMPORTANT: MODEL PROVIDER REQUIREMENT

The app must allow changing model providers in Settings.

The selected provider should appear in:

- Chat
- Sub-agent cards
- Investigation steps
- Settings

This is frontend-only simulation, but it must be structured so backend can later use the selected provider.

IMPORTANT: BACKEND READINESS

The frontend must be easy to connect to a backend later.

Do not hardcode fake logic inside components where possible.

Use service functions.

Use TypeScript interfaces.

Use clear mock data files.

Use replaceable mock adapters.

Make it easy to replace:

```ts
mockApi.getAlerts()
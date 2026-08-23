# 🖥️ Cross-Sense AI+ | Operator Console & Hacker Pod (Web App)

> **Web Application Module for Cross-Sense AI+ Cyber-Physical Industrial Operating System**  
> *Built with React 19, TanStack Start & Router, Tailwind CSS v4, Lucide Icons, Recharts, Zustand, and LiveKit WebRTC.*

For the complete project overview, system architecture diagrams, voice AI agents, and setup guides, see the **[Master Repository README](../README.md)**.

---

## 🌟 Overview

This subproject provides the Next-Gen Operator Command Cockpit and Chaos Engineering Hacker Pod:

- **Factory Overview Dashboard**: Real-time throughput metrics (chips/hr), yield percentages, power consumption (kW), oil temperature, and live machine health status.
- **ChipLine Visualization**: Continuous status ribbon for line speed, yield, and thermal stability.
- **Live Multimodal Voice Agent (Gemini 3.1 Live)**: Embedded WebRTC voice widget to converse with the factory floor copilot.
- **Multi-Agent Investigation Timeline**: Step-by-step root-cause diagnostics (Vision, Sensor, Data, SOP Document, and CV Verification Agents) with human-in-the-loop approval actions.
- **Hacker Pod (`/hacker`)**: Real-time chaos engineering pod to inject vibration surges, throttle cycle times, trigger sensor dropouts, and edit AI reasoning matrices with zero-latency `BroadcastChannel` synchronization.
- **Audit & Email Trail (`/email-trail`)**: Dynamic work order and notification logs integrated with Resend API for automated technician dispatch.

---

## 🚀 Quickstart

### 1. Install Dependencies

```bash
# Using Bun (Recommended)
bun install

# Or using npm
npm install
```

### 2. Configure Environment

Ensure `.env` in this directory or the root directory contains your API keys:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
ALERT_RECIPIENT_EMAIL=your-email@company.com
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Development Server

```bash
bun dev
# or: npm run dev
```

Visit:
- **Operator Console**: [http://localhost:3000](http://localhost:3000)
- **Hacker Pod**: [http://localhost:3000/hacker](http://localhost:3000/hacker)
- **Multi-Agent Investigations**: [http://localhost:3000/investigations/inv-101](http://localhost:3000/investigations/inv-101)
- **Email & Work Order Trail**: [http://localhost:3000/email-trail](http://localhost:3000/email-trail)

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **UI Library**: React 19, Radix UI Primitives, Tailwind CSS v4, Lucide React
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with HTML5 `BroadcastChannel` cross-tab state syncing
- **Charts & Telemetry**: [Recharts](https://recharts.org/)
- **Voice & Real-Time Media**: [LiveKit Client SDK](https://livekit.io/)
- **Validation**: [Zod](https://zod.dev/)

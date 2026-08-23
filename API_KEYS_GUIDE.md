# 🔑 API Keys & Environment Configuration Guide

This guide details all API keys and environment variables used by the **Cross-Sense AI+ Agentic Operations** platform, where to obtain them, and how to configure them in your `.env` file.

---

## 📁 Quick Setup

1. Open the [`.env`](file:///c:/Users/ravit/OneDrive/Desktop/launchpadx%20hackthon/launchpadx-hackthon-main/.env) file in the project root directory.
2. Paste your API keys into the corresponding variables.
3. Save the file and restart the development server (`bun dev` or `npm run dev`).

---

## 🛠️ Required & Optional API Keys

### 1. Resend API Key (`RESEND_API_KEY`) — **Recommended**
- **Purpose**: Powers real-time email dispatch when machines encounter critical anomalies, degradation, or when sub-agents file work orders.
- **Where to get it**:
  1. Sign up or log in at [Resend](https://resend.com).
  2. Navigate to **API Keys** (`https://resend.com/api-keys`).
  3. Click **Create API Key** with **Full access** or **Sending access**.
  4. Copy the key (starts with `re_...`) and paste it into `RESEND_API_KEY=` in `.env`.
- **Sender Domain**:
  - For testing/free tier, Resend allows sending from `onboarding@resend.dev` to the email registered on your Resend account.
  - To send to any recipient, verify your custom domain in the Resend dashboard.

### 2. Alert Recipient Email (`ALERT_RECIPIENT_EMAIL`)
- **Purpose**: Target email address where machine anomaly reports and operator action notices will be sent.
- **Default value**: `257r1a6704@cmrtc.ac.in`
- **Configuration**: Change `ALERT_RECIPIENT_EMAIL=your-email@example.com` in `.env` to receive alerts in your own inbox.

### 3. Lovable Gateway Key (`LOVABLE_API_KEY`) — **Optional**
- **Purpose**: Used if you are deploying or connecting through Lovable's connector gateway (`connector-gateway.lovable.dev`).
- **Where to get it**: Provided in Lovable project settings under connected integrations.
- *Note*: If left blank, the app directly calls the official Resend API (`api.resend.com`).

### 4. Google Gemini API Key (`GEMINI_API_KEY`) — **Optional / AI Integration**
- **Purpose**: Powers AI multi-agent orchestration (Vision Agent, Sensor Agent, Data Agent, Document Agent, Verification Agent) and live chat reasoning.
- **Where to get it**:
  1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
  2. Click **Create API Key**.
  3. Paste into `GEMINI_API_KEY=` in `.env`.

### 5. OpenAI API Key (`OPENAI_API_KEY`) — **Optional / AI Integration**
- **Purpose**: Alternate model provider for GPT-4o / reasoning models.
- **Where to get it**: [OpenAI API Keys](https://platform.openai.com/api-keys).
- Paste into `OPENAI_API_KEY=` in `.env`.

---

## 📝 Example `.env` File Format

```env
# Email Notifications
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
ALERT_RECIPIENT_EMAIL=your-email@example.com
LOVABLE_API_KEY=

# AI & LLM Providers
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...

# Application Settings
PORT=3000
VITE_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🧪 Verifying Your Setup

1. Start the application:
   ```bash
   bun dev
   # or
   npm run dev
   ```
2. Open `http://localhost:3000` in your browser.
3. Open the **Hacker Pod** (`http://localhost:3000/hacker`) or adjust Machine #37 sliders to trigger a warning/critical condition.
4. Check the notification toast in the UI and inspect your email inbox for the alert notification.

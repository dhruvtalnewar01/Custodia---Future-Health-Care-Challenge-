# CUSTODIA Production Deployment Guide on Vercel

This guide outlines the exact, step-by-step procedure to deploy **CUSTODIA (Autonomous Screening-to-Care Clinical Custody Platform)** to Vercel with zero friction, optimized edge performance, and production reliability.

---

## 1. Architecture Overview on Vercel

CUSTODIA is architected as a monorepo consisting of:
* **Frontend**: Next.js 15.1.6 App Router with React 19, Tailwind CSS, Three.js 3D WebGL anatomical rendering, WebCrypto Subtle ECDSA P-256 digital signatures, and responsive glassmorphism clinical cockpits.
* **Serverless AI Handlers**: Native Next.js App Router Edge/Serverless Route Handlers (`/api/ai/companion-chat` and `/api/navigator/chat`) running directly on Vercel with OpenAI GPT-4o integration.
* **Client-Side Clinical Engine**: Full autonomous custody state machine, demographic cohort simulators, and local Live SaaS Mode with persistent browser storage.
* **Optional Remote Backend**: Next.js automatically rewrites `/api/*` routes to an external FastAPI backend if `BACKEND_URL` is configured in your Vercel environment variables.

---

## 2. Deploying via Vercel Web Dashboard (Recommended)

### Step 1: Log in to Vercel
1. Navigate to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** > **Project** (or visit [vercel.com/new](https://vercel.com/new)).

### Step 2: Import the GitHub Repository
1. In the **Import Git Repository** list, find:
   ```text
   dhruvtalnewar01/Custodia---Future-Health-Care-Challenge-
   ```
2. Click **Import**.

### Step 3: Configure Project Settings
In the **Configure Project** screen:

1. **Project Name**: `custodia-healthcare` (or your preferred name).
2. **Framework Preset**: **Next.js** (auto-detected).
3. **Root Directory**:
   * Click **Edit** next to Root Directory.
   * Select `frontend` and click **Continue**.
   *(Note: If you leave it as `./`, the pre-configured root `vercel.json` and `package.json` will automatically build the `frontend` directory as well).*
4. **Build and Output Settings**:
   * Leave default (Next.js automatically compiles into `.next`).

### Step 4: Configure Environment Variables
Expand the **Environment Variables** section and configure the following:

| Variable Name | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `OPENAI_API_KEY` | Recommended | `sk-proj-...` | Powers the live GPT-4o Patient Care Companion and Clinical Navigator. |
| `BACKEND_URL` | Optional | `https://your-fastapi-backend.onrender.com` | Remote FastAPI instance (if hosted separately on Render, Railway, or Fly.io). |
| `NEXT_PUBLIC_API_URL` | Optional | `https://your-fastapi-backend.onrender.com` | Alternative public API target for client-side direct requests. |

*(Note: If `OPENAI_API_KEY` is not provided, the platform automatically activates high-fidelity clinical fallback responses without throwing errors).*

### Step 5: Click Deploy
Click **Deploy**. Vercel will install dependencies, run the Next.js production build, optimize static and serverless routes, and provide your live production URL (e.g., `https://custodia-healthcare.vercel.app`).

---

## 3. Deploying via Vercel CLI

If you prefer using the command line:

```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Log in to Vercel
vercel login

# 3. Deploy from the repository root
vercel

# Follow the interactive prompts:
# ? Set up and deploy "~/Custodia---Future-Health-Care-Challenge-"? [Y/n] y
# ? Which scope do you want to deploy to? <Your Account>
# ? Link to existing project? [y/N] n
# ? What's your project's name? custodia-healthcare
# ? In which directory is your code located? frontend
# ? Want to modify these settings? [y/N] n

# 4. Deploy to production
vercel --prod
```

---

## 4. Post-Deployment Verification Checklist

Once your deployment is live, verify the following core modules:

* [ ] **Landing Hero Page** (`/`): Verify the full-viewport hero, interactive headline, and navigation buttons.
* [ ] **Persona Gateway / Login** (`/login`): Test switching between clinical personas (CMO, PCP, Specialist, Care Navigator, Patient).
* [ ] **Clinical Workstation** (`/workstation`): Verify queue filtering, demographic cohorts, and click **Switch to Live SaaS Mode** to test creating a live case.
* [ ] **Care Companion** (`/companion/LOOP-UAE-401`): Test the interactive 3D WebGL anatomical model, and message the AI Care Companion chatbot (*"What does BI-RADS 4 mean?"*) to verify the strict 1-to-2 line response.
* [ ] **Cryptographic Audit Ledger** (`/ledger`): Test the RFC 8785 canonical hash verification, Bit-Flip Tamper Simulation, and one-tap cryptographic restoration.
* [ ] **Population Health Command Center** (`/command`): Verify executive KPI cards, conversion funnel, and equity heatmaps.
* [ ] **Referral Clearinghouse** (`/referrals`): Test the Two-Phase Handshake and WebCrypto ECDSA clinician digital signatures.

---

## 5. Troubleshooting & FAQ

#### Q: How does the AI Chatbot work without a Python backend on Vercel?
Next.js App Router includes serverless route handlers at `/api/ai/companion-chat` and `/api/navigator/chat`. These execute on Vercel Serverless Functions using standard Node.js runtime, connecting directly to OpenAI GPT-4o using your `OPENAI_API_KEY`.

#### Q: Can I link an external FastAPI backend later?
Yes. Deploy your `backend/` folder to Render, Railway, Fly.io, or AWS ECS, and then in your Vercel Project Settings > Environment Variables, add:
```text
BACKEND_URL=https://your-backend-service.railway.app
```
Next.js will automatically proxy all `/api/*` calls to your external backend.

#### Q: Do I need to re-deploy when I push to GitHub?
Vercel automatically sets up CI/CD webhooks on your GitHub repository. Every push to the `main` branch triggers an automated build and zero-downtime deployment.

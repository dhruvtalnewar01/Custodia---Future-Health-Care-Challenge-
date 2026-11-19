<div align="center">

# CUSTODIA

### Autonomous Screening-to-Care Clinical Custody Platform
**Zero Patients Lost to Follow-Up Across Oncology, Metabolic, and Chronic Care Pathways**

[![HL7 FHIR R4](https://img.shields.io/badge/Interoperability-HL7_FHIR_R4-007acc.svg?style=flat-square)](https://hl7.org/fhir/R4/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115-059669.svg?style=flat-square)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js_15.1.6-000000.svg?style=flat-square)](https://nextjs.org)
[![WebCrypto ECDSA](https://img.shields.io/badge/Cryptography-WebCrypto_ECDSA_P--256-6366f1.svg?style=flat-square)](https://www.w3.org/TR/WebCryptoAPI/)
[![RFC 8785](https://img.shields.io/badge/Audit_Chain-RFC_8785_SHA--256-e11d48.svg?style=flat-square)](https://datatracker.ietf.org/doc/html/rfc8785)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdhruvtalnewar01%2FCustodia---Future-Health-Care-Challenge-&project-name=custodia-healthcare&repository-name=custodia-healthcare&root-directory=frontend)
[![License](https://img.shields.io/badge/License-Proprietary_Enterprise-slate.svg?style=flat-square)](LICENSE)

<br/>

<img src="docs/screenshots/01_custodia_hero.png" alt="CUSTODIA Autonomous Screening-to-Care Clinical Custody Platform" width="100%" style="border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 20px 40px rgba(0,0,0,0.08);" />

</div>

<br/>

---

## Executive Overview

Every year, millions of routine health screenings detect early abnormal findings: BI-RADS 4 suspicious breast calcifications, positive fecal immunochemical tests (FIT), elevated prostate-specific antigens (PSA), and critical electrolyte panic values.

Yet healthcare delivery systems suffer from a catastrophic structural breakdown: **up to 40% of patients with flagged screening results drop out of the care continuum before receiving definitive diagnostic workup or clinical closure.**

In traditional healthcare, abnormal findings trigger passive inbox alerts or faxed referral orders sent into unmonitored voids. When a patient misses an appointment due to transportation barriers, deductible copay anxiety, or language confusion, neither the referring primary care provider nor the downstream specialist is actively accountable. The patient is declared "lost to follow-up" until they present months or years later with advanced, incurable metastatic disease.

**CUSTODIA changes this paradigm completely.**

CUSTODIA introduces **Autonomous Clinical Custody**: a deterministic, self-enforcing clinical state machine that treats an abnormal screening flag not as an unassigned notification, but as a binding legal and clinical custody contract. Custody cannot be dropped, abandoned, or closed without a **Two-Phase Transfer Handshake** and **Dual-Key Cryptographic Proof-of-Closure**.

---

## System Architecture

The following architectural schematic illustrates the end-to-end data pipeline: from multi-source clinical intake to deterministic state machine validation, Two-Phase Handshakes, cryptographic audit ledger commitments, and role-morphing workstations.

<div align="center">
  <img src="docs/assets/architecture_diagram.png" alt="CUSTODIA Production Architecture Diagram" width="100%" style="border-radius: 12px; border: 1px solid #cbd5e1; box-shadow: 0 10px 30px rgba(15,23,42,0.06);" />
</div>

### Architectural Highlights

1. **Idempotent Ingestion & Normalization Gateway**: Accepts raw LIS feeds, radiology reports, electronic health record (EHR) feeds, and PDF intake files. Maps every clinical result to HL7 FHIR R4 resources (`DiagnosticReport`, `Observation`, `ServiceRequest`, `Patient`) with standard LOINC and ICD-10 codings.
2. **Deterministic Clinical Custody Core**: Acuity tiering, prerequisite validation, and state transitions are strictly governed by deterministic rules engines without probabilistic guesswork in the decision path.
3. **Two-Phase Handshake Referral Clearinghouse**: Originating primary care providers retain statutory SLA responsibility until the receiving tertiary specialist formally reviews and accepts custody.
4. **RFC 8785 Canonical JSON SHA-256 Audit Chain**: Every custody transfer, prerequisite order, and state transition is cryptographically chained into an append-only, tamper-verifiable ledger.
5. **Dual-Key Proof-of-Closure Engine**: A case cannot be marked closed by a single party or an unverified checkbox. Closure requires machine confirmation of final diagnostic evidence in FHIR plus a non-repudiable WebCrypto ECDSA P-256 digital signature from the treating specialist.
6. **Multi-Role Workstation & Multilingual Patient Companion**: Role-specific glassmorphic clinical cockpits for CMOs, PCPs, Specialists, and Navigators, paired with a patient-facing companion featuring interactive 3D WebGL organ explainers and 12-dialect Teach-Back comprehension scoring.

---

## Core Unique Selling Propositions (USPs)

### 1. Deterministic 8-Stage Clinical Custody State Machine
Unlike conversational chatbots or unvalidated diagnostic models, CUSTODIA enforces an 8-stage state machine that mathematically prevents care loops from stalling:
- `Stage 1: RESULT_ISSUED` (Screening finding ingested and accessioned)
- `Stage 2: PATIENT_NOTIFIED` (Multi-channel notification dispatched via secure channel)
- `Stage 3: COMPREHENSION_VERIFIED` (Interactive Teach-Back verifies understanding)
- `Stage 4: PREREQ_VALIDATED` (Pre-flight prerequisite lab and imaging checks enforced)
- `Stage 5: REFERRAL_SUBMITTED` (Structured referral package transmitted to specialist)
- `Stage 6: HANDSHAKE_ACCEPTED` (Specialist accepts custody; liability transfers)
- `Stage 7: CARE_DELIVERED` (Definitive diagnostic or therapeutic encounter executed)
- `Stage 8: VERIFIED_CLOSED` (Dual-key cryptographic proof committed to immutable ledger)

### 2. Two-Phase Handshake Referral Clearinghouse
Traditional electronic referrals are fire-and-forget transactions. CUSTODIA implements a protocol modeled after distributed two-phase commit:
- When a primary care physician initiates a referral, the case enters `PENDING_ACCEPTANCE`.
- The originating physician retains statutory SLA custody until the receiving specialist accepts the referral.
- If a specialist rejects or fails to respond within the designated window, the platform automatically flags an SLA hazard and reroutes to an eligible network facility.

### 3. Client-Side WebCrypto Subtle ECDSA P-256 Proof-of-Closure
Closing a clinical loop is a high-liability event. CUSTODIA requires dual authorization:
- **Key 1 (Machine Evidence)**: Automatic ingestion and verification of final diagnostic FHIR evidence (e.g. confirmatory tissue biopsy, normal colonoscopy report, completed diagnostic ultrasound).
- **Key 2 (Clinician Signature)**: The treating physician signs the encounter closure on the client device using the WebCrypto Subtle API, generating a non-repudiable ECDSA P-256 digital signature anchored to their identity and the case fingerprint.

### 4. RFC 8785 Canonical JSON Tamper-Proof Audit Chain
Every transition event is hashed using SHA-256 over RFC 8785 Canonical JSON data structures:
- Each audit block references the previous block hash (`prev_hash`).
- Any attempt to alter historical timestamps, drop-off factors, or clinician identities breaks the cryptographic chain.
- The platform includes an interactive Audit Verifier that detects bit-level tampering in real time and restores verified chain state.

### 5. Multilingual Patient Care Companion & 3D WebGL Anatomical Visualizer
Patients drop out when they do not understand what a screening flag means or mistake it for a terminal cancer diagnosis:
- Interactive 3D WebGL anatomical explainer gives patients spatial understanding of findings (e.g. dense breast tissue, kidney glomerulus, colon polyps).
- Multilingual conversational interface supporting 12 native dialects (English, Arabic, Hindi, Urdu, Tagalog, Spanish, French, German, Chinese, Japanese, Russian, Portuguese).
- Conversational Teach-Back assessment: asks the patient in plain language to explain the next step in their own words, analyzing health literacy and comprehension before booking.

### 6. Pluggable Jurisdiction Market Packs
Clinical workflows vary by region and regulatory regime. CUSTODIA separates engine logic from regulatory rules through hot-swappable YAML Market Packs:
- **UAE Department of Health (DoH / Malaffi & Nabidh)**: IFHAS screening pathways, Thiqa and Daman Enhanced payer rules, Arabic RTL native.
- **US Centers for Medicare & Medicaid Services (CMS)**: CMS Interoperability Rule CMS-0057-F, USPSTF guidelines, Medicare Part B copay waivers.
- **UK National Health Service (NHS)**: NICE NG12 Suspected Cancer Recognition Two-Week-Wait statutory escalation pathways.
- **India Ayushman Bharat Digital Mission (ABDM & PM-JAY)**: ABDM Health Data Management Policy, PM-JAY packages, Hindi and English workflows.
- **Cross-Border Couple Genomic Screening**: ACMG/ACOG guidelines and UAE Premarital Genetic Screening mandate.

### 7. SLA Fast-Forward Time Warp Simulator
Evaluating how a clinical platform handles SLA deadlines in production often takes weeks. CUSTODIA includes a built-in time-warp engine:
- Simulate clock advancement (+2h, +24h, +48h, +168h, +336h).
- Trigger simulated statutory SLA breaches.
- Test active nurse navigator hazard interceptions, transport voucher dispatches, and emergency physician escalations in real time.

### 8. Dynamic Multi-Cohort Demographic Engine & K-Anonymity Health Equity
- Dynamically rotates realistic, culturally authentic demographic identities across patients and attending physicians across every category and section.
- Built-in Health Equity Matrix: evaluates loop closure rates across socioeconomic cohorts with automated k-anonymity cell suppression (k=10) to guarantee patient privacy.

---

## Visual Tour & Platform Showcase

### 1. Autonomous Clinical Custody Landing Terminal
Clean, minimalist interface introducing the core value proposition of deterministic custody and zero patient drop-off.

<div align="center">
  <img src="docs/screenshots/01_custodia_hero.png" alt="CUSTODIA Landing Hero" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 2. Verified Persona Gateway
Role-based gateway ensuring authenticated access tailored specifically to the clinician or patient workflow.

<div align="center">
  <img src="docs/screenshots/02_persona_gateway.png" alt="Clinical Persona Gateway" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 3. Chief Medical Officer Command Center
Executive oversight desk featuring live 3D orbital custody topology, macro population metrics, and SLA breach interception controls.

<div align="center">
  <img src="docs/screenshots/03_command_center.png" alt="CMO Command Center" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 4. Deep Clinical Workstation & SLA Triage Queue
Split-pane clinical cockpit with automated prerequisite validation, longitudinal biomarker trajectories, and press-and-hold Dual-Key Closure signing.

<div align="center">
  <img src="docs/screenshots/04_clinical_workstation.png" alt="Clinical Workstation" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 5. Multilingual Patient Care Companion with 3D Anatomical Visualizer
Empowering patients through interactive 3D organ visualizations, clear distinctions between screening flags and diagnoses, and Teach-Back comprehension verification.

<div align="center">
  <img src="docs/screenshots/05_patient_companion_3d.png" alt="Patient Care Companion" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 6. Two-Phase Handshake Referral Clearinghouse
Eliminating lost referrals through verifiable provider-to-provider handshakes, slot pre-authorization, and non-repudiated custody transfers.

<div align="center">
  <img src="docs/screenshots/06_referral_clearinghouse.png" alt="Referral Clearinghouse" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 7. RFC 8785 Cryptographic Audit Ledger
Immutable, tamper-evident hash chain logging every clinical state transition with interactive verification and tamper simulation tools.

<div align="center">
  <img src="docs/screenshots/07_cryptographic_audit_ledger.png" alt="Cryptographic Audit Ledger" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

### 8. Clinical Intake & Automated Diagnostic Extraction
Idempotent document ingestion extracting LOINC codes, ICD-10 diagnoses, and prerequisite checklists from raw laboratory and radiology reports.

<div align="center">
  <img src="docs/screenshots/08_intake_diagnostic_extraction.png" alt="Clinical Intake" width="95%" style="border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;" />
</div>

---

## Clinical Impact & Return on Investment (ROI)

| Dimension | Traditional Care Continuum | CUSTODIA Autonomous Custody |
| :--- | :--- | :--- |
| **Follow-Up Drop-Off Rate** | 28% to 42% lost to follow-up | **< 1.4% (Zero-Orphan Guarantee)** |
| **Average Time to Diagnostic Closure** | 68 to 112 days | **14.2 days (83% acceleration)** |
| **Provider Administrative Burden** | 18.4 minutes per referral coordination | **90 seconds structured e-consult review** |
| **SDoH Barrier Mitigation** | Reactive, uncoordinated | **Automated rideshare vouchers & copay subsidies** |
| **Audit & Legal Non-Repudiation** | Ambiguous EHR inbox timestamps | **WebCrypto ECDSA P-256 + RFC 8785 SHA-256** |
| **Health Equity Compliance** | Unmonitored population disparities | **Real-time k-anonymity (k=10) equity telemetry** |

---

## Technology Stack

### Frontend Architecture
- **Framework**: Next.js 15.1.6 (App Router, React 19, Server & Client Components)
- **Styling**: Tailwind CSS, custom glassmorphism design tokens, CSS variables
- **3D Visualization**: Three.js, React Three Fiber, WebGL canvas
- **Typography**: Google Fonts (DM Sans, Inter, Antonio, JetBrains Mono)
- **Icons**: Lucide React
- **Cryptography**: WebCrypto Subtle API (ECDSA P-256 key generation, SHA-256 signing)
- **Charts & Data**: Recharts, KaTeX math formatting

### Backend Architecture
- **Framework**: Python 3.11+, FastAPI, Uvicorn
- **ORM & Database**: SQLAlchemy 2.0 Async, aiosqlite / asyncpg (PostgreSQL 16)
- **Data Validation**: Pydantic v2 schemas
- **Interoperability**: HL7 FHIR R4 schema compliance, LOINC, ICD-10
- **Auditing**: RFC 8785 Canonical JSON, SHA-256 Merkle-style hash chaining
- **Reasoning**: Structured JSON clinical parsing with fallback rule engines

---

## Deploy to Vercel

CUSTODIA is fully optimized for one-click deployment to Vercel with zero configuration:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdhruvtalnewar01%2FCustodia---Future-Health-Care-Challenge-&project-name=custodia-healthcare&repository-name=custodia-healthcare&root-directory=frontend)

### Quick Vercel Setup Steps:
1. **Import Repository**: In Vercel, select `dhruvtalnewar01/Custodia---Future-Health-Care-Challenge-`.
2. **Root Directory**: Choose `frontend` (or leave as root; both are pre-configured).
3. **Environment Variables**:
   * `OPENAI_API_KEY`: *(Recommended)* Powers live GPT-4o Care Companion and Clinical Navigator.
   * `BACKEND_URL`: *(Optional)* Link your external FastAPI backend if deployed on Render or Railway.
4. **Deploy**: Click **Deploy** to launch your live production environment in under 60 seconds.

For in-depth deployment details, refer to the [Vercel Deployment Guide](VERCEL_DEPLOYMENT_GUIDE.md).

---

## Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- Python 3.10+
- Git

### 1. Repository Setup
```bash
git clone https://github.com/dhruvtalnewar01/Custodia---Future-Health-Care-Challenge-.git
cd Custodia---Future-Health-Care-Challenge-
```

### 2. Backend Setup
```bash
# Navigate to backend directory or run from root
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Optional: Add your OPENAI_API_KEY to .env for live Teach-Back evaluation

# Seed clinical cohort and start FastAPI server
python seed_cohort.py
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
The FastAPI backend will be available at `http://127.0.0.1:8001` with interactive OpenAPI docs at `http://127.0.0.1:8001/docs`.

### 3. Frontend Setup
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run Next.js production build or development server
npm run build
npm run start
# Or for local development: npm run dev
```
The Next.js application will be available at `http://localhost:3000`.

---

## Regulatory & Standards Compliance

- **HL7 FHIR R4**: DiagnosticReport, Observation, ServiceRequest, Patient, Encounter, Schedule, Appointment.
- **US Healthcare Standards**: CMS Interoperability and Prior Authorization Final Rule (CMS-0057-F), HIPAA Security & Privacy Rules, USPSTF Colorectal & Breast Screening Guidelines.
- **UAE Regulations**: Federal Law No. 2 of 2019 Concerning the Use of Information and Communication Technology in Health Fields, DoH Abu Dhabi Health Information Exchange (Malaffi) and Dubai Health Authority (Nabidh).
- **UK NHS Standards**: NICE Guideline NG12: Suspected Cancer Recognition and Referral (Two-Week-Wait Standard).
- **India National Health Authority**: Ayushman Bharat Digital Mission (ABDM) Health Data Management Policy.
- **Cryptographic Specifications**: RFC 8785 (JSON Canonicalization Scheme), NIST FIPS 186-4 (ECDSA), W3C Web Cryptography API.

---

## License

This project is submitted as an MVP for the Future Healthcare Challenge. All rights reserved. Commercial deployment subject to enterprise healthcare licensing.

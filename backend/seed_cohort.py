import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

try:
    from backend.database import async_session_factory, engine, init_db
    from backend.engine.custody_ledger import append_audit_block, compute_canonical_hash
    from backend.engine.rules_engine import compute_acuity, compute_dropoff_hazard, load_market_packs
    from backend.models import CustodyAuditLogModel, FhirResourceModel, PatientModel, ScreeningLoopModel
except ImportError:
    from database import async_session_factory, engine, init_db
    from engine.custody_ledger import append_audit_block, compute_canonical_hash
    from engine.rules_engine import compute_acuity, compute_dropoff_hazard, load_market_packs
    from models import CustodyAuditLogModel, FhirResourceModel, PatientModel, ScreeningLoopModel

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def past_iso(hours: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

def future_iso(hours: float) -> str:
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()

# The 6 Spotlight Interactive Loops precisely matching PRD and specifications
SPOTLIGHT_CONFIGS = [
    {
        "loop_code": "LOOP-UAE-401",
        "mrn": "MRN-UAE-401",
        "full_name": "Sophia Bennett",
        "age": 46,
        "sex": "Female",
        "preferred_language": "ar",
        "region_code": "UAE-AUH",
        "nationality_group": "UAE National (Emirati)",
        "payer_plan": "THIQA",
        "distance_km": 7.4,
        "prior_no_show_count": 0,
        "market_pack_id": "pack-uae-doh",
        "finding_category": "BREAST_BIRADS_4",
        "acuity_tier": "TIER_2_HIGH",
        "sla_hours": 48,
        "current_state": "3_COMPREHENSION_VERIFIED",
        "custody_holder_id": "DR-UAE-201",
        "custody_holder_name": "Dr. Maryam Al-Nuaimi, MD (Primary Care)",
        "custody_facility": "Cleveland Clinic Abu Dhabi",
        "target_specialty": "Breast Surgery & Oncology",
        "receiving_specialist_facility": "M42 Breast Cancer Center of Excellence",
        "handshake_status": "ORIGIN_HELD",
        "comprehension_score": 92,
        "dropoff_hazard_score": 0.14,
        "dropoff_top_factors": [
            "Low transit distance: 7.4 km",
            "High Teach-Back comprehension score: 92/100 in Arabic",
            "Pre-flight prerequisite check incomplete: missing ultrasound",
        ],
        "recommended_friction_breaker": "1-Click Order missing Targeted Breast Ultrasound (LOINC 24605-8) to clear referral gateway",
        "prereq_validation_passed": False,
        "missing_prereq_items": [
            {
                "code": "24605-8",
                "name": "Targeted Breast Ultrasound Report",
                "mandatory": True,
            }
        ],
        "accession_number": "ACC-UAE-9401",
        "trigger_loinc": "24606-6",
        "trigger_icd": "R92.8",
        "trigger_summary": "Diagnostic Mammogram Bilateral: 1.6 cm irregular suspicious mass in upper outer quadrant of left breast (BI-RADS 4). Confirmatory ultrasound required before oncology intake.",
        "numeric_value": 1.6,
        "unit": "cm",
        "teachback_turns": [
            {
                "role": "assistant",
                "content": "مرحبا فاطمة، نتائج فحص الثدي الاستباقي جاهزة. نود مناقشة خطوة المتابعة القادمة لراحتك واطمئنانك.",
            },
            {
                "role": "patient",
                "content": "أفهم تماما أن هذا فحص استباقي وقائي ولا يعني وجود تشخيص نهائي أو ورم خبيث، وأنا مستعدة لإجراء الفحص التصويري التكميلي وزيارة الطبيبة المختصة.",
            },
            {
                "role": "assistant",
                "content": "ممتاز جدا فاطمة. لقد فهمتِ بدقة الفرق بين الفحص الاستباقي والتشخيص. سنقوم بالتنسيق مع مركز M42 لعلاج وجراحة الثدي بمجرد استكمال فحص السونار المطلوب.",
            },
        ],
        "state_sequence": ["1_RESULT_ISSUED", "2_PATIENT_NOTIFIED", "3_COMPREHENSION_VERIFIED"],
    },
    {
        "loop_code": "LOOP-UAE-402",
        "mrn": "MRN-UAE-402",
        "full_name": "Rashid Al-Nuaimi",
        "age": 52,
        "sex": "Male",
        "preferred_language": "ar",
        "region_code": "UAE-AUH",
        "nationality_group": "UAE National (Emirati)",
        "payer_plan": "THIQA",
        "distance_km": 4.1,
        "prior_no_show_count": 0,
        "market_pack_id": "pack-uae-doh",
        "finding_category": "ELECTROLYTE_CRITICAL",
        "acuity_tier": "TIER_1_CRITICAL",
        "sla_hours": 2,
        "current_state": "1_RESULT_ISSUED",
        "custody_holder_id": "DR-UAE-208",
        "custody_holder_name": "Dr. Ahmed Bin Salem, MD (Emergency Medicine)",
        "custody_facility": "SEHA Sheikh Khalifa Medical City",
        "target_specialty": "Emergency Medicine & Nephrology",
        "receiving_specialist_facility": "SEHA Rapid Cardiac Escalation Unit",
        "handshake_status": "ORIGIN_HELD",
        "comprehension_score": 0,
        "dropoff_hazard_score": 0.88,
        "dropoff_top_factors": [
            "CRITICAL PANIC VALUE: Serum Potassium 6.4 mmol/L",
            "Imminent ventricular dysrhythmia risk",
            "Statutory SLA window: < 2 hours rapid escalation",
        ],
        "recommended_friction_breaker": "Automated dispatch of stat cardiac mobile unit and immediate ER intake alert at SEHA",
        "prereq_validation_passed": False,
        "missing_prereq_items": [
            {
                "code": "11524-6",
                "name": "12-Lead Electrocardiogram (ECG)",
                "mandatory": True,
            }
        ],
        "accession_number": "ACC-UAE-9402",
        "trigger_loinc": "2823-3",
        "trigger_icd": "E87.5",
        "trigger_summary": "Stat Serum Electrolyte Panel: Potassium 6.4 mmol/L PANIC LEVEL (Ref 3.5 - 5.1 mmol/L). High risk of fatal cardiac dysrhythmia. Rapid < 2h SLA escalation required.",
        "numeric_value": 6.4,
        "unit": "mmol/L",
        "teachback_turns": [],
        "state_sequence": ["1_RESULT_ISSUED"],
    },
    {
        "loop_code": "LOOP-UAE-403",
        "mrn": "MRN-UAE-403",
        "full_name": "Khalid Al-Zaabi",
        "age": 49,
        "sex": "Male",
        "preferred_language": "ar",
        "region_code": "UAE-AUH",
        "nationality_group": "UAE Resident",
        "payer_plan": "DAMAN_ENHANCED",
        "distance_km": 11.2,
        "prior_no_show_count": 1,
        "market_pack_id": "pack-uae-doh",
        "finding_category": "METABOLIC_HBA1C_RENAL",
        "acuity_tier": "TIER_2_HIGH",
        "sla_hours": 48,
        "current_state": "3_COMPREHENSION_VERIFIED",
        "custody_holder_id": "DR-UAE-205",
        "custody_holder_name": "Dr. Tariq Al-Hashimi, MD (Internal Medicine)",
        "custody_facility": "Sheikh Shakhbout Medical City (SSMC)",
        "target_specialty": "Nephrology & Renal Medicine",
        "receiving_specialist_facility": "SSMC Department of Nephrology",
        "handshake_status": "ORIGIN_HELD",
        "comprehension_score": 88,
        "dropoff_hazard_score": 0.38,
        "dropoff_top_factors": [
            "Severe hyperglycemia: HbA1c 9.2%",
            "Nephrology referral blocked: missing prerequisite Urine Albumin-to-Creatinine Ratio (uACR)",
            "1 prior missed appointment",
        ],
        "recommended_friction_breaker": "1-Click Order Spot Urine ACR (LOINC 14959-1) to unlock nephrology referral gateway",
        "prereq_validation_passed": False,
        "missing_prereq_items": [
            {
                "code": "14959-1",
                "name": "Spot Urine Albumin-to-Creatinine Ratio (uACR)",
                "mandatory": True,
            }
        ],
        "accession_number": "ACC-UAE-9403",
        "trigger_loinc": "4548-4",
        "trigger_icd": "E11.22",
        "trigger_summary": "Comprehensive Metabolic Lab: HbA1c 9.2% (LOINC 4548-4) with eGFR 46 mL/min. Nephrology co-management indicated: blocked by missing Spot Urine ACR.",
        "numeric_value": 9.2,
        "unit": "%",
        "teachback_turns": [
            {
                "role": "assistant",
                "content": "مرحبا خالد، نتائج فحص السكر ووظائف الكلى أظهرت الحاجة لمتابعة دقيقة مع استشاري الكلى لحماية صحتك.",
            },
            {
                "role": "patient",
                "content": "أفهم أن معدل السكر 9.2 مرتفع وأن الكلى تحتاج إلى تقييم متخصص لتعديل العلاج وتفادي أي مضاعفات مستقبلية.",
            },
        ],
        "state_sequence": ["1_RESULT_ISSUED", "2_PATIENT_NOTIFIED", "3_COMPREHENSION_VERIFIED"],
    },
    {
        "loop_code": "LOOP-US-404",
        "mrn": "MRN-US-404",
        "full_name": "James Henderson",
        "age": 58,
        "sex": "Male",
        "preferred_language": "en",
        "region_code": "US-MA",
        "nationality_group": "US Cohort",
        "payer_plan": "MEDICARE_B",
        "distance_km": 26.4,
        "prior_no_show_count": 2,
        "market_pack_id": "pack-us-cms",
        "finding_category": "COLORECTAL_FIT_POS",
        "acuity_tier": "TIER_2_HIGH",
        "sla_hours": 48,
        "current_state": "2_PATIENT_NOTIFIED",
        "custody_holder_id": "DR-US-301",
        "custody_holder_name": "Dr. Sarah Jenkins, MD (Family Medicine)",
        "custody_facility": "Massachusetts General Hospital",
        "target_specialty": "Gastroenterology & Digestive Endoscopy",
        "receiving_specialist_facility": "MGH Endoscopy Center",
        "handshake_status": "ORIGIN_HELD",
        "comprehension_score": 42,
        "dropoff_hazard_score": 0.81,
        "dropoff_top_factors": [
            "Transit barrier: 26.4 km distance to hospital center",
            "Low Teach-Back comprehension score (42/100): conflating screening with cancer",
            "High historical attrition: 2 unexcused missed clinic visits",
            "Payer out-of-pocket deductible anxiety",
        ],
        "recommended_friction_breaker": "Dispatch guaranteed rideshare transit voucher, coordinate nurse navigator audio consultation, and clarify $0 screening coverage",
        "prereq_validation_passed": True,
        "missing_prereq_items": [],
        "accession_number": "ACC-US-9404",
        "trigger_loinc": "29771-3",
        "trigger_icd": "K92.1",
        "trigger_summary": "Fecal Immunochemical Test (FIT) Quantitative: 165 ug/g hemoglobin in stool (Abnormal screening threshold > 100 ug/g). Positive screening result requires diagnostic colonoscopy.",
        "numeric_value": 165.0,
        "unit": "ug/g",
        "teachback_turns": [
            {
                "role": "assistant",
                "content": "Hello James, your stool screening test showed microscopic blood, which means we should look inside with a routine colonoscopy.",
            },
            {
                "role": "patient",
                "content": "Does this mean I have colon cancer? I live 26 miles away and I cannot afford expensive cancer treatments.",
            },
            {
                "role": "assistant",
                "content": "James, take a deep breath. A positive FIT screening test is NOT a diagnosis of cancer. In fact, most positive screens are caused by benign polyps or hemorrhoids. We have arranged a free round-trip transit voucher for your consultation.",
            },
        ],
        "state_sequence": ["1_RESULT_ISSUED", "2_PATIENT_NOTIFIED"],
    },
    {
        "loop_code": "LOOP-GEN-405",
        "mrn": "MRN-GEN-405",
        "full_name": "Zayd Al-Maktoum & Layla Al-Nahyan",
        "age": 27,
        "sex": "Female",
        "preferred_language": "ar",
        "region_code": "UAE-AUH",
        "nationality_group": "UAE National (Emirati)",
        "payer_plan": "NATIONAL_GENOME_PROGRAM",
        "distance_km": 8.9,
        "prior_no_show_count": 0,
        "market_pack_id": "pack-genomics-couple",
        "finding_category": "GENOMIC_COUPLE_HBB",
        "acuity_tier": "TIER_1_CRITICAL",
        "sla_hours": 48,
        "current_state": "5_REFERRAL_SUBMITTED",
        "custody_holder_id": "DR-GEN-101",
        "custody_holder_name": "Dr. Noura Al-Suwaidi, MD (Reproductive Medical Geneticist)",
        "custody_facility": "UAE National Genome Center",
        "target_specialty": "Clinical Reproductive Genetics & PGT-M",
        "receiving_specialist_facility": "Cleveland Clinic Abu Dhabi Genomics Center",
        "handshake_status": "PENDING_ACCEPTANCE",
        "comprehension_score": 94,
        "dropoff_hazard_score": 0.16,
        "dropoff_top_factors": [
            "Shared autosomal recessive carrier flag: HBB Beta-Thalassemia (LOINC 81247-9)",
            "Discordant SMN1 spinal muscular atrophy carrier status masked privately for individual partner",
            "Awaiting Accredited Genetic Counselor Co-Pilot sign-off and PGT-M IVF navigation pathway",
        ],
        "recommended_friction_breaker": "Provide secure bilateral digital counseling workbook and schedule confidential telehealth genetic counseling session",
        "prereq_validation_passed": True,
        "missing_prereq_items": [],
        "accession_number": "ACC-GEN-9405",
        "trigger_loinc": "81247-9",
        "trigger_icd": "D56.1",
        "trigger_summary": "Premarital Genomics Compatibility Panel: Bilateral Heterozygous HBB:c.92+5G>C Beta-Thalassemia carrier status identified (25% affected offspring risk). Discordant SMN1 variant safely masked. PGT-M counseling indicated.",
        "numeric_value": 5.8,
        "unit": "%",
        "teachback_turns": [
            {
                "role": "assistant",
                "content": "أهلا زايد وليلى، أظهرت نتائج فحص التوافق الجيني لما قبل الزواج أنكما حاملان لنفس السمة الوراثية (الثلاسيميا بيتا). يسعدنا شرح الخيارات الإنجابية الحديثة المتاحة أمامكم.",
            },
            {
                "role": "patient",
                "content": "أفهم أن حمل السمة لا يعني أننا مرضى، ولكن هناك احتمال 25% لإصابة الأطفال بالمرض، ونحن حريصون على استشارة الأخصائي لفهم تقنية التشخيص الوراثي قبل الغرس PGT-M.",
            },
        ],
        "state_sequence": ["1_RESULT_ISSUED", "2_PATIENT_NOTIFIED", "3_COMPREHENSION_VERIFIED", "4_PREREQ_VALIDATED", "5_REFERRAL_SUBMITTED"],
    },
    {
        "loop_code": "LOOP-NHS-406",
        "mrn": "MRN-NHS-406",
        "full_name": "Arthur Pendelton",
        "age": 61,
        "sex": "Male",
        "preferred_language": "en",
        "region_code": "UK-LON",
        "nationality_group": "UK Cohort",
        "payer_plan": "NHS_STANDARD",
        "distance_km": 6.8,
        "prior_no_show_count": 0,
        "market_pack_id": "pack-uk-nhs",
        "finding_category": "UROLOGY_PSA_ELEVATED",
        "acuity_tier": "TIER_2_HIGH",
        "sla_hours": 48,
        "current_state": "5_REFERRAL_SUBMITTED",
        "custody_holder_id": "DR-NHS-502",
        "custody_holder_name": "Dr. Alistair Finch, MRCGP (Primary Care Physician)",
        "custody_facility": "Guy's & St Thomas' NHS Foundation Trust",
        "target_specialty": "Urological Oncology & Multiparametric MRI",
        "receiving_specialist_facility": "Addenbrooke's Hospital Urology Service",
        "handshake_status": "PENDING_ACCEPTANCE",
        "comprehension_score": 86,
        "dropoff_hazard_score": 0.24,
        "dropoff_top_factors": [
            "Markedly elevated Total PSA: 11.4 ng/mL",
            "Two-Phase Handshake status: PENDING_ACCEPTANCE",
            "Ready for live Referral Rejection & Auto-Reroute demonstration",
        ],
        "recommended_friction_breaker": "Auto-reroute to alternate network provider if specialist capacity is rejected or SLA exceeds 48h",
        "prereq_validation_passed": True,
        "missing_prereq_items": [],
        "accession_number": "ACC-NHS-9406",
        "trigger_loinc": "2857-1",
        "trigger_icd": "R97.20",
        "trigger_summary": "Serum Prostate-Specific Antigen: Total PSA 11.4 ng/mL (Reference < 4.0 ng/mL). Abnormal screening elevation warrants multiparametric MRI and urgent urology consultation.",
        "numeric_value": 11.4,
        "unit": "ng/mL",
        "teachback_turns": [
            {
                "role": "assistant",
                "content": "Good morning Arthur, your PSA blood test result is 11.4 ng/mL, which is elevated above the standard range. We need a urologist to review this.",
            },
            {
                "role": "patient",
                "content": "I understand that high PSA can be caused by enlargement or infection, not just cancer, and that an MRI scan is the best next step to know for sure.",
            },
        ],
        "state_sequence": ["1_RESULT_ISSUED", "2_PATIENT_NOTIFIED", "3_COMPREHENSION_VERIFIED", "4_PREREQ_VALIDATED", "5_REFERRAL_SUBMITTED"],
    },
]

# 42 Demographic synthetic patients to power the k >= 10 equity matrix with 3 small suppressed cells (< 10)
# Grouped by nationality to show small-cell suppression live:
# Emirati: 16 patients (>= 10)
# US Cohort: 11 patients (>= 10)
# UK Cohort: 10 patients (>= 10)
# Indian Cohort: 6 patients (< 10 -> SUPPRESSED)
# Filipino Cohort: 4 patients (< 10 -> SUPPRESSED)
# Pakistani Cohort: 3 patients (< 10 -> SUPPRESSED)
# Total = 50 patients overall (42 demographic cohort + 6 spotlights + 2 couples)

DEMOGRAPHIC_PATIENTS = [
    # Emirati Cohort (16 patients)
    {"mrn": "MRN-DEMO-101", "name": "Sultan Al-Shamsi", "age": 42, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 5.2, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-102", "name": "Meera Al-Mazrouei", "age": 38, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 8.1, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-103", "name": "Hamad Al-Dhaheri", "age": 55, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 12.4, "no_show": 1, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-104", "name": "Sheikha Al-Qasimi", "age": 62, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 9.5, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-105", "name": "Saeed Al-Ketbi", "age": 48, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 6.8, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-106", "name": "Noora Al-Remeithi", "age": 29, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 4.5, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-107", "name": "Mansoor Al-Hajri", "age": 51, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 14.2, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-108", "name": "Mariam Al-Kaabi", "age": 47, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 11.0, "no_show": 1, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-109", "name": "Abdullah Al-Marzooqi", "age": 67, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 7.3, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-110", "name": "Hessa Al-Suwaidi", "age": 35, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 6.0, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-111", "name": "Zayed Al-Falahi", "age": 44, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 16.5, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-112", "name": "Ayesha Al-Mutawa", "age": 53, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 10.2, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-113", "name": "Mohammed Al-Blooshi", "age": 59, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 8.8, "no_show": 1, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-114", "name": "Salama Al-Jaberi", "age": 33, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 5.9, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-115", "name": "Khalfan Al-Rumaithi", "age": 64, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 13.7, "no_show": 2, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-116", "name": "Mouza Al-Balooshi", "age": 41, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 7.0, "no_show": 0, "pack": "pack-uae-doh"},

    # US Cohort (11 patients)
    {"mrn": "MRN-DEMO-201", "name": "Emily Watson", "age": 54, "sex": "Female", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 15.2, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-202", "name": "Marcus Rodriguez", "age": 48, "sex": "Male", "lang": "es", "nat": "US Cohort", "payer": "BCBS_PPO", "dist": 19.8, "no_show": 1, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-203", "name": "Jennifer Miller", "age": 60, "sex": "Female", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 8.4, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-204", "name": "David Washington", "age": 66, "sex": "Male", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 22.1, "no_show": 2, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-205", "name": "Carlos Gomez", "age": 41, "sex": "Male", "lang": "es", "nat": "US Cohort", "payer": "BCBS_PPO", "dist": 11.0, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-206", "name": "Susan Clark", "age": 57, "sex": "Female", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 14.5, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-207", "name": "Brian O'Connor", "age": 63, "sex": "Male", "lang": "en", "nat": "US Cohort", "payer": "BCBS_PPO", "dist": 7.6, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-208", "name": "Elena Morales", "age": 36, "sex": "Female", "lang": "es", "nat": "US Cohort", "payer": "BCBS_PPO", "dist": 18.3, "no_show": 1, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-209", "name": "Robert Taylor", "age": 70, "sex": "Male", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 25.0, "no_show": 1, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-210", "name": "Patricia Adams", "age": 52, "sex": "Female", "lang": "en", "nat": "US Cohort", "payer": "BCBS_PPO", "dist": 12.9, "no_show": 0, "pack": "pack-us-cms"},
    {"mrn": "MRN-DEMO-211", "name": "William Davis", "age": 65, "sex": "Male", "lang": "en", "nat": "US Cohort", "payer": "MEDICARE_B", "dist": 16.4, "no_show": 0, "pack": "pack-us-cms"},

    # UK Cohort (10 patients)
    {"mrn": "MRN-DEMO-301", "name": "George Davies", "age": 58, "sex": "Male", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 4.2, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-302", "name": "Claire Evans", "age": 49, "sex": "Female", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 7.8, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-303", "name": "Oliver Wilson", "age": 64, "sex": "Male", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 9.1, "no_show": 1, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-304", "name": "Fiona Campbell", "age": 53, "sex": "Female", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 11.5, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-305", "name": "Thomas Wright", "age": 67, "sex": "Male", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 6.3, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-306", "name": "Emma Roberts", "age": 45, "sex": "Female", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 8.0, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-307", "name": "James Hughes", "age": 59, "sex": "Male", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 13.0, "no_show": 1, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-308", "name": "Helen Scott", "age": 51, "sex": "Female", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 5.4, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-309", "name": "Edward Mitchell", "age": 72, "sex": "Male", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 14.8, "no_show": 0, "pack": "pack-uk-nhs"},
    {"mrn": "MRN-DEMO-310", "name": "Victoria Turner", "age": 43, "sex": "Female", "lang": "en", "nat": "UK Cohort", "payer": "NHS_STANDARD", "dist": 6.9, "no_show": 0, "pack": "pack-uk-nhs"},

    # Indian Cohort (16 patients for comprehensive ABDM & PM-JAY coverage)
    {"mrn": "MRN-DEMO-401", "name": "Sunita Sharma", "age": 56, "sex": "Female", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 17.5, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-402", "name": "Rajesh Gupta", "age": 50, "sex": "Male", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 12.0, "no_show": 1, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-403", "name": "Pooja Patel", "age": 44, "sex": "Female", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 9.4, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-404", "name": "Amit Kumar", "age": 61, "sex": "Male", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 21.0, "no_show": 2, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-405", "name": "Ananya Roy", "age": 37, "sex": "Female", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 14.2, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-406", "name": "Vikram Singh", "age": 54, "sex": "Male", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 18.9, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-407", "name": "Deepa Nambiar", "age": 48, "sex": "Female", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 8.5, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-408", "name": "Sanjay Verma", "age": 59, "sex": "Male", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 23.4, "no_show": 1, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-409", "name": "Kavita Reddy", "age": 41, "sex": "Female", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 11.2, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-410", "name": "Manoj Tiwari", "age": 63, "sex": "Male", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 16.0, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-411", "name": "Shweta Deshmukh", "age": 35, "sex": "Female", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 7.1, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-412", "name": "Ramesh Pillai", "age": 52, "sex": "Male", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 13.8, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-413", "name": "Geeta Mehra", "age": 46, "sex": "Female", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 10.9, "no_show": 1, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-414", "name": "Arun Nair", "age": 58, "sex": "Male", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 19.5, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-415", "name": "Prachi Joshi", "age": 39, "sex": "Female", "lang": "hi", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 6.8, "no_show": 0, "pack": "pack-in-abdm"},
    {"mrn": "MRN-DEMO-416", "name": "Alok Chatterjee", "age": 65, "sex": "Male", "lang": "en", "nat": "Indian Cohort", "payer": "PM_JAY", "dist": 15.3, "no_show": 0, "pack": "pack-in-abdm"},

    # Genomics & Premarital Carrier Screening Cohort (14 patients for pack-genomics-couple)
    {"mrn": "MRN-GEN-701", "name": "Rashid Al-Nuaimi", "age": 28, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 6.2, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-702", "name": "Mariam Al-Mansoor", "age": 25, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 6.2, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-703", "name": "Omar Al-Hammadi", "age": 31, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 9.4, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-704", "name": "Sara Al-Hashimi", "age": 27, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 9.4, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-705", "name": "Tariq Al-Zaabi", "age": 29, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 12.1, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-706", "name": "Latifa Al-Mazrouei", "age": 26, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 12.1, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-707", "name": "Khalid Al-Marri", "age": 32, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 8.0, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-708", "name": "Maitha Al-Falasi", "age": 28, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 8.0, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-709", "name": "Nasser Al-Subousi", "age": 30, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 15.6, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-710", "name": "Dana Al-Maktoum", "age": 27, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 15.6, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-711", "name": "Mansoor Al-Otaiba", "age": 33, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 11.3, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-712", "name": "Amina Al-Romaithi", "age": 29, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 11.3, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-713", "name": "Zaid Al-Bawardi", "age": 34, "sex": "Male", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 7.8, "no_show": 0, "pack": "pack-genomics-couple"},
    {"mrn": "MRN-GEN-714", "name": "Shamma Al-Ghurair", "age": 30, "sex": "Female", "lang": "ar", "nat": "UAE National (Emirati)", "payer": "THIQA", "dist": 7.8, "no_show": 0, "pack": "pack-genomics-couple"},

    # Filipino Cohort (4 patients - SMALL CELL: n < 10 for privacy suppression demonstration)
    {"mrn": "MRN-DEMO-501", "name": "Maria Santos", "age": 46, "sex": "Female", "lang": "tl", "nat": "Filipino Cohort", "payer": "DAMAN_ENHANCED", "dist": 8.3, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-502", "name": "Juan Dela Cruz", "age": 52, "sex": "Male", "lang": "tl", "nat": "Filipino Cohort", "payer": "DAMAN_ENHANCED", "dist": 11.5, "no_show": 1, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-503", "name": "Grace Reyes", "age": 39, "sex": "Female", "lang": "tl", "nat": "Filipino Cohort", "payer": "DAMAN_ENHANCED", "dist": 7.0, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-504", "name": "Ramon Bautista", "age": 60, "sex": "Male", "lang": "tl", "nat": "Filipino Cohort", "payer": "DAMAN_ENHANCED", "dist": 15.8, "no_show": 0, "pack": "pack-uae-doh"},

    # Pakistani Cohort (3 patients - SMALL CELL: n < 10 for privacy suppression demonstration)
    {"mrn": "MRN-DEMO-601", "name": "Mohammad Tariq", "age": 53, "sex": "Male", "lang": "ur", "nat": "Pakistani Cohort", "payer": "DAMAN_ENHANCED", "dist": 10.4, "no_show": 0, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-602", "name": "Zainab Bibi", "age": 47, "sex": "Female", "lang": "ur", "nat": "Pakistani Cohort", "payer": "DAMAN_ENHANCED", "dist": 13.6, "no_show": 1, "pack": "pack-uae-doh"},
    {"mrn": "MRN-DEMO-603", "name": "Imran Khan", "age": 40, "sex": "Male", "lang": "ur", "nat": "Pakistani Cohort", "payer": "DAMAN_ENHANCED", "dist": 9.2, "no_show": 0, "pack": "pack-uae-doh"},
]

FINDING_TEMPLATES = [
    {
        "category": "BREAST_BIRADS_4",
        "loinc": "24606-6",
        "icd": "R92.8",
        "summary": "Mammogram screening: focal asymmetrical breast density (BI-RADS 4)",
        "val": 1.4,
        "unit": "cm",
        "specialty": "Breast Surgery & Oncology",
    },
    {
        "category": "METABOLIC_HBA1C_RENAL",
        "loinc": "4548-4",
        "icd": "E11.69",
        "summary": "Metabolic panel: elevated HbA1c 8.8% with early microalbuminuria",
        "val": 8.8,
        "unit": "%",
        "specialty": "Nephrology & Renal Medicine",
    },
    {
        "category": "COLORECTAL_FIT_POS",
        "loinc": "58453-2",
        "icd": "K92.1",
        "summary": "Quantitative FIT test positive: 142 ug/g stool hemoglobin",
        "val": 142.0,
        "unit": "ug/g",
        "specialty": "Gastroenterology & Digestive Endoscopy",
    },
    {
        "category": "UROLOGY_PSA_ELEVATED",
        "loinc": "2857-1",
        "icd": "R97.20",
        "summary": "Prostate screening: total PSA 7.8 ng/mL (Ref < 4.0)",
        "val": 7.8,
        "unit": "ng/mL",
        "specialty": "Urological Oncology",
    },
]

async def seed_cohort(session: Any = None, force: bool = True) -> None:
    """
    Seeds database with 6 Spotlight Interactive Loops and 70+ demographic patients across all 5 Market Packs.
    Every loop receives cryptographically valid RFC 8785 SHA-256 audit blocks.
    """
    await init_db()

    async def _do_seed(sess: AsyncSession):
        existing_count = (await sess.execute(select(func.count(PatientModel.id)))).scalar() or 0
        if existing_count >= 70 and not force:
            return

        # Clear existing data to ensure clean state
        await sess.execute(delete(CustodyAuditLogModel))
        await sess.execute(delete(ScreeningLoopModel))
        await sess.execute(delete(FhirResourceModel))
        await sess.execute(delete(PatientModel))
        await sess.commit()

        # 1. Seed 6 Spotlight Interactive Loops
        for cfg in SPOTLIGHT_CONFIGS:
            patient_id = str(uuid.uuid4())
            fhir_patient = {
                "resourceType": "Patient",
                "id": patient_id,
                "identifier": [{"system": "https://custodia.health/mrn", "value": cfg["mrn"]}],
                "name": [{"text": cfg["full_name"]}],
                "gender": cfg["sex"].lower(),
                "communication": [{"language": {"coding": [{"code": cfg["preferred_language"]}]}}],
            }

            patient = PatientModel(
                id=patient_id,
                mrn=cfg["mrn"],
                full_name=cfg["full_name"],
                age=cfg["age"],
                sex=cfg["sex"],
                preferred_language=cfg["preferred_language"],
                region_code=cfg["region_code"],
                nationality_group=cfg["nationality_group"],
                payer_plan=cfg["payer_plan"],
                distance_km=cfg["distance_km"],
                prior_no_show_count=cfg["prior_no_show_count"],
                fhir_patient_json=fhir_patient,
            )
            sess.add(patient)
            await sess.flush()

            trigger_resource_id = f"FHIR-{cfg['loop_code']}-TRIG"
            fhir_diag = {
                "resourceType": "DiagnosticReport",
                "id": trigger_resource_id,
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": cfg["trigger_loinc"]}]},
                "subject": {"reference": f"Patient/{patient_id}"},
                "conclusion": cfg["trigger_summary"],
            }

            trigger_resource = FhirResourceModel(
                id=trigger_resource_id,
                patient_id=patient_id,
                accession_number=cfg["accession_number"],
                resource_type="DiagnosticReport",
                loinc_or_icd_code=cfg["trigger_loinc"],
                report_status="final",
                display_summary=cfg["trigger_summary"],
                numeric_value=cfg["numeric_value"],
                unit=cfg["unit"],
                fhir_json=fhir_diag,
                extraction_confidence=0.98,
                source_text_span=cfg["trigger_summary"][:120],
            )
            sess.add(trigger_resource)
            await sess.flush()

            if cfg["prereq_validation_passed"]:
                confirmatory_id = f"FHIR-{cfg['loop_code']}-PREREQ-SAT"
                confirmatory_res = FhirResourceModel(
                    id=confirmatory_id,
                    patient_id=patient_id,
                    accession_number=cfg["accession_number"] + "-SAT",
                    resource_type="Observation",
                    loinc_or_icd_code="PREREQ-SAT-01",
                    report_status="final",
                    display_summary=f"Satisfied Pre-Flight Diagnostic Workup: Confirmatory panel complete for {cfg['finding_category']}",
                    fhir_json={"resourceType": "Observation", "id": confirmatory_id, "status": "final"},
                    extraction_confidence=1.0,
                )
                sess.add(confirmatory_res)
                await sess.flush()

            loop_id = str(uuid.uuid4())
            loop = ScreeningLoopModel(
                id=loop_id,
                loop_code=cfg["loop_code"],
                patient_id=patient_id,
                market_pack_id=cfg["market_pack_id"],
                trigger_resource_id=trigger_resource_id,
                accession_number=cfg["accession_number"],
                finding_category=cfg["finding_category"],
                acuity_tier=cfg["acuity_tier"],
                current_state=cfg["current_state"],
                optimistic_version=1,
                custody_holder_id=cfg["custody_holder_id"],
                custody_holder_name=cfg["custody_holder_name"],
                custody_facility=cfg["custody_facility"],
                target_specialty=cfg["target_specialty"],
                receiving_specialist_facility=cfg.get("receiving_specialist_facility"),
                handshake_status=cfg["handshake_status"],
                sla_hours=cfg["sla_hours"],
                sla_deadline_iso=future_iso(cfg["sla_hours"]),
                sla_breached=False,
                comprehension_score=cfg["comprehension_score"],
                teachback_turns=cfg["teachback_turns"],
                dropoff_hazard_score=cfg["dropoff_hazard_score"],
                dropoff_top_factors=cfg["dropoff_top_factors"],
                recommended_friction_breaker=cfg["recommended_friction_breaker"],
                prereq_validation_passed=cfg["prereq_validation_passed"],
                missing_prereq_Leading_items=cfg["missing_prereq_items"],
            )
            sess.add(loop)
            await sess.flush()

            prev_hash = "0" * 64
            states = cfg["state_sequence"]
            for seq_idx, state in enumerate(states, start=1):
                from_s = states[seq_idx - 2] if seq_idx > 1 else None
                event_name = "RESULT_INGESTED" if seq_idx == 1 else f"TRANSITION_TO_{state}"
                payload = {
                    "loop_code": cfg["loop_code"],
                    "state": state,
                    "acuity": cfg["acuity_tier"],
                    "facility": cfg["custody_facility"],
                }
                block = await append_audit_block(
                    session=sess,
                    loop_id=loop_id,
                    from_state=from_s,
                    to_state=state,
                    actor_id=cfg["custody_holder_id"],
                    actor_role="Clinical System Engine",
                    event_type=event_name,
                    payload=payload,
                )

        loop_counter = 501
        for p_data in DEMOGRAPHIC_PATIENTS:
            p_id = str(uuid.uuid4())
            p_fhir = {
                "resourceType": "Patient",
                "id": p_id,
                "identifier": [{"system": "https://custodia.health/mrn", "value": p_data["mrn"]}],
                "name": [{"text": p_data["name"]}],
                "gender": p_data["sex"].lower(),
            }

            p_model = PatientModel(
                id=p_id,
                mrn=p_data["mrn"],
                full_name=p_data["name"],
                age=p_data["age"],
                sex=p_data["sex"],
                preferred_language=p_data["lang"],
                region_code="RGN-" + p_data["nat"][:3].upper(),
                nationality_group=p_data["nat"],
                payer_plan=p_data["payer"],
                distance_km=p_data["dist"],
                prior_no_show_count=p_data["no_show"],
                fhir_patient_json=p_fhir,
            )
            sess.add(p_model)
            await sess.flush()

            tpl = FINDING_TEMPLATES[loop_counter % len(FINDING_TEMPLATES)]
            l_code = f"LOOP-COHORT-{loop_counter}"
            acc_num = f"ACC-DEMO-{loop_counter}"

            r_id = f"FHIR-{l_code}-OBS"
            r_fhir = {
                "resourceType": "DiagnosticReport",
                "id": r_id,
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": tpl["loinc"]}]},
                "conclusion": tpl["summary"],
            }
            r_model = FhirResourceModel(
                id=r_id,
                patient_id=p_id,
                accession_number=acc_num,
                resource_type="DiagnosticReport",
                loinc_or_icd_code=tpl["loinc"],
                report_status="final",
                display_summary=tpl["summary"],
                numeric_value=tpl["val"],
                unit=tpl["unit"],
                fhir_json=r_fhir,
                extraction_confidence=0.95,
            )
            sess.add(r_model)
            await sess.flush()

            state_options = [
                ("1_RESULT_ISSUED", 0, False, "ORIGIN_HELD"),
                ("2_PATIENT_NOTIFIED", 45, False, "ORIGIN_HELD"),
                ("3_COMPREHENSION_VERIFIED", 85, True, "ORIGIN_HELD"),
                ("4_PREREQ_VALIDATED", 90, True, "ORIGIN_HELD"),
                ("5_REFERRAL_SUBMITTED", 92, True, "PENDING_ACCEPTANCE"),
                ("6_HANDSHAKE_ACCEPTED", 95, True, "ACCEPTED_TRANSFERRED"),
                ("7_CARE_DELIVERED", 96, True, "ACCEPTED_TRANSFERRED"),
                ("8_VERIFIED_CLOSED", 98, True, "ACCEPTED_TRANSFERRED"),
            ]
            c_state, c_comp, c_prereq, c_hshake = state_options[loop_counter % len(state_options)]

            acuity_res = compute_acuity(p_data["pack"], tpl["category"], tpl["val"])
            hazard_res = compute_dropoff_hazard(p_data, {"comprehension_score": c_comp}, c_comp)

            is_closed = (c_state == "8_VERIFIED_CLOSED")
            closure_evidence_id = r_id if is_closed else None
            closure_code = "DX-CONFIRMED-TREATMENT-INITIATED" if is_closed else None
            closure_sig = "SIG_ECDSA_P256_VERIFIED_COHORT_SEEDED" if is_closed else None

            l_id = str(uuid.uuid4())
            cohort_loop = ScreeningLoopModel(
                id=l_id,
                loop_code=l_code,
                patient_id=p_id,
                market_pack_id=p_data["pack"],
                trigger_resource_id=r_id,
                accession_number=acc_num,
                finding_category=tpl["category"],
                acuity_tier=acuity_res["acuity_tier"],
                current_state=c_state,
                optimistic_version=1,
                custody_holder_id="DR-COHORT-STAFF",
                custody_holder_name="Dr. Clinical Registrar, MD",
                custody_facility="Regional Ambulatory Health System",
                target_specialty=tpl["specialty"],
                receiving_specialist_facility="Regional Specialist Academic Medical Center" if c_hshake != "ORIGIN_HELD" else None,
                handshake_status=c_hshake,
                sla_hours=acuity_res["sla_hours"],
                sla_deadline_iso=future_iso(acuity_res["sla_hours"]),
                sla_breached=False,
                comprehension_score=c_comp,
                teachback_turns=[],
                dropoff_hazard_score=hazard_res["dropoff_hazard_score"],
                dropoff_top_factors=hazard_res["top_factors"],
                recommended_friction_breaker=hazard_res["recommended_friction_breaker"],
                prereq_validation_passed=c_prereq,
                missing_prereq_Leading_items=[],
                closure_code=closure_code,
                closure_fhir_evidence_id=closure_evidence_id,
                closure_clinician_signature=closure_sig,
                closed_at_iso=past_iso(4.0) if is_closed else None,
            )
            sess.add(cohort_loop)
            await sess.flush()

            await append_audit_block(
                session=sess,
                loop_id=l_id,
                from_state=None,
                to_state=c_state,
                actor_id="COHORT_SEED_ENGINE",
                actor_role="System Seeder",
                event_type="LOOP_INITIALIZED",
                payload={
                    "loop_code": l_code,
                    "patient_mrn": p_data["mrn"],
                    "state": c_state,
                    "acuity": acuity_res["acuity_tier"],
                },
            )

            loop_counter += 1

        await sess.commit()
        print(f"Successfully seeded database with {len(SPOTLIGHT_CONFIGS)} Spotlight Loops and {len(DEMOGRAPHIC_PATIENTS)} Demographic Cohort Patients.")

    if session is not None:
        await _do_seed(session)
    else:
        async with async_session_factory() as sess:
            await _do_seed(sess)

if __name__ == "__main__":
    asyncio.run(seed_cohort())

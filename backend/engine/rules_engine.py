import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import yaml
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Cached market packs dictionary
_MARKET_PACKS_CACHE: Optional[Dict[str, Any]] = None

def get_market_packs_path() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "market_packs", "packs.yaml")

def load_market_packs() -> Dict[str, Any]:
    global _MARKET_PACKS_CACHE
    if _MARKET_PACKS_CACHE is not None:
        return _MARKET_PACKS_CACHE

    yaml_path = get_market_packs_path()
    if not os.path.exists(yaml_path):
        raise FileNotFoundError(f"Market packs file not found at: {yaml_path}")

    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    packs = data.get("packs", {})
    _MARKET_PACKS_CACHE = packs
    return packs

def get_market_pack(pack_id: str) -> Dict[str, Any]:
    packs = load_market_packs()
    if pack_id in packs:
        return packs[pack_id]
    if "pack-uae-doh" in packs:
        return packs["pack-uae-doh"]
    return next(iter(packs.values())) if packs else {}

def compute_acuity(
    market_pack_id: str,
    finding_category: str,
    numeric_value: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Computes deterministic clinical acuity tier and statutory SLA hours per Market Pack YAML.
    TIER_1_CRITICAL: 2h SLA (e.g. Critical Electrolyte panic values)
    TIER_2_HIGH: 48h SLA (e.g. BI-RADS 4, positive FIT, elevated PSA, uncontrolled diabetes renal)
    TIER_3_ROUTINE: 336h SLA (14 days, routine surveillance)
    """
    pack = get_market_pack(market_pack_id)
    acuity_rules = pack.get("acuity_rules", {})
    rule = acuity_rules.get(finding_category)

    if rule:
        tier = rule.get("tier", "TIER_2_HIGH")
        sla_hours = int(rule.get("sla_hours", 48))
        guideline = rule.get("guideline", "Standard Clinical Practice Protocol")
        rationale = rule.get("rationale", "Screening anomaly requires confirmatory evaluation")
    else:
        tier = "TIER_2_HIGH"
        sla_hours = 48
        guideline = "General Clinical Practice Protocol"
        rationale = f"Finding {finding_category} requires specialist assessment within 48h SLA"

    # Deterministic overrides based on category and numeric panic values
    if finding_category == "ELECTROLYTE_CRITICAL":
        tier = "TIER_1_CRITICAL"
        sla_hours = 2
        val_str = f"{numeric_value} mmol/L" if numeric_value is not None else "Critical"
        rationale = f"Panic value alert: Serum K+ {val_str} presents acute fatal dysrhythmia risk: < 2h SLA rapid escalation"

    elif finding_category == "BREAST_BIRADS_4":
        tier = "TIER_2_HIGH"
        sla_hours = 48
        rationale = "Suspicious BI-RADS 4 abnormality with 2% to 95% malignancy likelihood: 48h confirmatory ultrasound and oncology referral SLA"

    elif finding_category == "GENOMIC_COUPLE_HBB":
        tier = "TIER_1_CRITICAL"
        sla_hours = 48
        rationale = "Dual heterozygous carrier beta-thalassemia trait: 25% affected offspring risk requires urgent premarital genetic counseling within 48h SLA"

    elif finding_category == "METABOLIC_HBA1C_RENAL":
        tier = "TIER_2_HIGH"
        sla_hours = 48
        val_str = f"HbA1c {numeric_value}%" if numeric_value is not None else "High HbA1c"
        rationale = f"Severe hyperglycemia ({val_str}) with renal microvascular threat requires nephrology consult within 48h SLA"

    elif finding_category == "COLORECTAL_FIT_POS":
        tier = "TIER_2_HIGH"
        sla_hours = 48
        rationale = "Positive fecal immunochemical screening test requires diagnostic colonoscopy intake within 48h SLA"

    elif finding_category == "UROLOGY_PSA_ELEVATED":
        tier = "TIER_2_HIGH"
        sla_hours = 48
        val_str = f"PSA {numeric_value} ng/mL" if numeric_value is not None else "Elevated PSA"
        rationale = f"Markedly elevated prostate biomarker ({val_str}) warrants accelerated urology intake within 48h SLA"

    now_utc = datetime.now(timezone.utc)
    deadline = now_utc + timedelta(hours=sla_hours)

    return {
        "acuity_tier": tier,
        "sla_hours": sla_hours,
        "sla_deadline_iso": deadline.isoformat(),
        "clinical_guideline": guideline,
        "rationale": rationale,
    }

def validate_prerequisites(
    market_pack_id: str,
    finding_category: str,
    patient_fhir_resources: List[Any],
) -> Dict[str, Any]:
    """
    Pre-Flight Referral Prerequisite Validator:
    Verifies that mandatory diagnostic workup artifacts exist prior to specialist referral.
    Prevents specialist referral bounce.
    """
    pack = get_market_pack(market_pack_id)
    prereq_rules = pack.get("prerequisite_rules", {})
    required_tests = prereq_rules.get(finding_category, [])

    if not required_tests:
        return {
            "passed": True,
            "missing_items": [],
            "satisfied_items": [],
        }

    # Collect available codes and summaries from patient's stored FHIR resources
    available_codes = set()
    available_summaries = []
    for r in patient_fhir_resources:
        if isinstance(r, dict):
            status = r.get("report_status", "final")
            if status == "cancelled":
                continue
            code = r.get("loinc_or_icd_code")
            summary = (r.get("display_summary") or "").lower()
            res_id = r.get("id")
        else:
            status = getattr(r, "report_status", "final")
            if status == "cancelled":
                continue
            code = getattr(r, "loinc_or_icd_code", None)
            summary = (getattr(r, "display_summary", None) or "").lower()
            res_id = getattr(r, "id", None)

        if code:
            available_codes.add(str(code).strip())
        if res_id:
            available_codes.add(str(res_id).strip())
        available_summaries.append(summary)

    missing_items: List[Dict[str, Any]] = []
    satisfied_items: List[Dict[str, Any]] = []

    for test in required_tests:
        test_code = str(test.get("code", "")).strip()
        test_name = test.get("name", "")
        mandatory = test.get("mandatory", True)

        # Check by code match or partial summary match
        code_matched = test_code in available_codes
        summary_matched = any(
            test_name.lower() in s or test_code.lower() in s for s in available_summaries
        )

        matched = code_matched or summary_matched

        item_detail = {
            "code": test_code,
            "name": test_name,
            "mandatory": mandatory,
        }

        if matched:
            satisfied_items.append(item_detail)
        else:
            if mandatory:
                missing_items.append(item_detail)

    passed = len(missing_items) == 0
    return {
        "passed": passed,
        "missing_items": missing_items,
        "satisfied_items": satisfied_items,
    }

async def check_idempotency(
    session: AsyncSession,
    patient_id: str,
    accession_number: str,
    finding_category: str,
    report_status: str = "final",
) -> Dict[str, Any]:
    """
    Idempotency & Accession deduplication engine (PRD Invariant 2).
    Deduplicates on (patient_id, accession_number, finding_category).
    Returns action: "CREATE" | "MERGE_AMENDED" | "FLAG_CANCELLED" | "SKIP_DUPLICATE"
    """
    try:
        from backend.models import ScreeningLoopModel
    except ImportError:
        from models import ScreeningLoopModel

    stmt = select(ScreeningLoopModel).where(
        ScreeningLoopModel.patient_id == patient_id,
        ScreeningLoopModel.accession_number == accession_number,
        ScreeningLoopModel.finding_category == finding_category,
    )
    result = await session.execute(stmt)
    existing_loop = result.scalars().first()

    if not existing_loop:
        return {
            "action": "CREATE",
            "existing_loop": None,
            "existing_loop_id": None,
        }

    if report_status == "amended":
        return {
            "action": "MERGE_AMENDED",
            "existing_loop": existing_loop,
            "existing_loop_id": existing_loop.id,
        }
    elif report_status == "cancelled":
        return {
            "action": "FLAG_CANCELLED",
            "existing_loop": existing_loop,
            "existing_loop_id": existing_loop.id,
        }
    else:
        return {
            "action": "SKIP_DUPLICATE",
            "existing_loop": existing_loop,
            "existing_loop_id": existing_loop.id,
        }

def compute_dropoff_hazard(
    patient: Any,
    loop: Any,
    current_comprehension_score: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Explainable Survival Drop-Off Hazard Calculator:
    Outputs dropoff_hazard_score (0.05 - 0.98), dropoff_top_factors, and recommended_friction_breaker.
    """
    if isinstance(patient, dict):
        age = patient.get("age", 45)
        distance_km = float(patient.get("distance_km", 8.5))
        prior_no_shows = int(patient.get("prior_no_show_count", 0))
        payer_plan = (patient.get("payer_plan") or "").upper()
        preferred_lang = (patient.get("preferred_language") or "en").lower()
    else:
        age = getattr(patient, "age", 45)
        distance_km = float(getattr(patient, "distance_km", 8.5))
        prior_no_shows = int(getattr(patient, "prior_no_show_count", 0))
        payer_plan = (getattr(patient, "payer_plan", "") or "").upper()
        preferred_lang = (getattr(patient, "preferred_language", "en") or "en").lower()

    if current_comprehension_score is not None:
        comp_score = current_comprehension_score
    elif isinstance(loop, dict):
        comp_score = int(loop.get("comprehension_score", 0))
    else:
        comp_score = int(getattr(loop, "comprehension_score", 0))

    score = 0.10
    top_factors: List[str] = []

    # Factor 1: Distance
    if distance_km >= 25.0:
        score += 0.35
        top_factors.append(f"Transit barrier: Residence is {distance_km:.1f} km from specialist clinic")
    elif distance_km >= 12.0:
        score += 0.18
        top_factors.append(f"Geographic distance: {distance_km:.1f} km transit required")

    # Factor 2: Prior no-shows
    if prior_no_shows >= 2:
        score += 0.32
        top_factors.append(f"High historical attrition: {prior_no_shows} previous clinic no-shows on record")
    elif prior_no_shows == 1:
        score += 0.16
        top_factors.append("Prior no-show history: 1 unexcused missed appointment")

    # Factor 3: Teach-back comprehension
    if comp_score > 0 and comp_score < 50:
        score += 0.32
        top_factors.append(f"Critical comprehension barrier: Patient scored {comp_score}/100 on Teach-Back evaluation")
    elif comp_score > 0 and comp_score < 75:
        score += 0.16
        top_factors.append(f"Sub-optimal Teach-Back score: {comp_score}/100 requires reinforcement")
    elif comp_score == 0:
        score += 0.12
        top_factors.append("Pending patient engagement: Initial Teach-Back not yet completed")

    # Factor 4: Geriatric vulnerability
    if age >= 75:
        score += 0.12
        top_factors.append(f"Geriatric vulnerability: Patient age {age} requires assisted escort coordination")
    elif age >= 65:
        score += 0.06
        top_factors.append(f"Senior cohort: Patient age {age}")

    # Factor 5: Financial / Payer friction
    if any(k in payer_plan for k in ("UNINSURED", "HIGH_DED", "SELF", "COP_HIGH")):
        score += 0.22
        top_factors.append("Financial out-of-pocket friction: Payer copay/coinsurance requires clearance")

    # Clamp hazard score between 0.05 and 0.98
    hazard_score = max(0.05, min(0.98, round(score, 3)))

    # Determine recommended friction breaker
    if distance_km >= 20.0 and comp_score < 50:
        friction_breaker = "Dispatch guaranteed medical transit voucher and schedule nurse navigator home video visit"
    elif distance_km >= 20.0:
        friction_breaker = "Dispatch guaranteed medical transit voucher and coordinate telehealth triage option"
    elif prior_no_shows >= 2:
        friction_breaker = "Assign dedicated community health worker escort with automated WhatsApp reminders"
    elif comp_score > 0 and comp_score < 60:
        friction_breaker = "Trigger immediate nurse navigator audio call in patient's primary dialect"
    elif any(k in payer_plan for k in ("UNINSURED", "HIGH_DED", "SELF")):
        friction_breaker = "Attach institutional financial charity grant and waiver of specialist facility fee"
    else:
        friction_breaker = "Send personalized SMS appointment confirmation with GPS directions and calendar sync"

    return {
        "dropoff_hazard_score": hazard_score,
        "top_factors": top_factors,
        "recommended_friction_breaker": friction_breaker,
    }

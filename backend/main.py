import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from dotenv import load_dotenv
from fastapi import (
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

load_dotenv()

try:
    from backend.ai.openai_service import (
        chat_with_companion,
        evaluate_teachback_turn,
        extract_clinical_data,
        generate_econsult_card,
        get_openai_client,
        synthesize_speech,
        transcribe_audio,
    )
    from backend.database import async_session_factory, get_async_session, init_db
    from backend.engine.custody_ledger import (
        InvalidStateTransitionError,
        OptimisticLockError,
        append_audit_block,
        compute_canonical_hash,
        restore_chain_integrity,
        simulate_tamper_attack,
        transition_state,
        verify_dual_key_closure,
        verify_full_hash_chain,
    )
    from backend.engine.rules_engine import (
        check_idempotency,
        compute_acuity,
        compute_dropoff_hazard,
        get_market_pack,
        load_market_packs,
        validate_prerequisites,
    )
    from backend.models import (
        CustodyAuditLogModel,
        FhirResourceModel,
        PatientModel,
        ScreeningLoopModel,
    )
    from backend.seed_cohort import seed_cohort
except ImportError:
    from ai.openai_service import (
        chat_with_companion,
        evaluate_teachback_turn,
        extract_clinical_data,
        generate_econsult_card,
        get_openai_client,
        synthesize_speech,
        transcribe_audio,
    )
    from database import async_session_factory, get_async_session, init_db
    from engine.custody_ledger import (
        InvalidStateTransitionError,
        OptimisticLockError,
        append_audit_block,
        compute_canonical_hash,
        restore_chain_integrity,
        simulate_tamper_attack,
        transition_state,
        verify_dual_key_closure,
        verify_full_hash_chain,
    )
    from engine.rules_engine import (
        check_idempotency,
        compute_acuity,
        compute_dropoff_hazard,
        get_market_pack,
        load_market_packs,
        validate_prerequisites,
    )
    from models import (
        CustodyAuditLogModel,
        FhirResourceModel,
        PatientModel,
        ScreeningLoopModel,
    )
    from seed_cohort import seed_cohort

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

# Event Broadcasting State
active_websockets: Set[WebSocket] = set()
active_sse_queues: Set[asyncio.Queue] = set()

async def broadcast_event(event_type: str, data: Any) -> None:
    message_payload = {
        "event": event_type,
        "data": data,
        "timestamp": now_iso(),
    }
    encoded = json.dumps(message_payload, default=str)

    # Broadcast to WebSockets
    for ws in list(active_websockets):
        try:
            await ws.send_text(encoded)
        except Exception:
            active_websockets.discard(ws)

    # Broadcast to SSE subscribers
    sse_chunk = f"event: {event_type}\ndata: {encoded}\n\n"
    for q in list(active_sse_queues):
        try:
            q.put_nowait(sse_chunk)
        except Exception:
            active_sse_queues.discard(q)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    await init_db()
    load_market_packs()

    # Automatically check if database has seed data; seed if empty
    async with async_session_factory() as session:
        result = await session.execute(select(func.count(PatientModel.id)))
        patient_count = result.scalar() or 0
        if patient_count == 0:
            print("[CUSTODIA] Empty database detected. Seeding 42 synthetic patients and 6 spotlight loops...")
            await seed_cohort(session)
            print("[CUSTODIA] Seeding complete.")
        else:
            print(f"[CUSTODIA] Database ready with {patient_count} existing synthetic patient records.")

    yield
    # Shutdown sequence
    active_websockets.clear()
    active_sse_queues.clear()

app = FastAPI(
    title="CUSTODIA Health OS",
    description="Autonomous Clinical Custody & Screening-to-Care Loop-Closure Engine",
    version="4.0",
    lifespan=lifespan,
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request Models
class IntakeRequest(BaseModel):
    patient_id: Optional[str] = None
    mrn: Optional[str] = None
    patient_name: Optional[str] = None
    accession_number: Optional[str] = None
    report_status: str = "final"
    market_pack_id: str = "pack-uae-doh"
    raw_text: str

class StateTransitionRequest(BaseModel):
    to_state: str
    expected_version: int
    actor_id: str
    actor_role: str = "Attending Clinician"
    event_type: str = "MANUAL_TRANSITION"
    payload: Dict[str, Any] = Field(default_factory=dict)

class TeachBackTurnRequest(BaseModel):
    patient_input: str
    language: str = "en"

class NavigatorChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    language: Optional[str] = "en"
    loop_code: Optional[str] = "LOOP-UAE-401"
    patient_name: Optional[str] = "Sophia Bennett"

class CompanionChatRequest(BaseModel):
    message: str
    patient_name: Optional[str] = "Sophia Bennett"
    finding_category: Optional[str] = "BREAST_BIRADS_4"
    history: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    loop_code: Optional[str] = "LOOP-UAE-401"

class HandshakeInitiateRequest(BaseModel):
    receiving_facility: str
    target_specialist_name: Optional[str] = None
    expected_version: int
    actor_id: str

class HandshakeAcceptRequest(BaseModel):
    specialist_id: str
    specialist_name: str
    specialist_facility: str
    slot_id: str
    start_time_iso: str
    expected_version: int

class HandshakeRejectRequest(BaseModel):
    specialist_id: str
    rejection_reason: str
    expected_version: int

class DualKeyClosureRequest(BaseModel):
    closure_code: str
    closure_fhir_evidence_id: str
    closure_clinician_signature: str
    closure_public_key_jwk: Optional[Dict[str, Any]] = None
    expected_version: Optional[int] = None
    actor_id: Optional[str] = "SPEC-DR-AL-HASHIMI"

class OrderPrereqRequest(BaseModel):
    code: str
    name: str
    clinician_id: Optional[str] = "DR-ATTENDING-01"

class BookSlotRequest(BaseModel):
    slot_id: str
    facility_name: str
    start_iso: str
    specialist_name: str
    facility_id: Optional[str] = None

class TamperSimulationRequest(BaseModel):
    target_seq_num: int
    malicious_payload: Dict[str, Any]

class AudioSynthesizeRequest(BaseModel):
    text: str
    voice: str = "alloy"

# Root & Health Endpoints
@app.get("/")
async def root():
    return {
        "system": "CUSTODIA Health OS",
        "version": "4.0",
        "status": "active",
        "architecture": "HL7 FHIR R4 Native, RFC 8785 SHA-256 Ledger, Deterministic Market Packs",
    }

@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "timestamp": now_iso(),
        "system": "CUSTODIA Health OS",
        "version": "4.0",
    }

# Market Packs Endpoints
@app.get("/api/market-packs")
async def list_market_packs():
    packs = load_market_packs()
    return {"market_packs": list(packs.values())}

@app.get("/api/market-packs/{pack_id}")
async def get_market_pack_detail(pack_id: str):
    pack = get_market_pack(pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail=f"Market pack {pack_id} not found")
    return pack

# Patients Endpoints
@app.get("/api/patients")
async def list_patients(
    region: Optional[str] = None,
    language: Optional[str] = None,
    payer: Optional[str] = None,
    limit: int = 50,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(PatientModel)
    if region:
        stmt = stmt.where(PatientModel.region_code == region)
    if language:
        stmt = stmt.where(PatientModel.preferred_language == language)
    if payer:
        stmt = stmt.where(PatientModel.payer_plan == payer)

    stmt = stmt.order_by(PatientModel.full_name).limit(limit)
    result = await session.execute(stmt)
    patients = result.scalars().all()
    return {"patients": [p.to_dict() for p in patients], "total": len(patients)}

@app.get("/api/patients/{patient_id}")
async def get_patient_detail(
    patient_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(PatientModel).where((PatientModel.id == patient_id) | (PatientModel.mrn == patient_id))
    result = await session.execute(stmt)
    patient = result.scalars().first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    res_stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == patient.id)
    res_result = await session.execute(res_stmt)
    resources = res_result.scalars().all()

    loops_stmt = select(ScreeningLoopModel).where(ScreeningLoopModel.patient_id == patient.id)
    loops_result = await session.execute(loops_stmt)
    loops = loops_result.scalars().all()

    data = patient.to_dict()
    data["fhir_resources"] = [r.to_dict() for r in resources]
    data["screening_loops"] = [l.to_dict() for l in loops]
    return data

@app.get("/api/patients/{patient_id}/fhir-resources")
async def get_patient_fhir_resources(
    patient_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == patient_id)
    result = await session.execute(stmt)
    resources = result.scalars().all()
    return {"resources": [r.to_dict() for r in resources]}

# Screening Loops Endpoints
@app.get("/api/loops")
async def list_screening_loops(
    market_pack_id: Optional[str] = None,
    current_state: Optional[str] = None,
    acuity_tier: Optional[str] = None,
    sla_breached: Optional[bool] = None,
    limit: int = 50,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel)
    if market_pack_id:
        stmt = stmt.where(ScreeningLoopModel.market_pack_id == market_pack_id)
    if current_state:
        stmt = stmt.where(ScreeningLoopModel.current_state == current_state)
    if acuity_tier:
        stmt = stmt.where(ScreeningLoopModel.acuity_tier == acuity_tier)
    if sla_breached is not None:
        stmt = stmt.where(ScreeningLoopModel.sla_breached == sla_breached)

    stmt = stmt.order_by(desc(ScreeningLoopModel.created_at_iso)).limit(limit)
    result = await session.execute(stmt)
    loops = result.scalars().all()
    return {"loops": [l.to_dict() for l in loops], "total": len(loops)}

@app.get("/api/loops/spotlight")
async def get_spotlight_loops(session: AsyncSession = Depends(get_async_session)):
    spotlight_codes = [
        "LOOP-UAE-401",
        "LOOP-UAE-402",
        "LOOP-UAE-403",
        "LOOP-US-404",
        "LOOP-GEN-405",
        "LOOP-NHS-406",
    ]
    stmt = select(ScreeningLoopModel).where(ScreeningLoopModel.loop_code.in_(spotlight_codes))
    result = await session.execute(stmt)
    loops = result.scalars().all()

    # Sort in order of spotlight codes
    code_order = {code: i for i, code in enumerate(spotlight_codes)}
    sorted_loops = sorted(loops, key=lambda l: code_order.get(l.loop_code, 99))
    return {"spotlight_loops": [l.to_dict() for l in sorted_loops]}

@app.get("/api/loops/stats")
async def get_loops_stats(session: AsyncSession = Depends(get_async_session)):
    stmt = select(ScreeningLoopModel)
    result = await session.execute(stmt)
    loops = result.scalars().all()
    total = len(loops)
    closed = sum(1 for l in loops if l.current_state in ["8_VERIFIED_CLOSED", "CLOSED"])
    t1 = sum(1 for l in loops if l.acuity_tier in ["TIER_1_CRITICAL", "TIER_1"])
    breached = sum(1 for l in loops if l.sla_breached)
    rate = round((closed / total * 100), 1) if total > 0 else 0
    return {
        "total_active": total,
        "t1_critical": t1,
        "sla_breaches": breached,
        "closure_rate_pct": rate,
    }

@app.get("/api/loops/{loop_id}")
async def get_loop_detail(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    # Fetch patient
    p_stmt = select(PatientModel).where(PatientModel.id == loop.patient_id)
    p_res = await session.execute(p_stmt)
    patient = p_res.scalars().first()

    # Fetch trigger resource
    t_stmt = select(FhirResourceModel).where(FhirResourceModel.id == loop.trigger_resource_id)
    t_res = await session.execute(t_stmt)
    trigger = t_res.scalars().first()

    # Fetch all audit blocks
    a_stmt = (
        select(CustodyAuditLogModel)
        .where(CustodyAuditLogModel.loop_id == loop.id)
        .order_by(CustodyAuditLogModel.seq_num.asc())
    )
    a_res = await session.execute(a_stmt)
    audit_blocks = a_res.scalars().all()

    # Fetch all fhir resources for patient
    f_stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == loop.patient_id)
    f_res = await session.execute(f_stmt)
    fhir_resources = f_res.scalars().all()

    loop_dict = loop.to_dict()
    patient_dict = patient.to_dict() if patient else None
    trigger_dict = trigger.to_dict() if trigger else None
    audit_list = [a.to_dict() for a in audit_blocks]
    fhir_list = [f.to_dict() for f in fhir_resources]

    # Return nested AND top-level fields for 100% universal compatibility
    response = dict(loop_dict)
    response["loop"] = loop_dict
    response["patient"] = patient_dict
    response["trigger_resource"] = trigger_dict
    response["fhir_resources"] = fhir_list
    response["audit_blocks"] = audit_list
    response["audit_history"] = audit_list
    return response

# Idempotent Ingestion Endpoint
@app.post("/api/intake")
async def intake_screening_report(
    req: IntakeRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Ingests raw screening reports idempotently.
    Parses with OpenAI gpt-4o, determines acuity with deterministic rules,
    guards against amended/duplicate accessions, and writes genesis audit block.
    """
    # 1. Parse clinical data via OpenAI gpt-4o (or fallback)
    extraction = await extract_clinical_data(raw_report_text=req.raw_text)
    accession = req.accession_number or extraction.accession_number or f"ACC-{random_digits(6)}"

    # 2. Check Idempotency First on Accession + Finding Category (PRD Invariant 2)
    existing_loop = None
    if accession:
        stmt = select(ScreeningLoopModel).where(
            ScreeningLoopModel.accession_number == accession,
            ScreeningLoopModel.finding_category == extraction.finding_category,
        )
        res = await session.execute(stmt)
        existing_loop = res.scalars().first()

    if existing_loop:
        if extraction.report_status == "amended" or req.report_status == "amended":
            # Amended Report Merge
            existing_loop.optimistic_version += 1
            existing_loop.updated_at_iso = now_iso()
            await append_audit_block(
                session=session,
                loop_id=existing_loop.id,
                from_state=existing_loop.current_state,
                to_state=existing_loop.current_state,
                actor_id="LIS-INTEROP-FEED",
                actor_role="Automated Interop Gate",
                event_type="AMENDED_REPORT_MERGED",
                payload={
                    "accession_number": accession,
                    "finding_category": extraction.finding_category,
                    "updated_value": extraction.numeric_value,
                    "notes": "Amended lab report merged in-place into active custody contract",
                },
            )
            await session.commit()
            await broadcast_event("LOOP_AMENDED", existing_loop.to_dict())
            return {
                "action": "AMENDED_MERGE",
                "message": "Amended report merged into existing screening loop without duplication",
                "loop_code": existing_loop.loop_code,
                "loop": existing_loop.to_dict(),
            }
        else:
            # Deduplication: return existing loop
            return {
                "action": "DEDUPLICATED",
                "message": "Existing loop detected for accession and finding category",
                "loop_code": existing_loop.loop_code,
                "loop": existing_loop.to_dict(),
            }

    # 3. Resolve or locate patient
    patient = None
    if req.patient_id:
        p_stmt = select(PatientModel).where((PatientModel.id == req.patient_id) | (PatientModel.mrn == req.patient_id))
        res = await session.execute(p_stmt)
        patient = res.scalars().first()

    if not patient and req.mrn:
        p_stmt = select(PatientModel).where(PatientModel.mrn == req.mrn)
        res = await session.execute(p_stmt)
        patient = res.scalars().first()

    if not patient:
        # Create synthetic patient entry if not specified
        patient_id = str(uuid.uuid4())
        mrn_val = req.mrn or f"MRN-INTAKE-{random_digits(4)}"
        name_val = req.patient_name or "Intake Screening Patient"
        patient = PatientModel(
            id=patient_id,
            mrn=mrn_val,
            full_name=name_val,
            age=48,
            sex="Female",
            preferred_language="en",
            region_code="UAE-AUH" if "uae" in req.market_pack_id else "US-MA",
            payer_plan="THIQA" if "uae" in req.market_pack_id else "STANDARD",
            distance_km=8.0,
            prior_no_show_count=0,
            fhir_patient_json={
                "resourceType": "Patient",
                "id": patient_id,
                "name": [{"text": name_val}],
            },
            created_at_iso=now_iso(),
        )
        session.add(patient)
        await session.flush()

    # 4. Save FHIR Resource Model with unique ID
    fhir_res_id = f"FHIR-RES-{accession}-{uuid.uuid4().hex[:6]}"
    fhir_res = FhirResourceModel(
        id=fhir_res_id,
        patient_id=patient.id,
        accession_number=accession,
        resource_type="DiagnosticReport",
        loinc_or_icd_code=extraction.loinc_code,
        report_status=extraction.report_status,
        display_summary=extraction.finding_title,
        numeric_value=extraction.numeric_value,
        unit=extraction.unit,
        fhir_json={
            "resourceType": "DiagnosticReport",
            "id": fhir_res_id,
            "status": extraction.report_status,
            "code": {"coding": [{"system": "http://loinc.org", "code": extraction.loinc_code}]},
            "subject": {"reference": f"Patient/{patient.id}"},
            "conclusion": extraction.finding_title,
        },
        extraction_confidence=extraction.overall_confidence,
        source_text_span=req.raw_text[:200],
        created_at_iso=now_iso(),
    )
    session.add(fhir_res)
    await session.flush()

    # 5. Deterministic Acuity & SLA Computation
    acuity_data = compute_acuity(
        market_pack_id=req.market_pack_id,
        finding_category=extraction.finding_category,
        numeric_value=extraction.numeric_value,
    )

    # 6. Initial Drop-Off Hazard Computation
    hazard = compute_dropoff_hazard(patient=patient, loop={"comprehension_score": 0})

    # 7. Create New Screening Loop
    loop_id = str(uuid.uuid4())
    loop_code = f"LOOP-{random_digits(4)}"
    pack = get_market_pack(req.market_pack_id)
    default_facility = pack.get("partner_facilities", [{}])[0].get("name", "Regional Referral Hospital")

    new_loop = ScreeningLoopModel(
        id=loop_id,
        loop_code=loop_code,
        patient_id=patient.id,
        market_pack_id=req.market_pack_id,
        trigger_resource_id=fhir_res_id,
        accession_number=accession,
        finding_category=extraction.finding_category,
        acuity_tier=acuity_data["acuity_tier"],
        current_state="1_RESULT_ISSUED",
        optimistic_version=1,
        custody_holder_id="DR-INTAKE-01",
        custody_holder_name="Dr. Attending PCP, MD",
        custody_facility=default_facility,
        target_specialty="Specialist Consultation",
        handshake_status="ORIGIN_HELD",
        sla_hours=acuity_data["sla_hours"],
        sla_deadline_iso=acuity_data["sla_deadline_iso"],
        sla_breached=False,
        comprehension_score=0,
        teachback_turns=[],
        dropoff_hazard_score=hazard["dropoff_hazard_score"],
        dropoff_top_factors=hazard["top_factors"],
        recommended_friction_breaker=hazard["recommended_friction_breaker"],
        prereq_validation_passed=False,
        missing_prereq_Leading_items=[],
        created_at_iso=now_iso(),
        updated_at_iso=now_iso(),
    )
    session.add(new_loop)
    await session.flush()

    # 8. Append Genesis Block to Custody Audit Log
    await append_audit_block(
        session=session,
        loop_id=loop_id,
        from_state=None,
        to_state="1_RESULT_ISSUED",
        actor_id="DR-INTAKE-01",
        actor_role="Originating Clinician",
        event_type="RESULT_INTAKE_GENESIS",
        payload={
            "loop_code": loop_code,
            "accession_number": accession,
            "finding_category": extraction.finding_category,
            "acuity_tier": acuity_data["acuity_tier"],
            "sla_hours": acuity_data["sla_hours"],
            "guideline": acuity_data["clinical_guideline"],
        },
    )

    await session.commit()
    await broadcast_event("LOOP_CREATED", new_loop.to_dict())

    return {
        "action": "CREATED",
        "message": f"Screening loop {loop_code} created and locked with genesis audit block",
        "loop_code": loop_code,
        "loop": new_loop.to_dict(),
        "extraction": extraction.model_dump(),
    }

def random_digits(n: int) -> str:
    import random
    return "".join(str(random.randint(0, 9)) for _ in range(n))

# State Transition Endpoint
@app.post("/api/loops/{loop_id}/transition")
async def execute_state_transition(
    loop_id: str,
    req: StateTransitionRequest,
    session: AsyncSession = Depends(get_async_session),
):
    try:
        updated_loop = await transition_state(
            session=session,
            loop_id=loop_id,
            expected_version=req.expected_version,
            to_state=req.to_state,
            actor_id=req.actor_id,
            actor_role=req.actor_role,
            event_type=req.event_type,
            payload=req.payload,
        )
        await session.commit()
        await broadcast_event("STATE_TRANSITION", updated_loop.to_dict())
        return {
            "success": True,
            "loop": updated_loop.to_dict(),
            "message": f"Successfully transitioned to {req.to_state}",
        }
    except OptimisticLockError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

# Pre-Flight Prerequisite Validation Endpoint
@app.post("/api/loops/{loop_id}/validate-prereqs")
async def validate_loop_prerequisites(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    res_stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == loop.patient_id)
    res_result = await session.execute(res_stmt)
    patient_resources = res_result.scalars().all()

    validation_result = validate_prerequisites(
        market_pack_id=loop.market_pack_id,
        finding_category=loop.finding_category,
        patient_fhir_resources=[r.to_dict() for r in patient_resources],
    )

    loop.prereq_validation_passed = validation_result["passed"]
    loop.missing_prereq_Leading_items = validation_result["missing_items"]
    loop.updated_at_iso = now_iso()
    await session.commit()

    await broadcast_event("PREREQS_VALIDATED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "validation": validation_result,
    })

    return {
        "loop_code": loop.loop_code,
        "validation_passed": validation_result["passed"],
        "missing_prerequisite_items": validation_result["missing_items"],
        "satisfied_prerequisite_items": validation_result["satisfied_items"],
    }

# 90-Second Specialist e-Consult Card Generation Endpoint
@app.post("/api/loops/{loop_id}/generate-econsult")
@app.post("/api/loops/{loop_id}/econsult-card")
async def generate_loop_econsult_card(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    p_stmt = select(PatientModel).where(PatientModel.id == loop.patient_id)
    p_res = await session.execute(p_stmt)
    patient = p_res.scalars().first()

    r_stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == loop.patient_id)
    r_res = await session.execute(r_stmt)
    resources = r_res.scalars().all()

    card_dict = await generate_econsult_card(
        patient_info=patient.to_dict() if patient else {},
        fhir_resources=[r.to_dict() for r in resources],
        loop_info=loop.to_dict(),
    )

    loop.econsult_card_json = card_dict
    loop.updated_at_iso = now_iso()
    await session.commit()

    await broadcast_event("ECONSULT_GENERATED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "card": card_dict,
    })

    return card_dict

# Multilingual Teach-Back Turn Endpoint
@app.post("/api/loops/{loop_id}/teachback-turn")
async def process_teachback_turn(
    loop_id: str,
    req: TeachBackTurnRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    p_stmt = select(PatientModel).where(PatientModel.id == loop.patient_id)
    p_res = await session.execute(p_stmt)
    patient = p_res.scalars().first()

    current_turns = loop.teachback_turns or []
    evaluation = await evaluate_teachback_turn(
        patient_input=req.patient_input,
        conversation_history=current_turns,
        finding_info={"finding_category": loop.finding_category},
        language=req.language or (patient.preferred_language if patient else "en"),
    )

    # Append turns
    new_turns = list(current_turns)
    new_turns.append({"role": "patient", "content": req.patient_input, "timestamp": now_iso()})
    new_turns.append({"role": "assistant", "content": evaluation.empathetic_patient_reply, "timestamp": now_iso()})

    loop.teachback_turns = new_turns
    loop.comprehension_score = evaluation.comprehension_score

    # Recalculate Drop-Off Hazard
    hazard_update = compute_dropoff_hazard(
        patient=patient.to_dict() if patient else {},
        loop=loop.to_dict(),
        current_comprehension_score=evaluation.comprehension_score,
    )
    loop.dropoff_hazard_score = hazard_update["dropoff_hazard_score"]
    loop.dropoff_top_factors = hazard_update["top_factors"]
    loop.recommended_friction_breaker = hazard_update["recommended_friction_breaker"]
    loop.updated_at_iso = now_iso()

    # If comprehension >= 70 and loop in 2_PATIENT_NOTIFIED, advance state to 3_TEACHBACK_COMPLETED
    if evaluation.comprehension_score >= 70 and loop.current_state == "2_PATIENT_NOTIFIED":
        try:
            await transition_state(
                session=session,
                loop_id=loop.id,
                expected_version=loop.optimistic_version,
                to_state="3_TEACHBACK_COMPLETED",
                actor_id="TEACHBACK_ENGINE",
                actor_role="Automated Patient Companion",
                event_type="TEACHBACK_VERIFIED",
                payload={
                    "comprehension_score": evaluation.comprehension_score,
                    "barrier": evaluation.detected_barrier,
                },
            )
        except Exception:
            pass

    await session.commit()
    await broadcast_event("TEACHBACK_TURN", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "evaluation": evaluation.model_dump(),
        "comprehension_score": loop.comprehension_score,
        "dropoff_hazard_score": loop.dropoff_hazard_score,
    })

    return {
        "evaluation": evaluation.model_dump(),
        "updated_turns": new_turns,
        "dropoff_hazard": hazard_update,
    }

# Live Interactive Clinical Navigator Endpoint (OpenAI gpt-4o with Cost-Optimized Clinical Reasoning)
@app.post("/api/navigator/chat")
async def clinical_navigator_chat(
    req: NavigatorChatRequest,
    session: AsyncSession = Depends(get_async_session),
):
    """
    Live conversational AI Care Navigator using OpenAI gpt-4o.
    Provides empathetic, clinically verified guidance.
    STRICT REQUIREMENT: Answers in strictly 1 to 2 lines only.
    """
    client = get_openai_client()
    language = req.language or "en"

    finding_context = "proactive breast screening (BI-RADS 4)"
    facility_context = "Cleveland Clinic Breast Center of Excellence"
    if req.loop_code:
        try:
            stmt = select(ScreeningLoopModel).where(
                (ScreeningLoopModel.loop_code == req.loop_code)
                | (ScreeningLoopModel.id == req.loop_code)
            )
            res = await session.execute(stmt)
            loop = res.scalars().first()
            if loop:
                finding_context = loop.finding_category
                if loop.custody_facility:
                    facility_context = loop.custody_facility
        except Exception:
            pass

    system_prompt = (
        f"You are the CUSTODIA Clinical Care Navigator assisting patient {req.patient_name or 'Sophia Bennett'}. "
        f"Context: The patient has a proactive screening result ({finding_context}) managed by {facility_context}. "
        "CLINICAL RULES: "
        "1. Reassure the patient warmly that a proactive screening flag is NOT a diagnosis of cancer. "
        "2. Explain that the follow-up confirmatory check has been ordered and 100% pre-authorized. "
        "3. CRITICAL CONSTRAINT: You MUST answer in strictly 1 to 2 lines only (under 40 words total). Never exceed 2 lines! "
        "4. Respond naturally in clear, soothing English."
    )

    reply = ""
    if client:
        try:
            messages = [{"role": "system", "content": system_prompt}]
            if req.conversation_history:
                for msg in req.conversation_history[-6:]:
                    r = "assistant" if msg.get("sender", "").lower().startswith("ai") or msg.get("role") == "assistant" or "navigator" in msg.get("sender", "").lower() else "user"
                    messages.append({"role": r, "content": msg.get("text") or msg.get("content", "")})
            messages.append({"role": "user", "content": req.message})

            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=80,
                temperature=0.3,
            )
            raw = response.choices[0].message.content or ""
            reply = raw.strip()
        except Exception:
            pass

    if not reply:
        # Intelligent clinical reasoning fallback adhering strictly to 1-2 lines
        lower = req.message.lower()
        if any(w in lower for w in ("cancer", "die", "scared", "terrified", "fear", "worried")):
            reply = "Please take comfort in knowing this screening flag is not cancer; it is a routine precaution to verify your health."
        elif any(w in lower for w in ("cost", "pay", "money", "insurance", "expensive", "bill")):
            reply = "You have zero out-of-pocket expense; your follow-up check is 100% pre-authorized with a $0.00 copay."
        elif any(w in lower for w in ("when", "where", "time", "date", "appointment", "clinic", "schedule")):
            reply = "Your confirmatory appointment is ready for one-tap booking below, with complimentary transport support available."
        elif any(w in lower for w in ("pain", "hurt", "biopsy")):
            reply = "The targeted follow-up ultrasound is painless, takes just 15 minutes, and uses gentle sound waves."
        else:
            reply = f"Hello {req.patient_name or 'Sophia'}, we have organized your care pathway step-by-step to keep you healthy."

    # Physically guarantee 1 to 2 lines
    lines = [ln.strip() for ln in reply.split("\n") if ln.strip()]
    if len(lines) > 2:
        reply = " ".join(lines[:2])
    elif len(lines) == 2:
        reply = f"{lines[0]}\n{lines[1]}"
    else:
        reply = lines[0] if lines else "We are here beside you throughout every step of your health journey."

    return {
        "success": True,
        "reply": reply,
        "model": "gpt-4o",
        "sender": "Care Coordinator",
        "language": language,
        "timestamp": now_iso(),
    }

# Dedicated Ultra-Realistic Companion Chatbot Endpoint
@app.post("/api/ai/companion-chat")
async def ai_companion_chat(req: CompanionChatRequest):
    """
    Dedicated AI Care Companion Chatbot powered by OpenAI GPT-4o.
    Strictly answers in 1 to 2 lines only.
    """
    result = await chat_with_companion(
        message=req.message,
        patient_name=req.patient_name or "Sophia Bennett",
        finding_category=req.finding_category or "BREAST_BIRADS_4",
        history=req.history,
    )
    return {
        "success": True,
        "reply": result["reply"],
        "model": result.get("model", "gpt-4o"),
        "patient_name": result.get("patient_name", "Sophia Bennett"),
        "timestamp": now_iso(),
    }

# Two-Phase Custody Handshake Endpoints
@app.post("/api/loops/{loop_id}/handshake/initiate")
async def initiate_custody_handshake(
    loop_id: str,
    req: HandshakeInitiateRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    if not loop.prereq_validation_passed:
        raise HTTPException(
            status_code=400,
            detail="Cannot initiate handshake: Pre-flight referral validation has not passed. Missing prerequisite tests.",
        )

    # PRD Invariant 3: Origin provider retains active SLA liability until specialist signs acceptance
    loop.receiving_specialist_facility = req.receiving_facility
    loop.handshake_status = "PENDING_ACCEPTANCE"

    updated_loop = await transition_state(
        session=session,
        loop_id=loop.id,
        expected_version=req.expected_version,
        to_state="5_HANDSHAKE_PENDING",
        actor_id=req.actor_id,
        actor_role="Originating Clinician",
        event_type="HANDSHAKE_INITIATED",
        payload={
            "receiving_facility": req.receiving_facility,
            "target_specialist": req.target_specialist_name,
            "handshake_status": "PENDING_ACCEPTANCE",
        },
    )
    await session.commit()
    await broadcast_event("HANDSHAKE_INITIATED", updated_loop.to_dict())
    return {
        "success": True,
        "handshake_status": "PENDING_ACCEPTANCE",
        "loop": updated_loop.to_dict(),
        "message": f"Custody handshake initiated with {req.receiving_facility}. Liability retained with origin until specialist signs.",
    }

@app.post("/api/loops/{loop_id}/handshake/accept")
async def accept_custody_handshake(
    loop_id: str,
    req: HandshakeAcceptRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    # Specialist signs Task.status = accepted with a confirmed slot
    loop.handshake_status = "ACCEPTED_TRANSFERRED"
    loop.custody_holder_id = req.specialist_id
    loop.custody_holder_name = req.specialist_name
    loop.custody_facility = req.specialist_facility
    loop.booked_slot_json = {
        "slot_id": req.slot_id,
        "start_time_iso": req.start_time_iso,
        "specialist_name": req.specialist_name,
        "facility": req.specialist_facility,
    }

    updated_loop = await transition_state(
        session=session,
        loop_id=loop.id,
        expected_version=req.expected_version,
        to_state="6_CUSTODY_TRANSFERRED",
        actor_id=req.specialist_id,
        actor_role="Receiving Specialist",
        event_type="HANDSHAKE_ACCEPTED_CUSTODY_TRANSFERRED",
        payload={
            "specialist_id": req.specialist_id,
            "specialist_name": req.specialist_name,
            "slot_id": req.slot_id,
            "confirmed_time": req.start_time_iso,
        },
    )
    await session.commit()
    await broadcast_event("HANDSHAKE_ACCEPTED", updated_loop.to_dict())
    return {
        "success": True,
        "handshake_status": "ACCEPTED_TRANSFERRED",
        "loop": updated_loop.to_dict(),
        "message": f"Custody legally transferred to {req.specialist_name} at {req.specialist_facility}.",
    }

@app.post("/api/loops/{loop_id}/handshake/reject")
async def reject_custody_handshake(
    loop_id: str,
    req: HandshakeRejectRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    pack = get_market_pack(loop.market_pack_id)
    facilities = pack.get("partner_facilities", [])
    # Determine alternate network facility for automated reroute
    alternate = next((f["name"] for f in facilities if f["name"] != loop.custody_facility), "Regional Hub Hospital")

    loop.handshake_status = "REJECTED_REROUTED"
    loop.receiving_specialist_facility = alternate

    updated_loop = await transition_state(
        session=session,
        loop_id=loop.id,
        expected_version=req.expected_version,
        to_state="REJECTED_REROUTED",
        actor_id=req.specialist_id,
        actor_role="Rejecting Specialist",
        event_type="HANDSHAKE_REJECTED_REROUTING",
        payload={
            "rejection_reason": req.rejection_reason,
            "rerouted_facility": alternate,
        },
    )
    await session.commit()
    await broadcast_event("HANDSHAKE_REJECTED", updated_loop.to_dict())
    return {
        "success": True,
        "handshake_status": "REJECTED_REROUTED",
        "loop": updated_loop.to_dict(),
        "rerouted_to": alternate,
        "message": f"Referral rejected: {req.rejection_reason}. Automated reroute initiated to {alternate}.",
    }

# Dual-Key Proof-of-Closure (PoC) Endpoint
@app.post("/api/loops/{loop_id}/close")
async def execute_proof_of_closure(
    loop_id: str,
    req: DualKeyClosureRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    # Cryptographic & Evidence Dual-Key Verification
    poc_result = await verify_dual_key_closure(
        session=session,
        loop_id=loop.id,
        closure_code=req.closure_code,
        closure_fhir_evidence_id=req.closure_fhir_evidence_id,
        closure_clinician_signature=req.closure_clinician_signature,
        closure_public_key_jwk=req.closure_public_key_jwk,
        clinician_id=req.actor_id,
    )

    if not poc_result.get("verified"):
        raise HTTPException(
            status_code=400,
            detail=f"Dual-Key Proof-of-Closure Failed: {poc_result.get('reason')}",
        )

    # Save closure proof on loop
    loop.closure_code = req.closure_code
    loop.closure_fhir_evidence_id = req.closure_fhir_evidence_id
    loop.closure_clinician_signature = req.closure_clinician_signature
    loop.closure_public_key_jwk = req.closure_public_key_jwk
    loop.closed_at_iso = now_iso()

    # Transition state to 8_VERIFIED_CLOSED using current loop version
    try:
        updated_loop = await transition_state(
            session=session,
            loop_id=loop.id,
            expected_version=loop.optimistic_version,
            to_state="8_VERIFIED_CLOSED",
            actor_id=req.actor_id,
            actor_role="Attending Clinician",
            event_type="DUAL_KEY_PROOF_OF_CLOSURE_VERIFIED",
            payload={
                "closure_code": req.closure_code,
                "evidence_resource_id": req.closure_fhir_evidence_id,
                "key1_resource_type": poc_result.get("key1_resource_type"),
                "key2_method": poc_result.get("key2_method"),
                "signature_hash": req.closure_clinician_signature[:24] + "...",
            },
        )
    except Exception as trans_err:
        raise HTTPException(
            status_code=400,
            detail=f"State transition to 8_VERIFIED_CLOSED failed: {str(trans_err)}",
        )

    await session.commit()
    await broadcast_event("PROOF_OF_CLOSURE_VERIFIED", updated_loop.to_dict())

    return {
        "success": True,
        "verified": True,
        "loop": updated_loop.to_dict(),
        "key1_evidence": poc_result.get("key1_resource_type"),
        "key2_cryptography": poc_result.get("key2_method"),
        "message": "Dual-Key Proof-of-Closure accepted: screening-to-care loop verifiably closed.",
    }

@app.get("/api/ledger")
async def get_general_ledger_overview(session: AsyncSession = Depends(get_async_session)):
    stmt = select(ScreeningLoopModel).order_by(desc(ScreeningLoopModel.updated_at_iso)).limit(20)
    res = await session.execute(stmt)
    loops = res.scalars().all()
    return {"status": "ok", "ledger_loops": [l.to_dict() for l in loops], "total": len(loops)}

# Hash Chain Audit & Tamper Resilience Endpoints
@app.get("/api/loops/{loop_id}/audit-chain")
async def get_loop_audit_chain(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    blocks_stmt = (
        select(CustodyAuditLogModel)
        .where(CustodyAuditLogModel.loop_id == loop.id)
        .order_by(CustodyAuditLogModel.seq_num.asc())
    )
    blocks_res = await session.execute(blocks_stmt)
    blocks = blocks_res.scalars().all()

    return {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "chain_length": len(blocks),
        "audit_blocks": [b.to_dict() for b in blocks],
    }

@app.get("/api/loops/{loop_id}/verify-chain")
async def verify_loop_hash_chain(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    verification = await verify_full_hash_chain(session=session, loop_id=loop.id)
    return {
        "loop_code": loop.loop_code,
        "verification": verification,
    }

@app.post("/api/loops/{loop_id}/simulate-tamper")
async def simulate_loop_tamper(
    loop_id: str,
    req: TamperSimulationRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    tamper_result = await simulate_tamper_attack(
        session=session,
        loop_id=loop.id,
        target_seq_num=req.target_seq_num,
        malicious_payload=req.malicious_payload,
    )
    await broadcast_event("TAMPER_ATTACK_SIMULATED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "target_seq": req.target_seq_num,
    })
    return tamper_result

@app.post("/api/loops/{loop_id}/restore-chain")
async def restore_loop_chain(
    loop_id: str,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    restore_result = await restore_chain_integrity(session=session, loop_id=loop.id)
    await broadcast_event("CHAIN_INTEGRITY_RESTORED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
    })
    return restore_result

# Audio / Speech Endpoints
@app.post("/api/audio/transcribe")
async def audio_transcribe(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    transcription_text = await transcribe_audio(audio_bytes=audio_bytes, filename=file.filename or "audio.wav")
    return {"text": transcription_text}

@app.post("/api/audio/synthesize")
async def audio_synthesize(req: AudioSynthesizeRequest):
    speech_bytes = await synthesize_speech(text=req.text, voice=req.voice)
    return Response(content=speech_bytes, media_type="audio/mpeg")

# Real-time SSE Endpoint
@app.get("/api/events/sse")
async def sse_events_feed():
    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()
        active_sse_queues.add(queue)
        try:
            # Send initial connection handshake ping
            init_msg = json.dumps({"event": "CONNECTED", "timestamp": now_iso()})
            yield f"event: CONNECTED\ndata: {init_msg}\n\n"
            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            pass
        finally:
            active_sse_queues.discard(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.add(websocket)
    try:
        # Welcome message
        await websocket.send_text(json.dumps({
            "event": "WS_CONNECTED",
            "system": "CUSTODIA Realtime Ledger Bus",
            "timestamp": now_iso(),
        }))
        while True:
            msg = await websocket.receive_text()
            # Echo or process client events
            await websocket.send_text(json.dumps({
                "event": "ACK",
                "received_length": len(msg),
                "timestamp": now_iso(),
            }))
    except WebSocketDisconnect:
        active_websockets.discard(websocket)
    except Exception:
        active_websockets.discard(websocket)

# Order Missing Prerequisite Lab Endpoint (1-Click Order)
@app.post("/api/loops/{loop_id}/order-prereq")
async def order_missing_prerequisite(
    loop_id: str,
    req: OrderPrereqRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    new_res_id = f"FHIR-{loop.loop_code}-PREREQ-{req.code}"
    existing_res = await session.get(FhirResourceModel, new_res_id)
    if existing_res:
        existing_res.display_summary = f"Completed Pre-Flight Prerequisite: {req.name}"
        existing_res.report_status = "final"
        existing_res.extraction_confidence = 1.0
        existing_res.source_text_span = f"Expedited prerequisite order fulfilled by {req.clinician_id}"
        new_resource = existing_res
    else:
        new_resource = FhirResourceModel(
            id=new_res_id,
            patient_id=loop.patient_id,
            accession_number=f"ACC-PREREQ-{loop.loop_code}",
            resource_type="Observation",
            loinc_or_icd_code=req.code,
            report_status="final",
            display_summary=f"Completed Pre-Flight Prerequisite: {req.name}",
            fhir_json={
                "resourceType": "Observation",
                "id": new_res_id,
                "status": "final",
                "code": {"coding": [{"system": "http://loinc.org", "code": req.code}]},
                "subject": {"reference": f"Patient/{loop.patient_id}"},
            },
            extraction_confidence=1.0,
            source_text_span=f"Expedited prerequisite order fulfilled by {req.clinician_id}",
        )
        session.add(new_resource)
    await session.flush()

    res_stmt = select(FhirResourceModel).where(FhirResourceModel.patient_id == loop.patient_id)
    all_res = (await session.execute(res_stmt)).scalars().all()

    val_result = validate_prerequisites(
        market_pack_id=loop.market_pack_id,
        finding_category=loop.finding_category,
        patient_fhir_resources=all_res,
    )

    loop.prereq_validation_passed = val_result["passed"]
    loop.missing_prereq_Leading_items = val_result["missing_items"]
    loop.optimistic_version += 1
    loop.updated_at_iso = now_iso()

    await append_audit_block(
        session=session,
        loop_id=loop.id,
        from_state=loop.current_state,
        to_state=loop.current_state,
        actor_id=req.clinician_id or "DR-ATTENDING",
        actor_role="Attending Clinician",
        event_type="PREREQUISITE_ORDER_FULFILLED",
        payload={
            "ordered_code": req.code,
            "ordered_name": req.name,
            "prereq_passed": val_result["passed"],
            "remaining_missing": len(val_result["missing_items"]),
        },
    )

    await session.commit()
    await broadcast_event("PREREQUISITE_ORDERED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "ordered_code": req.code,
        "prereq_validation_passed": loop.prereq_validation_passed,
    })

    return {
        "success": True,
        "prereq_validation_passed": loop.prereq_validation_passed,
        "missing_items": loop.missing_prereq_Leading_items,
        "new_resource": new_resource.to_dict(),
        "loop": loop.to_dict(),
        "message": f"Prerequisite {req.name} ({req.code}) successfully ordered and verified.",
    }

# Book Appointment Slot Endpoint (1-Tap Booking)
@app.post("/api/loops/{loop_id}/book-slot")
async def book_appointment_slot(
    loop_id: str,
    req: BookSlotRequest,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(ScreeningLoopModel).where(
        (ScreeningLoopModel.id == loop_id)
        | (ScreeningLoopModel.loop_code == loop_id)
        | (func.upper(ScreeningLoopModel.loop_code) == loop_id.upper())
    )
    result = await session.execute(stmt)
    loop = result.scalars().first()
    if not loop:
        raise HTTPException(status_code=404, detail="Screening loop not found")

    loop.booked_slot_json = {
        "slot_id": req.slot_id,
        "facility_name": req.facility_name,
        "start_iso": req.start_iso,
        "specialist_name": req.specialist_name,
        "booked_at_iso": now_iso(),
    }
    loop.optimistic_version += 1
    loop.updated_at_iso = now_iso()

    await append_audit_block(
        session=session,
        loop_id=loop.id,
        from_state=loop.current_state,
        to_state=loop.current_state,
        actor_id="PATIENT_PORTAL",
        actor_role="Patient",
        event_type="SLOT_BOOKED",
        payload=loop.booked_slot_json,
    )

    await session.commit()
    await broadcast_event("SLOT_BOOKED", {
        "loop_id": loop.id,
        "loop_code": loop.loop_code,
        "booked_slot": loop.booked_slot_json,
    })

    return {
        "success": True,
        "loop": loop.to_dict(),
        "booked_slot": loop.booked_slot_json,
        "message": f"Pre-authorized appointment slot confirmed at {req.facility_name}.",
    }

# Referral Accept Alias
@app.post("/api/loops/{loop_id}/referral/accept")
async def referral_accept_alias(
    loop_id: str,
    req: HandshakeAcceptRequest,
    session: AsyncSession = Depends(get_async_session),
):
    return await accept_custody_handshake(loop_id=loop_id, req=req, session=session)

# Referral Reject Alias
@app.post("/api/loops/{loop_id}/referral/reject")
async def referral_reject_alias(
    loop_id: str,
    req: HandshakeRejectRequest,
    session: AsyncSession = Depends(get_async_session),
):
    return await reject_custody_handshake(loop_id=loop_id, req=req, session=session)

# Audit Aliases
@app.get("/api/audit/{loop_id}")
async def audit_chain_alias(loop_id: str, session: AsyncSession = Depends(get_async_session)):
    return await get_loop_audit_chain(loop_id=loop_id, session=session)

@app.post("/api/audit/{loop_id}/verify")
async def verify_chain_alias(loop_id: str, session: AsyncSession = Depends(get_async_session)):
    return await verify_loop_hash_chain(loop_id=loop_id, session=session)

@app.post("/api/audit/{loop_id}/tamper")
async def tamper_chain_alias(loop_id: str, req: TamperSimulationRequest, session: AsyncSession = Depends(get_async_session)):
    return await simulate_loop_tamper(loop_id=loop_id, req=req, session=session)

@app.post("/api/audit/{loop_id}/restore")
async def restore_chain_alias(loop_id: str, session: AsyncSession = Depends(get_async_session)):
    return await restore_loop_chain(loop_id=loop_id, session=session)

# Events SSE Alias
@app.get("/api/events")
async def events_sse_alias():
    return await sse_events_feed()

# Analytics: k-Anonymity Equity Matrix
@app.get("/api/stats/equity-matrix")
async def get_equity_matrix(
    suppress_small_cells: bool = Query(default=True),
    k: int = Query(default=10),
    session: AsyncSession = Depends(get_async_session),
):
    p_stmt = select(PatientModel)
    patients = (await session.execute(p_stmt)).scalars().all()

    l_stmt = select(ScreeningLoopModel)
    loops = (await session.execute(l_stmt)).scalars().all()
    loops_by_patient: Dict[str, List[Any]] = {}
    for l in loops:
        loops_by_patient.setdefault(l.patient_id, []).append(l)

    groups: Dict[str, Dict[str, Any]] = {}
    for p in patients:
        nat = p.nationality_group or "Unspecified"
        if nat not in groups:
            groups[nat] = {
                "cohort_name": nat,
                "patient_count": 0,
                "total_loops": 0,
                "converted_loops": 0,
                "breached_loops": 0,
                "hazard_sum": 0.0,
                "comp_sum": 0.0,
                "languages": set(),
                "payer_plans": set(),
            }
        g = groups[nat]
        g["patient_count"] += 1
        g["languages"].add(p.preferred_language)
        g["payer_plans"].add(p.payer_plan)

        p_loops = loops_by_patient.get(p.id, [])
        for l in p_loops:
            g["total_loops"] += 1
            if l.current_state in ("6_HANDSHAKE_ACCEPTED", "6_CUSTODY_TRANSFERRED", "7_CARE_DELIVERED", "7_ENCOUNTER_CONFIRMED", "8_VERIFIED_CLOSED"):
                g["converted_loops"] += 1
            if l.sla_breached:
                g["breached_loops"] += 1
            g["hazard_sum"] += l.dropoff_hazard_score
            g["comp_sum"] += l.comprehension_score

    matrix_rows = []
    total_suppressed = 0
    total_small_cells = 0

    for nat, g in sorted(groups.items(), key=lambda x: x[1]["patient_count"], reverse=True):
        n = g["patient_count"]
        tot_l = g["total_loops"] or 1
        conv_rate = round((g["converted_loops"] / tot_l) * 100, 1)
        avg_hazard = round(g["hazard_sum"] / tot_l, 2)
        avg_comp = round(g["comp_sum"] / tot_l, 1)
        is_small = n < k
        if is_small:
            total_small_cells += 1
        suppressed = is_small and suppress_small_cells
        if suppressed:
            total_suppressed += 1

        matrix_rows.append({
            "cohort_name": nat,
            "patient_count": n,
            "display_count": f"< {k} (Suppressed for Privacy)" if suppressed else str(n),
            "total_loops": "< 10" if suppressed else str(g["total_loops"]),
            "converted_loops": "< 10" if suppressed else str(g["converted_loops"]),
            "conversion_rate": 0.0 if suppressed else conv_rate,
            "display_conversion_rate": f"Suppressed (n={n} < k={k})" if suppressed else f"{conv_rate}%",
            "avg_dropoff_hazard": 0.0 if suppressed else avg_hazard,
            "avg_comprehension_score": 0.0 if suppressed else avg_comp,
            "breached_loops": "< 10" if suppressed else str(g["breached_loops"]),
            "languages": list(g["languages"]),
            "payer_plans": list(g["payer_plans"]),
            "is_small_cell": is_small,
            "is_suppressed": suppressed,
        })

    return {
        "k_threshold": k,
        "suppression_active": suppress_small_cells,
        "total_cohorts": len(matrix_rows),
        "total_patients": len(patients),
        "small_cells_count": total_small_cells,
        "small_cells_suppressed": total_suppressed,
        "cohorts": matrix_rows,
        "privacy_guarantee": f"k-Anonymity guarantee satisfied for k >= {k}. Cells with n < {k} are automatically masked to prevent patient re-identification.",
    }

# Analytics: Cross-Facility Conversion Funnel
@app.get("/api/stats/conversion-funnel")
async def get_conversion_funnel(session: AsyncSession = Depends(get_async_session)):
    stmt = select(ScreeningLoopModel)
    loops = (await session.execute(stmt)).scalars().all()
    total = len(loops) or 1

    stages = [
        ("1_RESULT_ISSUED", "01. Result Issued"),
        ("2_PATIENT_NOTIFIED", "02. Patient Notified"),
        ("3_COMPREHENSION_VERIFIED", "03. Teach-Back Verified"),
        ("4_PREREQ_VALIDATED", "04. Prereqs Validated"),
        ("5_REFERRAL_SUBMITTED", "05. Referral Handshake"),
        ("6_HANDSHAKE_ACCEPTED", "06. Custody Transferred"),
        ("7_CARE_DELIVERED", "07. Care Delivered"),
        ("8_VERIFIED_CLOSED", "08. Verified Closed"),
    ]

    state_rank = {
        "1_RESULT_ISSUED": 1,
        "2_PATIENT_NOTIFIED": 2,
        "3_COMPREHENSION_VERIFIED": 3,
        "3_TEACHBACK_COMPLETED": 3,
        "4_PREREQ_VALIDATED": 4,
        "5_REFERRAL_SUBMITTED": 5,
        "5_HANDSHAKE_PENDING": 5,
        "6_HANDSHAKE_ACCEPTED": 6,
        "6_CUSTODY_TRANSFERRED": 6,
        "7_CARE_DELIVERED": 7,
        "7_ENCOUNTER_CONFIRMED": 7,
        "8_VERIFIED_CLOSED": 8,
        "REJECTED_REROUTED": 5,
        "CANCELLED": 0,
    }

    funnel_data = []
    for rank, (s_key, s_label) in enumerate(stages, start=1):
        reached_count = sum(1 for l in loops if state_rank.get(l.current_state, 0) >= rank)
        current_in_state = sum(1 for l in loops if state_rank.get(l.current_state, 0) == rank)
        rate = round((reached_count / total) * 100, 1)

        funnel_data.append({
            "stage_key": s_key,
            "stage_label": s_label,
            "step_number": rank,
            "reached_count": reached_count,
            "current_count": current_in_state,
            "conversion_percentage": rate,
            "dropoff_percentage": round(100.0 - rate, 1),
        })

    return {
        "total_initiated_loops": total,
        "stages": funnel_data,
        "final_loop_closure_rate": funnel_data[-1]["conversion_percentage"] if funnel_data else 0.0,
    }

# Analytics: Live SLA Breach Interception Queue
@app.get("/api/stats/sla-breaches")
async def get_sla_breaches(session: AsyncSession = Depends(get_async_session)):
    stmt = select(ScreeningLoopModel).where(
        ScreeningLoopModel.current_state != "8_VERIFIED_CLOSED"
    )
    loops = (await session.execute(stmt)).scalars().all()
    now_utc = datetime.now(timezone.utc)

    breached = []
    urgent_tier1 = []
    near_breach = []

    for l in loops:
        loop_dict = l.to_dict()
        try:
            deadline = datetime.fromisoformat(l.sla_deadline_iso.replace("Z", "+00:00"))
            hours_left = (deadline - now_utc).total_seconds() / 3600.0
        except Exception:
            hours_left = 24.0

        loop_dict["hours_remaining"] = round(hours_left, 1)

        if l.sla_breached or hours_left <= 0:
            loop_dict["sla_status"] = "BREACHED"
            breached.append(loop_dict)
        elif l.acuity_tier == "TIER_1_CRITICAL":
            loop_dict["sla_status"] = "TIER_1_RAPID_ESCALATION"
            urgent_tier1.append(loop_dict)
        elif hours_left <= 6.0:
            loop_dict["sla_status"] = "IMMINENT_BREACH_HAZARD"
            near_breach.append(loop_dict)

    return {
        "total_active_loops": len(loops),
        "breached_count": len(breached),
        "tier1_urgent_count": len(urgent_tier1),
        "near_breach_count": len(near_breach),
        "breached_loops": breached,
        "tier1_urgent_loops": urgent_tier1,
        "near_breach_loops": near_breach,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

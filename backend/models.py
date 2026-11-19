import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

JSONVariant = JSON().with_variant(JSONB, "postgresql")

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class Base(DeclarativeBase):
    pass

class PatientModel(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    mrn: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    age: Mapped[int] = mapped_column(Integer)
    sex: Mapped[str] = mapped_column(String(16))
    preferred_language: Mapped[str] = mapped_column(String(32), default="en")
    region_code: Mapped[str] = mapped_column(String(64))
    nationality_group: Mapped[str] = mapped_column(String(64), default="Local Cohort")
    payer_plan: Mapped[str] = mapped_column(String(64))
    distance_km: Mapped[float] = mapped_column(Float, default=8.5)
    prior_no_show_count: Mapped[int] = mapped_column(Integer, default=0)
    fhir_patient_json: Mapped[dict] = mapped_column(JSONVariant)
    created_at_iso: Mapped[str] = mapped_column(String(40), default=now_iso)

    # Relationships
    fhir_resources: Mapped[List["FhirResourceModel"]] = relationship(
        "FhirResourceModel", back_populates="patient", cascade="all, delete-orphan"
    )
    screening_loops: Mapped[List["ScreeningLoopModel"]] = relationship(
        "ScreeningLoopModel", back_populates="patient", cascade="all, delete-orphan"
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "mrn": self.mrn,
            "full_name": self.full_name,
            "age": self.age,
            "sex": self.sex,
            "preferred_language": self.preferred_language,
            "region_code": self.region_code,
            "nationality_group": self.nationality_group,
            "payer_plan": self.payer_plan,
            "distance_km": self.distance_km,
            "prior_no_show_count": self.prior_no_show_count,
            "fhir_patient_json": self.fhir_patient_json,
            "created_at_iso": self.created_at_iso,
        }

class FhirResourceModel(Base):
    __tablename__ = "fhir_resources"

    id: Mapped[str] = mapped_column(String(96), primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    accession_number: Mapped[str] = mapped_column(String(64), index=True)
    resource_type: Mapped[str] = mapped_column(String(48))  # DiagnosticReport, Observation, Task, ServiceRequest, CarePlan, MedicationRequest, Consent
    loinc_or_icd_code: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    report_status: Mapped[str] = mapped_column(String(32), default="final")  # final, amended, cancelled
    display_summary: Mapped[str] = mapped_column(Text)
    numeric_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    fhir_json: Mapped[dict] = mapped_column(JSONVariant)
    extraction_confidence: Mapped[float] = mapped_column(Float, default=1.0)
    source_text_span: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at_iso: Mapped[str] = mapped_column(String(40), default=now_iso)

    # Relationships
    patient: Mapped["PatientModel"] = relationship("PatientModel", back_populates="fhir_resources")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "accession_number": self.accession_number,
            "resource_type": self.resource_type,
            "loinc_or_icd_code": self.loinc_or_icd_code,
            "report_status": self.report_status,
            "display_summary": self.display_summary,
            "numeric_value": self.numeric_value,
            "unit": self.unit,
            "fhir_json": self.fhir_json,
            "extraction_confidence": self.extraction_confidence,
            "source_text_span": self.source_text_span,
            "created_at_iso": self.created_at_iso,
        }

class ScreeningLoopModel(Base):
    __tablename__ = "screening_loops"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loop_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    patient_id: Mapped[str] = mapped_column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), index=True)
    market_pack_id: Mapped[str] = mapped_column(String(48), default="pack-uae-doh", index=True)
    trigger_resource_id: Mapped[str] = mapped_column(String(96), ForeignKey("fhir_resources.id"))
    accession_number: Mapped[str] = mapped_column(String(64), index=True)
    finding_category: Mapped[str] = mapped_column(String(64))  # BREAST_BIRADS_4, METABOLIC_HBA1C_RENAL, COLORECTAL_FIT_POS, ELECTROLYTE_CRITICAL, GENOMIC_COUPLE_HBB, UROLOGY_PSA_ELEVATED
    acuity_tier: Mapped[str] = mapped_column(String(24))  # TIER_1_CRITICAL, TIER_2_HIGH, TIER_3_ROUTINE
    current_state: Mapped[str] = mapped_column(String(48), default="1_RESULT_ISSUED")
    optimistic_version: Mapped[int] = mapped_column(Integer, default=1)
    custody_holder_id: Mapped[str] = mapped_column(String(96))
    custody_holder_name: Mapped[str] = mapped_column(String(120))
    custody_facility: Mapped[str] = mapped_column(String(120))
    target_specialty: Mapped[str] = mapped_column(String(80))
    receiving_specialist_facility: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    handshake_status: Mapped[str] = mapped_column(String(32), default="ORIGIN_HELD")  # ORIGIN_HELD, PENDING_ACCEPTANCE, ACCEPTED_TRANSFERRED, REJECTED_REROUTED
    sla_hours: Mapped[int] = mapped_column(Integer)
    sla_deadline_iso: Mapped[str] = mapped_column(String(40))
    sla_breached: Mapped[bool] = mapped_column(Boolean, default=False)
    comprehension_score: Mapped[int] = mapped_column(Integer, default=0)
    teachback_turns: Mapped[list] = mapped_column(JSONVariant, default=list)
    dropoff_hazard_score: Mapped[float] = mapped_column(Float, default=0.15)
    dropoff_top_factors: Mapped[list] = mapped_column(JSONVariant, default=list)
    recommended_friction_breaker: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    prereq_validation_passed: Mapped[bool] = mapped_column(Boolean, default=False)
    missing_prereq_Leading_items: Mapped[list] = mapped_column("missing_prereq_items", JSONVariant, default=list)
    econsult_card_json: Mapped[Optional[dict]] = mapped_column(JSONVariant, nullable=True)
    booked_slot_json: Mapped[Optional[dict]] = mapped_column(JSONVariant, nullable=True)
    closure_code: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    closure_fhir_evidence_id: Mapped[Optional[str]] = mapped_column(String(96), nullable=True)
    closure_clinician_signature: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    closure_public_key_jwk: Mapped[Optional[dict]] = mapped_column(JSONVariant, nullable=True)
    closed_at_iso: Mapped[Optional[str]] = mapped_column(String(40), nullable=True)
    created_at_iso: Mapped[str] = mapped_column(String(40), default=now_iso)
    updated_at_iso: Mapped[str] = mapped_column(String(40), default=now_iso)

    # Relationships
    patient: Mapped["PatientModel"] = relationship("PatientModel", back_populates="screening_loops")
    audit_logs: Mapped[List["CustodyAuditLogModel"]] = relationship(
        "CustodyAuditLogModel", back_populates="screening_loop", cascade="all, delete-orphan", order_by="CustodyAuditLogModel.seq_num"
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "loop_code": self.loop_code,
            "patient_id": self.patient_id,
            "market_pack_id": self.market_pack_id,
            "trigger_resource_id": self.trigger_resource_id,
            "accession_number": self.accession_number,
            "finding_category": self.finding_category,
            "acuity_tier": self.acuity_tier,
            "current_state": self.current_state,
            "optimistic_version": self.optimistic_version,
            "custody_holder_id": self.custody_holder_id,
            "custody_holder_name": self.custody_holder_name,
            "custody_facility": self.custody_facility,
            "target_specialty": self.target_specialty,
            "receiving_specialist_facility": self.receiving_specialist_facility,
            "handshake_status": self.handshake_status,
            "sla_hours": self.sla_hours,
            "sla_deadline_iso": self.sla_deadline_iso,
            "sla_breached": self.sla_breached,
            "comprehension_score": self.comprehension_score,
            "teachback_turns": self.teachback_turns or [],
            "dropoff_hazard_score": self.dropoff_hazard_score,
            "dropoff_top_factors": self.dropoff_top_factors or [],
            "recommended_friction_breaker": self.recommended_friction_breaker,
            "prereq_validation_passed": self.prereq_validation_passed,
            "missing_prereq_items": self.missing_prereq_Leading_items or [],
            "econsult_card_json": self.econsult_card_json,
            "booked_slot_json": self.booked_slot_json,
            "closure_code": self.closure_code,
            "closure_fhir_evidence_id": self.closure_fhir_evidence_id,
            "closure_clinician_signature": self.closure_clinician_signature,
            "closure_public_key_jwk": self.closure_public_key_jwk,
            "closed_at_iso": self.closed_at_iso,
            "created_at_iso": self.created_at_iso,
            "updated_at_iso": self.updated_at_iso,
        }

class CustodyAuditLogModel(Base):
    __tablename__ = "custody_audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    loop_id: Mapped[str] = mapped_column(String(36), ForeignKey("screening_loops.id", ondelete="CASCADE"), index=True)
    seq_num: Mapped[int] = mapped_column(Integer)
    from_state: Mapped[Optional[str]] = mapped_column(String(48), nullable=True)
    to_state: Mapped[str] = mapped_column(String(48))
    actor_id: Mapped[str] = mapped_column(String(96))
    actor_role: Mapped[str] = mapped_column(String(48))
    event_type: Mapped[str] = mapped_column(String(64))
    payload_json: Mapped[dict] = mapped_column(JSONVariant)
    created_at_ms: Mapped[int] = mapped_column(Integer)
    prev_hash: Mapped[str] = mapped_column(String(64))
    curr_hash: Mapped[str] = mapped_column(String(64))

    # Relationships
    screening_loop: Mapped["ScreeningLoopModel"] = relationship("ScreeningLoopModel", back_populates="audit_logs")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "loop_id": self.loop_id,
            "seq_num": self.seq_num,
            "from_state": self.from_state,
            "to_state": self.to_state,
            "actor_id": self.actor_id,
            "actor_role": self.actor_role,
            "event_type": self.event_type,
            "payload_json": self.payload_json,
            "created_at_ms": self.created_at_ms,
            "prev_hash": self.prev_hash,
            "curr_hash": self.curr_hash,
        }

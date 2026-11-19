from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ExtractedFieldItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    field_name: str
    extracted_value: str
    confidence: float
    source_quote_span: str

class ClinicalExtractionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    accession_number: str
    report_status: str  # "final", "amended", or "cancelled"
    finding_category: str  # "BREAST_BIRADS_4", "METABOLIC_HBA1C_RENAL", "COLORECTAL_FIT_POS", "ELECTROLYTE_CRITICAL", "GENOMIC_COUPLE_HBB", "UROLOGY_PSA_ELEVATED"
    finding_title: str
    loinc_code: str
    icd10_code: str
    numeric_value: Optional[float]
    unit: str
    overall_confidence: float
    extracted_fields: List[ExtractedFieldItem]

class CitedClinicalBullet(BaseModel):
    model_config = ConfigDict(extra="forbid")
    clinical_statement: str
    cited_fhir_resource_id: str

class SuggestedOrderItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    loinc_code: str
    test_display_name: str
    clinical_rationale: str

class EConsultCardResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    specialist_headline: str
    urgency_rationale: str
    longitudinal_synthesis_bullets: List[CitedClinicalBullet]
    guideline_pathway_citation: str
    focused_specialist_question: str
    suggested_confirmatory_orders: List[SuggestedOrderItem]

class TeachBackTurnResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    empathetic_patient_reply: str
    language_code: str
    comprehension_score: int  # 0 to 100
    understands_screening_vs_diagnosis: bool
    understands_next_step_and_prep: bool
    detected_barrier: str  # "NONE", "HIGH_ANXIETY", "TRANSPORT_FRICTION", "COST_CONCERN", "GENDER_CONCORDANCE_REQUEST"
    recommended_accommodation: str
    escalate_to_human_navigator: bool

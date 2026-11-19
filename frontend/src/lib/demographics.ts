/**
 * CUSTODIA Dynamic Demographic Cohort & Multi-Name Engine
 * Provides realistic, authentic multi-cohort patient and clinician identities
 * across all jurisdictions, categories, and sections.
 * Automatically rotates demo profiles dynamically so new names appear consistently.
 */

export interface DemographicPatient {
  id: string;
  mrn: string;
  full_name: string;
  age: number;
  sex: "Female" | "Male";
  preferred_language: string;
  region_code: string;
  nationality_group: string;
  payer_plan: string;
  distance_km: number;
  prior_no_show_count: number;
}

export interface DemographicClinician {
  id: string;
  name: string;
  roleTitle: string;
  facility: string;
  specialty: string;
}

export interface DemographicCohort {
  id: string;
  jurisdiction: string;
  name: string;
  patients: DemographicPatient[];
  pcpClinicians: DemographicClinician[];
  specialistClinicians: DemographicClinician[];
  navigators: DemographicClinician[];
  cmoExecutives: DemographicClinician[];
}

export const DEMOGRAPHIC_COHORTS: Record<string, DemographicCohort> = {
  "pack-uae-doh": {
    id: "pack-uae-doh",
    jurisdiction: "United Arab Emirates",
    name: "UAE Department of Health (DoH / Malaffi & Nabidh)",
    patients: [
      {
        id: "pat-uae-101",
        mrn: "MRN-UAE-401",
        full_name: "Fatma Al-Mansoor",
        age: 46,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 7.4,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-102",
        mrn: "MRN-UAE-402",
        full_name: "Rashid Al-Kaabi",
        age: 58,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 14.2,
        prior_no_show_count: 1,
      },
      {
        id: "pat-uae-103",
        mrn: "MRN-UAE-403",
        full_name: "Tariq Al-Zaabi",
        age: 52,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE Resident",
        payer_plan: "DAMAN_ENHANCED",
        distance_km: 11.0,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-104",
        mrn: "MRN-UAE-404",
        full_name: "Sheikha Al-Qasimi",
        age: 39,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-SHJ",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 8.3,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-105",
        mrn: "MRN-UAE-405",
        full_name: "Sultan Al-Shamsi",
        age: 64,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AAN",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 19.5,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-106",
        mrn: "MRN-UAE-406",
        full_name: "Meera Al-Mazrouei",
        age: 42,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 5.6,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-107",
        mrn: "MRN-UAE-407",
        full_name: "Hamad Al-Dhaheri",
        age: 71,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AAN",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 22.1,
        prior_no_show_count: 1,
      },
      {
        id: "pat-uae-108",
        mrn: "MRN-UAE-408",
        full_name: "Noora Al-Remeithi",
        age: 34,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 6.8,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-109",
        mrn: "MRN-UAE-409",
        full_name: "Maria Santos",
        age: 44,
        sex: "Female",
        preferred_language: "tl",
        region_code: "UAE-DXB",
        nationality_group: "Filipino Expatriate Cohort",
        payer_plan: "DAMAN_ENHANCED",
        distance_km: 15.4,
        prior_no_show_count: 1,
      },
      {
        id: "pat-uae-110",
        mrn: "MRN-UAE-410",
        full_name: "Mohammad Tariq",
        age: 49,
        sex: "Male",
        preferred_language: "ur",
        region_code: "UAE-SHJ",
        nationality_group: "Pakistani Expatriate Cohort",
        payer_plan: "DAMAN_ENHANCED",
        distance_km: 18.0,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-111",
        mrn: "MRN-UAE-411",
        full_name: "Saeed Al-Ketbi",
        age: 56,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 9.1,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uae-112",
        mrn: "MRN-UAE-412",
        full_name: "Amina Al-Otaiba",
        age: 50,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 12.3,
        prior_no_show_count: 0,
      },
    ],
    pcpClinicians: [
      { id: "DR-UAE-201", name: "Dr. Maryam Al-Nuaimi, MD", roleTitle: "Primary Care Attending", facility: "Cleveland Clinic Abu Dhabi", specialty: "Family Medicine & Ambulatory Care" },
      { id: "DR-UAE-202", name: "Dr. Rashid Al-Kaabi, MD", roleTitle: "Origin Ambulatory Lead", facility: "Sheikh Shakhbout Medical City (SSMC)", specialty: "Internal Medicine" },
      { id: "DR-UAE-203", name: "Dr. Moza Al-Sharhan, MD", roleTitle: "Diagnostic Review Physician", facility: "Tawam Hospital Al Ain", specialty: "Preventive & Community Medicine" },
    ],
    specialistClinicians: [
      { id: "DR-UAE-SPEC-01", name: "Dr. Jonathan Hayes, FRCS", roleTitle: "Lead Surgical Oncologist", facility: "M42 Center of Excellence", specialty: "Breast Surgery & Oncology" },
      { id: "DR-UAE-SPEC-02", name: "Dr. Tariq Al-Hashimi, MD", roleTitle: "Consultant Nephrologist", facility: "Sheikh Shakhbout Medical City (SSMC)", specialty: "Renal Medicine & Hypertension" },
      { id: "DR-UAE-SPEC-03", name: "Dr. Ahmed Bin Salem, MD", roleTitle: "Emergency & Critical Care Lead", facility: "Cleveland Clinic Abu Dhabi", specialty: "Emergency Medicine" },
      { id: "DR-UAE-SPEC-04", name: "Dr. Humaid Al-Shamsi, MD", roleTitle: "Professor of Oncology", facility: "Burjeel Medical City", specialty: "Medical Oncology" },
    ],
    navigators: [
      { id: "NAV-UAE-01", name: "Amina Al-Falasi, RN", roleTitle: "Lead Nurse Navigator", facility: "Comprehensive Patient Navigation Center", specialty: "Clinical Triage & Patient Retention" },
      { id: "NAV-UAE-02", name: "Sara Al-Hajri, BSN", roleTitle: "Multilingual Care Coordinator", facility: "DoH Care Coordination Desk", specialty: "Patient Education & Teach-Back" },
    ],
    cmoExecutives: [
      { id: "CMO-UAE-01", name: "Dr. Farida Al-Hosani, MD", roleTitle: "Chief Medical Officer", facility: "DoH Healthcare Command Clearinghouse", specialty: "Population Health & Clinical Governance" },
    ],
  },

  "pack-us-cms": {
    id: "pack-us-cms",
    jurisdiction: "United States",
    name: "United States Centers for Medicare & Medicaid Services (CMS)",
    patients: [
      {
        id: "pat-us-101",
        mrn: "MRN-US-601",
        full_name: "Eleanor Vance",
        age: 54,
        sex: "Female",
        preferred_language: "en",
        region_code: "US-MA",
        nationality_group: "US Cohort",
        payer_plan: "MEDICARE_B",
        distance_km: 12.4,
        prior_no_show_count: 0,
      },
      {
        id: "pat-us-102",
        mrn: "MRN-US-602",
        full_name: "James Henderson",
        age: 63,
        sex: "Male",
        preferred_language: "en",
        region_code: "US-MN",
        nationality_group: "US Cohort",
        payer_plan: "MEDICARE_ADVANTAGE",
        distance_km: 28.0,
        prior_no_show_count: 2,
      },
      {
        id: "pat-us-103",
        mrn: "MRN-US-603",
        full_name: "Marcus Rodriguez",
        age: 49,
        sex: "Male",
        preferred_language: "es",
        region_code: "US-TX",
        nationality_group: "US Cohort (Hispanic)",
        payer_plan: "BCBS_PPO",
        distance_km: 16.5,
        prior_no_show_count: 1,
      },
      {
        id: "pat-us-104",
        mrn: "MRN-US-604",
        full_name: "Emily Watson",
        age: 41,
        sex: "Female",
        preferred_language: "en",
        region_code: "US-OH",
        nationality_group: "US Cohort",
        payer_plan: "AETNA_CHOICE",
        distance_km: 9.2,
        prior_no_show_count: 0,
      },
      {
        id: "pat-us-105",
        mrn: "MRN-US-605",
        full_name: "David Washington",
        age: 67,
        sex: "Male",
        preferred_language: "en",
        region_code: "US-NY",
        nationality_group: "US Cohort",
        payer_plan: "MEDICARE_B",
        distance_km: 14.8,
        prior_no_show_count: 0,
      },
      {
        id: "pat-us-106",
        mrn: "MRN-US-606",
        full_name: "Jennifer Miller",
        age: 48,
        sex: "Female",
        preferred_language: "en",
        region_code: "US-CA",
        nationality_group: "US Cohort",
        payer_plan: "KAISER_PERMANENTE",
        distance_km: 11.3,
        prior_no_show_count: 0,
      },
      {
        id: "pat-us-107",
        mrn: "MRN-US-607",
        full_name: "Carlos Gomez",
        age: 59,
        sex: "Male",
        preferred_language: "es",
        region_code: "US-FL",
        nationality_group: "US Cohort (Hispanic)",
        payer_plan: "HUMANA_GOLD",
        distance_km: 21.7,
        prior_no_show_count: 1,
      },
      {
        id: "pat-us-108",
        mrn: "MRN-US-608",
        full_name: "Susan Clark",
        age: 72,
        sex: "Female",
        preferred_language: "en",
        region_code: "US-MA",
        nationality_group: "US Cohort",
        payer_plan: "MEDICARE_B",
        distance_km: 8.6,
        prior_no_show_count: 0,
      },
    ],
    pcpClinicians: [
      { id: "DR-US-301", name: "Dr. Robert Chen, MD", roleTitle: "Attending Physician", facility: "Massachusetts General Hospital", specialty: "Internal Medicine" },
      { id: "DR-US-302", name: "Dr. Sarah Jenkins, MD", roleTitle: "Primary Care Lead", facility: "Mayo Clinic Health System", specialty: "Family Medicine" },
    ],
    specialistClinicians: [
      { id: "DR-US-SPEC-01", name: "Dr. Marcus Washington, MD", roleTitle: "Director of Endoscopy", facility: "MGH Digestive Healthcare Center", specialty: "Gastroenterology" },
      { id: "DR-US-SPEC-02", name: "Dr. Alistair Finch, MD", roleTitle: "Surgical Oncologist", facility: "Johns Hopkins Medicine", specialty: "Oncologic Surgery" },
      { id: "DR-US-SPEC-03", name: "Dr. Katherine Hayes, MD", roleTitle: "Consultant Nephrologist", facility: "Brigham and Women's Hospital", specialty: "Nephrology" },
    ],
    navigators: [
      { id: "NAV-US-01", name: "Patricia O'Neal, RN", roleTitle: "Senior Oncology Navigator", facility: "MGH Cancer Center Navigation", specialty: "Care Coordination & Barriers Clearing" },
    ],
    cmoExecutives: [
      { id: "CMO-US-01", name: "Dr. William Sterling, MD", roleTitle: "Chief Medical Officer", facility: "CMS Regional ACO Network", specialty: "Health Systems Leadership" },
    ],
  },

  "pack-uk-nhs": {
    id: "pack-uk-nhs",
    jurisdiction: "United Kingdom",
    name: "United Kingdom National Health Service (NHS Two-Week-Wait)",
    patients: [
      {
        id: "pat-uk-101",
        mrn: "MRN-UK-701",
        full_name: "Arthur Pendelton",
        age: 68,
        sex: "Male",
        preferred_language: "en",
        region_code: "UK-LON",
        nationality_group: "UK Cohort",
        payer_plan: "NHS_STANDARD",
        distance_km: 6.5,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uk-102",
        mrn: "MRN-UK-702",
        full_name: "Charlotte Higgins",
        age: 52,
        sex: "Female",
        preferred_language: "en",
        region_code: "UK-LON",
        nationality_group: "UK Cohort",
        payer_plan: "NHS_STANDARD",
        distance_km: 9.8,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uk-103",
        mrn: "MRN-UK-703",
        full_name: "George Davies",
        age: 61,
        sex: "Male",
        preferred_language: "en",
        region_code: "UK-MAN",
        nationality_group: "UK Cohort",
        payer_plan: "NHS_STANDARD",
        distance_km: 12.3,
        prior_no_show_count: 1,
      },
      {
        id: "pat-uk-104",
        mrn: "MRN-UK-704",
        full_name: "Claire Evans",
        age: 47,
        sex: "Female",
        preferred_language: "en",
        region_code: "UK-CAM",
        nationality_group: "UK Cohort",
        payer_plan: "NHS_STANDARD",
        distance_km: 8.1,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uk-105",
        mrn: "MRN-UK-705",
        full_name: "Oliver Wilson",
        age: 70,
        sex: "Male",
        preferred_language: "en",
        region_code: "UK-OXF",
        nationality_group: "UK Cohort",
        payer_plan: "NHS_STANDARD",
        distance_km: 15.6,
        prior_no_show_count: 0,
      },
      {
        id: "pat-uk-106",
        mrn: "MRN-UK-706",
        full_name: "Fiona Campbell",
        age: 58,
        sex: "Female",
        preferred_language: "en",
        region_code: "UK-EDI",
        nationality_group: "UK Cohort (Scottish)",
        payer_plan: "NHS_SCOTLAND",
        distance_km: 11.2,
        prior_no_show_count: 0,
      },
    ],
    pcpClinicians: [
      { id: "DR-UK-401", name: "Dr. Alistair MacLeod, FRCS", roleTitle: "GP Lead Practitioner", facility: "Guy's and St Thomas' NHS Trust", specialty: "General Practice & Triage" },
      { id: "DR-UK-402", name: "Dr. Eleanor Vance, BM BCh", roleTitle: "Clinical Fellow", facility: "Oxford University Hospitals", specialty: "Community Medicine" },
    ],
    specialistClinicians: [
      { id: "DR-UK-SPEC-01", name: "Dr. Nigel Thorne, FRCS", roleTitle: "Consultant Urologist", facility: "Guy's Hospital Cancer Centre", specialty: "Urological Oncology" },
      { id: "DR-UK-SPEC-02", name: "Dr. Alistair Finch, FRCP", roleTitle: "Consultant Oncologist", facility: "The Royal Marsden NHS Foundation Trust", specialty: "Medical Oncology" },
    ],
    navigators: [
      { id: "NAV-UK-01", name: "Sister Fiona MacIntyre, RN", roleTitle: "Macmillan Nurse Navigator", facility: "NHS Cancer Triage Hub", specialty: "Two-Week-Wait Pathway Navigation" },
    ],
    cmoExecutives: [
      { id: "CMO-UK-01", name: "Dr. Alistair MacLeod, MD", roleTitle: "Medical Director", facility: "NHS Integrated Care Board", specialty: "Clinical Governance" },
    ],
  },

  "pack-in-abdm": {
    id: "pack-in-abdm",
    jurisdiction: "India",
    name: "India Ayushman Bharat Digital Mission (ABDM & PM-JAY)",
    patients: [
      {
        id: "pat-in-101",
        mrn: "MRN-IND-801",
        full_name: "Sunita Sharma",
        age: 48,
        sex: "Female",
        preferred_language: "hi",
        region_code: "IND-DEL",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 13.5,
        prior_no_show_count: 0,
      },
      {
        id: "pat-in-102",
        mrn: "MRN-IND-802",
        full_name: "Rajesh Gupta",
        age: 55,
        sex: "Male",
        preferred_language: "hi",
        region_code: "IND-UP",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 24.0,
        prior_no_show_count: 1,
      },
      {
        id: "pat-in-103",
        mrn: "MRN-IND-803",
        full_name: "Pooja Patel",
        age: 39,
        sex: "Female",
        preferred_language: "hi",
        region_code: "IND-GUJ",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 10.2,
        prior_no_show_count: 0,
      },
      {
        id: "pat-in-104",
        mrn: "MRN-IND-804",
        full_name: "Amit Kumar",
        age: 62,
        sex: "Male",
        preferred_language: "hi",
        region_code: "IND-BIH",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 32.1,
        prior_no_show_count: 2,
      },
      {
        id: "pat-in-105",
        mrn: "MRN-IND-805",
        full_name: "Ananya Roy",
        age: 51,
        sex: "Female",
        preferred_language: "en",
        region_code: "IND-WB",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 17.8,
        prior_no_show_count: 0,
      },
      {
        id: "pat-in-106",
        mrn: "MRN-IND-806",
        full_name: "Vikram Singh",
        age: 57,
        sex: "Male",
        preferred_language: "hi",
        region_code: "IND-PUN",
        nationality_group: "Indian Cohort",
        payer_plan: "PM_JAY",
        distance_km: 14.6,
        prior_no_show_count: 0,
      },
    ],
    pcpClinicians: [
      { id: "DR-IND-501", name: "Dr. Arvind Swaminathan, MD", roleTitle: "Chief Medical Officer", facility: "All India Institute of Medical Sciences (AIIMS)", specialty: "Community Medicine" },
      { id: "DR-IND-502", name: "Dr. Sanjay Sengupta, MD", roleTitle: "Primary Attending Physician", facility: "Safdarjung Hospital", specialty: "Internal Medicine" },
    ],
    specialistClinicians: [
      { id: "DR-IND-SPEC-01", name: "Dr. Priya Nair, MS", roleTitle: "Consultant Surgical Oncologist", facility: "Tata Memorial Hospital Mumbai", specialty: "Oncology" },
      { id: "DR-IND-SPEC-02", name: "Dr. Rajesh Kulkarni, DM", roleTitle: "Director of Nephrology", facility: "Medanta The Medicity", specialty: "Nephrology" },
    ],
    navigators: [
      { id: "NAV-IND-01", name: "Sister Anju George, RN", roleTitle: "Ayushman Mitra Coordinator", facility: "AIIMS Patient Help Desk", specialty: "Patient Triage & Navigation" },
    ],
    cmoExecutives: [
      { id: "CMO-IND-01", name: "Dr. Arvind Swaminathan, MD", roleTitle: "Superintendent & CMO", facility: "ABDM Digital Registry Desk", specialty: "Public Health" },
    ],
  },

  "pack-genomics-couple": {
    id: "pack-genomics-couple",
    jurisdiction: "Global / UAE Mandate",
    name: "Cross-Jurisdiction Premarital & Couple Genomic Screening",
    patients: [
      {
        id: "pat-gen-101",
        mrn: "MRN-GEN-901",
        full_name: "Saeed & Mariam Al-Qasimi",
        age: 27,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-DXB",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "NATIONAL_GENOME_PROGRAM",
        distance_km: 9.2,
        prior_no_show_count: 0,
      },
      {
        id: "pat-gen-102",
        mrn: "MRN-GEN-902",
        full_name: "Rashid & Fatima Al-Nuaimi",
        age: 29,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-AUH",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 11.4,
        prior_no_show_count: 0,
      },
      {
        id: "pat-gen-103",
        mrn: "MRN-GEN-903",
        full_name: "Omar & Sara Al-Hashimi",
        age: 26,
        sex: "Female",
        preferred_language: "ar",
        region_code: "UAE-SHJ",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 7.8,
        prior_no_show_count: 0,
      },
      {
        id: "pat-gen-104",
        mrn: "MRN-GEN-904",
        full_name: "Khalid & Maitha Al-Marri",
        age: 31,
        sex: "Male",
        preferred_language: "ar",
        region_code: "UAE-DXB",
        nationality_group: "UAE National (Emirati)",
        payer_plan: "THIQA",
        distance_km: 13.9,
        prior_no_show_count: 0,
      },
    ],
    pcpClinicians: [
      { id: "DR-GEN-101", name: "Dr. Noura Al-Suwaidi, MD", roleTitle: "Lead Genetic Counselor", facility: "UAE National Genome Center", specialty: "Clinical Reproductive Genetics" },
    ],
    specialistClinicians: [
      { id: "DR-GEN-SPEC-01", name: "Dr. Jonathan Hayes, FRCS", roleTitle: "Head of Molecular Genetics", facility: "M42 Omics Diagnostics", specialty: "Clinical Genomics & PGT-M" },
    ],
    navigators: [
      { id: "NAV-GEN-01", name: "Amina Al-Falasi, RN", roleTitle: "Genomic Navigator", facility: "National Premarital Screening Desk", specialty: "Carrier Counseling & Follow-Up" },
    ],
    cmoExecutives: [
      { id: "CMO-GEN-01", name: "Dr. Farida Al-Hosani, MD", roleTitle: "Chair of Genomic Governance", facility: "National Genome Council", specialty: "Clinical Genetics & Policy" },
    ],
  },
};

/**
 * Storage key for session demographic rotation offset
 */
const STORAGE_KEY_OFFSET = "custodia-demo-rotation-offset";

/**
 * Get active rotation offset (0-indexed)
 */
export function getDemographicOffset(): number {
  if (typeof window === "undefined") return 0;
  try {
    const val = sessionStorage.getItem(STORAGE_KEY_OFFSET);
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * Increment and switch demographic cohort offset dynamically
 */
export function rotateDemographicProfile(): number {
  if (typeof window === "undefined") return 0;
  try {
    const current = getDemographicOffset();
    const next = (current + 1) % 10;
    sessionStorage.setItem(STORAGE_KEY_OFFSET, String(next));
    window.dispatchEvent(new CustomEvent("custodia:demographics-changed", { detail: { offset: next } }));
    return next;
  } catch {
    return 0;
  }
}

/**
 * Get the active demographic cohort object for a given market pack and offset
 */
export function getDemographicCohort(packId: string = "pack-uae-doh", explicitOffset?: number): DemographicCohort {
  const cohort = DEMOGRAPHIC_COHORTS[packId] || DEMOGRAPHIC_COHORTS["pack-uae-doh"];
  const offset = explicitOffset !== undefined ? explicitOffset : getDemographicOffset();

  if (offset === 0) return cohort;

  // Rotate patients array circularly based on offset
  const n = cohort.patients.length;
  const rotatedPatients = [...cohort.patients.slice(offset % n), ...cohort.patients.slice(0, offset % n)];

  // Rotate clinicians
  const pcpN = cohort.pcpClinicians.length;
  const rotatedPCPs = [...cohort.pcpClinicians.slice(offset % pcpN), ...cohort.pcpClinicians.slice(0, offset % pcpN)];

  const specN = cohort.specialistClinicians.length;
  const rotatedSpecs = [...cohort.specialistClinicians.slice(offset % specN), ...cohort.specialistClinicians.slice(0, offset % specN)];

  return {
    ...cohort,
    patients: rotatedPatients,
    pcpClinicians: rotatedPCPs,
    specialistClinicians: rotatedSpecs,
  };
}

/**
 * Get a specific patient by case code or category
 */
export function getPatientForCase(caseCode: string, packId: string = "pack-uae-doh"): DemographicPatient {
  const cohort = getDemographicCohort(packId);
  if (caseCode.includes("401") || caseCode.includes("MAMMO") || caseCode.includes("BIRADS")) {
    return cohort.patients[0];
  }
  if (caseCode.includes("402") || caseCode.includes("CHEM") || caseCode.includes("CRITICAL")) {
    return cohort.patients[1 % cohort.patients.length];
  }
  if (caseCode.includes("403") || caseCode.includes("DIAB") || caseCode.includes("HBA1C")) {
    return cohort.patients[2 % cohort.patients.length];
  }
  if (caseCode.includes("404") || caseCode.includes("FIT") || caseCode.includes("COLON")) {
    return cohort.patients[3 % cohort.patients.length];
  }
  if (caseCode.includes("405") || caseCode.includes("GEN")) {
    return cohort.patients[4 % cohort.patients.length];
  }
  // Round-robin fallback
  let hash = 0;
  for (let i = 0; i < caseCode.length; i++) hash += caseCode.charCodeAt(i);
  return cohort.patients[Math.abs(hash) % cohort.patients.length];
}

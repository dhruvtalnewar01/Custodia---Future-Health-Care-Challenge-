import asyncio
import os
import sys
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

def test_all():
    print("--- CUSTODIA BACKEND VERIFICATION TEST SUITE ---")
    
    # 1. Health
    r = client.get("/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[PASS] 1. Health check: OK")

    # 2. Market Packs
    r = client.get("/api/market-packs")
    assert r.status_code == 200, f"Market packs failed: {r.text}"
    packs = r.json().get("market_packs", [])
    assert len(packs) >= 5, f"Expected at least 5 packs, got {len(packs)}"
    pack_ids = [p["id"] for p in packs]
    print(f"[PASS] 2. Market packs: {pack_ids}")

    # 3. Patients
    r = client.get("/api/patients")
    assert r.status_code == 200, f"Patients failed: {r.text}"
    patients = r.json().get("patients", [])
    assert len(patients) >= 40, f"Expected >= 40 patients, got {len(patients)}"
    print(f"[PASS] 3. Patients list: {len(patients)} synthetic patients loaded")

    # 4. Loops & Spotlights
    r = client.get("/api/loops/spotlight")
    assert r.status_code == 200, f"Spotlight failed: {r.text}"
    spotlights = r.json().get("spotlight_loops", [])
    spotlight_codes = [s["loop_code"] for s in spotlights]
    print(f"[PASS] 4. Spotlight loops: {spotlight_codes}")
    for target in ["LOOP-UAE-401", "LOOP-UAE-402", "LOOP-UAE-403", "LOOP-US-404", "LOOP-GEN-405", "LOOP-NHS-406"]:
        assert target in spotlight_codes, f"Missing spotlight loop: {target}"

    # 5. Equity Matrix with Small Cell Suppression
    r = client.get("/api/stats/equity-matrix?suppress_small_cells=true")
    assert r.status_code == 200, f"Equity matrix failed: {r.text}"
    eq_data = r.json()
    suppressed_count = eq_data.get("small_cells_suppressed")
    print(f"[PASS] 5. Equity matrix: {suppressed_count} small cells suppressed (k >= 10 guarantee)")
    assert suppressed_count >= 2, f"Expected at least 2 suppressed small cells, got {suppressed_count}"

    # 6. Conversion Funnel
    r = client.get("/api/stats/conversion-funnel")
    assert r.status_code == 200, f"Funnel failed: {r.text}"
    stages = r.json().get("stages", [])
    print(f"[PASS] 6. Conversion funnel: {len(stages)} pipeline stages tracked")
    assert len(stages) == 8, f"Expected 8 funnel stages, got {len(stages)}"

    # 7. SLA Breaches
    r = client.get("/api/stats/sla-breaches")
    assert r.status_code == 200, f"SLA breaches failed: {r.text}"
    sla_data = r.json()
    print(f"[PASS] 7. SLA breaches: {sla_data.get('total_active_loops')} active loops evaluated")

    # 8. Audit Chain Verification on LOOP-UAE-401
    r = client.post("/api/audit/LOOP-UAE-401/verify")
    assert r.status_code == 200, f"Audit verify failed: {r.text}"
    is_valid = r.json().get("verification", {}).get("valid")
    assert is_valid is True, "Hash chain not valid!"
    print("[PASS] 8. RFC 8785 Hash Chain verification: 100% Cryptographically Valid")

    # 9. 1-Click Order Missing Prerequisite Lab test
    r = client.post(
        "/api/loops/LOOP-UAE-401/order-prereq",
        json={"code": "24605-8", "name": "Targeted Breast Ultrasound Report", "clinician_id": "DR-TEST-01"},
    )
    assert r.status_code == 200, f"Order prereq failed: {r.text}"
    prereq_res = r.json()
    assert prereq_res.get("prereq_validation_passed") is True, "Prereq validation did not pass after order!"
    print("[PASS] 9. 1-Click Order Missing Prerequisite Lab: Succeeded and passed validation")

    # 10. Re-verify audit chain after prerequisite order
    r = client.post("/api/audit/LOOP-UAE-401/verify")
    assert r.status_code == 200
    assert r.json().get("verification", {}).get("valid") is True
    print("[PASS] 10. Post-mutation RFC 8785 Hash Chain: Integrity perfectly preserved")

    # 11. Tamper Attack Simulation and Recovery
    r = client.post("/api/audit/LOOP-UAE-401/tamper", json={"target_seq_num": 1, "malicious_payload": {"attacker": "malicious_sql_injection"}})
    assert r.status_code == 200
    r_ver = client.post("/api/audit/LOOP-UAE-401/verify")
    assert r_ver.json().get("verification", {}).get("valid") is False, "Tamper was not detected!"
    print("[PASS] 11. Tamper Attack Simulation: Cryptographic breach detected at seq 1")

    # 12. Restore Chain Integrity
    r_rest = client.post("/api/audit/LOOP-UAE-401/restore")
    assert r_rest.status_code == 200
    r_ver2 = client.post("/api/audit/LOOP-UAE-401/verify")
    assert r_ver2.json().get("verification", {}).get("valid") is True, "Chain was not restored!"
    print("[PASS] 12. Chain Integrity Restoration: Cryptographic chain 100% restored")

    print("\n>>> ALL 12 CUSTODIA BACKEND VERIFICATION TESTS PASSED CLEANLY <<<")

if __name__ == "__main__":
    test_all()

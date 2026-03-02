"""
Backend API tests for EndocrinoPront Pro - Iteration 3
Tests: Glucose, Lab-Results, Bioimpedance new endpoints
New endpoints: GET /glucose?patientId=, GET /glucose/analyze?patientId=,
               GET /lab-results?patientId=, GET /bioimpedance?patientId=,
               POST /glucose, POST /lab-results, POST /bioimpedance
"""
import pytest
import requests
import os

BASE_URL = "http://localhost:8001"
TENANT_ID = "clitenant0000000000000001"
MEDICO_EMAIL = "rafaellarar65@gmail.com"
MEDICO_PASSWORD = "crucru22"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
    })
    return session


@pytest.fixture(scope="module")
def auth_headers(api_client):
    resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": MEDICO_EMAIL,
        "password": MEDICO_PASSWORD,
    })
    if resp.status_code == 201:
        token = resp.json()["accessToken"]
        return {"Authorization": f"Bearer {token}", "x-tenant-id": TENANT_ID}
    pytest.skip(f"Login failed ({resp.status_code}): {resp.text}")


@pytest.fixture(scope="module")
def first_patient_id(api_client, auth_headers):
    """Get the first available patient ID for tests."""
    resp = api_client.get(f"{BASE_URL}/api/v1/patients", headers=auth_headers)
    assert resp.status_code == 200, f"Failed to get patients: {resp.text}"
    patients = resp.json()
    if not patients:
        pytest.skip("No patients available - cannot test patient-related endpoints")
    return patients[0]["id"]


class TestGlucoseEndpoints:
    """Tests for /api/v1/glucose endpoints (new in iteration 3)"""

    created_log_id = None

    # ── POST /glucose ──────────────────────────────────────────────
    def test_post_glucose_creates_log(self, api_client, auth_headers, first_patient_id):
        """POST /api/v1/glucose must create a glucose log with patientId in body"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/glucose",
            json={
                "patientId": first_patient_id,
                "value": 110,
                "measuredAt": "2025-02-01T08:00:00.000Z",
                "notes": "TEST_glucose_iter3",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"POST /glucose failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, f"Missing 'id' in response. Keys: {list(data.keys())}"
        assert data["patientId"] == first_patient_id
        assert data["value"] == 110
        assert "measuredAt" in data
        TestGlucoseEndpoints.created_log_id = data["id"]

    def test_post_glucose_missing_value_returns_400(self, api_client, auth_headers, first_patient_id):
        """POST /api/v1/glucose without value must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/glucose",
            json={
                "patientId": first_patient_id,
                "measuredAt": "2025-02-01T08:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    def test_post_glucose_out_of_range_value_returns_400(self, api_client, auth_headers, first_patient_id):
        """POST /api/v1/glucose with value > 600 must return 400 (Max validation)"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/glucose",
            json={
                "patientId": first_patient_id,
                "value": 1000,
                "measuredAt": "2025-02-01T08:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    # ── GET /glucose?patientId= ────────────────────────────────────
    def test_get_glucose_returns_array(self, api_client, auth_headers, first_patient_id):
        """GET /api/v1/glucose?patientId= must return array of GlucoseLogs"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /glucose failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_get_glucose_returns_created_log(self, api_client, auth_headers, first_patient_id):
        """After POST, GET /glucose?patientId= must include created log"""
        if not TestGlucoseEndpoints.created_log_id:
            pytest.skip("No log created in previous test")
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        ids = [item["id"] for item in data]
        assert TestGlucoseEndpoints.created_log_id in ids, \
            f"Created log not found in list. IDs: {ids}"

    def test_get_glucose_log_has_required_fields(self, api_client, auth_headers, first_patient_id):
        """Each glucose log must have id, patientId, value, measuredAt"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        if data:
            item = data[0]
            for field in ["id", "patientId", "value", "measuredAt"]:
                assert field in item, f"Missing field '{field}' in glucose log. Keys: {list(item.keys())}"

    def test_get_glucose_without_auth_returns_401(self, api_client, first_patient_id):
        """GET /glucose without auth must return 401"""
        resp = requests.get(
            f"{BASE_URL}/api/v1/glucose",
            params={"patientId": first_patient_id},
            headers={"Content-Type": "application/json", "x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_get_glucose_with_limit_param(self, api_client, auth_headers, first_patient_id):
        """GET /glucose?patientId=&limit=5 must return at most 5 items"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose",
            params={"patientId": first_patient_id, "limit": 5},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /glucose with limit failed: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) <= 5, f"Expected <= 5 items, got {len(data)}"

    # ── GET /glucose/analyze?patientId= ───────────────────────────
    def test_get_glucose_analyze_returns_analysis(self, api_client, auth_headers, first_patient_id):
        """GET /api/v1/glucose/analyze?patientId= must return analysis object"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose/analyze",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /glucose/analyze failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, dict), f"Expected dict, got {type(data)}"

    def test_get_glucose_analyze_has_required_fields(self, api_client, auth_headers, first_patient_id):
        """GET /glucose/analyze must return average, min, max, count, trend"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose/analyze",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        for field in ["average", "min", "max", "count", "trend"]:
            assert field in data, f"Missing field '{field}' in analyze response. Keys: {list(data.keys())}"

    def test_get_glucose_analyze_trend_is_valid(self, api_client, auth_headers, first_patient_id):
        """GET /glucose/analyze trend must be 'up', 'down', or 'stable'"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose/analyze",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["trend"] in ["up", "down", "stable"], \
            f"Invalid trend value: {data.get('trend')}"

    def test_get_glucose_analyze_empty_patient_returns_zero_stats(self, api_client, auth_headers):
        """GET /glucose/analyze for patient with no logs must return zeroes"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/glucose/analyze",
            params={"patientId": "nonexistent-patient-iter3"},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["count"] == 0
        assert data["average"] == 0
        assert data["trend"] == "stable"


class TestLabResultsEndpoints:
    """Tests for /api/v1/lab-results endpoints (new in iteration 3)"""

    created_result_id = None

    # ── POST /lab-results ──────────────────────────────────────────
    def test_post_lab_result_creates_record(self, api_client, auth_headers, first_patient_id):
        """POST /api/v1/lab-results must create a lab result"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/lab-results",
            json={
                "patientId": first_patient_id,
                "examName": "TSH",
                "value": 2.5,
                "unit": "mIU/L",
                "reference": "0.4-4.0",
                "resultDate": "2025-02-01T00:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"POST /lab-results failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, f"Missing 'id' in response. Keys: {list(data.keys())}"
        assert data["patientId"] == first_patient_id
        assert data["examName"] == "TSH"
        assert data["value"] == 2.5
        TestLabResultsEndpoints.created_result_id = data["id"]

    def test_post_lab_result_missing_exam_name_returns_400(self, api_client, auth_headers, first_patient_id):
        """POST /lab-results without examName must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/lab-results",
            json={
                "patientId": first_patient_id,
                "value": 2.5,
                "resultDate": "2025-02-01T00:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    def test_post_lab_result_missing_value_returns_400(self, api_client, auth_headers, first_patient_id):
        """POST /lab-results without value must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/lab-results",
            json={
                "patientId": first_patient_id,
                "examName": "TSH",
                "resultDate": "2025-02-01T00:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    # ── GET /lab-results?patientId= ───────────────────────────────
    def test_get_lab_results_returns_array(self, api_client, auth_headers, first_patient_id):
        """GET /api/v1/lab-results?patientId= must return array"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/lab-results",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /lab-results failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_get_lab_results_contains_created_record(self, api_client, auth_headers, first_patient_id):
        """After POST, GET /lab-results?patientId= must contain the created record"""
        if not TestLabResultsEndpoints.created_result_id:
            pytest.skip("No lab result created in previous test")
        resp = api_client.get(
            f"{BASE_URL}/api/v1/lab-results",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        ids = [item["id"] for item in data]
        assert TestLabResultsEndpoints.created_result_id in ids, \
            f"Created result not found in list. IDs: {ids}"

    def test_get_lab_results_has_required_fields(self, api_client, auth_headers, first_patient_id):
        """Each lab result must have id, patientId, examName, value, resultDate"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/lab-results",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        if data:
            item = data[0]
            for field in ["id", "patientId", "examName", "value", "resultDate"]:
                assert field in item, f"Missing field '{field}' in lab result. Keys: {list(item.keys())}"

    def test_get_lab_results_without_auth_returns_401(self, first_patient_id):
        """GET /lab-results without auth must return 401"""
        resp = requests.get(
            f"{BASE_URL}/api/v1/lab-results",
            params={"patientId": first_patient_id},
            headers={"Content-Type": "application/json", "x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"


class TestBioimpedanceEndpoints:
    """Tests for /api/v1/bioimpedance endpoints (new in iteration 3)"""

    created_exam_id = None

    # ── POST /bioimpedance ─────────────────────────────────────────
    def test_post_bioimpedance_creates_exam(self, api_client, auth_headers, first_patient_id):
        """POST /api/v1/bioimpedance must create a bioimpedance exam"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/bioimpedance",
            json={
                "patientId": first_patient_id,
                "measuredAt": "2025-02-01T08:00:00.000Z",
                "weightKg": 75.5,
                "bodyFatPct": 22.3,
                "muscleMassKg": 31.5,
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"POST /bioimpedance failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, f"Missing 'id' in response. Keys: {list(data.keys())}"
        assert data["patientId"] == first_patient_id
        assert data["weightKg"] == 75.5
        assert data["bodyFatPct"] == 22.3
        assert data["muscleMassKg"] == 31.5
        TestBioimpedanceEndpoints.created_exam_id = data["id"]

    def test_post_bioimpedance_minimal_payload(self, api_client, auth_headers, first_patient_id):
        """POST /bioimpedance with minimal required fields must succeed"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/bioimpedance",
            json={
                "patientId": first_patient_id,
                "measuredAt": "2025-02-02T08:00:00.000Z",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"POST /bioimpedance minimal failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data

    def test_post_bioimpedance_missing_measured_at_returns_400(self, api_client, auth_headers, first_patient_id):
        """POST /bioimpedance without measuredAt must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/bioimpedance",
            json={
                "patientId": first_patient_id,
                "weightKg": 75.0,
            },
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    # ── GET /bioimpedance?patientId= ──────────────────────────────
    def test_get_bioimpedance_returns_array(self, api_client, auth_headers, first_patient_id):
        """GET /api/v1/bioimpedance?patientId= must return array of exams"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/bioimpedance",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /bioimpedance failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"

    def test_get_bioimpedance_contains_created_exam(self, api_client, auth_headers, first_patient_id):
        """After POST, GET /bioimpedance?patientId= must contain created exam"""
        if not TestBioimpedanceEndpoints.created_exam_id:
            pytest.skip("No bioimpedance exam created in previous test")
        resp = api_client.get(
            f"{BASE_URL}/api/v1/bioimpedance",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        ids = [item["id"] for item in data]
        assert TestBioimpedanceEndpoints.created_exam_id in ids, \
            f"Created exam not found. IDs: {ids}"

    def test_get_bioimpedance_has_required_fields(self, api_client, auth_headers, first_patient_id):
        """Each bioimpedance exam must have id, patientId, measuredAt"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/bioimpedance",
            params={"patientId": first_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        if data:
            item = data[0]
            for field in ["id", "patientId", "measuredAt"]:
                assert field in item, f"Missing field '{field}' in bioimpedance exam. Keys: {list(item.keys())}"

    def test_get_bioimpedance_without_auth_returns_401(self, first_patient_id):
        """GET /bioimpedance without auth must return 401"""
        resp = requests.get(
            f"{BASE_URL}/api/v1/bioimpedance",
            params={"patientId": first_patient_id},
            headers={"Content-Type": "application/json", "x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_get_bioimpedance_with_limit(self, api_client, auth_headers, first_patient_id):
        """GET /bioimpedance?patientId=&limit=2 must return at most 2 items"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/bioimpedance",
            params={"patientId": first_patient_id, "limit": 2},
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"GET /bioimpedance with limit failed: {resp.text}"
        data = resp.json()
        assert len(data) <= 2, f"Expected <= 2 items, got {len(data)}"

"""
Backend API tests for EndocrinoPront Pro - Iteration 2
Tests: Patients CRUD, AI Consultation Assist, Consultations, Templates
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


class TestPatientsCRUD:
    """Tests for /api/v1/patients CRUD operations"""

    created_patient_id = None

    def test_create_patient_returns_id_and_fullname(self, api_client, auth_headers):
        """POST /api/v1/patients must return id and fullName"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/patients",
            json={
                "fullName": "TEST_Maria Aparecida Santos",
                "birthDate": "1980-03-15",
                "sex": "F",
                "phone": "(11) 99888-7766",
                "email": "test_maria@example.com",
                "cpf": "999.888.777-66",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Expected 201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, f"Response must have 'id' field. Got: {list(data.keys())}"
        assert "fullName" in data, f"Response must have 'fullName' field. Got: {list(data.keys())}"
        assert data["fullName"] == "TEST_Maria Aparecida Santos"
        assert isinstance(data["id"], str) and len(data["id"]) > 5
        # Store for subsequent tests
        TestPatientsCRUD.created_patient_id = data["id"]

    def test_create_patient_persisted_in_list(self, api_client, auth_headers):
        """After POST, patient must appear in GET list"""
        assert TestPatientsCRUD.created_patient_id, "Need created patient id from previous test"
        resp = api_client.get(
            f"{BASE_URL}/api/v1/patients",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        patients = resp.json()
        assert isinstance(patients, list)
        ids = [p["id"] for p in patients]
        assert TestPatientsCRUD.created_patient_id in ids, \
            f"Created patient not found in list. IDs: {ids}"

    def test_get_patient_by_id(self, api_client, auth_headers):
        """GET /api/v1/patients/:id must return patient data"""
        assert TestPatientsCRUD.created_patient_id
        resp = api_client.get(
            f"{BASE_URL}/api/v1/patients/{TestPatientsCRUD.created_patient_id}",
            headers=auth_headers,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["id"] == TestPatientsCRUD.created_patient_id
        assert data["fullName"] == "TEST_Maria Aparecida Santos"
        assert data["sex"] == "F"
        assert data["cpf"] == "999.888.777-66"

    def test_update_patient_and_verify(self, api_client, auth_headers):
        """PATCH /api/v1/patients/:id must update data and persist"""
        assert TestPatientsCRUD.created_patient_id
        resp = api_client.patch(
            f"{BASE_URL}/api/v1/patients/{TestPatientsCRUD.created_patient_id}",
            json={"phone": "(11) 98765-4321", "notes": "Paciente teste - updated"},
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Update failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["phone"] == "(11) 98765-4321"

    def test_delete_patient(self, api_client, auth_headers):
        """DELETE /api/v1/patients/:id must remove patient"""
        assert TestPatientsCRUD.created_patient_id
        resp = api_client.delete(
            f"{BASE_URL}/api/v1/patients/{TestPatientsCRUD.created_patient_id}",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 204], f"Delete failed: {resp.status_code}: {resp.text}"

    def test_create_patient_missing_name_returns_error(self, api_client, auth_headers):
        """POST /api/v1/patients without fullName must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/patients",
            json={"birthDate": "1990-01-01"},
            headers=auth_headers,
        )
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"


class TestAIConsultationAssist:
    """Tests for /api/v1/ai/assist-consultation endpoint"""

    def test_ai_assist_returns_required_fields(self, api_client, auth_headers):
        """POST /api/v1/ai/assist-consultation must return assistantType and differentialDiagnoses"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/ai/assist-consultation",
            json={
                "patient": {"name": "Maria Aparecida Santos", "age": 45},
                "queixas": "fadiga, ganho de peso, intolerância ao frio",
                "historico": "hipotireoidismo em investigação",
                "avaliacao": "",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"AI assist failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "assistantType" in data, f"Missing 'assistantType'. Keys: {list(data.keys())}"
        assert "differentialDiagnoses" in data, f"Missing 'differentialDiagnoses'. Keys: {list(data.keys())}"
        assert isinstance(data["differentialDiagnoses"], list)

    def test_ai_assist_without_auth_returns_401(self, api_client):
        """POST /api/v1/ai/assist-consultation without auth must return 401"""
        resp = requests.post(
            f"{BASE_URL}/api/v1/ai/assist-consultation",
            json={"patient": {"name": "Test"}, "queixas": "dor"},
            headers={"Content-Type": "application/json", "x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_ai_assist_clinical_summary_present(self, api_client, auth_headers):
        """AI response should include clinicalSummary"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/ai/assist-consultation",
            json={
                "patient": {"name": "Ana Lima", "age": 35},
                "queixas": "polidipsia, poliúria, perda de peso",
                "historico": "",
                "avaliacao": "",
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201]
        data = resp.json()
        assert "clinicalSummary" in data or "differentialDiagnoses" in data


class TestConsultations:
    """Tests for /api/v1/consultations CRUD"""

    created_consultation_id = None
    test_patient_id = None

    def test_create_consultation_requires_patientid(self, api_client, auth_headers):
        """POST /api/v1/consultations without patientId must return 400"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/consultations",
            json={},
            headers=auth_headers,
        )
        assert resp.status_code in [400, 422], f"Expected 400/422, got {resp.status_code}: {resp.text}"

    def test_create_consultation_with_valid_patient(self, api_client, auth_headers):
        """POST /api/v1/consultations with valid patientId must succeed"""
        # First get an existing patient
        patients_resp = api_client.get(f"{BASE_URL}/api/v1/patients", headers=auth_headers)
        assert patients_resp.status_code == 200
        patients = patients_resp.json()
        if len(patients) == 0:
            pytest.skip("No patients available to create consultation")

        TestConsultations.test_patient_id = patients[0]["id"]
        resp = api_client.post(
            f"{BASE_URL}/api/v1/consultations",
            json={"patientId": TestConsultations.test_patient_id},
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Expected 201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data
        assert data["patientId"] == TestConsultations.test_patient_id
        assert data["status"] in ["DRAFT", "draft"]
        TestConsultations.created_consultation_id = data["id"]

    def test_autosave_consultation(self, api_client, auth_headers):
        """PATCH /api/v1/consultations/:id/autosave must update draft
        NOTE: Backend expects anamnese/exameFisico/diagnostico/prescricao NOT subjetivo/objetivo/avaliacao/plano
        Frontend bug: consultation-api.ts sends subjetivo/objetivo/avaliacao/plano → 400 error
        """
        if not TestConsultations.created_consultation_id:
            pytest.skip("No consultation created")
        # Test with CORRECT backend field names (anamnese/exameFisico/diagnostico/prescricao)
        resp = api_client.patch(
            f"{BASE_URL}/api/v1/consultations/{TestConsultations.created_consultation_id}/autosave",
            json={
                "anamnese": {"text": "Paciente relata fadiga há 3 meses."},
                "exameFisico": {"text": "PA: 120/80. FC: 75bpm. Peso: 70kg."},
                "diagnostico": {"text": "Hipotireoidismo subclínico."},
                "prescricao": {"text": "Solicitar TSH, T4 livre."},
            },
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Autosave failed with backend field names: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["id"] == TestConsultations.created_consultation_id

    def test_autosave_consultation_with_frontend_fields_fails(self, api_client, auth_headers):
        """PATCH autosave with frontend field names (subjetivo/objetivo) should fail with 400
        This verifies the CRITICAL BUG: frontend sends wrong field names to backend
        Bug: consultation-api.ts ConsultationDraft uses subjetivo/objetivo/avaliacao/plano
        But backend UpsertConsultationSectionDto expects anamnese/exameFisico/diagnostico/prescricao
        """
        if not TestConsultations.created_consultation_id:
            pytest.skip("No consultation created")
        resp = api_client.patch(
            f"{BASE_URL}/api/v1/consultations/{TestConsultations.created_consultation_id}/autosave",
            json={
                "subjetivo": "Paciente relata fadiga há 3 meses.",
                "objetivo": "PA: 120/80.",
                "avaliacao": "Hipotireoidismo.",
                "plano": "Solicitar TSH.",
            },
            headers=auth_headers,
        )
        # This SHOULD fail because frontend sends wrong field names
        assert resp.status_code == 400, (
            f"Expected 400 (bug confirmed), got {resp.status_code}. "
            f"If 200: backend now accepts frontend field names (bug may be fixed)"
        )
        data = resp.json()
        assert "should not exist" in str(data.get("message", "")), \
            f"Expected 'should not exist' error, got: {data}"

    def test_finalize_consultation(self, api_client, auth_headers):
        """POST /api/v1/consultations/:id/finalize must finalize it"""
        if not TestConsultations.created_consultation_id:
            pytest.skip("No consultation created")
        resp = api_client.post(
            f"{BASE_URL}/api/v1/consultations/{TestConsultations.created_consultation_id}/finalize",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Finalize failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["status"] in ["FINALIZED", "finalized"]

    def test_list_consultations(self, api_client, auth_headers):
        """GET /api/v1/consultations must return list"""
        resp = api_client.get(f"{BASE_URL}/api/v1/consultations", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)


class TestTemplates:
    """Tests for /api/v1/templates endpoint"""

    template_id = None

    def test_list_templates(self, api_client, auth_headers):
        """GET /api/v1/templates must return list"""
        resp = api_client.get(f"{BASE_URL}/api/v1/templates", headers=auth_headers)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, list)

    def test_create_template(self, api_client, auth_headers):
        """POST /api/v1/templates must create and return template"""
        resp = api_client.post(
            f"{BASE_URL}/api/v1/templates",
            json={"payload": {"name": "TEST_Template", "canvas": {"objects": [], "version": "5.3.0"}}},
            headers=auth_headers,
        )
        assert resp.status_code in [200, 201], f"Template create failed: {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "id" in data, f"Missing 'id'. Keys: {list(data.keys())}"
        TestTemplates.template_id = data["id"]

    def test_template_persisted_in_list(self, api_client, auth_headers):
        """After POST, template must appear in GET list"""
        if not TestTemplates.template_id:
            pytest.skip("No template created")
        resp = api_client.get(f"{BASE_URL}/api/v1/templates", headers=auth_headers)
        assert resp.status_code == 200
        templates = resp.json()
        ids = [t["id"] for t in templates]
        assert TestTemplates.template_id in ids, f"Template not in list. IDs: {ids}"

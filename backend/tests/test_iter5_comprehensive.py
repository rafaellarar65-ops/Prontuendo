"""
Iteration 5 - Comprehensive Backend API Tests for EndocrinoPront Pro
Tests: Login, Patients, Consultations, Agenda, Prescriptions, Scores, Templates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('VITE_API_BASE_URL', 'http://localhost:8001/api/v1')
if BASE_URL.startswith('/'):
    BASE_URL = f"http://localhost:8001{BASE_URL}"

TENANT_ID = "clitenant0000000000000001"

# Test credentials
TEST_EMAIL = "rafaellarar65@gmail.com"
TEST_PASSWORD = "12345678"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    assert response.status_code in [200, 201], f"Login failed: {response.text}"
    data = response.json()
    assert "accessToken" in data, "No accessToken in response"
    return data["accessToken"]


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID
    }


# ============ AUTH TESTS ============
class TestAuth:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code in [200, 201]
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code == 401


# ============ PATIENTS TESTS ============
class TestPatients:
    """Patient CRUD tests"""
    
    def test_list_patients(self, auth_headers):
        """Test listing patients"""
        response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "id" in data[0]
            assert "fullName" in data[0]
    
    def test_get_patient_detail(self, auth_headers):
        """Test getting patient detail"""
        # First get list to find a patient
        list_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        assert list_response.status_code == 200
        patients = list_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(f"{BASE_URL}/patients/{patient_id}", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == patient_id
            assert "fullName" in data


# ============ CONSULTATIONS TESTS ============
class TestConsultations:
    """Consultation endpoint tests"""
    
    def test_list_consultations_by_patient(self, auth_headers):
        """Test listing consultations for a patient"""
        # Get a patient first
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/consultations",
                params={"patientId": patient_id},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


# ============ AGENDA TESTS ============
class TestAgenda:
    """Agenda/Appointments endpoint tests"""
    
    def test_list_appointments(self, auth_headers):
        """Test listing all appointments"""
        response = requests.get(f"{BASE_URL}/agenda", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_list_appointments_by_date(self, auth_headers):
        """Test filtering appointments by date"""
        response = requests.get(
            f"{BASE_URL}/agenda",
            params={"date": "2026-03-05"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_and_delete_appointment(self, auth_headers):
        """Test creating and deleting an appointment"""
        # Get a patient first
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            
            # Create appointment
            create_response = requests.post(
                f"{BASE_URL}/agenda",
                json={
                    "patientId": patient_id,
                    "date": "2026-03-10",
                    "time": "10:00",
                    "type": "RETORNO",
                    "status": "AGENDADO",
                    "notes": "TEST_ITER5_appointment"
                },
                headers=auth_headers
            )
            assert create_response.status_code == 201, f"Create failed: {create_response.text}"
            created = create_response.json()
            assert "id" in created
            
            # Delete appointment
            delete_response = requests.delete(
                f"{BASE_URL}/agenda/{created['id']}",
                headers=auth_headers
            )
            assert delete_response.status_code in [200, 204]


# ============ PRESCRIPTIONS TESTS ============
class TestPrescriptions:
    """Prescription endpoint tests"""
    
    def test_list_prescriptions(self, auth_headers):
        """Test listing prescriptions"""
        response = requests.get(f"{BASE_URL}/prescriptions", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_prescriptions_by_patient(self, auth_headers):
        """Test getting prescriptions for a patient"""
        # Get a patient first
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/prescriptions/patient/{patient_id}",
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


# ============ SCORES TESTS ============
class TestScores:
    """Clinical scores endpoint tests"""
    
    def test_get_score_history(self, auth_headers):
        """Test getting score history for a patient"""
        # Get a patient first
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/scores",
                params={"patientId": patient_id},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
    
    def test_get_latest_score(self, auth_headers):
        """Test getting latest score for a patient"""
        # Get a patient first
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/scores/latest/{patient_id}",
                headers=auth_headers
            )
            # Can be 200 with data or 200 with null if no scores
            assert response.status_code == 200


# ============ TEMPLATES TESTS ============
class TestTemplates:
    """Document templates endpoint tests"""
    
    def test_list_templates(self, auth_headers):
        """Test listing document templates"""
        response = requests.get(f"{BASE_URL}/templates", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# ============ GLUCOSE TESTS ============
class TestGlucose:
    """Glucose monitoring endpoint tests"""
    
    def test_get_glucose_by_patient(self, auth_headers):
        """Test getting glucose readings for a patient"""
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/glucose",
                params={"patientId": patient_id},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


# ============ LAB RESULTS TESTS ============
class TestLabResults:
    """Lab results endpoint tests"""
    
    def test_get_lab_results_by_patient(self, auth_headers):
        """Test getting lab results for a patient"""
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/lab-results",
                params={"patientId": patient_id},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


# ============ BIOIMPEDANCE TESTS ============
class TestBioimpedance:
    """Bioimpedance endpoint tests"""
    
    def test_get_bioimpedance_by_patient(self, auth_headers):
        """Test getting bioimpedance data for a patient"""
        patients_response = requests.get(f"{BASE_URL}/patients", headers=auth_headers)
        patients = patients_response.json()
        
        if len(patients) > 0:
            patient_id = patients[0]["id"]
            response = requests.get(
                f"{BASE_URL}/bioimpedance",
                params={"patientId": patient_id},
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

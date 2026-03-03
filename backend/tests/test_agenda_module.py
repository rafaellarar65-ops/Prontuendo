"""
Test suite for Agenda (Appointments) Module - EndocrinoPront Pro
Tests all CRUD operations for appointments with PostgreSQL persistence
"""
import pytest
import requests
import os

# Backend URL - using localhost since we're testing from the same container
BASE_URL = "http://localhost:8001/api/v1"
TENANT_ID = "clitenant0000000000000001"
TEST_PATIENT_ID = "cmm9tn1zg001c5ato8vgnuakq"  # Camila Meireles Silva

# Test credentials
TEST_EMAIL = "rafaellarar65@gmail.com"
TEST_PASSWORD = "crucru22"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API requests"""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        headers={"x-tenant-id": TENANT_ID, "Content-Type": "application/json"}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "accessToken" in data
    return data["accessToken"]


@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session for API requests"""
    session = requests.Session()
    session.headers.update({
        "Authorization": f"Bearer {auth_token}",
        "x-tenant-id": TENANT_ID,
        "Content-Type": "application/json"
    })
    return session


class TestAgendaList:
    """Tests for GET /agenda - List appointments"""
    
    def test_list_all_appointments(self, api_client):
        """GET /agenda should return list of appointments"""
        response = api_client.get(f"{BASE_URL}/agenda")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify structure if appointments exist
        if len(data) > 0:
            appt = data[0]
            assert "id" in appt
            assert "patientId" in appt
            assert "patientName" in appt
            assert "date" in appt
            assert "time" in appt
            assert "type" in appt
            assert "status" in appt
    
    def test_list_appointments_filter_by_date(self, api_client):
        """GET /agenda?date=YYYY-MM-DD should filter by date"""
        # Test with a date that has appointments
        response = api_client.get(f"{BASE_URL}/agenda", params={"date": "2026-03-03"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned appointments should have the filtered date
        for appt in data:
            assert appt["date"] == "2026-03-03"
    
    def test_list_appointments_empty_date(self, api_client):
        """GET /agenda?date=YYYY-MM-DD with no appointments returns empty list"""
        response = api_client.get(f"{BASE_URL}/agenda", params={"date": "2020-01-01"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestAgendaGetById:
    """Tests for GET /agenda/:id - Get appointment by ID"""
    
    def test_get_existing_appointment(self, api_client):
        """GET /agenda/:id should return appointment details"""
        # First get list to find an existing ID
        list_response = api_client.get(f"{BASE_URL}/agenda")
        appointments = list_response.json()
        
        if len(appointments) > 0:
            appt_id = appointments[0]["id"]
            response = api_client.get(f"{BASE_URL}/agenda/{appt_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == appt_id
            assert "patientName" in data
            assert "date" in data
            assert "time" in data
    
    def test_get_nonexistent_appointment(self, api_client):
        """GET /agenda/:id with invalid ID should return 404"""
        response = api_client.get(f"{BASE_URL}/agenda/nonexistent-id-12345")
        assert response.status_code == 404
        data = response.json()
        assert "message" in data


class TestAgendaCreate:
    """Tests for POST /agenda - Create new appointment"""
    
    def test_create_appointment_success(self, api_client):
        """POST /agenda should create new appointment"""
        payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-15",
            "time": "10:00",
            "type": "RETORNO",
            "notes": "TEST_Appointment created by pytest"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 201
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["patientId"] == TEST_PATIENT_ID
        assert data["date"] == "2026-02-15"
        assert data["time"] == "10:00"
        assert data["type"] == "RETORNO"
        assert data["status"] == "AGENDADO"  # Default status
        assert "patientName" in data
        
        # Store ID for cleanup
        TestAgendaCreate.created_id = data["id"]
    
    def test_create_appointment_primeira_consulta(self, api_client):
        """POST /agenda with PRIMEIRA_CONSULTA type"""
        payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-16",
            "time": "11:30",
            "type": "PRIMEIRA_CONSULTA",
            "notes": "TEST_First consultation"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "PRIMEIRA_CONSULTA"
        TestAgendaCreate.created_id_2 = data["id"]
    
    def test_create_appointment_teleconsulta(self, api_client):
        """POST /agenda with TELECONSULTA type"""
        payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-17",
            "time": "15:00",
            "type": "TELECONSULTA"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "TELECONSULTA"
        TestAgendaCreate.created_id_3 = data["id"]
    
    def test_create_appointment_exame(self, api_client):
        """POST /agenda with EXAME type"""
        payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-18",
            "time": "08:00",
            "type": "EXAME",
            "notes": "TEST_Lab exam"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "EXAME"
        TestAgendaCreate.created_id_4 = data["id"]
    
    def test_create_appointment_invalid_patient(self, api_client):
        """POST /agenda with invalid patientId should return 404"""
        payload = {
            "patientId": "invalid-patient-id",
            "date": "2026-02-20",
            "time": "09:00",
            "type": "RETORNO"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 404
    
    def test_create_appointment_invalid_time_format(self, api_client):
        """POST /agenda with invalid time format should return 400"""
        payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-20",
            "time": "9:00",  # Invalid format (should be 09:00)
            "type": "RETORNO"
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 400
    
    def test_create_appointment_missing_required_fields(self, api_client):
        """POST /agenda without required fields should return 400"""
        payload = {
            "patientId": TEST_PATIENT_ID
            # Missing date, time, type
        }
        response = api_client.post(f"{BASE_URL}/agenda", json=payload)
        assert response.status_code == 400


class TestAgendaUpdate:
    """Tests for PATCH /agenda/:id - Update appointment"""
    
    def test_update_appointment_status(self, api_client):
        """PATCH /agenda/:id should update status"""
        # Create an appointment first
        create_payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-25",
            "time": "16:00",
            "type": "RETORNO"
        }
        create_response = api_client.post(f"{BASE_URL}/agenda", json=create_payload)
        assert create_response.status_code == 201
        appt_id = create_response.json()["id"]
        
        # Update status
        update_payload = {"status": "CONFIRMADO"}
        response = api_client.patch(f"{BASE_URL}/agenda/{appt_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "CONFIRMADO"
        
        # Verify with GET
        get_response = api_client.get(f"{BASE_URL}/agenda/{appt_id}")
        assert get_response.json()["status"] == "CONFIRMADO"
        
        TestAgendaUpdate.created_id = appt_id
    
    def test_update_appointment_all_statuses(self, api_client):
        """PATCH /agenda/:id should support all status values"""
        appt_id = TestAgendaUpdate.created_id
        
        statuses = ["EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"]
        for status in statuses:
            response = api_client.patch(
                f"{BASE_URL}/agenda/{appt_id}",
                json={"status": status}
            )
            assert response.status_code == 200
            assert response.json()["status"] == status
    
    def test_update_appointment_notes(self, api_client):
        """PATCH /agenda/:id should update notes"""
        appt_id = TestAgendaUpdate.created_id
        
        response = api_client.patch(
            f"{BASE_URL}/agenda/{appt_id}",
            json={"notes": "Updated notes via pytest"}
        )
        assert response.status_code == 200
        assert response.json()["notes"] == "Updated notes via pytest"
    
    def test_update_appointment_date_time(self, api_client):
        """PATCH /agenda/:id should update date and time"""
        appt_id = TestAgendaUpdate.created_id
        
        response = api_client.patch(
            f"{BASE_URL}/agenda/{appt_id}",
            json={"date": "2026-03-01", "time": "17:30"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == "2026-03-01"
        assert data["time"] == "17:30"
    
    def test_update_nonexistent_appointment(self, api_client):
        """PATCH /agenda/:id with invalid ID should return 404"""
        response = api_client.patch(
            f"{BASE_URL}/agenda/nonexistent-id",
            json={"status": "CONFIRMADO"}
        )
        assert response.status_code == 404


class TestAgendaDelete:
    """Tests for DELETE /agenda/:id - Remove appointment"""
    
    def test_delete_appointment_success(self, api_client):
        """DELETE /agenda/:id should remove appointment"""
        # Create an appointment to delete
        create_payload = {
            "patientId": TEST_PATIENT_ID,
            "date": "2026-02-28",
            "time": "12:00",
            "type": "RETORNO",
            "notes": "TEST_To be deleted"
        }
        create_response = api_client.post(f"{BASE_URL}/agenda", json=create_payload)
        assert create_response.status_code == 201
        appt_id = create_response.json()["id"]
        
        # Delete
        response = api_client.delete(f"{BASE_URL}/agenda/{appt_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["deleted"] == True
        
        # Verify deletion with GET (should return 404)
        get_response = api_client.get(f"{BASE_URL}/agenda/{appt_id}")
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_appointment(self, api_client):
        """DELETE /agenda/:id with invalid ID should return 404"""
        response = api_client.delete(f"{BASE_URL}/agenda/nonexistent-id")
        assert response.status_code == 404


class TestAgendaByPatient:
    """Tests for GET /agenda/patient/:patientId - List by patient"""
    
    def test_list_appointments_by_patient(self, api_client):
        """GET /agenda/patient/:patientId should return patient's appointments"""
        response = api_client.get(f"{BASE_URL}/agenda/patient/{TEST_PATIENT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # All appointments should belong to the patient
        for appt in data:
            assert appt["patientId"] == TEST_PATIENT_ID
    
    def test_list_appointments_nonexistent_patient(self, api_client):
        """GET /agenda/patient/:patientId with invalid patient returns empty list"""
        response = api_client.get(f"{BASE_URL}/agenda/patient/nonexistent-patient")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


class TestCleanup:
    """Cleanup test data created during tests"""
    
    def test_cleanup_test_appointments(self, api_client):
        """Delete all TEST_ prefixed appointments"""
        # Get all appointments
        response = api_client.get(f"{BASE_URL}/agenda")
        appointments = response.json()
        
        # Delete appointments with TEST_ in notes
        deleted_count = 0
        for appt in appointments:
            if appt.get("notes") and "TEST_" in appt.get("notes", ""):
                delete_response = api_client.delete(f"{BASE_URL}/agenda/{appt['id']}")
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        # Also cleanup created IDs from test classes
        ids_to_delete = []
        if hasattr(TestAgendaCreate, 'created_id'):
            ids_to_delete.append(TestAgendaCreate.created_id)
        if hasattr(TestAgendaCreate, 'created_id_2'):
            ids_to_delete.append(TestAgendaCreate.created_id_2)
        if hasattr(TestAgendaCreate, 'created_id_3'):
            ids_to_delete.append(TestAgendaCreate.created_id_3)
        if hasattr(TestAgendaCreate, 'created_id_4'):
            ids_to_delete.append(TestAgendaCreate.created_id_4)
        if hasattr(TestAgendaUpdate, 'created_id'):
            ids_to_delete.append(TestAgendaUpdate.created_id)
        
        for appt_id in ids_to_delete:
            try:
                api_client.delete(f"{BASE_URL}/agenda/{appt_id}")
            except:
                pass
        
        print(f"Cleaned up {deleted_count} test appointments")
        assert True  # Cleanup always passes

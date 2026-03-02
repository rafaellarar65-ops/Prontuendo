"""
Backend API tests for EndocrinoPront Pro
Tests: Auth, Patients endpoints, JWT protection
"""
import pytest
import requests
import os

# Base URL - using backend directly on port 8001
BASE_URL = "http://localhost:8001"
TENANT_ID = "clitenant0000000000000001"

MEDICO_EMAIL = "rafaellarar65@gmail.com"
MEDICO_PASSWORD = "crucru22"
RECEPCAO_EMAIL = "recepcao@endocrinopro.com"
RECEPCAO_PASSWORD = "Recepcao@123!"


@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "x-tenant-id": TENANT_ID,
    })
    return session


@pytest.fixture(scope="module")
def medico_token(api_client):
    resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": MEDICO_EMAIL,
        "password": MEDICO_PASSWORD,
    })
    if resp.status_code == 201:
        return resp.json()["accessToken"]
    pytest.skip(f"Medico login failed ({resp.status_code}): {resp.text}")


@pytest.fixture(scope="module")
def recepcao_token(api_client):
    resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": RECEPCAO_EMAIL,
        "password": RECEPCAO_PASSWORD,
    })
    if resp.status_code == 201:
        return resp.json()["accessToken"]
    pytest.skip(f"Recepcao login failed ({resp.status_code}): {resp.text}")


class TestAuthEndpoints:
    """Authentication endpoint tests"""

    def test_login_medico_success(self, api_client):
        """POST /api/v1/auth/login - medico login must return 201 with tokens"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": MEDICO_EMAIL,
            "password": MEDICO_PASSWORD,
        })
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "accessToken" in data, "Response must have accessToken"
        assert "refreshToken" in data, "Response must have refreshToken"
        assert "user" in data, "Response must have user object"
        user = data["user"]
        assert user["email"] == MEDICO_EMAIL.lower()
        assert "MEDICO" in user.get("roles", []), f"Expected MEDICO role, got: {user.get('roles')}"
        assert isinstance(data["accessToken"], str) and len(data["accessToken"]) > 10

    def test_login_recepcao_success(self, api_client):
        """POST /api/v1/auth/login - recepcao login must work"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": RECEPCAO_EMAIL,
            "password": RECEPCAO_PASSWORD,
        })
        assert resp.status_code == 201, f"Expected 201, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "accessToken" in data
        user = data["user"]
        assert "RECEPCAO" in user.get("roles", [])

    def test_login_invalid_credentials(self, api_client):
        """POST /api/v1/auth/login - wrong password must return 401"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": MEDICO_EMAIL,
            "password": "wrongpassword",
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
        data = resp.json()
        assert "message" in data

    def test_login_unknown_user(self, api_client):
        """POST /api/v1/auth/login - unknown user must return 401"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "somepassword",
        })
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"

    def test_login_missing_email(self, api_client):
        """POST /api/v1/auth/login - missing email should return 400"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "password": "somepassword",
        })
        assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.text}"

    def test_login_response_user_has_fullname(self, api_client):
        """POST /api/v1/auth/login - user object must have fullName field"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": MEDICO_EMAIL,
            "password": MEDICO_PASSWORD,
        })
        assert resp.status_code == 201
        user = resp.json()["user"]
        # Backend returns fullName, frontend expects name - check what backend sends
        assert "fullName" in user, f"Backend must return fullName. Got keys: {list(user.keys())}"
        assert "tenantId" in user
        assert user["tenantId"] == TENANT_ID

    def test_login_no_tenant_header(self, api_client):
        """POST /api/v1/auth/login without tenant header should fail"""
        resp = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": MEDICO_EMAIL, "password": MEDICO_PASSWORD},
            headers={"Content-Type": "application/json"},
        )
        # Without tenant, user lookup should fail
        assert resp.status_code in [401, 400], f"Expected 401/400, got {resp.status_code}: {resp.text}"


class TestPatientsEndpoint:
    """Patients endpoint tests"""

    def test_patients_without_auth_returns_401(self, api_client):
        """GET /api/v1/patients without token must return 401"""
        resp = requests.get(
            f"{BASE_URL}/api/v1/patients",
            headers={"x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}: {resp.text}"

    def test_patients_with_auth_returns_200(self, api_client, medico_token):
        """GET /api/v1/patients with valid token must return 200 or 201"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/patients",
            headers={"Authorization": f"Bearer {medico_token}"},
        )
        assert resp.status_code in [200, 201], f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert isinstance(data, (list, dict)), f"Expected list or dict, got {type(data)}"

    def test_patients_list_is_list(self, api_client, medico_token):
        """GET /api/v1/patients must return a list (even if empty)"""
        resp = api_client.get(
            f"{BASE_URL}/api/v1/patients",
            headers={"Authorization": f"Bearer {medico_token}"},
        )
        assert resp.status_code in [200, 201]
        data = resp.json()
        # Could be a list directly, or wrapped in {data: [...]}
        if isinstance(data, dict):
            patients = data.get("data", data.get("patients", []))
        else:
            patients = data
        assert isinstance(patients, list), f"Expected list of patients, got: {type(patients)}"

    def test_create_patient_requires_auth(self, api_client):
        """POST /api/v1/patients without auth must return 401"""
        resp = requests.post(
            f"{BASE_URL}/api/v1/patients",
            json={"fullName": "Test Patient", "birthDate": "1990-01-01"},
            headers={"Content-Type": "application/json", "x-tenant-id": TENANT_ID},
        )
        assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"


class TestBackendHealth:
    """Backend health and general status checks"""

    def test_backend_responds(self):
        """Backend must be reachable"""
        resp = requests.get(f"{BASE_URL}/api/v1/auth/login", timeout=5)
        # GET on POST endpoint should return 404 or 405
        assert resp.status_code in [404, 405, 401], f"Backend not responding properly: {resp.status_code}"

    def test_swagger_docs_accessible(self):
        """Swagger docs should be accessible"""
        resp = requests.get(f"{BASE_URL}/docs", timeout=5)
        assert resp.status_code in [200, 301, 302], f"Swagger not accessible: {resp.status_code}"

    def test_login_response_tokens_are_strings(self, api_client):
        """Verify token structure is correct"""
        resp = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": MEDICO_EMAIL,
            "password": MEDICO_PASSWORD,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert isinstance(data["accessToken"], str)
        assert isinstance(data["refreshToken"], str)
        # Access token should be a JWT (3 parts separated by .)
        parts = data["accessToken"].split(".")
        assert len(parts) == 3, f"accessToken is not a valid JWT: {data['accessToken'][:50]}"

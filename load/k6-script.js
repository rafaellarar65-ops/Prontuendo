import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    medicos_consultas: {
      executor: 'constant-vus',
      exec: 'doctorFlow',
      vus: 50,
      duration: '3m',
    },
    pacientes_glicemia: {
      executor: 'constant-vus',
      exec: 'patientFlow',
      vus: 200,
      duration: '3m',
    },
    consultas_concorrentes: {
      executor: 'ramping-vus',
      exec: 'concurrentConsultationFlow',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 80 },
        { duration: '1m', target: 120 },
        { duration: '1m', target: 20 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1200'],
  },
};

const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:3000';

function auth(role) {
  const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: `${role}.${__VU}@load.local`,
    password: 'Load@Test123!',
  }), { headers: { 'Content-Type': 'application/json' } });

  check(response, { 'login status 200': (r) => r.status === 200 });
  return response.json('accessToken');
}

export function doctorFlow() {
  const token = auth('doctor');
  const payload = {
    patientId: `patient-${__VU}`,
    subjective: 'Consulta de follow-up endocrinológico',
    objective: 'Sem intercorrências agudas',
  };

  const res = http.post(`${BASE_URL}/api/consultations`, JSON.stringify(payload), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  check(res, { 'consulta criada': (r) => r.status === 201 });
  sleep(1);
}

export function patientFlow() {
  const token = auth('patient');
  const glucose = http.post(`${BASE_URL}/api/glucose`, JSON.stringify({
    value: 110 + (__ITER % 20),
    measuredAt: new Date().toISOString(),
    context: 'pre-breakfast',
  }), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  check(glucose, { 'glicemia criada': (r) => r.status === 201 });
  sleep(0.5);
}

export function concurrentConsultationFlow() {
  const token = auth('doctor.concurrent');
  const open = http.post(`${BASE_URL}/api/consultations/concurrent`, JSON.stringify({
    patientId: `critical-${__VU}`,
    lockMode: 'optimistic',
  }), {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  check(open, {
    'concorrência controlada': (r) => [200, 201, 409].includes(r.status),
  });
  sleep(0.8);
}

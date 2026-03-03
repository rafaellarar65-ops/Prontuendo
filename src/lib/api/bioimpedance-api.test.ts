import { describe, expect, it, vi, afterEach } from 'vitest';
import { http } from '@/lib/api/http';
import {
  bioimpedanceApi,
  mapBioimpedanceAiToFormValues,
  mapBioimpedanceFormToCreatePayload,
} from '@/lib/api/bioimpedance-api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('bioimpedance mapping', () => {
  it('maps AI extraction to form values with metadata fields', () => {
    const form = mapBioimpedanceAiToFormValues({
      measuredAt: '2026-01-01T00:00:00.000Z',
      bodyFatPct: 22.1,
      muscleMassKg: 31.2,
      segmentedFields: { bodyFatPct: '22.1' },
      originalFileName: 'exame.pdf',
      originalFileUrl: 'https://files/exame.pdf',
    });

    expect(form.source).toBe('ia');
    expect(form.bodyFatPct).toBe(22.1);
    expect(form.segmentedFields).toEqual({ bodyFatPct: '22.1' });
    expect(form.originalFileName).toBe('exame.pdf');
  });

  it('maps form values to create payload preserving structured metadata', () => {
    const payload = mapBioimpedanceFormToCreatePayload({
      measuredAt: '2026-01-01T00:00:00.000Z',
      source: 'manual',
      bodyFatPct: 18,
      muscleMassKg: 35,
      originalFileName: 'manual-entry.txt',
    });

    expect(payload.metadata).toEqual({
      source: 'manual',
      originalFileName: 'manual-entry.txt',
    });
  });
});


describe('bioimpedance create', () => {
  it('creates exam using patient scoped endpoint', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({
      data: {
        id: 'exam-1',
        tenantId: 'tenant-1',
        patientId: 'patient-1',
        measuredAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    } as never);

    await bioimpedanceApi.create('patient-1', {
      measuredAt: '2026-01-01T00:00:00.000Z',
      metadata: { source: 'manual' },
    });

    expect(postSpy).toHaveBeenCalledWith('/bioimpedance/patient-1', {
      measuredAt: '2026-01-01T00:00:00.000Z',
      metadata: { source: 'manual' },
    });
  });
});

describe('bioimpedance evolution compatibility', () => {
  it('uses legacy and segmented fields when canonical columns are missing', async () => {
    vi.spyOn(http, 'get').mockResolvedValue({
      data: [
        {
          id: 'exam-1',
          tenantId: 'tenant-1',
          patientId: 'patient-1',
          measuredAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          bodyFatPercent: '19.5',
          metadata: {
            source: 'ia',
            segmentedFields: { muscleMass: '34.2' },
          },
        },
      ],
    } as never);

    const points = await bioimpedanceApi.evolution('patient-1');

    expect(points).toEqual([
      {
        date: '2026-01-01T00:00:00.000Z',
        fatMassPercent: 19.5,
        muscleMassKg: 34.2,
      },
    ]);
  });
});

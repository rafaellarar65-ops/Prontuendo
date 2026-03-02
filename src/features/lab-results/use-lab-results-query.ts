import { useLabResultsHistoryQuery } from '@/features/lab-results/use-lab-results-history-query';

export const useLabResultsQuery = (patientId: string) => useLabResultsHistoryQuery(patientId);

// Tipos e enums para substituir os do Prisma (que foram removidos para SQLite)

export enum Role {
  MEDICO = 'MEDICO',
  RECEPCAO = 'RECEPCAO',
  PATIENT = 'PATIENT',
}

export enum ConsultationStatus {
  DRAFT = 'DRAFT',
  FINALIZED = 'FINALIZED',
}

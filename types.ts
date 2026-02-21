
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
  NO_SHOW = 'NO_SHOW'
}

export enum PatientLifecycle {
  LEAD = 'LEAD',
  FIRST_VISIT_PENDING = 'FIRST_VISIT_PENDING',
  ACTIVE_FOLLOWUP = 'ACTIVE_FOLLOWUP',
  LONG_TERM_FOLLOWUP = 'LONG_TERM_FOLLOWUP',
  LATENT = 'LATENT',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export type DocumentType = 'prescription' | 'certificate' | 'report' | 'ai_report' | 'lab_order' | 'consent' | 'bioimpedance' | 'other';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  category: 'medico' | 'recepcao' | 'admin';
  specialty?: string;
  crm?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  color?: string;
  logoUrl?: string;
}

export interface TimeSlot {
  id: string;
  clinicId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  isBooked: boolean;
}

export interface ServiceDefinition {
  id: string;
  name: string;
  active: boolean;
  type: 'Primeira Consulta' | 'Retorno' | 'Procedimento' | 'Exame' | 'Outro';
  contractType: 'Particular' | 'Convenio' | 'Social';
  price: number;
  durationMinutes: number;
  color: string;
  updatedAt: string;
}

export interface PatientProfile {
  fullName: string;
  birthDate: string;
  biologicalSex: 'Masculino' | 'Feminino' | 'Intersexo' | 'NaoInformado';
  genderIdentity?: string;
  cpf: string;
  whatsapp: string;
  email?: string;
  clinicId?: string; // Legacy/Public
  clinicIds?: string[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  
  preferredName?: string;
  address?: {
    zipCode: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  city?: string; // Legacy flat
  state?: string; // Legacy flat
  
  maritalStatus?: string;
  occupation?: string;
  educationLevel?: string;
  nationality?: string;
  naturalness?: string;
  fatherName?: string;
  motherName?: string;
  
  emergencyName?: string;
  emergencyRelation?: string;
  emergencyPhone?: string;
  
  rg?: string;
  healthPlanProvider?: string;
  healthPlanName?: string;
  healthPlanNumber?: string;
  
  pastIllnesses?: string;
  surgeries?: string;
  chronicConditions?: string;
  allergies?: string;
  currentMeds?: string;
  tags?: string[];
  
  metabolicScore?: number;
  adherenceScore?: number;
  lastVisit?: string;
  lastConsultationAt?: string;
  
  followupStatus?: 'ok' | 'due' | 'overdue' | 'critical';
  lifecycleStatus?: PatientLifecycle;
}

export interface ThyroidExam {
  size: string;
  consistency: string;
  nodules: {
    present: boolean;
    location?: string;
    sizeCm?: string;
  };
  lymphNodes?: string;
}

export interface MetabolicPhenotype {
  bodyType: string;
  signs: string[];
}

export interface PhysicalSystemStatus {
  status: 'Normal' | 'Alterado';
  obs?: string;
}

export interface MichiganNeuropathyData {
  history: Record<number, 'Sim' | 'Nao' | null>;
  physical: {
    left: {
      appearance: 'Normal' | 'Abnormal';
      def_deformities?: boolean;
      def_drySkin?: boolean;
      def_infection?: boolean;
      def_fissure?: boolean;
      def_other?: boolean;
      def_other_text?: string;
      ulceration: 'Absent' | 'Present';
      ankleReflex: 'Present' | 'Reinforced' | 'Absent';
      vibration: 'Present' | 'Decreased' | 'Absent';
    };
    right: {
      appearance: 'Normal' | 'Abnormal';
      def_deformities?: boolean;
      def_drySkin?: boolean;
      def_infection?: boolean;
      def_fissure?: boolean;
      def_other?: boolean;
      def_other_text?: string;
      ulceration: 'Absent' | 'Present';
      ankleReflex: 'Present' | 'Reinforced' | 'Absent';
      vibration: 'Present' | 'Decreased' | 'Absent';
    };
  };
  scoreA: number;
  scoreB: number;
  evaluatedAt: string;
}

export interface UtahNeuropathyData {
  motor: { left: 0 | 2; right: 0 | 2; };
  pinSensation: { left: number[]; right: number[]; };
  allodynia: { left: 0 | 1; right: 0 | 1; };
  largeFiber: {
    vibration: { left: 0 | 1 | 2; right: 0 | 1 | 2; };
    position: { left: 0 | 1 | 2; right: 0 | 1 | 2; };
  };
  reflexes: { left: 0 | 1 | 2; right: 0 | 1 | 2; };
  totalScore: number;
  evaluatedAt: string;
}

export interface PhysicalExamRecord {
  pa: string;
  fc?: string;
  fr?: string;
  temp?: string;
  o2?: string;
  peso: string;
  altura: string;
  imc: string;
  cintura?: string;
  quadril?: string;
  pescoco?: string;
  gorduraCorporal?: string;
  
  thyroid?: ThyroidExam;
  metabolic?: MetabolicPhenotype;
  michigan?: MichiganNeuropathyData;
  utah?: UtahNeuropathyData;
  
  outros: string;
  mode?: 'QUICK' | 'STRUCTURED' | 'NARRATIVE';
  systems?: Record<string, PhysicalSystemStatus>;
  narrativeText?: string;
  customData?: Record<string, any>;
}

export interface LabResult {
  id?: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  referenceRange?: string;
  category?: string;
  source?: 'MANUAL' | 'PDF' | 'IMAGE';
  rawInput?: string;
}

// Alias for compatibility
export type ExamResult = LabResult;

export interface BioimpedanceSegmentData {
  muscle_kg: number;
  fat_kg: number;
}

export interface BioimpedanceSegment {
  left_arm: BioimpedanceSegmentData;
  right_arm: BioimpedanceSegmentData;
  left_leg: BioimpedanceSegmentData;
  right_leg: BioimpedanceSegmentData;
  trunk: BioimpedanceSegmentData;
}

export type BodyCircumferences = Record<string, number>;

export interface BioimpedanceResult {
  id: string;
  date: string;
  weight: number;
  bmi: number;
  body_fat_percent: number;
  fat_mass_kg: number;
  muscle_mass_kg: number;
  tbw_kg: number; // Total Body Water
  icw_kg?: number; // Intracelular
  ecw_kg?: number; // Extracelular
  visceral_fat_level: number;
  bone_mass_kg: number;
  bmr_kcal: number; // Basal Metabolic Rate
  body_age?: number;
  protein_mass_kg?: number;
  skeletal_muscle_mass_kg?: number;
  waist_hip_ratio?: number;
  body_score_raw?: number;
  segments?: BioimpedanceSegment;
  circumferences?: BodyCircumferences;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  quantity: string;
  instructions: string;
}

export interface CertificateData {
  purpose: 'Trabalho' | 'Escolar' | 'INSS' | 'Academia' | 'Viagem' | 'Outros';
  days: number;
  mode: 'days' | 'date';
  endDate?: string;
  cid?: { code: string; description: string; includeInDoc: boolean };
  notes?: string;
  showTime?: boolean;
  otherPurpose?: string;
}

export interface MedicalDocumentVersion {
  version: number;
  content: string; // HTML or JSON structure
  status: 'DRAFT' | 'FINAL' | 'SIGNED';
  createdAt: string;
  createdBy: string;
  signedBy?: string;
  signatureDate?: string;
  signatureHash?: string;
  templateData?: any;
}

export interface MedicalDocument {
  id: string;
  patientId: string;
  patientName: string;
  type: DocumentType;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  versions: MedicalDocumentVersion[];
}

export interface TherapeuticPlanGoals {
  id: string;
  text: string;
  status: 'pending' | 'achieved' | 'abandoned';
}

export interface TherapeuticPlanHabits {
  id: string;
  text: string;
  frequency: string;
}

export interface TherapeuticPlan {
  goals: TherapeuticPlanGoals[];
  habits: TherapeuticPlanHabits[];
  nextSteps: string[];
  narrativeText?: string;
  updatedAt: string;
}

export interface PatientCRMAnalysis {
  riskColor: 'green' | 'yellow' | 'red' | 'purple';
  riskLabel: string;
  engagementLevel: 'low' | 'medium' | 'high';
  returnStatus: 'ok' | 'due_soon' | 'overdue' | 'critical_overdue';
  smartTags: string[];
}

export interface PatientRecord {
  id: string;
  profile: PatientProfile;
  diagnoses: string[];
  mentalHealth: {
    hasSpecialistCare: boolean;
    hasPsychiatricHospitalization: boolean;
    diagnoses: string[];
    medications: string[];
  };
  vaccinations: string[];
  soap: {
    s: { complaints: string; history: string; ciapTags: string[] };
    o: { physical: Record<string, any>; systems: Record<string, any> };
    a: { diagnosis: string; cidCode: string; severity: number };
    p: { plan: string; instructions: string };
  };
  anamnese: {
    hda: string;
    queixas: string;
    problemas: string;
    medicacoes: string;
    familiar: string;
    habitos: string;
    revisaoSistemas: string;
    customFields?: Record<string, string>;
    narrativeText?: string;
  };
  physical: PhysicalExamRecord;
  exams: LabResult[];
  bioimpedance: BioimpedanceResult[];
  prescriptions: any[]; // Legacy
  currentPrescription: string;
  clinicalVariables: Record<string, any>;
  calculatedScores: any[];
  metrics: {
    weight: { date: string; value: number }[];
    hba1c: { date: string; value: number }[];
    fat: { date: string; value: number }[];
  };
  timeline: {
    id: string;
    date: string;
    type: 'appointment' | 'exam' | 'medication';
    title: string;
    description: string;
    signed?: boolean;
  }[];
  documents?: MedicalDocument[];
  labAnalysis?: string;
  bioAnalysis?: string;
  therapeuticPlan?: TherapeuticPlan;
  crm?: PatientCRMAnalysis;
}

export interface ScoringResult {
  noShowProb: number;
  lateProb: number;
  riskBucket: RiskLevel;
  actionPlan: string[];
  reasonCodes: string[];
  calculatedAt: string;
}

export interface QueueSuggestion {
  suggestedPosition: number;
  action: 'KEEP' | 'UP' | 'DOWN';
  reason: string;
  impactMinutes: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  clinicId: string;
  time: string; // ISO
  durationMinutes: number;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  created_at?: string;
  resourceId?: string;
  commStatus?: 'pending' | 'sent' | 'failed' | 'confirmed';
  prepScore: number;
  scoring?: ScoringResult;
  queue?: QueueSuggestion;
  isOverbookingCandidate?: boolean;
  serviceId?: string;
}

export interface DailyInsight {
  type: 'revenue' | 'risk' | 'opportunity';
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface PendingAction {
  id: string;
  type: 'review_exam' | 'sign_doc' | 'confirm_appt';
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  margins: { top: number; right: number; bottom: number; left: number };
  showSignatureLine: boolean;
  headerHtml: string;
  footerHtml: string;
}

export interface TemplateStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  color?: string;
  backgroundColor?: string;
  border?: string;
}

export interface TemplateRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TemplateElement {
  id: string;
  name: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'line' | 'qrcode' | 'table' | 'signature' | 'bio_body_muscle' | 'bio_body_fat' | 'bio_composition_bar';
  box: TemplateRect;
  rotation?: number;
  opacity?: number;
  visible: boolean;
  locked?: boolean;
  zIndex?: number;
  
  text?: {
    content: string;
    style?: TemplateStyle;
  };
  image?: {
    assetId?: string; // URL or Base64
    fit?: 'cover' | 'contain' | 'stretch';
    borderRadius?: number;
  };
  table?: {
    columns: { title: string; w: number; cellBinding: string }[];
    rowsBinding: string;
    style?: TemplateStyle;
    headerStyle?: TemplateStyle;
  };
  bioConfig?: {
    metricKey: string;
    label: string;
    min: number;
    max: number;
  };
}

export interface DocumentTemplateV1 {
  id: string;
  name: string;
  type: DocumentType;
  version: number;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  page: {
    size: 'A4';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    backgroundColor?: string;
    backgroundImage?: string;
  };
  elements: TemplateElement[];
}

export type ConsultationFieldType = 'text' | 'textarea' | 'number' | 'check' | 'select' | 'header' | 'ai_inferred' | 'formula';

export interface ConsultationFieldDef {
  key: string;
  label: string;
  type: ConsultationFieldType;
  width?: 'full' | 'half' | 'third' | 'quarter';
  options?: string[]; // For select
  formula?: string; // For formula
  aiPrompt?: string; // For ai_inferred
}

export interface ConsultationSectionDef {
  id: string;
  title: string;
  fields: ConsultationFieldDef[];
}

export interface ConsultationTemplateDef {
  id: string;
  name: string;
  category: 'Anamnese' | 'ExameFisico' | 'Outros';
  isBase: boolean;
  sections: ConsultationSectionDef[];
}

export interface ClinicalVariableDef {
  key: string;
  name: string;
  type: 'DYNAMIC' | 'FIXED';
  dataType: 'number' | 'string' | 'boolean';
  unit?: string;
  description?: string;
}

export interface ClinicalScoreDef {
  id: string;
  name: string;
  description: string;
  category: string;
  iframeUrl?: string;
  inputs: {
    key: string;
    label: string;
    type?: string;
    dataType?: string;
    variableKey?: string; // Map to global variable
  }[];
  logicCode?: string; // JS code string
  calcFn?: (data: any) => { score: number; classification: string; color: string };
}

export interface ClinicalSuggestion {
  id: string;
  title: string;
  description: string;
  type: 'alert' | 'insight';
}

export interface DiseaseDB {
  id: string;
  name: string;
  definition?: string;
  pathophysiology?: string;
  epidemiology?: string;
  diagnosticCriteria?: { source: string; criteria: string[] }[];
  examStrategy?: { exam: string; indication: string; interpretation: string }[];
  treatmentLines?: {
    line: string;
    rationale?: string;
    options: { medicationName: string; evidenceLevel?: string }[];
    indicationCriteria?: string[];
    avoidCriteria?: string[];
  }[];
  followUp?: { scenario: string; exams: { name: string; frequency: string }[] }[];
  complications?: { title: string; items: string[] }[];
  differentialDiagnosis?: string[];
  tags?: string[];
  parentId?: string;
  lastUpdated?: string;
  aiConsensus?: {
    concordance: string[];
    divergence: string[];
    finalRecommendation: string;
  };
  aiInheritance?: {
    inheritancePercentage: number;
    parentProtocol: string;
    inheritedSections: string[];
    uniqueSections: string[];
  };
}

export interface MedicationDB {
  id: string;
  name: string;
  drugClass?: string;
  mechanismOfAction?: string;
  indications?: { diseaseName: string; lineOfTreatment: string; dosage: string }[];
  contraindications?: string[];
  adjustments?: { condition: string; instruction: string }[];
  pharmacokinetics?: { halfLife: string; metabolism: string; excretion: string; bioavailability?: string };
  commercialNames?: { name: string; country: string; isReference: boolean }[];
}

export interface Protocol {
  id: string;
  name: string;
  extractedMeds: { name: string; dosage?: string; presentation?: string; indication?: string }[];
}

export interface GlobalExam {
  // Placeholder for global exam registry
  code: string;
  name: string;
}

export interface ConsultationDraft {
  patientId: string;
  savedAt: string;
  soap: any;
  anamnese: any;
  physical: any;
}

export enum ConsultationStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL'
}

export interface ConsultationContent {
  soap?: any;
  anamnese?: any;
  physical?: any;
  diagnosis?: string;
}

export interface AgendaConfig {
  noShow: {
    highThreshold: number;
    criticalThreshold: number;
    confirmRequiredHoursBefore: number;
  };
  optimization: {
    bufferMinutesPerBlock: number;
    overtimeRiskLimit: number;
  };
  overbooking: {
    allowed: boolean;
    minNoShowProb: number;
    maxPerDay: number;
    autoApply: boolean;
  };
  queue: {
    autoApply: boolean;
    graceMinutes: number;
  };
}

export interface IntegraClearance {
  clearanceId: string;
  productName: string;
  providerName: string;
  clearanceEndpoint: string;
  clearanceType: 'CLOUD' | 'PHYSICAL';
}

export interface IntegraAuthenticationResult {
  clearances: IntegraClearance[];
}

export interface ConsultationHeader {
  patientId: string;
  date: string;
}

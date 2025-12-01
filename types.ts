
export interface User {
  username: string;
  fullName: string;
  role: 'auditor' | 'manager' | 'admin';
  jobTitle: string;
  photoUrl: string; // Reference photo URL or Base64
  requiredUniform?: string; // Configurable uniform description
  assignedStoreIds?: string[]; // New: List of store IDs this user can access
}

export interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  type: 'select' | 'text'; 
  options?: string[]; 
  dependsOn?: { questionId: string; value: string }; 
  photoRequiredIf?: string[]; 
}

export interface AuditFormState {
  storeId: string;
  answers: Record<string, string>; 
  photos: Record<string, string>; 
}

export interface AuditReport {
  score: number;
  summary: string;
  criticalIssues: string[];
  recommendations: string[];
}

export interface TimeLog {
  id: string;
  userId: string;
  userFullName: string;
  userPhotoUrl: string; 
  storeId?: string; 
  storeName?: string; 
  type: 'INGRESO' | 'EGRESO';
  timestamp: string; // ISO string
  hasIncident: boolean; 
  incidentDetail?: string; 
  identityScore: number; 
  uniformCompliant: boolean; 
  uniformDetails?: string; 
  
  // Location Data
  location?: { lat: number; lng: number };
  distanceToStore?: number; 
  locationAllowed?: boolean; 
}

// Datos iniciales vacíos, se cargarán desde Supabase
export const STORES: Store[] = [];
export const USERS: Record<string, User & { password: string }> = {};
export const MOCK_TIME_LOGS: TimeLog[] = [];

// Preguntas fijas del sistema (Módulo Depósito)
export const QUESTIONS: Question[] = [
  {
    id: 'dep_01',
    category: 'Depósito',
    text: '¿Están delimitados todos los pasillos del depósito con cinta amarilla?',
    type: 'select',
    options: ['Sí', 'No'],
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_02',
    category: 'Depósito',
    text: '¿Los pasillos permiten la fácil circulación?',
    type: 'select',
    options: ['Sí', 'No'],
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_02_why',
    category: 'Depósito',
    text: '¿Por qué los pasillos no permiten la fácil circulación?',
    type: 'text',
    dependsOn: { questionId: 'dep_02', value: 'No' }
  },
  {
    id: 'dep_03',
    category: 'Depósito',
    text: 'El depósito, ¿cuenta con escaleras?',
    type: 'select',
    options: ['Sí', 'No'],
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_03_mark',
    category: 'Depósito',
    text: '¿Están señalizados con cinta amarilla el primer y último escalón?',
    type: 'select',
    options: ['Sí', 'No'],
    dependsOn: { questionId: 'dep_03', value: 'Sí' },
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_03_obs',
    category: 'Depósito',
    text: '¿Las escaleras se encuentran libres de productos y/o cosas que generan obstáculos?',
    type: 'select',
    options: ['Sí', 'No'],
    dependsOn: { questionId: 'dep_03', value: 'Sí' },
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_03_obs_detail',
    category: 'Depósito',
    text: '¿Qué obstáculos hay en las escaleras?',
    type: 'text',
    dependsOn: { questionId: 'dep_03_obs', value: 'No' }
  },
  {
    id: 'dep_04',
    category: 'Depósito',
    text: '¿Está el cartel de salida del depósito colocado?',
    type: 'select',
    options: ['Sí', 'No'],
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_04_where',
    category: 'Depósito',
    text: '¿Dónde está colocado el cartel?',
    type: 'text',
    dependsOn: { questionId: 'dep_04', value: 'Sí' }
  },
  {
    id: 'dep_04_why_not',
    category: 'Depósito',
    text: '¿Por qué no está colocado el cartel de salida del depósito?',
    type: 'text',
    dependsOn: { questionId: 'dep_04', value: 'No' }
  },
  {
    id: 'dep_05',
    category: 'Depósito',
    text: '¿El espacio físico del depósito es acorde a la cantidad de productos?',
    type: 'select',
    options: ['Sí', 'No'],
    photoRequiredIf: ['No']
  },
  {
    id: 'dep_05_why',
    category: 'Depósito',
    text: '¿Por qué no es acorde el espacio físico del depósito?',
    type: 'text',
    dependsOn: { questionId: 'dep_05', value: 'No' }
  },
  {
    id: 'dep_06',
    category: 'Depósito',
    text: 'Estado de limpieza del depósito',
    type: 'select',
    options: ['Buena', 'Regular', 'Mala'],
    photoRequiredIf: ['Regular', 'Mala']
  }
];

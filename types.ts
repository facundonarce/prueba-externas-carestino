

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
  type: 'select' | 'text'; // New: Support text input
  options?: string[]; // Only for select
  dependsOn?: { questionId: string; value: string }; // New: Conditional visibility
  photoRequiredIf?: string[]; // New: Values that force a photo requirement
}

export interface AuditFormState {
  storeId: string;
  answers: Record<string, string>; // questionId -> answer
  photos: Record<string, string>; // questionId -> base64 string
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
  userPhotoUrl: string; // The specific selfie taken at that time
  storeId?: string; // New: Where did they clock in?
  storeName?: string; // New: Readable name
  type: 'INGRESO' | 'EGRESO';
  timestamp: string; // ISO string
  hasIncident: boolean; // Flag for identity OR location mismatch
  incidentDetail?: string; // Reason for the incident
  identityScore: number; // 0-100% confidence match
  uniformCompliant: boolean; // Does clothing match requirements?
  uniformDetails?: string; // Details about clothing
  
  // Location Data
  location?: { lat: number; lng: number };
  distanceToStore?: number; // In meters
  locationAllowed?: boolean; // True if within radius
}

export const STORES: Store[] = [
  // Coords example: Buenos Aires Obelisco area
  { id: 'STORE-001', name: 'Sucursal Centro', address: 'Av. Corrientes 1234', lat: -34.603722, lng: -58.381592 }, 
  // Coords example: Palermo
  { id: 'STORE-002', name: 'Sucursal Norte', address: 'Av. Santa Fe 4500', lat: -34.576837, lng: -58.423405 },
  // Coords example: Belgrano
  { id: 'STORE-003', name: 'Sucursal Sur', address: 'Av. Cabildo 2000', lat: -34.561492, lng: -58.456391 },
];

// Mock Database of Auditors & Admin
export const USERS: Record<string, User & { password: string }> = {
  'auditor': {
    username: 'auditor',
    password: '1234',
    fullName: 'Juan Pérez',
    role: 'auditor',
    jobTitle: 'Auditor Senior de Campo',
    photoUrl: 'https://ui-avatars.com/api/?name=Juan+Perez&background=FF5100&color=fff&size=256',
    requiredUniform: 'Buzo o campera negra',
    assignedStoreIds: ['STORE-001', 'STORE-002'] // Can access Center and North
  },
  'manager': {
    username: 'manager',
    password: 'admin',
    fullName: 'Maria González',
    role: 'manager',
    jobTitle: 'Gerente Regional',
    photoUrl: 'https://ui-avatars.com/api/?name=Maria+G&background=0D8ABC&color=fff&size=256',
    requiredUniform: 'Saco o ropa formal',
    assignedStoreIds: ['STORE-001'] // Only Center
  },
  'admin': {
    username: 'admin',
    password: 'admin123',
    fullName: 'Soporte IT',
    role: 'admin',
    jobTitle: 'Administrador del Sistema',
    photoUrl: 'https://ui-avatars.com/api/?name=Admin+IT&background=333&color=fff&size=256',
    requiredUniform: 'Sin restricción',
    assignedStoreIds: [] // Admin sees all via dashboard
  }
};

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

// Mock Time Logs for Admin View
export const MOCK_TIME_LOGS: TimeLog[] = [
  {
    id: 'log-1',
    userId: 'auditor',
    userFullName: 'Juan Pérez',
    userPhotoUrl: 'https://ui-avatars.com/api/?name=Juan+Perez&background=FF5100&color=fff&size=256',
    storeId: 'STORE-001',
    storeName: 'Sucursal Centro',
    type: 'INGRESO',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    hasIncident: false,
    identityScore: 98,
    uniformCompliant: true,
    uniformDetails: 'Lleva buzo negro correctamente.',
    locationAllowed: true,
    distanceToStore: 15
  },
  {
    id: 'log-2',
    userId: 'manager',
    userFullName: 'Maria González',
    userPhotoUrl: 'https://ui-avatars.com/api/?name=Maria+G&background=0D8ABC&color=fff&size=256',
    storeId: 'STORE-001',
    storeName: 'Sucursal Centro',
    type: 'INGRESO',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    hasIncident: false,
    identityScore: 95,
    uniformCompliant: true,
    uniformDetails: 'Vestimenta formal correcta.',
    locationAllowed: true,
    distanceToStore: 5
  },
  {
    id: 'log-3',
    userId: 'auditor',
    userFullName: 'Juan Pérez',
    userPhotoUrl: 'https://ui-avatars.com/api/?name=Juan+Perez&background=FF5100&color=fff&size=256',
    storeId: 'STORE-001',
    storeName: 'Sucursal Centro',
    type: 'EGRESO',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    hasIncident: false,
    identityScore: 99,
    uniformCompliant: true,
    uniformDetails: 'Mantiene uniforme.',
    locationAllowed: true,
    distanceToStore: 20
  }
];
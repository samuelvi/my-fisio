export type PatientStatus = 'active' | 'disabled';

export interface Patient {
    id: number;
    firstName: string;
    lastName: string;
    fullName?: string;
    taxId?: string;
    dateOfBirth?: string;
    phone?: string;
    email?: string;
    address?: string;
    profession?: string;
    sportsActivity?: string;
    rate?: string;
    allergies?: string;
    medication?: string;
    systemicDiseases?: string;
    surgeries?: string;
    accidents?: string;
    injuries?: string;
    bruxism?: string;
    insoles?: string;
    others?: string;
    notes?: string;
    status: PatientStatus;
    totalInvoiced?: number;
    createdAt: string;
    records?: RecordEntry[];
}

export interface Record {
    id: number;
    physiotherapyTreatment: string;
    consultationReason?: string;
    onset?: string;
    currentSituation?: string;
    evolution?: string;
    radiologyTests?: string;
    medicalTreatment?: string;
    homeTreatment?: string;
    notes?: string;
    sickLeave: boolean;
    createdAt: string;
    patient?: string; // IRI
}

// Alias for clinical history entries
export type RecordEntry = Record;

export interface Appointment {
    id: number;
    patientId?: number;
    patientName?: string;
    userId: number;
    title: string;
    allDay: boolean;
    startsAt: string;
    endsAt: string;
    notes?: string;
    type: string;
    createdAt?: string;
}

export interface InvoiceLine {
    id?: number;
    concept: string;
    description?: string;
    quantity: number;
    price: number;
    amount: number;
}

export interface Invoice {
    id: number;
    number: string;
    formattedNumber?: string; // Number with prefix (e.g., "F2025000001")
    date: string;
    fullName: string;
    taxId: string;
    address?: string;
    phone?: string;
    email?: string;
    amount: number;
    currency: string; // ISO 4217 currency code (e.g., 'EUR', 'USD')
    createdAt?: string;
    lines: InvoiceLine[];
}

export interface Customer {
    id?: number;
    firstName: string;
    lastName: string;
    fullName?: string;
    taxId: string;
    email?: string;
    phone?: string;
    billingAddress: string;
    createdAt?: string;
}

export interface DashboardStats {
    totalPatients: number;
    appointmentsToday: number;
    othersToday: number;
    invoicesThisYear: number;
}

export interface HealthCheck {
    status: 'ok' | 'degraded' | 'loading';
    checks: Record<string, { ok: boolean }>;
}

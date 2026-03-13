export type UserRole = 'admin' | 'employee';

export interface Sede {
    id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    radiusMeters: number;
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    pin: string;
    sedeId?: string; // Legacy field for compatibility during migration
    sedeIds?: string[]; // Multiple assigned sedes
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    type: 'in' | 'out';
    timestamp: string; // ISO string
    sedeId?: string; // Sede where this record was created
    location: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    photoUrl?: string; // Data URL or path
    notes?: string;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    color: string;
    createdAt: string;
    updatedAt: string;
}

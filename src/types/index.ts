export type UserRole = 'admin' | 'employee';

export interface Sede {
    id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
}

export interface User {
    id: string;
    name: string;
    role: UserRole;
    pin: string;
    sedeId?: string; // Optional for admin, required for employees ideally
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    userName: string;
    type: 'in' | 'out';
    timestamp: string; // ISO string
    location: {
        lat: number;
        lng: number;
        accuracy?: number;
    };
    photoUrl?: string; // Data URL or path
    notes?: string;
}

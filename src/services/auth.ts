import type { User, Sede } from '../types';

export const SEDES: Sede[] = [
    {
        id: '1',
        name: 'Sede Principal',
        location: { lat: 7.31182, lng: -72.48478 },
        address: 'Calle 1 # 1-1'
    },
    {
        id: '2',
        name: 'Sede Norte',
        location: { lat: 4.6597, lng: -74.0517 }, // Bogota North approx
        address: 'Calle 100 # 15-15'
    }
];

// Mock users for the prototype
const MOCK_USERS: User[] = [
    { id: '1', name: 'Admin User', role: 'admin', pin: 'admin123' },
    { id: '2', name: 'Juan Perez', role: 'employee', pin: '1234', sedeId: '1' },
    { id: '3', name: 'Maria Gomez', role: 'employee', pin: '5678', sedeId: '2' },
];

const AUTH_KEY = 'auth_user';

export const AuthService = {
    login: (pin: string): User | null => {
        const user = MOCK_USERS.find(u => u.pin === pin);
        if (user) {
            localStorage.setItem(AUTH_KEY, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(AUTH_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Helper to get Sede info
    getSede: (sedeId?: string): Sede | undefined => {
        return SEDES.find(s => s.id === sedeId);
    },

    getAllSedes: (): Sede[] => {
        return SEDES;
    },

    getAllUsers: (): User[] => {
        return MOCK_USERS;
    }
};

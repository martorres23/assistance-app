import type { User, Sede } from '../types';

const USERS_KEY = 'app_users';
const SEDES_KEY = 'app_sedes';
const AUTH_KEY = 'auth_user';

const INITIAL_SEDES: Sede[] = [
    {
        id: '1',
        name: 'Sede Principal',
        location: { lat: 7.31182, lng: -72.48478 },
        address: 'Calle 1 # 1-1',
        radiusMeters: 100
    },
    {
        id: '2',
        name: 'Sede Norte',
        location: { lat: 4.6597, lng: -74.0517 },
        address: 'Calle 100 # 15-15',
        radiusMeters: 100
    }
];

const INITIAL_USERS: User[] = [
    { id: '1', name: 'Admin User', role: 'admin', pin: 'admin123' },
    { id: '2', name: 'Juan Perez', role: 'employee', pin: '1234', sedeId: '1' },
    { id: '3', name: 'Maria Gomez', role: 'employee', pin: '5678', sedeId: '2' },
];

// Initialize storage if empty
if (!localStorage.getItem(SEDES_KEY)) {
    localStorage.setItem(SEDES_KEY, JSON.stringify(INITIAL_SEDES));
}
if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
}

export const AuthService = {
    login: (pin: string): User | null => {
        const users = AuthService.getAllUsers();
        const user = users.find(u => u.pin === pin);
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

    // Sede Management
    getSede: (sedeId?: string): Sede | undefined => {
        return AuthService.getAllSedes().find(s => s.id === sedeId);
    },

    getAllSedes: (): Sede[] => {
        const stored = localStorage.getItem(SEDES_KEY);
        const sedes: Sede[] = stored ? JSON.parse(stored) : [];
        // Ensure all sedes have a radiusMeters field
        return sedes.map(s => ({
            ...s,
            radiusMeters: s.radiusMeters ?? 100
        }));
    },

    addSede: (sede: Sede) => {
        const sedes = AuthService.getAllSedes();
        localStorage.setItem(SEDES_KEY, JSON.stringify([...sedes, sede]));
    },

    deleteSede: (sedeId: string) => {
        const sedes = AuthService.getAllSedes().filter(s => s.id !== sedeId);
        localStorage.setItem(SEDES_KEY, JSON.stringify(sedes));
    },

    updateSede: (updatedSede: Sede) => {
        const sedes = AuthService.getAllSedes().map(s => s.id === updatedSede.id ? updatedSede : s);
        localStorage.setItem(SEDES_KEY, JSON.stringify(sedes));
    },

    // User Management
    getAllUsers: (): User[] => {
        const stored = localStorage.getItem(USERS_KEY);
        return stored ? JSON.parse(stored) : [];
    },

    addUser: (user: User) => {
        const users = AuthService.getAllUsers();
        localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
    },

    deleteUser: (userId: string) => {
        const users = AuthService.getAllUsers().filter(u => u.id !== userId);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    updateUser: (updatedUser: User, oldId?: string) => {
        const idToMatch = oldId || updatedUser.id;
        const users = AuthService.getAllUsers().map(u => u.id === idToMatch ? updatedUser : u);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

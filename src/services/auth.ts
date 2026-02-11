import type { User, Sede } from '../types';
import { supabase } from '../lib/supabase';

const AUTH_KEY = 'auth_user';

export const AuthService = {
    login: async (pin: string): Promise<User | null> => {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('pin', pin)
            .single();

        if (error || !user) return null;

        const formattedUser: User = {
            id: user.id,
            name: user.name,
            role: user.role as any,
            pin: user.pin,
            sedeId: user.sede_id
        };

        localStorage.setItem(AUTH_KEY, JSON.stringify(formattedUser));
        return formattedUser;
    },

    logout: () => {
        localStorage.removeItem(AUTH_KEY);
    },

    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(AUTH_KEY);
        return stored ? JSON.parse(stored) : null;
    },

    // Sede Management
    getSede: async (sedeId?: string): Promise<Sede | undefined> => {
        if (!sedeId) return undefined;
        const { data, error } = await supabase
            .from('sedes')
            .select('*')
            .eq('id', sedeId)
            .single();

        if (error || !data) return undefined;
        return {
            id: data.id,
            name: data.name,
            address: data.address,
            location: { lat: data.lat, lng: data.lng },
            radiusMeters: data.radius_meters
        };
    },

    getAllSedes: async (): Promise<Sede[]> => {
        const { data, error } = await supabase
            .from('sedes')
            .select('*')
            .order('name');

        if (error || !data) return [];
        return data.map(s => ({
            id: s.id,
            name: s.name,
            address: s.address,
            location: { lat: s.lat, lng: s.lng },
            radiusMeters: s.radius_meters
        }));
    },

    addSede: async (sede: Omit<Sede, 'id'>) => {
        const { error } = await supabase
            .from('sedes')
            .insert({
                name: sede.name,
                address: sede.address,
                lat: sede.location.lat,
                lng: sede.location.lng,
                radius_meters: sede.radiusMeters
            });
        return { error };
    },

    deleteSede: async (sedeId: string) => {
        const { error } = await supabase
            .from('sedes')
            .delete()
            .eq('id', sedeId);
        return { error };
    },

    updateSede: async (updatedSede: Sede) => {
        const { error } = await supabase
            .from('sedes')
            .update({
                name: updatedSede.name,
                address: updatedSede.address,
                lat: updatedSede.location.lat,
                lng: updatedSede.location.lng,
                radius_meters: updatedSede.radiusMeters
            })
            .eq('id', updatedSede.id);
        return { error };
    },

    // User Management
    getAllUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');

        if (error || !data) return [];
        return data.map(u => ({
            id: u.id,
            name: u.name,
            role: u.role as any,
            pin: u.pin,
            sedeId: u.sede_id
        }));
    },

    addUser: async (user: User) => {
        const { error } = await supabase
            .from('users')
            .insert({
                id: user.id,
                name: user.name,
                role: user.role,
                pin: user.pin,
                sede_id: user.sedeId
            });
        return { error };
    },

    deleteUser: async (userId: string) => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
        return { error };
    },

    updateUser: async (updatedUser: User, oldId?: string) => {
        const idToMatch = oldId || updatedUser.id;
        const { error } = await supabase
            .from('users')
            .update({
                id: updatedUser.id,
                name: updatedUser.name,
                role: updatedUser.role,
                pin: updatedUser.pin,
                sede_id: updatedUser.sedeId
            })
            .eq('id', idToMatch);
        return { error };
    }
};


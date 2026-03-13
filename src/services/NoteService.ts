import { supabase } from '../lib/supabase';
import type { Note } from '../types';

export const NoteService = {
    getNotes: async (): Promise<Note[]> => {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(n => ({
            id: n.id,
            title: n.title,
            content: n.content,
            color: n.color,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        }));
    },

    addNote: async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Note | null, error: any }> => {
        const { data, error } = await supabase
            .from('notes')
            .insert({
                title: note.title,
                content: note.content,
                color: note.color
            })
            .select()
            .single();

        if (error) return { data: null, error };

        return {
            data: {
                id: data.id,
                title: data.title,
                content: data.content,
                color: data.color,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            },
            error: null
        };
    },

    updateNote: async (id: string, note: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ error: any }> => {
        const { error } = await supabase
            .from('notes')
            .update({
                ...note,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        return { error };
    },

    deleteNote: async (id: string): Promise<{ error: any }> => {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        return { error };
    }
};

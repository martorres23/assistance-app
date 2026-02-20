import type { AttendanceRecord } from '../types';
import { supabase } from '../lib/supabase';

export const StorageService = {
    saveRecord: async (record: AttendanceRecord): Promise<{ error: any }> => {
        let photoUrl = record.photoUrl;

        // 1. If we have a data URL (captured photo), upload it to Supabase Storage
        if (photoUrl && photoUrl.startsWith('data:')) {
            const blob = await fetch(photoUrl).then(res => res.blob());
            const fileName = `${record.userId}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('attendance-photos')
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadError) {
                console.error('Error uploading photo:', uploadError);
                return { error: uploadError };
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('attendance-photos')
                .getPublicUrl(fileName);

            photoUrl = publicUrl;
        }

        // 2. Save record to DB
        const { error: dbError } = await supabase
            .from('attendance_records')
            .insert({
                user_id: record.userId,
                user_name: record.userName,
                type: record.type,
                timestamp: record.timestamp,
                lat: record.location.lat,
                lng: record.location.lng,
                accuracy: record.location.accuracy,
                photo_url: photoUrl
            });

        return { error: dbError };
    },

    getRecords: async (): Promise<AttendanceRecord[]> => {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error || !data) return [];

        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            userName: r.user_name,
            type: r.type as 'in' | 'out',
            timestamp: r.timestamp,
            location: {
                lat: r.lat,
                lng: r.lng,
                accuracy: r.accuracy
            },
            photoUrl: r.photo_url
        }));
    },

    deleteAllRecordsForUser: async (userId: string): Promise<{ error: any }> => {
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('user_id', userId);

        return { error };
    },

    deleteRecordsForUser: async (userId: string, datePrefix: string): Promise<{ error: any }> => {
        // En Supabase, el timestamp está en UTC.
        // Colombia está en UTC-5.
        // El día 'datePrefix' (YYYY-MM-DD) en Colombia:
        // Inicia: datePrefix T 05:00:00 Z
        // Termina: (datePrefix + 1 día) T 04:59:59 Z

        const start = new Date(`${datePrefix}T00:00:00`);
        const startDate = new Date(start.getTime() + (5 * 60 * 60 * 1000)).toISOString();

        const end = new Date(start.getTime() + (24 * 60 * 60 * 1000));
        const endDate = new Date(end.getTime() + (4 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000)).toISOString();

        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('user_id', userId)
            .gte('timestamp', startDate)
            .lte('timestamp', endDate);

        return { error };
    },

    clearRecords: async (): Promise<void> => {
        // Peligroso: Borra todo
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all hack
        if (error) console.error(error);
    }
};


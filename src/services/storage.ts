import type { AttendanceRecord } from '../types';

const STORAGE_KEY = 'attendance_records';

export const StorageService = {
    saveRecord: (record: AttendanceRecord): void => {
        const existing = StorageService.getRecords();
        const updated = [record, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    },

    getRecords: (): AttendanceRecord[] => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    clearRecords: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    },

    deleteRecordsForUser: (userId: string, datePrefix: string): void => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return;
        const records: AttendanceRecord[] = JSON.parse(data);
        const filtered = records.filter(r => !(r.userId === userId && r.timestamp.startsWith(datePrefix)));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    },

    // Helper for demo data
    seed: () => {
        // Optional: Seed initial data
    }
};

import type { AttendanceRecord, User } from '../types';
import { AnalyticsUtils } from './analytics';

export const PayrollUtils = {
    generateCSV: (records: AttendanceRecord[], users: User[], startDate?: Date, endDate?: Date): string => {
        // Headers
        const headers = ['ID Empleado', 'Nombre', 'Rol', 'Horas Totales', 'Días Trabajados', 'Fecha Inicio', 'Fecha Fin'];
        const rows = [headers.join(',')];

        const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

        users.forEach(user => {
            const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
            const daysWorked = new Set(
                stats.dailyStats.filter(d => d.hours > 0).map(d => d.date)
            ).size;

            const row = [
                user.id,
                user.name,
                user.role,
                stats.totalHours.toFixed(2),
                daysWorked.toString(),
                startDate ? startDate.toLocaleDateString() : 'Inicio Histórico',
                endDate ? endDate.toLocaleDateString() : 'Hoy'
            ];

            rows.push(row.join(','));
        });

        return rows.join('\n');
    },

    downloadCSV: (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

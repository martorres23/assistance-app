import type { AttendanceRecord, User, Sede } from '../types';
import { AnalyticsUtils } from './analytics';
import * as XLSX from 'xlsx';

export const PayrollUtils = {
    generateExcel: (
        records: AttendanceRecord[],
        users: User[],
        sedes: Sede[],
        startDate?: Date,
        endDate?: Date,
        mode: 'summary' | 'detailed' = 'summary'
    ) => {
        // If dates are not provided (History mode), detect min/max from records
        let finalStart = startDate;
        let finalEnd = endDate;

        if (!finalStart || !finalEnd) {
            const timestamps = records.map(r => new Date(r.timestamp).getTime());
            if (timestamps.length > 0) {
                finalStart = new Date(Math.min(...timestamps));
                finalEnd = new Date(Math.max(...timestamps));
            }
        }

        const dateRange = finalStart && finalEnd ? { start: finalStart, end: finalEnd } : undefined;
        const data: any[] = [];

        if (mode === 'summary') {
            users.forEach(user => {
                const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
                const userSede = sedes.find(s => s.id === user.sedeId);
                const daysWorked = new Set(
                    stats.dailyStats.filter(d => d.hours > 0).map(d => d.date)
                ).size;

                data.push({
                    'Documento de Identidad': user.id,
                    'Nombre': user.name,
                    'Sede': userSede?.name || 'No asignada',
                    'Horas Totales': Number(stats.totalHours.toFixed(2)),
                    'Días Trabajados': daysWorked,
                    'Periodo Inicio': finalStart ? finalStart.toLocaleDateString() : '—',
                    'Periodo Fin': finalEnd ? finalEnd.toLocaleDateString() : '—'
                });
            });
        } else {
            // Detailed: Pivot Table (Rows = Dates, Columns = Employees)
            // 1. Get unique dates in range sorted
            const uniqueDates = new Set<string>();
            users.forEach(user => {
                const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
                stats.dailyStats.forEach(d => uniqueDates.add(d.date));
            });
            const sortedDates = Array.from(uniqueDates).sort();

            // 2. Build rows
            sortedDates.forEach(date => {
                const row: any = { 'Fecha': date };
                users.forEach(user => {
                    const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
                    const dayStat = stats.dailyStats.find(d => d.date === date);
                    row[user.name] = dayStat ? `${dayStat.hours}h` : '0h';
                });
                data.push(row);
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, mode === 'summary' ? 'Resumen' : 'Detallado');

        return workbook;
    },

    downloadExcel: (workbook: XLSX.WorkBook, filename: string) => {
        XLSX.writeFile(workbook, filename);
    }
};

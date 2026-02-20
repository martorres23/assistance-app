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
        const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
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
                    'Periodo Inicio': startDate ? startDate.toLocaleDateString() : 'Inicio Histórico',
                    'Periodo Fin': endDate ? endDate.toLocaleDateString() : 'A la fecha'
                });
            });
        } else {
            // Detailed: Group by user and then by day
            users.forEach(user => {
                const userSede = sedes.find(s => s.id === user.sedeId);
                const userRecords = records.filter(r => r.userId === user.id);
                const sessions = AnalyticsUtils.getAttendanceSessions(userRecords, user);

                // Filter sessions by date range
                const filteredSessions = sessions.filter(s => {
                    if (!dateRange) return true;
                    const sessionDate = new Date(s.date + 'T00:00:00');
                    return sessionDate >= dateRange.start && sessionDate <= dateRange.end;
                });

                filteredSessions.forEach(session => {
                    data.push({
                        'Fecha': session.date,
                        'Documento de Identidad': user.id,
                        'Nombre': user.name,
                        'Sede': userSede?.name || 'No asignada',
                        'Estado': session.status,
                        'Entrada': session.entry || '—',
                        'Salida': session.exit || '—',
                        'Horas': session.hours
                    });
                });
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

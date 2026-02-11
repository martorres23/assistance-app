import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import type { AttendanceRecord, User, Sede } from '../../types';
import { PayrollUtils } from '../../utils/payroll';
import { Download, FileText } from 'lucide-react';

interface AdminPayrollViewProps {
    records: AttendanceRecord[];
}

export const AdminPayrollView: React.FC<AdminPayrollViewProps> = ({ records }) => {
    const [selectedSede, setSelectedSede] = useState<string>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

    const sedes = AuthService.getAllSedes();
    const USERS = AuthService.getAllUsers().filter(u => u.role === 'employee');

    const handleGeneratePayroll = () => {
        // Determine date range for export
        let range: { start: Date; end: Date } | undefined;
        const now = new Date();

        if (timeRange === 'week') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            range = { start: lastWeek, end: now };
        } else if (timeRange === 'month') {
            const lastMonth = new Date();
            lastMonth.setDate(now.getDate() - 30);
            range = { start: lastMonth, end: now };
        }

        let usersToExport = USERS;
        if (selectedSede !== 'all') {
            usersToExport = usersToExport.filter((u: User) => u.sedeId === selectedSede);
        }
        if (selectedEmployee !== 'all') {
            usersToExport = usersToExport.filter((u: User) => u.id === selectedEmployee);
        }

        const csvContent = PayrollUtils.generateCSV(records, usersToExport, range?.start, range?.end);
        PayrollUtils.downloadCSV(csvContent, `nomina-${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Generar Nómina</h2>
                    <p className="text-gray-500">Seleccione los filtros para exportar el reporte de horas.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                        >
                            <option value="all">Todo el historial</option>
                            <option value="week">Última Semana</option>
                            <option value="month">Último Mes</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sede</label>
                            <select
                                value={selectedSede}
                                onChange={(e) => setSelectedSede(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            >
                                <option value="all">Todas las Sedes</option>
                                {sedes.map((s: Sede) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                            >
                                <option value="all">Todos los Empleados</option>
                                {USERS.map((u: User) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={handleGeneratePayroll}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Download className="w-5 h-5" />
                            Generar y Descargar CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

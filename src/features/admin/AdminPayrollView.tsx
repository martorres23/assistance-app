import React, { useState, useEffect } from 'react';
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
    const [reportMode, setReportMode] = useState<'summary' | 'detailed'>('summary');
    const [selectionType, setSelectionType] = useState<'all' | 'month' | 'range' | 'quarter'>('all');

    // Date states
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [customRange, setCustomRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [sedes, setSedes] = useState<Sede[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allSedes, allUsers] = await Promise.all([
                    AuthService.getAllSedes(),
                    AuthService.getAllUsers()
                ]);
                setSedes(allSedes);
                setUsers(allUsers.filter(u => u.role === 'employee'));
            } catch (error) {
                console.error('Error fetching payroll data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleGeneratePayroll = () => {
        let start: Date | undefined;
        let end: Date | undefined;

        if (selectionType === 'month') {
            const [year, month] = selectedMonth.split('-').map(Number);
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0, 23, 59, 59);
        } else if (selectionType === 'range') {
            start = new Date(customRange.start + 'T00:00:00');
            end = new Date(customRange.end + 'T23:59:59');
        } else if (selectionType === 'quarter') {
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            end = now;
        }

        let usersToExport = users;
        if (selectedSede !== 'all') {
            usersToExport = usersToExport.filter((u: User) => u.sedeId === selectedSede);
        }
        if (selectedEmployee !== 'all') {
            usersToExport = usersToExport.filter((u: User) => u.id === selectedEmployee);
        }

        const wb = PayrollUtils.generateExcel(records, usersToExport, sedes, start, end, reportMode);
        const fileName = `nomina-${reportMode}-${new Date().toISOString().split('T')[0]}.xlsx`;
        PayrollUtils.downloadExcel(wb, fileName);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <span>Cargando datos de nómina...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 max-w-3xl mx-auto">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-800 tracking-tight">Generar Reporte Excel</h2>
                    <p className="text-gray-500 text-sm">Configura los filtros para exportar la nómina de empleados.</p>
                </div>

                <div className="space-y-6">
                    {/* Report Type Selection */}
                    <div className="bg-gray-50 p-1.5 rounded-2xl flex gap-2">
                        <button
                            onClick={() => setReportMode('summary')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportMode === 'summary' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Registro Resumen
                        </button>
                        <button
                            onClick={() => setReportMode('detailed')}
                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportMode === 'detailed' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Registro Detallado
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Period/Selection Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Tipo de Periodo</label>
                            <select
                                value={selectionType}
                                onChange={(e) => setSelectionType(e.target.value as any)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700"
                            >
                                <option value="all">Todo el Historial</option>
                                <option value="month">Por Mes Específico</option>
                                <option value="range">Rango de Fechas</option>
                                <option value="quarter">Último Trimestre</option>
                            </select>
                        </div>

                        {/* Contextual Date Selectors */}
                        {selectionType === 'month' && (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Seleccionar Mes</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700"
                                />
                            </div>
                        )}

                        {selectionType === 'range' && (
                            <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Desde</label>
                                    <input
                                        type="date"
                                        value={customRange.start}
                                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                        className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Hasta</label>
                                    <input
                                        type="date"
                                        value={customRange.end}
                                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                        className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {selectionType === 'quarter' && (
                            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Periodo Calculado</label>
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-blue-700 font-bold text-sm">
                                    {new Date(new Date().setMonth(new Date().getMonth() - 3)).toLocaleDateString()} al {new Date().toLocaleDateString()}
                                </div>
                            </div>
                        )}

                        {selectionType === 'all' && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Información</label>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-bold text-sm">
                                    Se incluirán todos los registros existentes.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sede Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Sede / Ubicación</label>
                            <select
                                value={selectedSede}
                                onChange={(e) => setSelectedSede(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700"
                            >
                                <option value="all">Todas las Sedes</option>
                                {sedes.map((s: Sede) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Employee Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Empleado Específico</label>
                            <select
                                value={selectedEmployee}
                                onChange={(e) => setSelectedEmployee(e.target.value)}
                                className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700"
                            >
                                <option value="all">Todos los Empleados</option>
                                {users
                                    .filter(u => selectedSede === 'all' || u.sedeId === selectedSede)
                                    .map((u: User) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleGeneratePayroll}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Excel (.xlsx)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

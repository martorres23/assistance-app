import React, { useMemo, useState, useEffect } from 'react';
import {
    BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { AnalyticsUtils } from '../../utils/analytics';
import type { AttendanceRecord, User, Sede } from '../../types';
import { AuthService } from '../../services/auth';
import { Users, MapPin, CheckSquare, Activity } from 'lucide-react';

interface AdminStatsViewProps {
    records: AttendanceRecord[];
}

export const AdminStatsView: React.FC<AdminStatsViewProps> = ({ records }) => {
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
    const [timeRange, setTimeRange] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>('none');
    const [users, setUsers] = useState<User[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [allUsers, allSedes] = await Promise.all([
                    AuthService.getAllUsers(),
                    AuthService.getAllSedes()
                ]);
                setUsers(allUsers.filter(u => u.role === 'employee'));
                setSedes(allSedes);
            } catch (error) {
                console.error('Error fetching stats data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        records.forEach(r => {
            const dateStr = r.timestamp.split('T')[0];
            const [year, month] = dateStr.split('-');
            const monthKey = `${year}-${month}`;
            months.add(monthKey);
        });
        return Array.from(months).sort().reverse();
    }, [records]);

    const dashboardData = useMemo(() => {
        if (isLoading) return null;

        let filteredUsers = users;

        if (selectedEmployee !== 'all') {
            filteredUsers = filteredUsers.filter(u => u.id === selectedEmployee);
        }

        let dateRange: { start: Date; end: Date } | undefined;
        const now = new Date();

        if (selectedMonth !== 'none') {
            const [year, month] = selectedMonth.split('-').map(Number);
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59, 999);
            dateRange = { start, end };
        } else if (timeRange === 'week') {
            const monday = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when today is Sunday
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);
            dateRange = { start: monday, end: now };
        } else if (timeRange === 'last_week') {
            const monday = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);
            dateRange = { start: monday, end: sunday };
        } else if (timeRange === 'month') {
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateRange = { start: firstDayOfMonth, end: now };
        }

        // Helper to count work days (excluding Sundays)
        const countWorkDays = (start: Date, end: Date) => {
            let count = 0;
            const current = new Date(start);
            while (current <= end) {
                if (current.getDay() !== 0) count++; // 0 is Sunday
                current.setDate(current.getDate() + 1);
            }
            return count;
        };

        const workDays = dateRange ? countWorkDays(dateRange.start, dateRange.end) : 0;
        const totalPossibleDays = workDays * users.length;

        // Today's attendance details (Real-time status)
        const todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD local
        const todayRecords = records.filter(r =>
            r.timestamp.startsWith(todayStr) &&
            (selectedEmployee === 'all' || r.userId === selectedEmployee)
        );

        const userTodayRecords = new Map<string, typeof records>();
        todayRecords.forEach(r => {
            if (!userTodayRecords.has(r.userId)) userTodayRecords.set(r.userId, []);
            userTodayRecords.get(r.userId)!.push(r);
        });

        let enCurso = 0;
        let finalizada = 0;

        userTodayRecords.forEach((recs) => {
            const last = [...recs].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).pop();
            if (last?.type === 'in') enCurso++;
            else if (last?.type === 'out') finalizada++;
        });

        // Individual Stats
        const employeeStats = filteredUsers.map((user: User) => {
            const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
            return {
                name: user.name,
                ...stats,
                daysWorked: new Set(
                    records
                        .filter(r => r.userId === user.id && (!dateRange || (new Date(r.timestamp) >= dateRange.start && new Date(r.timestamp) <= dateRange.end)))
                        .map(r => r.timestamp.split('T')[0])
                ).size
            };
        });

        // Aggregated Stats
        const aggregated = AnalyticsUtils.aggregateStats(employeeStats);

        // 1. Dual Activity Heatmap (Entries vs Exits) - Count Unique People
        const entrySets = new Map<string, Set<string>>();
        const exitSets = new Map<string, Set<string>>();
        const heatmapDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

        records.forEach(r => {
            const rDate = new Date(r.timestamp);
            if (!dateRange || (rDate >= dateRange.start && rDate <= dateRange.end)) {
                const hour = rDate.getHours();
                const day = (rDate.getDay() + 6) % 7; // Mon=0, Sun=6
                const key = `${day}-${hour}`;
                if (r.type === 'in') {
                    if (!entrySets.has(key)) entrySets.set(key, new Set());
                    entrySets.get(key)!.add(r.userId);
                } else if (r.type === 'out') {
                    if (!exitSets.has(key)) exitSets.set(key, new Set());
                    exitSets.get(key)!.add(r.userId);
                }
            }
        });

        const entryHeatmap = [];
        const exitHeatmap = [];
        for (let d = 0; d < 7; d++) {
            for (let h = 0; h < 24; h++) {
                const key = `${d}-${h}`;
                entryHeatmap.push({ day: heatmapDays[d], hour: h, count: entrySets.get(key)?.size || 0 });
                exitHeatmap.push({ day: heatmapDays[d], hour: h, count: exitSets.get(key)?.size || 0 });
            }
        }

        // 2. Distribution by Sede
        const sedeUsage = new Map<string, number>();
        records.forEach(r => {
            const rDate = new Date(r.timestamp);
            if (!dateRange || (rDate >= dateRange.start && rDate <= dateRange.end)) {
                // Use record-level sedeId if available, fallback to user-level
                const user = users.find(u => u.id === r.userId);
                const sedeId = r.sedeId || user?.sedeId || 'unknown';
                sedeUsage.set(sedeId, (sedeUsage.get(sedeId) || 0) + 1);
            }
        });

        const sedeDistribution = Array.from(sedeUsage.entries()).map(([id, count]) => {
            const sedeName = sedes.find(s => s.id === id)?.name || 'Sin Sede';
            return { name: sedeName, count };
        });

        const totalDaysWorked = employeeStats.reduce((acc, s) => acc + s.daysWorked, 0);
        const avgAttendance = users.length > 0 ? (totalDaysWorked / users.length).toFixed(1) : '0';

        return {
            employeeStats,
            aggregated,
            metrics: {
                totalEmployees: users.length,
                totalSedes: sedes.length,
                attendanceToday: userTodayRecords.size,
                enCurso,
                finalizada,
                avgAttendance,
                totalDaysWorked,
                totalPossibleDays
            },
            entryHeatmap,
            exitHeatmap,
            sedeDistribution,
            heatmapData: AnalyticsUtils.getHeatmapData(aggregated.dailyTrend)
        };
    }, [records, users, sedes, selectedEmployee, timeRange, selectedMonth, isLoading]);

    if (isLoading || !dashboardData) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <span>Cargando estadísticas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Upper Section: Filters & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                    <div className="flex flex-col gap-1 min-w-[200px]">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Seleccionar Empleado</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="p-3 border-0 bg-blue-50/50 rounded-xl text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-200 transition-all appearance-none"
                        >
                            <option value="all">📊 Vista General de Todos</option>
                            {users.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[130px]">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Filtros Rápidos</label>
                        <select
                            value={timeRange}
                            onChange={(e) => {
                                setTimeRange(e.target.value);
                                setSelectedMonth('none');
                            }}
                            className="p-3 border-0 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
                        >
                            <option value="all">Todo</option>
                            <option value="week">Semana Actual</option>
                            <option value="last_week">Semana Anterior</option>
                            <option value="month">Este Mes</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1 min-w-[170px]">
                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Mes Específico</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setTimeRange('all');
                            }}
                            className="p-3 border-0 bg-gray-50 rounded-xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-gray-200 transition-all cursor-pointer"
                        >
                            <option value="none">Seleccionar mes...</option>
                            {availableMonths.map(m => {
                                const [year, month] = m.split('-');
                                const date = new Date(Number(year), Number(month) - 1);
                                const label = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                                return <option key={m} value={m}>{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* Blue Card: Totals */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-100 flex flex-col justify-between text-white overflow-hidden relative group">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-wider">Plantilla Total</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="text-3xl font-black">{dashboardData.metrics.totalEmployees}</h3>
                            <span className="text-blue-200 text-xs font-bold">Empleados</span>
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-blue-100/80">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-bold">{dashboardData.metrics.totalSedes} Sedes Activas</span>
                        </div>
                    </div>
                    <Users className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                </div>
            </div>

            {selectedEmployee === 'all' ? (
                // --- GENERAL VIEW ---
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Asistencia Hoy */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 w-fit rounded-lg"><Users className="w-5 h-5" /></div>
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Asistencia Hoy</p>
                                <h3 className="text-xl font-black text-gray-800">{dashboardData.metrics.attendanceToday}</h3>
                            </div>
                        </div>

                        {/* En Curso */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="p-2 bg-amber-50 text-amber-600 w-fit rounded-lg"><Activity className="w-5 h-5" /></div>
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">En Curso</p>
                                <h3 className="text-xl font-black text-gray-800">{dashboardData.metrics.enCurso}</h3>
                            </div>
                        </div>

                        {/* Finalizada */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 w-fit rounded-lg"><CheckSquare className="w-5 h-5" /></div>
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Finalizada</p>
                                <h3 className="text-xl font-black text-gray-800">{dashboardData.metrics.finalizada}</h3>
                            </div>
                        </div>

                        {/* Asistencia Promedio */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                            <div className="p-2 bg-purple-50 text-purple-600 w-fit rounded-lg"><Activity className="w-5 h-5" /></div>
                            <div>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Asist. Promedio</p>
                                <h3 className="text-xl font-black text-gray-800">{dashboardData.metrics.avgAttendance} <span className="text-xs font-bold text-gray-400">días</span></h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
                            <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                Asistencia por Sede
                            </h4>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={dashboardData.sedeDistribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis fontSize={12} tick={{ fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" name="Asistencias" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-10">
                            {/* ENTRIES HEATMAP */}
                            <div>
                                <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <span className="w-2 h-6 bg-amber-500 rounded-full"></span>
                                    En qué horas llegan (ENTRADAS)
                                </h4>
                                <div className="flex flex-col min-h-0">
                                    <div className="grid grid-cols-[40px_1fr] gap-1">
                                        <div className="grid grid-rows-7 gap-1">
                                            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                                                <span key={day} className="text-[10px] font-black text-gray-400 flex items-center justify-end pr-2">{day}</span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-[repeat(24,1fr)] grid-rows-7 gap-1">
                                            {dashboardData.entryHeatmap.map((cell: any, idx: number) => {
                                                let colorClass = 'bg-gray-50';
                                                if (cell.count > 0) {
                                                    if (cell.count === 1) colorClass = 'bg-yellow-200';
                                                    else if (cell.count === 2) colorClass = 'bg-yellow-300';
                                                    else if (cell.count === 3) colorClass = 'bg-amber-300';
                                                    else if (cell.count === 4) colorClass = 'bg-amber-400';
                                                    else if (cell.count === 5) colorClass = 'bg-orange-400';
                                                    else if (cell.count === 6) colorClass = 'bg-orange-500';
                                                    else if (cell.count <= 8) colorClass = 'bg-red-500';
                                                    else if (cell.count <= 10) colorClass = 'bg-red-600';
                                                    else if (cell.count <= 12) colorClass = 'bg-red-700';
                                                    else colorClass = 'bg-red-900';
                                                }
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`h-4 rounded-sm transition-all hover:ring-2 hover:ring-amber-200 cursor-help ${colorClass}`}
                                                        title={`ENTRADAS: ${cell.day} ${cell.hour}:00 - ${cell.count} empleados`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[40px_1fr] gap-1 mt-2">
                                        <div />
                                        <div className="grid grid-cols-[repeat(24,1fr)] gap-1">
                                            {[0, 6, 12, 18, 23].map(h => (
                                                <div key={h} className="text-[9px] font-black text-gray-300 text-center" style={{ gridColumnStart: h + 1 }}>
                                                    {h}h
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* EXITS HEATMAP */}
                            <div>
                                <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2 uppercase tracking-tight text-sm">
                                    <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                    En qué horas se van (SALIDAS)
                                </h4>
                                <div className="flex flex-col min-h-0">
                                    <div className="grid grid-cols-[40px_1fr] gap-1">
                                        <div className="grid grid-rows-7 gap-1">
                                            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                                                <span key={day} className="text-[10px] font-black text-gray-400 flex items-center justify-end pr-2">{day}</span>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-[repeat(24,1fr)] grid-rows-7 gap-1">
                                            {dashboardData.exitHeatmap.map((cell: any, idx: number) => {
                                                let colorClass = 'bg-gray-50';
                                                if (cell.count > 0) {
                                                    if (cell.count === 1) colorClass = 'bg-emerald-200';
                                                    else if (cell.count === 2) colorClass = 'bg-emerald-300';
                                                    else if (cell.count === 3) colorClass = 'bg-emerald-400';
                                                    else if (cell.count === 4) colorClass = 'bg-green-400';
                                                    else if (cell.count === 5) colorClass = 'bg-green-500';
                                                    else if (cell.count === 6) colorClass = 'bg-green-600';
                                                    else if (cell.count <= 8) colorClass = 'bg-green-700';
                                                    else if (cell.count <= 10) colorClass = 'bg-green-800';
                                                    else if (cell.count <= 12) colorClass = 'bg-emerald-900';
                                                    else colorClass = 'bg-slate-900';
                                                }
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`h-4 rounded-sm transition-all hover:ring-2 hover:ring-emerald-200 cursor-help ${colorClass}`}
                                                        title={`SALIDAS: ${cell.day} ${cell.hour}:00 - ${cell.count} empleados`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-[40px_1fr] gap-1 mt-2">
                                        <div />
                                        <div className="grid grid-cols-[repeat(24,1fr)] gap-1">
                                            {[0, 6, 12, 18, 23].map(h => (
                                                <div key={h} className="text-[9px] font-black text-gray-300 text-center" style={{ gridColumnStart: h + 1 }}>
                                                    {h}h
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 py-2 rounded-lg">
                                    💡 Cómo leer: Cada cuadro indica cuántos empleados distintos coinciden en ese horario. El color más oscuro significa que la mayoría de tu equipo marca a esa hora.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                // --- DETAILED EMPLOYEE VIEW ---
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in zoom-in-95 duration-300">
                    {(() => {
                        const user = users.find(u => u.id === selectedEmployee);
                        if (!user) return null;

                        const allSessions = AnalyticsUtils.getAttendanceSessions(records, user);

                        // Filter sessions by timeRange
                        const filteredSessions = allSessions.filter(s => {
                            const sDate = new Date(s.date + 'T00:00:00');
                            const now = new Date();

                            // Priority to specific month selection
                            if (selectedMonth !== 'none') {
                                const [year, month] = selectedMonth.split('-').map(Number);
                                return sDate.getMonth() === (month - 1) && sDate.getFullYear() === year;
                            }

                            if (timeRange === 'all') return true;
                            // Ensure s.date (YYYY-MM-DD) is parsed as local midnight

                            if (timeRange === 'week') {
                                const monday = new Date();
                                const day = now.getDay();
                                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                                monday.setDate(diff);
                                monday.setHours(0, 0, 0, 0);
                                const endOfDay = new Date();
                                endOfDay.setHours(23, 59, 59, 999);
                                return sDate >= monday && sDate <= endOfDay;
                            }
                            if (timeRange === 'last_week') {
                                const monday = new Date();
                                const day = now.getDay();
                                const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
                                monday.setDate(diff);
                                monday.setHours(0, 0, 0, 0);
                                const sunday = new Date(monday);
                                sunday.setDate(monday.getDate() + 6);
                                sunday.setHours(23, 59, 59, 999);
                                return sDate >= monday && sDate <= sunday;
                            }
                            if (timeRange === 'month') {
                                return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
                            }
                            return true;
                        });

                        const totalHours = filteredSessions.reduce((acc, s) => acc + s.hours, 0);
                        const avgHours = filteredSessions.length > 0 ? (totalHours / filteredSessions.length).toFixed(1) : '0';

                        return (
                            <>
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Summary for Selected Employee */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="font-black text-gray-800 text-xl flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-sm">
                                                    {user.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                Informe de {user.name}
                                            </h4>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase text-gray-400">Total en Periodo</p>
                                                <p className="text-3xl font-black text-blue-600">{totalHours.toFixed(1)}h</p>
                                            </div>
                                        </div>

                                        {/* Daily Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="border-b-2 border-gray-50">
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Fecha</th>
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Entrada</th>
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400">Salida</th>
                                                        <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Horas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {filteredSessions.map((session, idx) => {
                                                        const sDate = new Date(session.date + 'T00:00:00');
                                                        const weekday = sDate.toLocaleString('es-ES', { weekday: 'long' });
                                                        const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

                                                        return (
                                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                                <td className="px-4 py-4 font-bold text-gray-700">
                                                                    <span className="text-[10px] block uppercase text-blue-500 mb-0.5">{formattedWeekday}</span>
                                                                    {session.date}
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold ring-1 ring-green-100">
                                                                        {session.entry || '—'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-bold ring-1 ring-amber-100">
                                                                        {session.exit || '—'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-4 text-right">
                                                                    <span className="font-black text-gray-900">{session.hours}h</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {filteredSessions.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400 font-bold italic">
                                                                No hay registros en este periodo
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Weekly Chart for specific employee */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                                        <h5 className="font-black text-gray-800 mb-4 uppercase text-[10px]">Carga de Trabajo Semanal</h5>
                                        <ResponsiveContainer width="100%" height="80%">
                                            <BarChart data={dashboardData.employeeStats.find(e => e.name === user.name)?.weeklyStats || []}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="week" fontSize={10} tick={{ fontWeight: 'bold' }} />
                                                <YAxis fontSize={10} tick={{ fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                                <Tooltip />
                                                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="bg-indigo-900 p-6 rounded-2xl text-white shadow-xl">
                                        <h5 className="font-black mb-4 uppercase text-[10px] text-indigo-300">Resumen de Periodo</h5>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-indigo-800 pb-2">
                                                <span className="text-sm font-medium">Días Laborados</span>
                                                <span className="text-xl font-black text-indigo-200">
                                                    {filteredSessions.length}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-indigo-800 pb-2">
                                                <span className="text-sm font-medium">Promedio Diario</span>
                                                <span className="text-xl font-black text-emerald-400">
                                                    {avgHours}h
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

import React, { useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { AnalyticsUtils } from '../../utils/analytics';
import type { AttendanceRecord, User, Sede } from '../../types';
import { AuthService } from '../../services/auth';
import { Clock, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';

interface AdminStatsViewProps {
    records: AttendanceRecord[];
}

const USERS = AuthService.getAllUsers().filter(u => u.role === 'employee');
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AdminStatsView: React.FC<AdminStatsViewProps> = ({ records }) => {
    const [selectedSede, setSelectedSede] = React.useState<string>('all');
    const [selectedEmployee, setSelectedEmployee] = React.useState<string>('all');
    const [timeRange, setTimeRange] = React.useState<'all' | 'week' | 'month'>('all');

    const sedes = AuthService.getAllSedes();

    const dashboardData = useMemo(() => {
        let filteredUsers = USERS;

        if (selectedSede !== 'all') {
            filteredUsers = filteredUsers.filter(u => u.sedeId === selectedSede);
        }

        if (selectedEmployee !== 'all') {
            filteredUsers = filteredUsers.filter(u => u.id === selectedEmployee);
        }

        let dateRange: { start: Date; end: Date } | undefined;
        const now = new Date();
        if (timeRange === 'week') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            dateRange = { start: lastWeek, end: now };
        } else if (timeRange === 'month') {
            const lastMonth = new Date();
            lastMonth.setDate(now.getDate() - 30);
            dateRange = { start: lastMonth, end: now };
        }

        // Individual Stats
        const employeeStats = filteredUsers.map((user: User) => {
            const stats = AnalyticsUtils.calculateHours(records, user.id, dateRange);
            return {
                name: user.name,
                ...stats
            };
        });

        // Aggregated Stats
        const aggregated = AnalyticsUtils.aggregateStats(employeeStats);
        const totalCost = AnalyticsUtils.calculateCost(aggregated.totalHours, 12000); // Example rate: 12k COP
        const mostActive = AnalyticsUtils.getMostActiveEmployee(employeeStats);
        const avgHours = filteredUsers.length > 0 ? (aggregated.totalHours / filteredUsers.length).toFixed(1) : 0;
        const heatmapData = AnalyticsUtils.getHeatmapData(aggregated.dailyTrend);

        return {
            employeeStats,
            aggregated,
            totalCost,
            mostActive,
            avgHours,
            heatmapData
        };
    }, [records, selectedSede, selectedEmployee, timeRange]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value as any)}
                        className="p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="all">Todo el tiempo</option>
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mes</option>
                    </select>
                    <select value={selectedSede} onChange={(e) => setSelectedSede(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="all">Todas las Sedes</option>
                        {sedes.map((s: Sede) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="p-2 border rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="all">Todos los Empleados</option>
                        {USERS.map((u: User) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Horas Totales</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{dashboardData.aggregated.totalHours}</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Clock className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Costo Estimado</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
                                ${dashboardData.totalCost.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600"><DollarSign className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Promedio / Empleado</p>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">{dashboardData.avgHours} h</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><TrendingUp className="w-5 h-5" /></div>
                    </div>
                </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Más Activo</p>
                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mt-2 truncate max-w-[120px]" title={dashboardData.mostActive?.name || '-'}>
                                {dashboardData.mostActive?.name || '-'}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Users className="w-5 h-5" /></div>
                    </div>
                </div>
            </div>

            {/* Main Charts: Bar & Line */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-80 md:h-96">
                    <h4 className="font-semibold text-gray-800 mb-4">Horas por Empleado</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={dashboardData.employeeStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="totalHours" name="Horas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 h-80 md:h-96">
                    <h4 className="font-semibold text-gray-800 mb-4">Tendencia Diaria</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={dashboardData.aggregated.dailyTrend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" fontSize={10} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="hours" name="Horas" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Section: Pie & Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h4 className="font-semibold text-gray-800 mb-4">Distribución de Horas</h4>
                    <ResponsiveContainer width="100%" height="90%">
                        <PieChart>
                            <Pie
                                data={dashboardData.employeeStats}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="totalHours"
                            >
                                {dashboardData.employeeStats.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            Mapa de Calor (Actividad)
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Menos</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                                <div className="w-3 h-3 bg-green-200 rounded"></div>
                                <div className="w-3 h-3 bg-green-400 rounded"></div>
                                <div className="w-3 h-3 bg-green-600 rounded"></div>
                                <div className="w-3 h-3 bg-green-800 rounded"></div>
                            </div>
                            <span>Más</span>
                        </div>
                    </div>

                    <div className="h-[80%] overflow-auto">
                        {/* Simple Heatmap Grid Visualization */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Weekday Headers */}
                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                            ))}

                            {/* Days */}
                            {dashboardData.heatmapData.map((day) => {
                                const intensityClass = {
                                    0: 'bg-gray-100',
                                    1: 'bg-green-200',
                                    2: 'bg-green-300',
                                    3: 'bg-green-500',
                                    4: 'bg-green-700 text-white'
                                }[day.intensity as 0 | 1 | 2 | 3 | 4] || 'bg-gray-100';

                                return (
                                    <div
                                        key={day.date}
                                        className={`rounded-lg p-2 h-16 flex flex-col items-center justify-center transition-all hover:scale-105 ${intensityClass}`}
                                        title={`${day.date}: ${day.count} horas`}
                                    >
                                        <span className="text-xs font-semibold">{new Date(day.date).getDate()}</span>
                                        {day.count > 0 && <span className="text-[10px] opacity-80">{day.count}h</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

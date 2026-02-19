import React, { useMemo } from 'react';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { AnalyticsUtils } from '../../utils/analytics';
import type { AttendanceRecord } from '../../types';
import { Clock, Calendar, BarChart2, TrendingUp } from 'lucide-react';

interface EmployeeStatsViewProps {
    records: AttendanceRecord[];
    userId: string;
}

const COLORS = ['#3b82f6', '#ef4444'];

export const EmployeeStatsView: React.FC<EmployeeStatsViewProps> = ({ records, userId }) => {
    const data = useMemo(() => AnalyticsUtils.getDashboardData(records, userId), [records, userId]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* 1. Resumen de hoy */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-bold">Resumen de hoy</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="grid grid-cols-3 gap-8 w-full">
                        <div className="text-center md:text-left">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Entrada</p>
                            <p className="text-xl font-bold text-gray-800">{data.today.entry || '--:--'}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Salida</p>
                            <p className="text-xl font-bold text-gray-800">{data.today.exit || '--:--'}</p>
                        </div>
                        <div className="text-center md:text-left">
                            <p className="text-xs text-gray-500 uppercase font-semibold">Horas Hoy</p>
                            <p className="text-xl font-bold text-blue-600">{data.today.hours}h</p>
                        </div>
                    </div>
                    <div className="shrink-0 w-full md:w-auto">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1 text-center md:text-left">Estado actual</p>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm flex items-center justify-center gap-2 ${data.today.status === 'En curso' ? 'bg-amber-100 text-amber-700' :
                            data.today.status === 'Finalizada' ? 'bg-green-100 text-green-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            {data.today.status === 'En curso' ? '🟡 ' : data.today.status === 'Finalizada' ? '✅ ' : '🔴 '}
                            {data.today.status}
                        </div>
                    </div>
                </div>
            </section>

            {/* Calendario de Asistencia */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold">Calendario de Asistencia</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 font-sans">
                    <div className="mb-4 text-center">
                        <h4 className="text-sm font-bold text-gray-700 capitalize">
                            {new Date().toLocaleString('es-CO', { month: 'long', year: 'numeric' })}
                        </h4>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                            <div key={idx} className="text-center text-[10px] font-bold text-gray-400 uppercase mb-2">
                                {day}
                            </div>
                        ))}
                        {/* Adjust for start day of the month */}
                        {(() => {
                            const firstDayStr = data.calendarDays[0].date;
                            const firstDay = new Date(firstDayStr + 'T00:00:00');
                            const padding = firstDay.getDay();
                            return Array(padding).fill(null).map((_, i) => (
                                <div key={`pad-${i}`} className="aspect-square" />
                            ));
                        })()}
                        {data.calendarDays.map((day) => (
                            <div
                                key={day.date}
                                className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all shadow-sm ${day.isWorked
                                    ? 'bg-indigo-600 border-indigo-700 text-white'
                                    : !day.isBusinessDay
                                        ? 'bg-gray-200 border-gray-300 text-gray-600' // Weekend/Holiday - darker
                                        : 'bg-gray-50 border-gray-100 text-gray-500' // Normal business day
                                    } ${day.isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
                            >
                                <span className="text-xs font-bold">{day.dayNum}</span>
                                {day.isWorked && (
                                    <span className="text-[10px] font-black">{day.hours}h</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase text-gray-500">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-indigo-600 border border-indigo-700" />
                            <span>Laborado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                            <span>Día Hábil</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
                            <span>Fín de semana / Festivo</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Esta semana */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-bold">Esta semana</h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-4 py-3">Día</th>
                                <th className="px-4 py-3">Entrada</th>
                                <th className="px-4 py-3">Salida</th>
                                <th className="px-4 py-3">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.weekTable.map((day) => (
                                <tr key={day.day}>
                                    <td className="px-4 py-3 font-medium text-gray-700">{day.day}</td>
                                    <td className="px-4 py-3 text-gray-500">{day.entry}</td>
                                    <td className="px-4 py-3 text-gray-500">{day.exit}</td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        {day.total}h {!day.attended && <span className="text-red-500 ml-1">❌</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* 3. Horas acumuladas */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <BarChart2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-bold">Horas acumuladas</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Esta Semana</p>
                        <p className="text-2xl font-black text-emerald-600">{data.accumulated.weekHours}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Este Mes</p>
                        <p className="text-2xl font-black text-blue-600">{data.accumulated.monthHours}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Promedio Diario</p>
                        <p className="text-2xl font-black text-purple-600">{data.accumulated.dailyAverage}h</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Días Asistidos</p>
                        <p className="text-2xl font-black text-green-600">{data.accumulated.attendedDays}/{data.accumulated.totalDaysSoFar}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Inasistencias</p>
                        <p className="text-2xl font-black text-red-600">{data.accumulated.absentDays}/{data.accumulated.totalDaysSoFar}</p>
                    </div>
                </div>
            </section>

            {/* 4. Gráficos */}
            <section>
                <div className="flex items-center gap-2 mb-4 text-gray-800">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-bold">Gráficos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Barras: Horas por día */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Horas Trabajadas por Día
                        </h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.charts.dailyBars}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Línea: Progreso Mensual */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500" />
                            Progreso de Horas (Mes)
                        </h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.charts.monthlyLine}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dona: Asistencias vs Inasistencias */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Asistencias vs Inasistencias
                        </h4>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.charts.attendanceDonut}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.charts.attendanceDonut.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

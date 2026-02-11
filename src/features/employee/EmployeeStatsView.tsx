import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AnalyticsUtils } from '../../utils/analytics';
import type { AttendanceRecord } from '../../types';

interface EmployeeStatsViewProps {
    records: AttendanceRecord[];
    userId: string;
}

export const EmployeeStatsView: React.FC<EmployeeStatsViewProps> = ({ records, userId }) => {
    const stats = useMemo(() => AnalyticsUtils.calculateHours(records, userId), [records, userId]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Resumen de Horas</h3>
                <div className="text-4xl font-extrabold text-blue-600">
                    {stats.totalHours} <span className="text-sm font-medium text-gray-500">horas totales</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4">Horas Diarias</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h4 className="font-semibold text-gray-700 mb-4">Horas Semanales</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.weeklyStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="hours" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                    <h4 className="font-semibold text-gray-700 mb-4">Horas Mensuales</h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.monthlyStats} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="month" type="category" width={80} tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

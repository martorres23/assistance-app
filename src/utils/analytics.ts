import type { AttendanceRecord } from '../types';
import { HolidayUtils } from './holidays';

export interface DailyStats {
    date: string; // YYYY-MM-DD
    hours: number;
}

export interface EmployeeStats {
    totalHours: number;
    dailyStats: DailyStats[];
    weeklyStats: { week: string; hours: number }[];
    monthlyStats: { month: string; hours: number }[];
}

export interface DashboardData {
    today: {
        entry: string | null;
        exit: string | null;
        hours: number;
        status: 'En curso' | 'Finalizada' | 'No registrada';
    };
    weekTable: {
        day: string;
        entry: string;
        exit: string;
        total: number;
        attended: boolean;
    }[];
    accumulated: {
        weekHours: number;
        monthHours: number;
        dailyAverage: number;
        attendedDays: number;
        absentDays: number;
        totalDaysSoFar: number;
    };
    charts: {
        dailyBars: { day: string; hours: number }[];
        monthlyLine: { date: string; hours: number }[];
        attendanceDonut: { name: string; value: number }[];
    };
    calendarDays: {
        date: string;
        dayNum: number;
        hours: number;
        isWorked: boolean;
        isToday: boolean;
        isBusinessDay: boolean;
    }[];
}

export const AnalyticsUtils = {
    getDashboardData: (records: AttendanceRecord[], userId: string): DashboardData => {
        const now = new Date();
        const colombiaDate = now.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        const [yearStr, monthStr, dayStr] = colombiaDate.split('-');
        const currentYearInBogota = parseInt(yearStr);
        const currentMonthInBogota = parseInt(monthStr) - 1; // 0-indexed
        const currentDayInBogota = parseInt(dayStr);

        // 1. Basic Filtering
        const userRecords = records
            .filter(r => r.userId === userId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // 2. Today's Summary
        const todayRecords = userRecords.filter(r =>
            new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) === colombiaDate
        );
        const todayIn = todayRecords.find(r => r.type === 'in');
        const todayOut = todayRecords.find(r => r.type === 'out');

        let todayHours = 0;
        if (todayIn && todayOut) {
            todayHours = (new Date(todayOut.timestamp).getTime() - new Date(todayIn.timestamp).getTime()) / (1000 * 60 * 60);
        } else if (todayIn) {
            todayHours = (now.getTime() - new Date(todayIn.timestamp).getTime()) / (1000 * 60 * 60);
        }

        const todayStatus = !todayIn ? 'No registrada' : (!todayOut ? 'En curso' : 'Finalizada');

        // 3. Weekly Stats (Monday to Sunday)
        const currentDayOfWeek = now.getDay(); // 0 is Sunday
        const diff = now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1); // Adjust for Monday start
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);

        const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const weekTable = weekDays.map((dayName, index) => {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + index);
            const dateStr = dayDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

            const dayRecords = userRecords.filter(r =>
                new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) === dateStr
            );

            const dIn = dayRecords.find(r => r.type === 'in');
            const dOut = dayRecords.find(r => r.type === 'out');

            let total = 0;
            if (dIn && dOut) {
                total = (new Date(dOut.timestamp).getTime() - new Date(dIn.timestamp).getTime()) / (1000 * 60 * 60);
            }

            return {
                day: dayName,
                entry: dIn ? new Date(dIn.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }) : '—',
                exit: dOut ? new Date(dOut.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }) : '—',
                total: Number(total.toFixed(1)),
                attended: !!dIn
            };
        });

        // 4. Monthly Stats
        const firstDayOfMonth = new Date(currentYearInBogota, currentMonthInBogota, 1);
        const lastDayOfMonth = new Date(currentYearInBogota, currentMonthInBogota + 1, 0);

        const monthRecords = userRecords.filter(r => {
            const dStr = new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
            const d = new Date(dStr + 'T00:00:00');
            return d >= firstDayOfMonth && d <= lastDayOfMonth;
        });

        const calculatePeriodHours = (recs: AttendanceRecord[]) => {
            let totalMs = 0;
            const sortedByDay: Record<string, AttendanceRecord[]> = {};

            recs.forEach(r => {
                const d = new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
                if (!sortedByDay[d]) sortedByDay[d] = [];
                sortedByDay[d].push(r);
            });

            Object.values(sortedByDay).forEach(dayRecs => {
                const dIn = dayRecs.find(r => r.type === 'in');
                const dOut = dayRecs.find(r => r.type === 'out');
                if (dIn && dOut) {
                    totalMs += (new Date(dOut.timestamp).getTime() - new Date(dIn.timestamp).getTime());
                }
            });
            return totalMs / (1000 * 60 * 60);
        };

        const weekHours = weekTable.reduce((acc, curr) => acc + curr.total, 0);
        const monthHours = calculatePeriodHours(monthRecords);

        const attendedDaysList = Object.keys(monthRecords.reduce((acc, r) => {
            const d = new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
            acc[d] = true;
            return acc;
        }, {} as Record<string, boolean>));

        const attendedDays = attendedDaysList.length;

        let businessDaysSoFar = 0;
        for (let i = 1; i <= currentDayInBogota; i++) {
            const d = new Date(currentYearInBogota, currentMonthInBogota, i);
            if (HolidayUtils.isBusinessDay(d)) {
                businessDaysSoFar++;
            }
        }

        // Absent days are business days where the user didn't show up
        let businessDaysWorked = 0;
        attendedDaysList.forEach(dStr => {
            const d = new Date(dStr + 'T00:00:00');
            if (HolidayUtils.isBusinessDay(d)) {
                businessDaysWorked++;
            }
        });

        const absentDays = Math.max(0, businessDaysSoFar - businessDaysWorked);

        // 5. Charts Data
        const dailyBars = weekTable.map(d => ({ day: d.day.substring(0, 3), hours: d.total }));

        // Progress of hours during the month
        const monthlyLine: { date: string, hours: number }[] = [];
        let runningTotal = 0;
        for (let i = 1; i <= currentDayInBogota; i++) {
            const dDate = new Date(currentYearInBogota, currentMonthInBogota, i);
            const dStr = dDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
            const dayRecs = monthRecords.filter(r => new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) === dStr);
            const dIn = dayRecs.find(r => r.type === 'in');
            const dOut = dayRecs.find(r => r.type === 'out');
            if (dIn && dOut) {
                runningTotal += (new Date(dOut.timestamp).getTime() - new Date(dIn.timestamp).getTime()) / (1000 * 60 * 60);
            }
            monthlyLine.push({ date: i.toString(), hours: Number(runningTotal.toFixed(1)) });
        }

        return {
            today: {
                entry: todayIn ? new Date(todayIn.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }) : null,
                exit: todayOut ? new Date(todayOut.timestamp).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit' }) : null,
                hours: Number(todayHours.toFixed(1)),
                status: todayStatus
            },
            weekTable,
            accumulated: {
                weekHours: Number(weekHours.toFixed(1)),
                monthHours: Number(monthHours.toFixed(1)),
                dailyAverage: attendedDays > 0 ? Number((monthHours / attendedDays).toFixed(1)) : 0,
                attendedDays,
                absentDays,
                totalDaysSoFar: businessDaysSoFar
            },
            charts: {
                dailyBars,
                monthlyLine,
                attendanceDonut: [
                    { name: 'Asistidos', value: attendedDays },
                    { name: 'Inasistencias', value: absentDays }
                ]
            },
            calendarDays: (() => {
                const daysInMonth = new Date(currentYearInBogota, currentMonthInBogota + 1, 0).getDate();
                const calendar = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    const date = new Date(currentYearInBogota, currentMonthInBogota, i);
                    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

                    const dayRecs = userRecords.filter(r =>
                        new Date(r.timestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }) === dateStr
                    );

                    const dIn = dayRecs.find(r => r.type === 'in');
                    const dOut = dayRecs.find(r => r.type === 'out');

                    let hours = 0;
                    if (dIn && dOut) {
                        hours = (new Date(dOut.timestamp).getTime() - new Date(dIn.timestamp).getTime()) / (1000 * 60 * 60);
                    }

                    calendar.push({
                        date: dateStr,
                        dayNum: i,
                        hours: Number(hours.toFixed(1)),
                        isWorked: !!dIn,
                        isToday: dateStr === colombiaDate,
                        isBusinessDay: HolidayUtils.isBusinessDay(date)
                    });
                }
                return calendar;
            })()
        };
    },

    calculateHours: (records: AttendanceRecord[], userId: string, dateRange?: { start: Date; end: Date }): EmployeeStats => {
        // 1. Filter records: by user, and optionally by date range
        const userRecords = records
            .filter(r => {
                const isUser = r.userId === userId;
                if (!dateRange) return isUser;
                const recordDate = new Date(r.timestamp);
                return isUser && recordDate >= dateRange.start && recordDate <= dateRange.end;
            })
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        let totalMilliseconds = 0;
        const dailyMap = new Map<string, number>();

        // 2. Iterate to find pairs of IN -> OUT
        for (let i = 0; i < userRecords.length - 1; i++) {
            const current = userRecords[i];
            const next = userRecords[i + 1];

            if (current.type === 'in' && next.type === 'out') {
                const start = new Date(current.timestamp);
                const end = new Date(next.timestamp);

                // Duration in milliseconds
                const duration = end.getTime() - start.getTime();
                totalMilliseconds += duration;

                // Daily Aggregation (Assign to the day of 'in')
                const dateKey = start.toISOString().split('T')[0];
                dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + duration);

                // Skip the 'out' record for the next iteration start
                i++;
            }
        }

        // 3. Format Stats
        const hoursFromMs = (ms: number) => Number((ms / (1000 * 60 * 60)).toFixed(2));

        const dailyStats: DailyStats[] = Array.from(dailyMap.entries()).map(([date, ms]) => ({
            date,
            hours: hoursFromMs(ms)
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Weekly Aggregation (Simple ISO week)
        const weeklyMap = new Map<string, number>();
        dailyStats.forEach(stat => {
            const date = new Date(stat.date);
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
            const weekKey = `W${weekNum}-${date.getFullYear()}`;
            weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + stat.hours);
        });

        const weeklyStats = Array.from(weeklyMap.entries()).map(([week, hours]) => ({
            week,
            hours: Number(hours.toFixed(2))
        }));

        // Monthly Aggregation
        const monthlyMap = new Map<string, number>();
        dailyStats.forEach(stat => {
            const monthKey = stat.date.substring(0, 7); // YYYY-MM
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + stat.hours);
        });

        const monthlyStats = Array.from(monthlyMap.entries()).map(([month, hours]) => ({
            month,
            hours: Number(hours.toFixed(2))
        }));

        return {
            totalHours: hoursFromMs(totalMilliseconds),
            dailyStats,
            weeklyStats,
            monthlyStats
        };
    },

    calculateDailyTotal: (_records: AttendanceRecord[]): { date: string; hours: number }[] => {
        // Placeholder for now, returning empty array to pass type check
        return [];
    },

    // Helper to aggregate multiple EmployeeStats
    aggregateStats: (employeeStats: EmployeeStats[]) => {
        let totalHours = 0;
        const dailyMap = new Map<string, number>();

        employeeStats.forEach(stat => {
            totalHours += stat.totalHours;
            stat.dailyStats.forEach(day => {
                dailyMap.set(day.date, (dailyMap.get(day.date) || 0) + day.hours);
            });
        });

        const dailyTrend = Array.from(dailyMap.entries())
            .map(([date, hours]) => ({ date, hours: Number(hours.toFixed(2)) }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalHours: Number(totalHours.toFixed(2)),
            dailyTrend
        };
    },

    calculateCost: (totalHours: number, hourlyRate: number = 10000) => {
        return totalHours * hourlyRate;
    },

    getMostActiveEmployee: (employeeStats: { name: string; totalHours: number }[]) => {
        if (employeeStats.length === 0) return null;
        return employeeStats.reduce((prev, current) =>
            (prev.totalHours > current.totalHours) ? prev : current
        );
    },

    getHeatmapData: (dailyTrend: { date: string; hours: number }[]) => {
        // Find max hours to normalize intensity
        const maxHours = Math.max(...dailyTrend.map(d => d.hours), 1);

        return dailyTrend.map(day => ({
            date: day.date,
            count: day.hours,
            intensity: Math.min(4, Math.ceil((day.hours / maxHours) * 4)) // 0-4 scale
        }));
    }
};

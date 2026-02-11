import type { AttendanceRecord } from '../types';

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

export const AnalyticsUtils = {
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

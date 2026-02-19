export const HolidayUtils = {
    // Hardcoded Colombian holidays for 2026
    getHolidays2026: (): string[] => [
        '2026-01-01', // Año Nuevo
        '2026-01-12', // Reyes Magos
        '2026-03-23', // San José
        '2026-04-02', // Jueves Santo
        '2026-04-03', // Viernes Santo
        '2026-05-01', // Día del Trabajo
        '2026-05-18', // Ascensión del Señor
        '2026-06-08', // Corpus Christi
        '2026-06-15', // Sagrado Corazón
        '2026-06-29', // San Pedro y San Pablo
        '2026-07-20', // Independencia
        '2026-08-07', // Batalla de Boyacá
        '2026-08-17', // Asunción de la Virgen
        '2026-10-12', // Día de la Raza
        '2026-11-02', // Todos los Santos
        '2026-11-16', // Independencia de Cartagena
        '2026-12-08', // Inmaculada Concepción
        '2026-12-25', // Navidad
    ],

    isHoliday: (dateStr: string): boolean => {
        return HolidayUtils.getHolidays2026().includes(dateStr);
    },

    isBusinessDay: (date: Date): boolean => {
        // Get day of week in Bogota to avoid local timezone shifts
        const bogotaDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Bogota' }).format(date);
        const isWeekend = bogotaDay === 'Sat' || bogotaDay === 'Sun';
        if (isWeekend) return false;

        const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        return !HolidayUtils.isHoliday(dateStr);
    }
};

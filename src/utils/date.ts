export const DateUtils = {
    // Get current date in Colombia timezone as YYYY-MM-DD
    getColombiaDate: (): string => {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    },

    // Get current time in Colombia
    getColombiaTime: (): string => {
        return new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota' });
    },

    // Check if a UTC ISO timestamp belongs to 'today' in Colombia
    isTodayInColombia: (isoTimestamp: string): boolean => {
        const recordDate = new Date(isoTimestamp).toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
        const today = DateUtils.getColombiaDate();
        return recordDate === today;
    },

    // Format ISO string to readable Colombia date/time
    formatDisplay: (isoTimestamp: string): string => {
        return new Date(isoTimestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    }
};

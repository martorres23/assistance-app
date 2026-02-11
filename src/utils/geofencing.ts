export const GeofencingUtils = {
    // Haversine formula to calculate distance in meters
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3; // Earth radius in meters
        const phi1 = lat1 * Math.PI / 180;
        const phi2 = lat2 * Math.PI / 180;
        const deltaPhi = (lat2 - lat1) * Math.PI / 180;
        const deltaLambda = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    },

    isWithinRange: (userLat: number, userLng: number, targetLat: number, targetLng: number, rangeMeters: number = 100): boolean => {
        const distance = GeofencingUtils.calculateDistance(userLat, userLng, targetLat, targetLng);
        return distance <= rangeMeters;
    }
};

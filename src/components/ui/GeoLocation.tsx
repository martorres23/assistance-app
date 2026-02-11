import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface GeoLocationProps {
    onLocationFound: (location: { lat: number; lng: number, accuracy: number }) => void;
}

export const GeoLocation: React.FC<GeoLocationProps> = ({ onLocationFound }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const startWatching = () => {
        setStatus('loading');
        setErrorMsg('');

        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Geolocalización no soportada');
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            const { latitude, longitude, accuracy } = position.coords;
            setCoords({ lat: latitude, lng: longitude });
            setStatus('success');
            setLastUpdated(new Date());
            onLocationFound({ lat: latitude, lng: longitude, accuracy });
        };

        const handleError = (error: GeolocationPositionError) => {
            setStatus('error');
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    setErrorMsg('Usuario denegó la solicitud.');
                    break;
                case error.POSITION_UNAVAILABLE:
                    setErrorMsg('Ubicación no disponible.');
                    break;
                case error.TIMEOUT:
                    setErrorMsg('Tiempo de espera agotado.');
                    break;
                default:
                    setErrorMsg('Error desconocido.');
                    break;
            }
        };

        const watcherId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0
        });

        return () => navigator.geolocation.clearWatch(watcherId);
    };

    useEffect(() => {
        const cleanup = startWatching();
        return () => {
            if (cleanup) cleanup();
        };
    }, [onLocationFound]);

    const handleRefresh = () => {
        setCoords(null);
        startWatching();
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center justify-between gap-2 text-sm p-3 bg-white/50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            <span className="text-gray-600">Buscando GPS...</span>
                        </>
                    )}
                    {status === 'error' && (
                        <>
                            <MapPin className="w-4 h-4 text-red-500" />
                            <span className="text-red-500 font-medium">{errorMsg}</span>
                        </>
                    )}
                    {status === 'success' && coords && (
                        <>
                            <MapPin className="w-4 h-4 text-green-600" />
                            <div className="flex flex-col">
                                <span className="text-green-700 font-medium">
                                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                                </span>
                                {lastUpdated && (
                                    <span className="text-[10px] text-gray-400">
                                        Actualizado: {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={handleRefresh}
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 active:scale-95 transition-all"
                    title="Actualizar Ubicación"
                >
                    <Loader2 className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center">
                * Asegúrate de tener el GPS activado y dar permisos al navegador.
            </p>
        </div>
    );
};

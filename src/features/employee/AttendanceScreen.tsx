import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '../../components/ui/CameraCapture';
import { GeoLocation } from '../../components/ui/GeoLocation';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import type { AttendanceRecord } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, CheckCircle, MapPin } from 'lucide-react';
import { EmployeeProfile } from './EmployeeProfile';
import { EmployeeStatsView } from './EmployeeStatsView';
import { GeofencingUtils } from '../../utils/geofencing';
import { DateUtils } from '../../utils/date';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export const AttendanceScreen: React.FC = () => {
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser();
    const [step, setStep] = useState<'type-select' | 'evidence'>('type-select');
    const [viewMode, setViewMode] = useState<'action' | 'stats' | 'profile'>('action');
    const [recordType, setRecordType] = useState<'in' | 'out'>('in');
    const [location, setLocation] = useState<{ lat: number; lng: number, accuracy: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get assigned Sede
    const assignedSede = user ? AuthService.getSede(user.sedeId) : undefined;

    // Calculate distance and check range
    const distanceToSede = (location && assignedSede)
        ? GeofencingUtils.calculateDistance(location.lat, location.lng, assignedSede.location.lat, assignedSede.location.lng)
        : null;

    // TEMPORAL: Rango aumentado a 50km para pruebas en computadora sin GPS
    // TODO: Reducir a 100m cuando se use en celular con GPS real
    const isWithinRange = (location && assignedSede)
        ? GeofencingUtils.isWithinRange(location.lat, location.lng, assignedSede.location.lat, assignedSede.location.lng, assignedSede.radiusMeters || 100)
        : false;

    // Fetch records for stats
    const records = StorageService.getRecords();

    const handleLogout = () => {
        AuthService.logout();
        navigate('/');
    };

    // Check for today's records (Colombia Time)
    const todayRecords = records.filter(r =>
        r.userId === user?.id && DateUtils.isTodayInColombia(r.timestamp)
    );

    const hasClockedIn = todayRecords.some(r => r.type === 'in');
    const hasClockedOut = todayRecords.some(r => r.type === 'out');

    const handleTypeSelect = (type: 'in' | 'out') => {
        setRecordType(type);
        setStep('evidence');
    };

    const handleCapture = (photoUrl: string) => {
        if (!user || !location) return;

        setIsSubmitting(true);
        const newRecord: AttendanceRecord = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            type: recordType,
            timestamp: new Date().toISOString(),
            location: location,
            photoUrl: photoUrl,
        };

        StorageService.saveRecord(newRecord);

        // Show success feedback briefly then reset/logout or go to history
        setTimeout(() => {
            setIsSubmitting(false);
            alert('Registro guardado exitosamente');
            handleLogout();
        }, 1000);
    };

    if (!user) {
        navigate('/');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10">
                <div>
                    <h1 className="font-bold text-lg text-gray-800">Hola, {user.name}</h1>
                    <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <main className="flex-1 p-4 flex flex-col items-center max-w-md mx-auto w-full">
                <div className="flex w-full mb-6 bg-gray-200 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode('action')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'action' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Marcar Asistencia
                    </button>
                    <button
                        onClick={() => setViewMode('stats')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'stats' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Mis Estadísticas
                    </button>
                    <button
                        onClick={() => setViewMode('profile')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'profile' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                    >
                        Mi Perfil
                    </button>
                </div>

                {viewMode === 'action' ? (
                    <div className="w-full">
                        <div className="mb-6 w-full flex flex-col items-center">
                            <GeoLocation onLocationFound={setLocation} />

                            {location && assignedSede && (
                                <div className={`mt-4 w-full p-3 rounded-lg border flex items-center gap-3 ${isWithinRange ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <MapPin className="w-5 h-5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">
                                            {isWithinRange ? 'Estás en la zona correcta' : 'Estás fuera de zona'}
                                        </p>
                                        <p className="text-xs opacity-90">
                                            Distancia a {assignedSede.name}: <span className="font-mono font-bold">{Math.round(distanceToSede || 0)}m</span> (Max {assignedSede.radiusMeters || 100}m)
                                        </p>
                                    </div>
                                </div>
                            )}

                            {location && !assignedSede && (
                                <div className="mt-4 w-full p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm text-center">
                                    ⚠️ No tienes sede asignada. El registro podría ser inválido.
                                </div>
                            )}

                            {/* Real-time Map */}
                            {location && (
                                <div className="mt-4 w-full h-64 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-200 z-0">
                                    <MapContainer
                                        center={[location.lat, location.lng]}
                                        zoom={16}
                                        style={{ height: "100%", width: "100%" }}
                                        dragging={true}
                                        touchZoom={true}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        />

                                        {/* User Position */}
                                        <Marker position={[location.lat, location.lng]}>
                                            <Popup>Estás aquí</Popup>
                                        </Marker>

                                        {/* Sede Position & Zone */}
                                        {assignedSede && (
                                            <>
                                                <Marker position={[assignedSede.location.lat, assignedSede.location.lng]}>
                                                    <Popup>{assignedSede.name}</Popup>
                                                </Marker>
                                                <Circle
                                                    center={[assignedSede.location.lat, assignedSede.location.lng]}
                                                    radius={100} // 100m zone
                                                    pathOptions={{ color: isWithinRange ? 'green' : 'red', fillColor: isWithinRange ? 'green' : 'red', fillOpacity: 0.2 }}
                                                />
                                            </>
                                        )}
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 'type-select' ? (
                                <motion.div
                                    key="select"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="w-full space-y-4"
                                >
                                    <button
                                        onClick={() => handleTypeSelect('in')}
                                        disabled={!location || !isWithinRange || hasClockedIn}
                                        className="w-full p-6 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                                    >
                                        <div className="text-left">
                                            <span className="block text-2xl font-bold">Marcar Entrada</span>
                                            <span className="text-green-100 text-sm">
                                                {hasClockedIn ? 'Ya registrado hoy' : 'Iniciar jornada'}
                                            </span>
                                        </div>
                                        <CheckCircle className="w-8 h-8 text-white/80" />
                                    </button>

                                    <button
                                        onClick={() => handleTypeSelect('out')}
                                        disabled={!location || !isWithinRange || hasClockedOut}
                                        className="w-full p-6 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                                    >
                                        <div className="text-left">
                                            <span className="block text-2xl font-bold">Marcar Salida</span>
                                            <span className="text-red-100 text-sm">
                                                {hasClockedOut ? 'Ya registrado hoy' : 'Finalizar jornada'}
                                            </span>
                                        </div>
                                        <LogOut className="w-8 h-8 text-white/80" />
                                    </button>
                                    {!location && <p className="text-center text-xs text-amber-600">Espere a obtener ubicación para continuar</p>}
                                    {location && !isWithinRange && <p className="text-center text-xs text-red-600 font-bold">Acércate a tu sede para marcar asistencia</p>}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="evidence"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="w-full"
                                >
                                    <div className="text-center mb-4">
                                        <h2 className="text-xl font-semibold mb-1">
                                            {recordType === 'in' ? 'Foto de Entrada' : 'Foto de Salida'}
                                        </h2>
                                        <p className="text-sm text-gray-500">Tome una selfie como evidencia</p>
                                    </div>

                                    <div className="mb-4">
                                        <CameraCapture onCapture={handleCapture} />
                                    </div>

                                    <button
                                        onClick={() => setStep('type-select')}
                                        className="w-full py-3 text-gray-500 text-sm underline"
                                    >
                                        Cancelar
                                    </button>

                                    {isSubmitting && (
                                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                            <div className="bg-white p-4 rounded-lg flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                                <span>Guardando...</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : viewMode === 'stats' ? (
                    <EmployeeStatsView records={records} userId={user.id} />
                ) : (
                    <EmployeeProfile user={user} />
                )}
            </main>
        </div>
    );
};

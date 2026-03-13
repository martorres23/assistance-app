import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraCapture } from '../../components/ui/CameraCapture';
import { GeoLocation } from '../../components/ui/GeoLocation';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import type { AttendanceRecord, Sede } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, CheckCircle, MapPin } from 'lucide-react';
import { EmployeeProfile } from './EmployeeProfile';
import { EmployeeStatsView } from './EmployeeStatsView';
import { GeofencingUtils } from '../../utils/geofencing';
import { DateUtils } from '../../utils/date';
import { HolidayUtils } from '../../utils/holidays';
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

import { ConfirmModal } from '../../components/ui/ConfirmModal';

export const AttendanceScreen: React.FC = () => {
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser();
    const [step, setStep] = useState<'type-select' | 'evidence'>('type-select');
    const [viewMode, setViewMode] = useState<'action' | 'stats' | 'profile'>('action');
    const [recordType, setRecordType] = useState<'in' | 'out'>('in');
    const [location, setLocation] = useState<{ lat: number; lng: number, accuracy: number } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [assignedSedes, setAssignedSedes] = useState<Sede[]>([]);
    const [activeSede, setActiveSede] = useState<Sede | undefined>(undefined);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Fetch dependencies
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const sedeIds = (user.sedeIds && user.sedeIds.length > 0)
                    ? user.sedeIds
                    : (user.sedeId ? [user.sedeId] : []);

                const [sedesData, allRecords] = await Promise.all([
                    Promise.all(sedeIds.map(id => AuthService.getSede(id))),
                    StorageService.getRecords()
                ]);

                setAssignedSedes(sedesData.filter((s): s is Sede => s !== undefined));
                setRecords(allRecords);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.id]);

    // Detect active sede based on location
    useEffect(() => {
        if (!location || assignedSedes.length === 0) return;

        const matchedSede = assignedSedes.find(s =>
            GeofencingUtils.isWithinRange(location.lat, location.lng, s.location.lat, s.location.lng, s.radiusMeters || 100)
        );

        if (matchedSede) {
            setActiveSede(matchedSede);
        } else {
            // If none matched, maybe just pick the closest one for UI feedback
            const closest = [...assignedSedes].sort((a, b) => {
                const distA = GeofencingUtils.calculateDistance(location.lat, location.lng, a.location.lat, a.location.lng);
                const distB = GeofencingUtils.calculateDistance(location.lat, location.lng, b.location.lat, b.location.lng);
                return distA - distB;
            })[0];
            setActiveSede(closest);
        }
    }, [location, assignedSedes]);

    const isWithinRange = (location && activeSede)
        ? GeofencingUtils.isWithinRange(location.lat, location.lng, activeSede.location.lat, activeSede.location.lng, activeSede.radiusMeters || 100)
        : false;

    const distanceToActiveSede = (location && activeSede)
        ? GeofencingUtils.calculateDistance(location.lat, location.lng, activeSede.location.lat, activeSede.location.lng)
        : null;

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

    const handleCapture = async (photoUrl: string) => {
        if (!user || !location) return;

        setIsSubmitting(true);
        const newRecord: AttendanceRecord = {
            id: crypto.randomUUID(), // Will be overwritten by DB UUID but useful for type consistency
            userId: user.id,
            userName: user.name,
            type: recordType,
            timestamp: new Date().toISOString(),
            location: location,
            photoUrl: photoUrl,
            sedeId: activeSede?.id
        };

        const { error } = await StorageService.saveRecord(newRecord);

        if (error) {
            setShowErrorModal(true);
            setIsSubmitting(false);
            return;
        }

        // Show success feedback briefly then go to history
        setTimeout(async () => {
            setIsSubmitting(false);

            // Refresh data to show newborn record
            try {
                const allRecords = await StorageService.getRecords();
                setRecords(allRecords);
            } catch (e) {
                console.error(e);
            }

            setStep('type-select');
            setViewMode('stats');
            setShowSuccessModal(true);
        }, 1000);
    };

    if (!user) {
        navigate('/');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-12 text-gray-500 gap-3 bg-gray-50">
                <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <span className="font-medium">Cargando aplicación...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 animate-in fade-in duration-500">
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
                        Mis Jornadas
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
                        {/* Recordatorios inteligentes */}
                        {HolidayUtils.isBusinessDay(new Date()) && !hasClockedIn && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 bg-white border border-amber-100 p-4 rounded-2xl flex items-center shadow-sm"
                            >
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800 flex items-center justify-center gap-2">
                                        <span className="animate-bounce">🔔</span> “No has marcado tu entrada hoy”
                                    </p>
                                </div>
                            </motion.div>
                        )}
                        <div className="mb-6 w-full flex flex-col items-center">
                            <GeoLocation onLocationFound={setLocation} />

                            {location && activeSede && (
                                <div className={`mt-4 w-full p-3 rounded-lg border flex items-center gap-3 ${isWithinRange ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    <MapPin className="w-5 h-5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">
                                            {isWithinRange ? `Estás en: ${activeSede.name}` : 'Estás fuera de zona'}
                                        </p>
                                        <p className="text-xs opacity-90">
                                            {isWithinRange
                                                ? `Ubicación validada correctamente.`
                                                : `Sede más cercana: ${activeSede.name} a ${Math.round(distanceToActiveSede || 0)}m`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {location && assignedSedes.length === 0 && (
                                <div className="mt-4 w-full p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm text-center">
                                    ⚠️ No tienes sedes asignadas. Contacta al administrador.
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

                                        {/* Sede Positions & Zones */}
                                        {assignedSedes.map(s => (
                                            <React.Fragment key={s.id}>
                                                <Marker position={[s.location.lat, s.location.lng]}>
                                                    <Popup>{s.name}</Popup>
                                                </Marker>
                                                <Circle
                                                    center={[s.location.lat, s.location.lng]}
                                                    radius={s.radiusMeters || 100}
                                                    pathOptions={{
                                                        color: activeSede?.id === s.id ? (isWithinRange ? 'green' : 'red') : 'gray',
                                                        fillColor: activeSede?.id === s.id ? (isWithinRange ? 'green' : 'red') : 'gray',
                                                        fillOpacity: 0.1
                                                    }}
                                                />
                                            </React.Fragment>
                                        ))}
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
                                        disabled={!location || !isWithinRange || hasClockedOut || !hasClockedIn}
                                        className="w-full p-6 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                                    >
                                        <div className="text-left">
                                            <span className="block text-2xl font-bold">Marcar Salida</span>
                                            <span className="text-red-100 text-sm">
                                                {!hasClockedIn ? 'Primero debes marcar entrada' : hasClockedOut ? 'Ya registrado hoy' : 'Finalizar jornada'}
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

            <ConfirmModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={() => setShowSuccessModal(false)}
                title="Registro Exitoso"
                message={`Tu asistencia de ${recordType === 'in' ? 'entrada' : 'salida'} ha sido guardada correctamente.`}
                confirmText="Entendido"
                cancelText={null}
                type="success"
            />

            <ConfirmModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                onConfirm={() => setShowErrorModal(false)}
                title="Error de Registro"
                message="Hubo un problema al guardar tu asistencia. Por favor, verifica tu conexión e intenta de nuevo."
                confirmText="Reintentar"
                cancelText={null}
                type="danger"
            />
        </div>
    );
};

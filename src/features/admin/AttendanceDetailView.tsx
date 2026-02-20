import React, { useState } from 'react';
import { Clock, LogOut, MapPin, Image, ChevronLeft, Calendar, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import type { AttendanceSession } from '../../utils/analytics';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AttendanceDetailViewProps {
    session: AttendanceSession;
    onBack: () => void;
}

export const AttendanceDetailView: React.FC<AttendanceDetailViewProps> = ({ session, onBack }) => {
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-bold transition-colors"
            >
                <ChevronLeft className="w-5 h-5" />
                Volver
            </button>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-100">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl uppercase">
                            {session.userName.substring(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800">{session.userName}</h2>
                            <div className="flex flex-wrap items-center gap-4 mt-1">
                                <span className="flex items-center gap-1.5 text-gray-500 font-bold text-sm">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase ${session.status === 'En curso' ? 'bg-amber-100 text-amber-700' :
                                    session.status === 'Finalizada' ? 'bg-green-100 text-green-700' :
                                        'bg-red-50 text-red-500'
                                    }`}>
                                    {session.status === 'En curso' ? '🟢 En curso' :
                                        session.status === 'Finalizada' ? '✅ Finalizada' :
                                            '🔴 No ha iniciado'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-8 py-5 rounded-3xl border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tiempo Laborado</p>
                        <p className="text-4xl font-black text-gray-900 font-mono tracking-tight">{session.hours}h</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
                    {/* Entrada */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Entrada</h3>
                                <p className="text-xl font-black text-gray-800">{session.entry || '--:--'}</p>
                            </div>
                        </div>

                        {session.entryRecord ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Foto de Evidencia</p>
                                    {session.entryRecord.photoUrl ? (
                                        <div
                                            className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-white cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all group/photo relative"
                                            onClick={() => setPreviewPhoto(session.entryRecord?.photoUrl || null)}
                                        >
                                            <img
                                                src={session.entryRecord.photoUrl}
                                                alt="Foto Entrada"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-800">Ampliar</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300 gap-2 border-2 border-dashed border-gray-200">
                                            <Image className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px] font-bold">Sin registro visual</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <p className="text-[10px] text-green-600 font-black uppercase mb-2">Ubicación</p>
                                        <div className="flex items-start gap-2 text-sm text-gray-700 font-bold leading-tight">
                                            <MapPin className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Registrado dentro del perímetro</span>
                                        </div>
                                    </div>
                                    <div className="h-[calc(100%-80px)] min-h-[160px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100 relative group/map">
                                        <MapContainer
                                            center={[session.entryRecord.location.lat, session.entryRecord.location.lng]}
                                            zoom={16}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[session.entryRecord.location.lat, session.entryRecord.location.lng]} />
                                        </MapContainer>
                                        <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-bold uppercase text-gray-500 shadow-sm pointer-events-none opacity-0 group-hover/map:opacity-100 transition-opacity">
                                            Mapa Interactivo
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100 text-gray-400 italic text-sm">
                                No se encontró registro de entrada para esta fecha.
                            </div>
                        )}
                    </div>

                    {/* Salida */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                                <LogOut className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-wider">Salida</h3>
                                <p className="text-xl font-black text-gray-800">{session.exit || '--:--'}</p>
                            </div>
                        </div>

                        {session.exitRecord ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Foto de Evidencia</p>
                                    {session.exitRecord.photoUrl ? (
                                        <div
                                            className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md border border-white cursor-pointer hover:ring-4 hover:ring-blue-100 transition-all group/photo relative"
                                            onClick={() => setPreviewPhoto(session.exitRecord?.photoUrl || null)}
                                        >
                                            <img
                                                src={session.exitRecord.photoUrl}
                                                alt="Foto Salida"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                                <span className="bg-white/90 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-800">Ampliar</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300 gap-2 border-2 border-dashed border-gray-200">
                                            <Image className="w-8 h-8 opacity-20" />
                                            <span className="text-[10px] font-bold">Sin registro visual</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <p className="text-[10px] text-red-600 font-black uppercase mb-2">Ubicación</p>
                                        <div className="flex items-start gap-2 text-sm text-gray-700 font-bold leading-tight">
                                            <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <span>Registrado dentro del perímetro</span>
                                        </div>
                                    </div>
                                    <div className="h-[calc(100%-80px)] min-h-[160px] rounded-2xl overflow-hidden border border-gray-100 shadow-inner bg-gray-100 relative group/map">
                                        <MapContainer
                                            center={[session.exitRecord.location.lat, session.exitRecord.location.lng]}
                                            zoom={16}
                                            style={{ height: '100%', width: '100%' }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <Marker position={[session.exitRecord.location.lat, session.exitRecord.location.lng]} />
                                        </MapContainer>
                                        <div className="absolute top-2 right-2 z-[400] bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-bold uppercase text-gray-500 shadow-sm pointer-events-none opacity-0 group-hover/map:opacity-100 transition-opacity">
                                            Mapa Interactivo
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-gray-100">
                                {session.status === 'En curso' ? (
                                    <div className="space-y-2">
                                        <p className="text-amber-600 font-black text-sm uppercase">Jornada Activa</p>
                                        <p className="text-gray-500 text-sm">El empleado aún no ha registrado su salida.</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-400 italic text-sm">No se registró salida.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Minimal Photo Preview Overlay */}
            {previewPhoto && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewPhoto(null)}
                >
                    <div className="relative max-w-sm w-full animate-in zoom-in-95 duration-300">
                        <button
                            className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
                            onClick={() => setPreviewPhoto(null)}
                        >
                            <X className="w-5 h-5" />
                            Cerrar
                        </button>
                        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <img
                                src={previewPhoto}
                                alt="Preview"
                                className="w-full h-auto rounded-[2.1rem]"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

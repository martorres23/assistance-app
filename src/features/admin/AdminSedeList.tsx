import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import type { Sede } from '../../types';
import { MapPin, Plus, Trash2, Building, Navigation, Edit2, Map as MapIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

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

// Internal component to handle map clicks and update marker
const MapClickHandler = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

export const AdminSedeList: React.FC = () => {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingSede, setEditingSede] = useState<Sede | 'new' | null>(null);
    const [formData, setFormData] = useState<Partial<Sede>>({
        name: '',
        address: '',
        location: { lat: 0, lng: 0 },
        radiusMeters: 100
    });
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'info' | 'warning' | 'success';
        cancelText?: string | null;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'info',
        cancelText: 'Cancelar'
    });

    const fetchSedes = async () => {
        setIsLoading(true);
        try {
            const allSedes = await AuthService.getAllSedes();
            setSedes(allSedes);
        } catch (error) {
            console.error('Error fetching sedes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSedes();
    }, []);

    const handleOpenForm = (sede: Sede | 'new') => {
        if (sede === 'new') {
            setFormData({ name: '', address: '', location: { lat: 0, lng: 0 }, radiusMeters: 100 });
        } else {
            setFormData(sede);
        }
        setEditingSede(sede);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address) return;

        // Add confirmation for updates
        if (editingSede !== 'new' && editingSede !== null) {
            setConfirmModal({
                isOpen: true,
                title: 'Actualizar Sede',
                message: '¿Confirma que desea actualizar los datos de esta sede?',
                type: 'info',
                onConfirm: async () => {
                    setIsLoading(true);
                    try {
                        await AuthService.updateSede({
                            ...editingSede,
                            ...formData
                        } as Sede);
                        await fetchSedes();
                        setEditingSede(null);
                    } catch (error) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'Error',
                            message: 'No se pudo guardar la sede. Intente de nuevo.',
                            type: 'danger',
                            onConfirm: () => { },
                            cancelText: null
                        });
                    } finally {
                        setIsLoading(false);
                    }
                }
            });
            return;
        }

        setIsLoading(true);
        try {
            if (editingSede === 'new') {
                const sedeToAdd: Sede = {
                    id: crypto.randomUUID(),
                    name: formData.name!,
                    address: formData.address!,
                    location: formData.location as { lat: number; lng: number },
                    radiusMeters: formData.radiusMeters || 100
                };
                await AuthService.addSede(sedeToAdd);
            }

            await fetchSedes();
            setEditingSede(null);
        } catch (error) {
            setConfirmModal({
                isOpen: true,
                title: 'Error',
                message: 'No se pudo guardar la sede. Intente de nuevo.',
                type: 'danger',
                onConfirm: () => { },
                cancelText: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Sede',
            message: '¿Confirma que desea eliminar esta sede? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await AuthService.deleteSede(id);
                    await fetchSedes();
                } catch (error) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'No se pudo eliminar la sede.',
                        type: 'danger',
                        onConfirm: () => { },
                        cancelText: null
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    if (isLoading && sedes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3 bg-white rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <span>Cargando sedes...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Building className="w-6 h-6 text-blue-600" />
                        Gestión de Sedes
                    </h2>
                    <button
                        onClick={() => handleOpenForm('new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Sede
                    </button>
                </div>

                {editingSede && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4">
                            {editingSede === 'new' ? 'Agregar Nueva Sede' : 'Editar Sede'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div className="md:col-span-3 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Nombre de la Sede</label>
                                <input
                                    placeholder="Ej: Sede Norte"
                                    className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-medium"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-3 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Dirección Completa</label>
                                <input
                                    placeholder="Calle 123 #45-67"
                                    className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-medium"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Latitud Gps</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.000000"
                                    className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-mono"
                                    value={formData.location?.lat || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        location: { ...formData.location!, lat: parseFloat(e.target.value) }
                                    })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Longitud Gps</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.000000"
                                    className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-mono"
                                    value={formData.location?.lng || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        location: { ...formData.location!, lng: parseFloat(e.target.value) }
                                    })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Perímetro (Metros)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 50"
                                    className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-medium"
                                    value={formData.radiusMeters || ''}
                                    onChange={e => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-6 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                    <MapIcon className="w-3.5 h-3.5" />
                                    Ubicación Geográfica (Clic para ajustar pin)
                                </label>
                                <div className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100 relative group/map">
                                    <MapContainer
                                        center={[formData.location?.lat || 0, formData.location?.lng || 0]}
                                        zoom={15}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[formData.location?.lat || 0, formData.location?.lng || 0]} />
                                        <MapClickHandler onLocationSelect={(lat, lng) => setFormData({ ...formData, location: { lat, lng } })} />
                                    </MapContainer>
                                    <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-blue-600 shadow-sm border border-blue-100 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                                        Pin Interactivo
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-6 flex justify-end gap-2 border-t pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingSede(null)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm"
                                >
                                    {editingSede === 'new' ? 'Guardar Sede' : 'Actualizar Sede'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sedes.map(sede => (
                        <div
                            key={sede.id}
                            onClick={() => handleOpenForm(sede)}
                            className="p-5 border border-gray-100 rounded-xl relative group hover:shadow-md transition-all cursor-pointer bg-white overflow-hidden"
                        >
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenForm(sede); }}
                                    className="text-gray-400 hover:text-blue-500 p-2"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(sede.id); }}
                                    className="text-gray-400 hover:text-red-500 p-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{sede.name}</h3>
                                    <p className="text-gray-500 text-xs mt-1">{sede.address}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <div className="flex items-center gap-1 text-[10px] text-blue-500 font-mono bg-blue-50 px-2 py-1 rounded w-fit">
                                            <Navigation className="w-3 h-3" />
                                            <span>{sede.location.lat.toFixed(4)}, {sede.location.lng.toFixed(4)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono bg-amber-50 px-2 py-1 rounded w-fit">
                                            <Navigation className="w-3 h-3" />
                                            <span>Radio: {sede.radiusMeters}m</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {sedes.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No hay sedes registradas.
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
            />
        </div>
    );
};

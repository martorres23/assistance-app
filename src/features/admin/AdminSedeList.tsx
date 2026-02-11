import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import type { Sede } from '../../types';
import { MapPin, Plus, Trash2, Building, Navigation, Edit2 } from 'lucide-react';

export const AdminSedeList: React.FC = () => {
    const [sedes, setSedes] = useState<Sede[]>(AuthService.getAllSedes());
    const [editingSede, setEditingSede] = useState<Sede | 'new' | null>(null);
    const [formData, setFormData] = useState<Partial<Sede>>({
        name: '',
        address: '',
        location: { lat: 0, lng: 0 },
        radiusMeters: 100
    });

    const handleOpenForm = (sede: Sede | 'new') => {
        if (sede === 'new') {
            setFormData({ name: '', address: '', location: { lat: 0, lng: 0 }, radiusMeters: 100 });
        } else {
            setFormData(sede);
        }
        setEditingSede(sede);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.address) return;

        if (editingSede === 'new') {
            const sedeToAdd: Sede = {
                id: crypto.randomUUID(),
                name: formData.name!,
                address: formData.address!,
                location: formData.location as { lat: number; lng: number },
                radiusMeters: formData.radiusMeters || 100
            };
            AuthService.addSede(sedeToAdd);
        } else if (editingSede) {
            AuthService.updateSede({
                ...editingSede,
                ...formData
            } as Sede);
        }

        setSedes(AuthService.getAllSedes());
        setEditingSede(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Confirma que desea eliminar esta sede?')) {
            AuthService.deleteSede(id);
            setSedes(AuthService.getAllSedes());
        }
    };

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
                            <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Nombre de la Sede</label>
                                <input
                                    placeholder="Nombre de la sede"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="md:col-span-3 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Dirección</label>
                                <input
                                    placeholder="Dirección"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Latitud</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Latitud"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.location?.lat || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        location: { ...formData.location!, lat: parseFloat(e.target.value) }
                                    })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Longitud</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="Longitud"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.location?.lng || ''}
                                    onChange={e => setFormData({
                                        ...formData,
                                        location: { ...formData.location!, lng: parseFloat(e.target.value) }
                                    })}
                                    required
                                />
                            </div>

                            <div className="md:col-span-2 flex flex-col gap-1">
                                <label className="text-xs font-semibold text-gray-500 ml-1">Radio Geocerca (m)</label>
                                <input
                                    type="number"
                                    placeholder="Ej: 100"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.radiusMeters || ''}
                                    onChange={e => setFormData({ ...formData, radiusMeters: parseInt(e.target.value) })}
                                    required
                                />
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
        </div>
    );
};

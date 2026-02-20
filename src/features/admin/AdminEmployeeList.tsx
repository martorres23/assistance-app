import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';
import { MapPin, User as UserIcon, Hash, ChevronLeft, Plus, Trash2, RefreshCw, Edit2 } from 'lucide-react';
import type { AttendanceRecord, User, Sede } from '../../types';
import { DateUtils } from '../../utils/date';
import { AnalyticsUtils, type AttendanceSession } from '../../utils/analytics';
import { AttendanceDetailView } from './AttendanceDetailView';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface AdminEmployeeListProps {
    records: AttendanceRecord[];
    onRefreshRecords: () => void; // Added to refresh records in parent
}

export const AdminEmployeeList: React.FC<AdminEmployeeListProps> = ({ records, onRefreshRecords }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [employees, setEmployees] = useState<User[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<User>>({
        id: '',
        name: '',
        role: 'employee',
        pin: '',
        sedeId: ''
    });
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
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

    // Fetch data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [allUsers, allSedes] = await Promise.all([
                AuthService.getAllUsers(),
                AuthService.getAllSedes()
            ]);
            setEmployees(allUsers.filter(u => u.role === 'employee'));
            setSedes(allSedes);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getSedeName = (sedeId?: string) => {
        const sede = sedes.find(s => s.id === sedeId);
        return sede ? sede.name : 'Sede Desconocida';
    };

    const handleOpenForm = (user: User | 'new') => {
        if (user === 'new') {
            setFormData({ id: '', name: '', role: 'employee', pin: '', sedeId: '' });
        } else {
            setFormData(user);
        }
        setEditingUser(user);
        setSelectedEmployeeId(null); // Close detail view when editing
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.pin || !formData.id) {
            setConfirmModal({
                isOpen: true,
                title: 'Campos Incompletos',
                message: 'Por favor complete todos los campos (ID, Nombre y PIN)',
                type: 'warning',
                onConfirm: () => { },
            });
            return;
        }

        const performSave = async () => {
            setIsLoading(true);
            try {
                if (editingUser === 'new') {
                    const exists = employees.some(u => u.id === formData.id);
                    if (exists) {
                        setConfirmModal({
                            isOpen: true,
                            title: 'ID Duplicado',
                            message: 'Ya existe un usuario con este ID',
                            type: 'danger',
                            onConfirm: () => { },
                        });
                        return;
                    }

                    const userToAdd: User = {
                        id: formData.id!,
                        name: formData.name!,
                        role: 'employee',
                        pin: formData.pin!,
                        sedeId: formData.sedeId
                    };
                    await AuthService.addUser(userToAdd);
                } else if (editingUser && typeof editingUser !== 'string') {
                    const oldId = editingUser.id;
                    const newId = formData.id!;

                    // If ID is changing, validate new ID doesn't exist
                    if (newId !== oldId) {
                        const exists = employees.some(u => u.id === newId);
                        if (exists) {
                            setConfirmModal({
                                isOpen: true,
                                title: 'ID Duplicado',
                                message: 'Ya existe un usuario con este ID',
                                type: 'danger',
                                onConfirm: () => { },
                            });
                            return;
                        }
                    }

                    await AuthService.updateUser({
                        ...editingUser,
                        ...formData
                    } as User, oldId);
                }

                setEditingUser(null);
                await fetchData(); // Refresh list
                onRefreshRecords(); // Refresh history if needed
            } catch (error) {
                setConfirmModal({
                    isOpen: true,
                    title: 'Error',
                    message: 'Error al guardar cambios',
                    type: 'danger',
                    onConfirm: () => { },
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (editingUser !== 'new' && editingUser !== null) {
            setConfirmModal({
                isOpen: true,
                title: 'Actualizar Empleado',
                message: '¿Confirma que desea guardar los cambios realizados en el perfil del empleado?',
                type: 'info',
                onConfirm: performSave
            });
        } else {
            performSave();
        }
    };

    const handleDeleteUser = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Empleado',
            message: '¿Confirma que desea eliminar este empleado? Esta acción no se puede deshacer y borrará su acceso.',
            type: 'danger',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    // Force delete: first delete all attendance records
                    await StorageService.deleteAllRecordsForUser(id);

                    // Then delete the user
                    const { error } = await AuthService.deleteUser(id);
                    if (error) throw error;

                    await fetchData();
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: error.message || 'Error al eliminar el empleado',
                        type: 'danger',
                        onConfirm: () => { },
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    const handleResetAttendance = async (userId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reiniciar Asistencia',
            message: '¿Desea reiniciar la asistencia de hoy para este empleado? Esto permitirá que el empleado vuelva a registrar su entrada.',
            type: 'warning',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    const today = DateUtils.getColombiaDate();
                    const { error } = await StorageService.deleteRecordsForUser(userId, today);

                    if (error) throw error;

                    onRefreshRecords(); // Refresh global records
                    setConfirmModal({
                        isOpen: true,
                        title: 'Reinicio Exitoso',
                        message: 'La asistencia ha sido reiniciada correctamente.',
                        type: 'success',
                        onConfirm: () => { },
                    });
                } catch (error) {
                    console.error(error);
                    setConfirmModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Error al reiniciar la asistencia.',
                        type: 'danger',
                        onConfirm: () => { },
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <span>Cargando datos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedEmployeeId ? (
                // Details View
                (() => {
                    const employee = employees.find(e => e.id === selectedEmployeeId);
                    const employeeRecords = records.filter(r => r.userId === selectedEmployeeId);
                    const sessions = employee ? AnalyticsUtils.getAttendanceSessions(employeeRecords, employee) : [];

                    if (selectedSession) {
                        return (
                            <AttendanceDetailView
                                session={selectedSession}
                                onBack={() => setSelectedSession(null)}
                            />
                        );
                    }

                    return (
                        <div className="space-y-6">
                            <button
                                onClick={() => setSelectedEmployeeId(null)}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Volver a la lista
                            </button>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                                            {employee?.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{employee?.name}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <Hash className="w-3 h-3" />
                                                    {employee?.id}
                                                </span>
                                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {getSedeName(employee?.sedeId)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenForm(employee!)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-sm font-semibold"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleResetAttendance(employee!.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 text-sm font-semibold"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Reiniciar Hoy
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <h3 className="text-lg font-semibold p-4 bg-gray-50 border-b border-gray-200">
                                    Historial de Asistencia
                                </h3>
                                {sessions.length === 0 ? (
                                    <p className="p-8 text-center text-gray-500">No hay registros de asistencia</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                                                    <th className="px-6 py-3 font-black">Fecha</th>
                                                    <th className="px-6 py-3 font-black">Entrada</th>
                                                    <th className="px-6 py-3 font-black">Salida</th>
                                                    <th className="px-6 py-3 font-black text-right">Tiempo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {sessions.map(session => (
                                                    <tr
                                                        key={session.date}
                                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                                        onClick={() => setSelectedSession(session)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-700">
                                                                    {new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                                    {new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-600">
                                                            {session.entry || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                                            <div className="flex items-center justify-between">
                                                                <span>{session.exit || '—'}</span>
                                                                <span className="text-[10px] text-blue-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    Ver detalle →
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-gray-900 font-mono">
                                                            {session.hours}h
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()
            ) : (
                // List View
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-blue-600" />
                            Lista de Empleados
                        </h2>
                        <button
                            onClick={() => handleOpenForm('new')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Empleado
                        </button>
                    </div>

                    {editingUser && (
                        <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4">
                                {editingUser === 'new' ? 'Nuevo Empleado' : 'Editar Empleado'}
                            </h3>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">ID de Empleado</label>
                                    <input
                                        placeholder="Ej: 12345678"
                                        className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-mono"
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Nombre Completo</label>
                                    <input
                                        placeholder="Ej: Juan Pérez"
                                        className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">PIN de Acceso (4 dígitos)</label>
                                    <input
                                        placeholder="Ej: 1234"
                                        className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-mono"
                                        value={formData.pin}
                                        onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-1">Sede de Trabajo</label>
                                    <select
                                        className="p-3 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 bg-white transition-all font-medium appearance-none"
                                        value={formData.sedeId}
                                        onChange={e => setFormData({ ...formData, sedeId: e.target.value })}
                                        required
                                    >
                                        <option value="">Seleccione una sede</option>
                                        {sedes.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 md:col-span-2 border-t pt-4 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg font-bold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-extrabold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                        {editingUser === 'new' ? 'Guardar Empleado' : 'Actualizar Perfil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b-2 border-gray-100">
                                <tr className="text-gray-600 text-sm">
                                    <th className="py-4 px-4 font-medium">Nombre</th>
                                    <th className="py-4 px-4 font-medium">ID</th>
                                    <th className="py-4 px-4 font-medium">PIN</th>
                                    <th className="py-4 px-4 font-medium">Sede Asignada</th>
                                    <th className="py-4 px-4 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {employees.map(employee => (
                                    <tr
                                        key={employee.id}
                                        onClick={() => setSelectedEmployeeId(employee.id)}
                                        className="hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm uppercase">
                                                    {employee.name.substring(0, 2)}
                                                </div>
                                                <span className="font-medium text-gray-800">{employee.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <Hash className="w-3 h-3" />
                                                {employee.id}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                                                {employee.pin}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <MapPin className="w-3 h-3" />
                                                {getSedeName(employee.sedeId)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenForm(employee); }}
                                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteUser(employee.id, e)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 z-[2000] flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-medium flex items-center gap-2"
                        >
                            <span>Cerrar</span>
                            <span className="text-2xl">×</span>
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Attendance Evidence"
                            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

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


import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import { StorageService } from '../../services/storage';
import { MapPin, User as UserIcon, Hash, ChevronLeft, Clock, Plus, Trash2, RefreshCw, Edit2 } from 'lucide-react';
import type { AttendanceRecord, User } from '../../types';
import { DateUtils } from '../../utils/date';

interface AdminEmployeeListProps {
    records: AttendanceRecord[];
}

export const AdminEmployeeList: React.FC<AdminEmployeeListProps> = ({ records }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [formData, setFormData] = useState<Partial<User>>({
        id: '',
        name: '',
        role: 'employee',
        pin: '',
        sedeId: ''
    });
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const employees = AuthService.getAllUsers().filter(u => u.role === 'employee');
    const sedes = AuthService.getAllSedes();

    const getSedeName = (sedeId?: string) => {
        const sede = AuthService.getSede(sedeId);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.pin || !formData.id) {
            alert('Por favor complete todos los campos (ID, Nombre y PIN)');
            return;
        }

        if (editingUser === 'new') {
            const exists = AuthService.getAllUsers().some(u => u.id === formData.id);
            if (exists) {
                alert('Ya existe un usuario con este ID');
                return;
            }

            const userToAdd: User = {
                id: formData.id!,
                name: formData.name!,
                role: 'employee',
                pin: formData.pin!,
                sedeId: formData.sedeId
            };
            AuthService.addUser(userToAdd);
        } else if (editingUser && typeof editingUser !== 'string') {
            const oldId = editingUser.id;
            const newId = formData.id!;

            // If ID is changing, validate new ID doesn't exist
            if (newId !== oldId) {
                const exists = AuthService.getAllUsers().some(u => u.id === newId);
                if (exists) {
                    alert('Ya existe un usuario con este ID');
                    return;
                }

                // Update attendance records with new ID
                const records = StorageService.getRecords();
                const updatedRecords = records.map(r =>
                    r.userId === oldId ? { ...r, userId: newId } : r
                );
                localStorage.setItem('attendance_records', JSON.stringify(updatedRecords));
            }

            AuthService.updateUser({
                ...editingUser,
                ...formData
            } as User, oldId);
        }

        setEditingUser(null);
        // Trigger storage event to update other components, then reload
        window.dispatchEvent(new Event('storage'));
        // Small delay to ensure localStorage updates are complete before reload
        setTimeout(() => {
            // Save current view before reload
            sessionStorage.setItem('admin_last_view', 'employees');
            window.location.reload();
        }, 50);
    };

    const handleDeleteUser = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Confirma que desea eliminar este empleado?')) {
            AuthService.deleteUser(id);
            sessionStorage.setItem('admin_last_view', 'employees');
            window.location.reload();
        }
    };

    const handleResetAttendance = (userId: string) => {
        if (confirm('¿Desea reiniciar la asistencia de hoy para este empleado?')) {
            const today = DateUtils.getColombiaDate();
            StorageService.deleteRecordsForUser(userId, today);
            alert('Asistencia reiniciada correctamente.');
            sessionStorage.setItem('admin_last_view', 'employees');
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedEmployeeId ? (
                // Details View
                (() => {
                    const employee = employees.find(e => e.id === selectedEmployeeId);
                    const employeeRecords = records.filter(r => r.userId === selectedEmployeeId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
                                {employeeRecords.length === 0 ? (
                                    <p className="p-8 text-center text-gray-500">No hay registros de asistencia</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {employeeRecords.map(record => (
                                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${record.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                    <div>
                                                        <p className="font-medium capitalize">{record.type === 'in' ? 'Entrada' : 'Salida'}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(record.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                {(record.photoUrl || (record as any).photo) && (
                                                    <img
                                                        src={record.photoUrl || (record as any).photo}
                                                        alt="Evidence"
                                                        className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setSelectedPhoto(record.photoUrl || (record as any).photo)}
                                                    />
                                                )}
                                            </div>
                                        ))}
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
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    placeholder="ID de empleado"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="Nombre completo"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <input
                                    placeholder="PIN de acceso"
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                    required
                                />
                                <select
                                    className="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    value={formData.sedeId}
                                    onChange={e => setFormData({ ...formData, sedeId: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione una sede</option>
                                    {sedes.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <div className="flex justify-end gap-2 md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-200 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-sm"
                                    >
                                        {editingUser === 'new' ? 'Guardar' : 'Actualizar'}
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

            {/* Photo Modal - Now outside of conditionals so it's always available */}
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
        </div>
    );
};

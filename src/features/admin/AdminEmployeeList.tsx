import React, { useState } from 'react';
import { AuthService } from '../../services/auth';
import { MapPin, User as UserIcon, Hash, ChevronLeft, Clock, LogOut } from 'lucide-react';
import type { AttendanceRecord } from '../../types';

interface AdminEmployeeListProps {
    records: AttendanceRecord[];
}

export const AdminEmployeeList: React.FC<AdminEmployeeListProps> = ({ records }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

    const employees = AuthService.getAllUsers().filter(u => u.role === 'employee');
    const sedes = AuthService.getAllSedes();

    const getSedeName = (sedeId?: string) => {
        if (!sedeId) return 'Sin Sede';
        const sede = sedes.find(s => s.id === sedeId);
        return sede ? sede.name : 'Sede Desconocida';
    };

    if (selectedEmployeeId) {
        const employee = employees.find(e => e.id === selectedEmployeeId);
        const employeeRecords = records.filter(r => r.userId === selectedEmployeeId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setSelectedEmployeeId(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Volver a la lista
                </button>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                            {employee?.name.substring(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{employee?.name}</h2>
                            <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                                <span className="flex items-center gap-1"><Hash className="w-4 h-4" /> {employee?.id}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {getSedeName(employee?.sedeId)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <h3 className="p-6 text-lg font-bold text-gray-800 border-b border-gray-100">Historial de Asistencia</h3>
                    {employeeRecords.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay registros para este empleado.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {employeeRecords.map((record) => (
                                <div key={record.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {record.type === 'in' ? <Clock className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{record.type === 'in' ? 'Entrada' : 'Salida'}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {record.photoUrl && (
                                        <a href={record.photoUrl} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded overflow-hidden border border-gray-200 hover:ring-2 ring-blue-500 transition-all">
                                            <img src={record.photoUrl} alt="Selfie" className="w-full h-full object-cover" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                    Lista de Empleados
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-500 text-sm">
                                <th className="py-4 px-4 font-medium">Nombre</th>
                                <th className="py-4 px-4 font-medium">ID</th>
                                <th className="py-4 px-4 font-medium">PIN</th>
                                <th className="py-4 px-4 font-medium">Sede Asignada</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {employees.map((employee) => (
                                <tr
                                    key={employee.id}
                                    onClick={() => setSelectedEmployeeId(employee.id)}
                                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                                >
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase group-hover:bg-blue-200 transition-colors">
                                                {employee.name.substring(0, 2)}
                                            </div>
                                            <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{employee.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-gray-600 font-mono text-sm">{employee.id}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2 text-gray-600 font-mono text-sm bg-gray-100 px-2 py-1 rounded w-fit group-hover:bg-white transition-colors">
                                            <Hash className="w-3 h-3 text-gray-400" />
                                            {employee.pin}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                                            <MapPin className="w-4 h-4 text-emerald-500" />
                                            {getSedeName(employee.sedeId)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {employees.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        No hay empleados registrados.
                    </div>
                )}
            </div>
        </div>
    );
};

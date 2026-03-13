import React, { useState, useEffect } from 'react';
import type { User, Sede } from '../../types';
import { AuthService } from '../../services/auth';
import { MapPin, User as UserIcon, Building } from 'lucide-react';

interface EmployeeProfileProps {
    user: User;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user }) => {
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSedes = async () => {
            setIsLoading(true);
            try {
                const sedeIds = (user.sedeIds && user.sedeIds.length > 0)
                    ? user.sedeIds
                    : (user.sedeId ? [user.sedeId] : []);

                const sedesData = await Promise.all(sedeIds.map(id => AuthService.getSede(id)));
                setSedes(sedesData.filter((s): s is Sede => s !== undefined));
            } catch (error) {
                console.error('Error fetching sedes for profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSedes();
    }, [user.sedeId, user.sedeIds]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                    {user.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium mt-2 capitalize">
                    {user.role}
                </span>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-gray-500" />
                    {sedes.length > 1 ? 'Sedes Asignadas' : 'Sede Asignada'}
                </h3>

                {isLoading ? (
                    <div className="h-24 bg-gray-50 animate-pulse rounded-lg border border-gray-100"></div>
                ) : sedes.length > 0 ? (
                    <div className="space-y-3">
                        {sedes.map(s => (
                            <div key={s.id} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-blue-900">{s.name}</h4>
                                        <p className="text-blue-700 text-sm mt-1">{s.address}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No tienes una sede asignada.</p>
                        <p className="text-xs text-gray-400 mt-1">Contacta al administrador.</p>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                    Información Personal
                </h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">ID de Empleado</span>
                        <span className="font-medium text-gray-900">{user.id}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">PIN de Acceso</span>
                        <span className="font-medium text-gray-900">****</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import type { User, Sede } from '../../types';
import { AuthService } from '../../services/auth';
import { MapPin, User as UserIcon, Building } from 'lucide-react';

interface EmployeeProfileProps {
    user: User;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ user }) => {
    const [sede, setSede] = useState<Sede | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSede = async () => {
            setIsLoading(true);
            try {
                const sedeData = await AuthService.getSede(user.sedeId);
                setSede(sedeData);
            } catch (error) {
                console.error('Error fetching sede for profile:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSede();
    }, [user.sedeId]);

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
                    Sede Asignada
                </h3>

                {isLoading ? (
                    <div className="h-24 bg-gray-50 animate-pulse rounded-lg border border-gray-100"></div>
                ) : sede ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-900">{sede.name}</h4>
                                <p className="text-blue-700 text-sm mt-1">{sede.address}</p>
                                <div className="mt-2 text-xs text-blue-600 flex gap-2">
                                    <span>Lat: {sede.location.lat}</span>
                                    <span>Lng: {sede.location.lng}</span>
                                </div>
                            </div>
                        </div>
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

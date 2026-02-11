import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import type { AttendanceRecord } from '../../types';
import { LogOut, Map as MapIcon, List, Clock, Users, LayoutDashboard, Menu, FileText, Building } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet definitions
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { AdminStatsView } from './AdminStatsView';
import { AdminEmployeeList } from './AdminEmployeeList';
import { AdminSedeList } from './AdminSedeList';
import { AdminPayrollView } from './AdminPayrollView';

export const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    // Restore last view from sessionStorage, default to 'list'
    const savedView = sessionStorage.getItem('admin_last_view') as 'list' | 'map' | 'stats' | 'employees' | 'sedes' | 'payroll' | null;
    const [view, setView] = useState<'list' | 'map' | 'stats' | 'employees' | 'sedes' | 'payroll'>(savedView || 'list');
    // Close sidebar by default on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        // Clear the saved view after restoring it
        if (savedView) {
            sessionStorage.removeItem('admin_last_view');
        }

        setRecords(StorageService.getRecords());

        // Handle window resize
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        AuthService.logout();
        navigate('/');
    };

    const centerLat = records.length > 0 ? records[0].location.lat : 4.6097; // Default Bogota
    const centerLng = records.length > 0 ? records[0].location.lng : -74.0817;

    const menuItems = [
        { id: 'list', label: 'Registros', icon: List },
        { id: 'map', label: 'Mapa Tiempo Real', icon: MapIcon },
        { id: 'stats', label: 'Estadísticas', icon: Clock },
        { id: 'employees', label: 'Empleados', icon: Users },
        { id: 'sedes', label: 'Sedes', icon: Building },
        { id: 'payroll', label: 'Generar Nómina', icon: FileText },
    ] as const;

    return (
        <div className="flex h-screen bg-gray-100 relative overflow-hidden">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[1000] md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    absolute md:relative inset-y-0 left-0 bg-white shadow-xl z-[1001] transition-all duration-300 flex flex-col
                    ${isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}
                `}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    {isSidebarOpen ? (
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <LayoutDashboard className="w-6 h-6 text-blue-600" />
                            <span>Panel</span>
                        </h1>
                    ) : (
                        <div className="mx-auto"><LayoutDashboard className="w-6 h-6 text-blue-600" /></div>
                    )}
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="md:hidden p-2 text-gray-400 hover:text-gray-600"
                    >
                        <LogOut className="w-5 h-5 rotate-180" /> {/* temporary icon for close/back */}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = view === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setView(item.id);
                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    } ${!isSidebarOpen && 'justify-center'}`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {isSidebarOpen && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all ${!isSidebarOpen && 'justify-center'}`}
                        title={!isSidebarOpen ? 'Salir' : ''}
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gray-50 w-full relative">
                {/* Mobile Header to toggle Sidebar */}
                <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-800">
                            {menuItems.find(i => i.id === view)?.label}
                        </h2>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                        AD
                    </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <header className="mb-8 hidden md:block">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-500"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {menuItems.find(i => i.id === view)?.label}
                                </h2>
                                <p className="text-gray-500">Gestión y control de asistencia</p>
                            </div>
                        </div>
                    </header>

                    {view === 'employees' && <AdminEmployeeList records={records} />}

                    {view === 'sedes' && <AdminSedeList />}

                    {view === 'payroll' && <AdminPayrollView records={records} />}

                    {view === 'stats' && <AdminStatsView records={records} />}

                    {view === 'list' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {records.length === 0 ? (
                                <div className="text-center text-gray-500 p-12">
                                    <p>No hay registros de asistencia aún.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {records.map((record) => (
                                        <div key={record.id} className="p-4 hover:bg-gray-50 flex items-center justify-between transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${record.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    {record.type === 'in' ? <Clock className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{record.userName}</p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <span>{new Date(record.timestamp).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${record.type === 'in'
                                                ? 'bg-green-50 text-green-700 border border-green-100'
                                                : 'bg-red-50 text-red-700 border border-red-100'
                                                }`}>
                                                {record.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'map' && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-120px)] md:h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {records.map(record => (
                                    <Marker
                                        key={record.id}
                                        position={[record.location.lat, record.location.lng]}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <strong className="block text-gray-900">{record.userName}</strong>
                                                <span className={`text-xs font-bold ${record.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {record.type === 'in' ? 'ENTRADA' : 'SALIDA'}
                                                </span>
                                                <br />
                                                <span className="text-xs text-gray-500">
                                                    {new Date(record.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

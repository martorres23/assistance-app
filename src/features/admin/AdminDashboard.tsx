import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { AnalyticsUtils, type AttendanceSession } from '../../utils/analytics';
import { StorageService } from '../../services/storage';
import { AuthService } from '../../services/auth';
import type { AttendanceRecord, User, Sede } from '../../types';
import { LogOut, Map as MapIcon, List, Clock, Users, LayoutDashboard, Menu, FileText, Building, ExternalLink } from 'lucide-react';
import { AttendanceDetailView } from './AttendanceDetailView';
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
    const [users, setUsers] = useState<User[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);

    // Restore last view from sessionStorage, default to 'list'
    const savedView = sessionStorage.getItem('admin_last_view') as 'list' | 'map' | 'stats' | 'employees' | 'sedes' | 'payroll' | null;
    const [view, setView] = useState<'list' | 'map' | 'stats' | 'employees' | 'sedes' | 'payroll'>(savedView || 'list');

    // Close sidebar by default on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

    const fetchRecords = async () => {
        setIsLoading(true);
        try {
            const [allRecords, allUsers, allSedes] = await Promise.all([
                StorageService.getRecords(),
                AuthService.getAllUsers(),
                AuthService.getAllSedes()
            ]);
            setRecords(allRecords);
            setUsers(allUsers.filter(u => u.role === 'employee'));
            setSedes(allSedes);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Clear the saved view after restoring it
        if (savedView) {
            sessionStorage.removeItem('admin_last_view');
        }

        fetchRecords();

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

    const onRefreshRecords = () => {
        fetchRecords();
    };

    const handleLogout = () => {
        AuthService.logout();
        navigate('/');
    };

    const centerLat = records.length > 0 ? records[0].location.lat : 4.6097; // Default Bogota
    const centerLng = records.length > 0 ? records[0].location.lng : -74.0817;

    const menuItems = [
        { id: 'list', label: 'Asistencias', icon: List },
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

                    {view === 'employees' && (
                        <AdminEmployeeList
                            records={records}
                            onRefreshRecords={onRefreshRecords}
                        />
                    )}

                    {view === 'sedes' && <AdminSedeList users={users} />}

                    {view === 'payroll' && <AdminPayrollView records={records} />}

                    {view === 'stats' && <AdminStatsView records={records} />}

                    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                        {selectedSession ? (
                            <AttendanceDetailView
                                session={selectedSession}
                                onBack={() => setSelectedSession(null)}
                            />
                        ) : (
                            <>
                                {view === 'list' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                Asistencia de Hoy
                                            </h3>
                                            <button
                                                onClick={onRefreshRecords}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase"
                                            >
                                                Actualizar
                                            </button>
                                        </div>

                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                            {isLoading ? (
                                                <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                                    <span>Cargando asistencia...</span>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Empleado</th>
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Estado</th>
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Entrada</th>
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Salida</th>
                                                                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Tiempo</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {AnalyticsUtils.getAdminTodaySummary(records, users).map((row) => (
                                                                <tr
                                                                    key={row.userId}
                                                                    className={`transition-colors group ${row.status !== 'No ha iniciado' ? 'hover:bg-blue-50/50 cursor-pointer' : 'hover:bg-gray-50/50'}`}
                                                                    onClick={() => row.status !== 'No ha iniciado' && setSelectedSession(row)}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                                                                                {row.userName.substring(0, 2)}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-gray-700">{row.userName}</span>
                                                                                {row.status !== 'No ha iniciado' && (
                                                                                    <button
                                                                                        className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-colors"
                                                                                        title="Ver registro de hoy"
                                                                                        onClick={(e) => { e.stopPropagation(); setSelectedSession(row); }}
                                                                                    >
                                                                                        <ExternalLink className="w-3 h-3" />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${row.status === 'En curso' ? 'bg-amber-100 text-amber-700' :
                                                                            row.status === 'Finalizada' ? 'bg-green-100 text-green-700' :
                                                                                'bg-red-50 text-red-500'
                                                                            }`}>
                                                                            {row.status === 'En curso' ? '🟢 En curso' :
                                                                                row.status === 'Finalizada' ? '✅ Finalizada' :
                                                                                    '🔴 No ha iniciado'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center font-medium text-gray-500">
                                                                        {row.entry || '—'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-center font-medium text-gray-500">
                                                                        {row.exit || '—'}
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right font-black text-gray-900 font-mono">
                                                                        {row.status !== 'No ha iniciado' ? `${row.hours}h` : '—'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {users.length === 0 && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                                                        No hay empleados registrados.
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {view === 'map' && (
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-120px)] md:h-[650px] animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                                        {isLoading ? (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                                            </div>
                                        ) : (
                                            <div className="h-full w-full relative">
                                                <MapContainer center={[centerLat, centerLng]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}>
                                                    <TileLayer
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    />

                                                    {/* Legend Overlay */}
                                                    <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-2xl shadow-xl border border-gray-100 flex flex-col gap-2 scale-90 origin-top-right">
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                                                            <span>Sede / Punto de Control</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                                                            <span>Empleado en Turno</span>
                                                        </div>
                                                    </div>

                                                    {/* Markers for Sedes */}
                                                    {sedes.map(sede => (
                                                        <React.Fragment key={`sede-${sede.id}`}>
                                                            <Marker
                                                                position={[sede.location.lat, sede.location.lng]}
                                                                icon={L.divIcon({
                                                                    className: 'custom-div-icon',
                                                                    html: `<div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 10px; border: 3px solid white; display: flex; items-center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); transform: rotate(45deg); margin-left: -16px; margin-top: -16px;">
                                                                            <div style="transform: rotate(-45deg); background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z%22/><path d=%22M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2%22/><path d=%22M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2%22/><path d=%22M10 6h4%22/><path d=%22M10 10h4%22/><path d=%22M10 14h4%22/><path d=%22M10 18h4%22/></svg>'); width: 18px; height: 18px; background-size: contain; background-repeat: no-repeat;"></div>
                                                                           </div>`
                                                                })}
                                                            >
                                                                <Popup>
                                                                    <div className="p-1">
                                                                        <h4 className="font-bold text-blue-600 mb-0">{sede.name}</h4>
                                                                        <p className="text-[10px] text-gray-500 mb-2">{sede.address}</p>
                                                                        <div className="bg-blue-50 p-2 rounded-lg">
                                                                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">Geocerca</span>
                                                                            <p className="text-xs font-bold text-blue-700">{sede.radiusMeters} metros de radio</p>
                                                                        </div>
                                                                    </div>
                                                                </Popup>
                                                            </Marker>
                                                            <Circle
                                                                center={[sede.location.lat, sede.location.lng]}
                                                                radius={sede.radiusMeters}
                                                                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }}
                                                            />
                                                        </React.Fragment>
                                                    ))}

                                                    {/* Markers for Active Employees */}
                                                    {AnalyticsUtils.getAdminTodaySummary(records, users).filter(s => s.status === 'En curso' && s.entryRecord).map(session => (
                                                        <Marker
                                                            key={`active-${session.userId}`}
                                                            position={[session.entryRecord!.location.lat, session.entryRecord!.location.lng]}
                                                            icon={L.divIcon({
                                                                className: 'custom-div-icon',
                                                                html: `<div style="background-color: #16a34a; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; items-center; justify-content: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); margin-left: -16px; margin-top: -16px;">
                                                                        <div style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2%22/><circle cx=%2212%22 cy=%227%22 r=%224%22/></svg>'); width: 18px; height: 18px; background-size: contain; background-repeat: no-repeat;"></div>
                                                                       </div>`
                                                            })}
                                                        >
                                                            <Popup>
                                                                <div className="p-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                                                            {session.userName.substring(0, 2).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="font-bold text-gray-800 text-sm leading-none">{session.userName}</h4>
                                                                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">En Turno</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1 border-t pt-2">
                                                                        <p className="text-[10px] text-gray-400 flex justify-between">Entrada: <span className="text-gray-700 font-bold">{session.entry}</span></p>
                                                                        <p className="text-[10px] text-gray-400 flex justify-between">Transcurrido: <span className="text-gray-700 font-bold">{session.hours}h</span></p>
                                                                    </div>
                                                                </div>
                                                            </Popup>
                                                        </Marker>
                                                    ))}
                                                </MapContainer>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

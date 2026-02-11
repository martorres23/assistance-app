import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = AuthService.login(pin);
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/attendance');
            }
        } else {
            setError('PIN inválido');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-blue-100 rounded-full">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Bienvenido</h1>
                <p className="text-gray-500 text-center mb-8">Ingrese su PIN personal</p>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full text-center text-3xl tracking-widest p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 transition-colors"
                            placeholder="••••"
                            maxLength={8}
                        />
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-red-500 text-center text-sm"
                        >
                            {error}
                        </motion.p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
                    >
                        Ingresar
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Demo PINs: 1234 (Empleado), admin123 (Admin)</p>
                </div>
            </motion.div>
        </div>
    );
};

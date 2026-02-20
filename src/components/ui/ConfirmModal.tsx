import React from 'react';
import { AlertCircle, HelpCircle, CheckCircle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string | null;
    type?: 'danger' | 'info' | 'warning' | 'success';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'info'
}) => {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            icon: <AlertCircle className="w-6 h-6 text-red-500" />,
            buttonClass: 'bg-red-600 hover:bg-red-700 shadow-red-100',
            iconBg: 'bg-red-50',
            accent: 'text-red-600'
        },
        info: {
            icon: <HelpCircle className="w-6 h-6 text-blue-500" />,
            buttonClass: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
            iconBg: 'bg-blue-50',
            accent: 'text-blue-600'
        },
        warning: {
            icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
            buttonClass: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
            iconBg: 'bg-amber-50',
            accent: 'text-amber-600'
        },
        success: {
            icon: <CheckCircle className="w-6 h-6 text-green-500" />,
            buttonClass: 'bg-green-600 hover:bg-green-700 shadow-green-100',
            iconBg: 'bg-green-50',
            accent: 'text-green-600'
        }
    };

    const config = typeConfig[type];

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-gray-100">
                {/* Header/Icon area */}
                <div className="p-8 text-center space-y-4">
                    <div className={`mx-auto w-16 h-16 ${config.iconBg} rounded-2xl flex items-center justify-center mb-2`}>
                        {config.icon}
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 leading-relaxed px-4">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50/50 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`w-full py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 ${config.buttonClass}`}
                    >
                        {confirmText}
                    </button>
                    {cancelText !== null && (
                        <button
                            onClick={onClose}
                            className="w-full py-4 rounded-2xl text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    )}
                </div>

                {/* Close hint (X button optional) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

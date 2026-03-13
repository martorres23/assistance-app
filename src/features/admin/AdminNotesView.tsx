import React, { useState, useEffect } from 'react';
import { NoteService } from '../../services/NoteService';
import type { Note } from '../../types';
import { Plus, Trash2, Edit2, Check, X, Palette, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_OPTIONS = [
    { name: 'Blanco', class: 'bg-white', text: 'text-gray-800' },
    { name: 'Amarillo', class: 'bg-amber-100', text: 'text-amber-900' },
    { name: 'Azul', class: 'bg-blue-100', text: 'text-blue-900' },
    { name: 'Verde', class: 'bg-emerald-100', text: 'text-emerald-900' },
    { name: 'Rojo', class: 'bg-rose-100', text: 'text-rose-900' },
    { name: 'Púrpura', class: 'bg-purple-100', text: 'text-purple-900' },
];

export const AdminNotesView: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | 'new' | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        color: 'bg-white'
    });

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const data = await NoteService.getNotes();
            setNotes(data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleOpenForm = (note?: Note) => {
        if (note) {
            setFormData({
                title: note.title,
                content: note.content,
                color: note.color
            });
            setIsEditing(note.id);
        } else {
            setFormData({
                title: '',
                content: '',
                color: 'bg-white'
            });
            setIsEditing('new');
        }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) return;

        try {
            if (isEditing === 'new') {
                await NoteService.addNote(formData);
            } else if (isEditing) {
                await NoteService.updateNote(isEditing, formData);
            }
            setIsEditing(null);
            fetchNotes();
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Confirma que desea eliminar esta nota?')) return;
        try {
            await NoteService.deleteNote(id);
            fetchNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    if (isLoading && notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                <span>Cargando notas...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <StickyNote className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 tracking-tight">Tablero de Notas</h2>
                        <p className="text-xs text-gray-500">Organiza recordatorios y avisos importantes.</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Nota
                </button>
            </div>

            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-gray-800">
                                {isEditing === 'new' ? 'Nueva Nota' : 'Editar Nota'}
                            </h3>
                            <button onClick={() => setIsEditing(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold text-gray-700"
                                    placeholder="Ej: Recordatorio de inventario"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Contenido</label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full p-4 border border-gray-100 rounded-2xl bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-gray-700 min-h-[120px]"
                                    placeholder="Escribe el contenido de la nota aquí..."
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Color de la Nota</label>
                                <div className="flex flex-wrap gap-3">
                                    {COLOR_OPTIONS.map(color => (
                                        <button
                                            key={color.class}
                                            onClick={() => setFormData({ ...formData, color: color.class })}
                                            className={`
                                                w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                                                ${color.class}
                                                ${formData.color === color.class ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-100 hover:border-blue-200'}
                                            `}
                                            title={color.name}
                                        >
                                            {formData.color === color.class && <Check className="w-5 h-5 text-blue-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={!formData.title || !formData.content}
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    Guardar Nota
                                </button>
                                <button
                                    onClick={() => setIsEditing(null)}
                                    className="px-8 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.map((note) => {
                    const colorData = COLOR_OPTIONS.find(c => c.class === note.color) || COLOR_OPTIONS[0];
                    return (
                        <motion.div
                            layout
                            key={note.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`${note.color} ${colorData.text} p-6 rounded-3xl shadow-lg border border-gray-100/50 relative group flex flex-col min-h-[180px]`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-lg leading-tight pr-8">{note.title}</h3>
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenForm(note)}
                                        className="p-2 bg-white/50 backdrop-blur rounded-full hover:bg-white text-gray-600 shadow-sm transition-all"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(note.id)}
                                        className="p-2 bg-white/50 backdrop-blur rounded-full hover:bg-rose-50 text-rose-600 shadow-sm transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm opacity-80 whitespace-pre-wrap flex-1">{note.content}</p>
                            <div className="mt-4 pt-4 border-t border-black/5 flex justify-between items-center opacity-60">
                                <span className="text-[9px] font-black uppercase tracking-wider">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </span>
                                <div className="p-1">
                                    <Palette className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {notes.length === 0 && !isEditing && (
                <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                        <StickyNote className="w-8 h-8 text-gray-300" />
                    </div>
                    <div className="max-w-xs">
                        <h3 className="font-bold text-gray-500">No hay notas todavía</h3>
                        <p className="text-sm text-gray-400 mt-1">Crea tu primera nota para empezar a organizar el tablero.</p>
                    </div>
                    <button
                        onClick={() => handleOpenForm()}
                        className="mt-2 text-blue-600 font-bold hover:underline"
                    >
                        + Crear primera nota
                    </button>
                </div>
            )}
        </div>
    );
};

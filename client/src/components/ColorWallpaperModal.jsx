import React, { useState } from 'react';
import { X, Image as ImageIcon, Palette, FileText } from 'lucide-react';
import Modal from './Modal';

// Data Constants
const colors = [
    { id: 'white', class: 'bg-white text-slate-900 border border-slate-100', preview: 'bg-white border-slate-200' },
    { id: 'dark', class: 'bg-slate-900 text-white', preview: 'bg-slate-900' },
    { id: 'sunset', class: 'bg-gradient-to-br from-orange-100 to-rose-200 text-rose-900', preview: 'bg-gradient-to-br from-orange-100 to-rose-200' },
    { id: 'ocean', class: 'bg-gradient-to-tr from-cyan-100 to-blue-200 text-blue-900', preview: 'bg-gradient-to-tr from-cyan-100 to-blue-200' },
    { id: 'forest', class: 'bg-gradient-to-b from-emerald-50 to-teal-100 text-teal-900', preview: 'bg-gradient-to-b from-emerald-50 to-teal-100' },
    { id: 'midnight', class: 'bg-gradient-to-r from-slate-900 to-indigo-950 text-indigo-100', preview: 'bg-gradient-to-r from-slate-900 to-indigo-950' },
    { id: 'berry', class: 'bg-gradient-to-bl from-pink-200 to-purple-300 text-purple-900', preview: 'bg-gradient-to-bl from-pink-200 to-purple-300' },
    { id: 'lemon', class: 'bg-yellow-50 text-yellow-800 border border-yellow-100', preview: 'bg-yellow-50 border-yellow-200' },
    { id: 'sky', class: 'bg-sky-100 text-sky-800', preview: 'bg-sky-100' },
    { id: 'lavender', class: 'bg-violet-100 text-violet-900', preview: 'bg-violet-100' },
    { id: 'cherry', class: 'bg-red-50 text-red-900 border border-red-100', preview: 'bg-red-50 border-red-200' },
    { id: 'gray', class: 'bg-gray-100 text-gray-700', preview: 'bg-gray-100' },
];

const textures = [
    { id: 'classic', label: 'Classic', class: 'bg-amber-50 text-amber-900 border-amber-100', texture: '' },
    { id: 'parchment', label: 'Parchment', class: 'bg-[#f0e6d2] text-[#5c4b35] border-[#e6dcc0]', texture: 'https://www.transparenttextures.com/patterns/aged-paper.png' },
    { id: 'lined', label: 'Lined', class: 'bg-white text-slate-800 border-blue-100', texture: 'https://www.transparenttextures.com/patterns/notebook.png' },
    { id: 'dark-paper', label: 'Midnight', class: 'bg-slate-900 text-slate-200 border-slate-800', texture: 'https://www.transparenttextures.com/patterns/stardust.png' },
    { id: 'flower', label: 'Floral', class: 'bg-rose-50 text-rose-900 border-rose-100', texture: 'https://www.transparenttextures.com/patterns/flowers.png' },
];

// Mock Unsplash Images (Poetic/Nature themes)
const images = [
    { id: 'clouds', url: 'https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=800&q=80', label: 'Clouds', textClass: 'text-slate-800' },
    { id: 'rain', url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80', label: 'Rain', textClass: 'text-white' },
    { id: 'forest-fog', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80', label: 'Forest', textClass: 'text-white' },
    { id: 'ocean-waves', url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80', label: 'Ocean', textClass: 'text-white' },
    { id: 'book', url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80', label: 'Book', textClass: 'text-slate-900' },
    { id: 'stars', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=80', label: 'Stars', textClass: 'text-white' },
];

const ColorWallpaperModal = ({ isOpen, onClose, onSelect, currentType }) => {
    const [activeTab, setActiveTab] = useState('colors'); // colors, textures, images

    const handleSelect = (style) => {
        onSelect(style);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-lg bg-surface rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-soft-border flex justify-between items-center bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <h3 className="font-serif text-lg text-text">Customize Style</h3>
                    <button onClick={onClose} className="p-2 hover:bg-background rounded-full transition-colors">
                        <X size={20} className="text-secondary" />
                    </button>
                </div>

                <div className="flex border-b border-soft-border">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'colors' ? 'bg-surface text-text border-b-2 border-sage' : 'bg-background/30 text-secondary hover:bg-background/50'}`}
                    >
                        <Palette size={16} /> Colors
                    </button>
                    <button
                        onClick={() => setActiveTab('textures')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'textures' ? 'bg-surface text-text border-b-2 border-sage' : 'bg-background/30 text-secondary hover:bg-background/50'}`}
                    >
                        <FileText size={16} /> Textures
                    </button>
                    <button
                        onClick={() => setActiveTab('images')}
                        className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'images' ? 'bg-surface text-text border-b-2 border-sage' : 'bg-background/30 text-secondary hover:bg-background/50'}`}
                    >
                        <ImageIcon size={16} /> Images
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'colors' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {colors.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelect({ type: 'color', ...c })}
                                    className={`aspect-square rounded-xl shadow-sm hover:scale-105 transition-transform border border-black/5 ${c.preview}`}
                                    title={c.id}
                                />
                            ))}
                        </div>
                    )}

                    {activeTab === 'textures' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {textures.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => handleSelect({ type: 'texture', ...t })}
                                    className={`aspect-[3/4] rounded-xl shadow-sm hover:scale-105 transition-transform border border-soft-border relative overflow-hidden ${t.class.split(' ')[0]}`}
                                    style={t.texture ? { backgroundImage: `url(${t.texture})` } : {}}
                                >
                                    <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
                                    <span className="absolute bottom-2 left-2 text-xs font-bold text-black/50 uppercase tracking-widest">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="grid grid-cols-2 gap-4">
                            {images.map((img) => (
                                <button
                                    key={img.id}
                                    onClick={() => handleSelect({ type: 'image', ...img })}
                                    className="group relative aspect-video rounded-xl overflow-hidden hover:shadow-md transition-all"
                                >
                                    <img src={img.url} alt={img.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <span className="absolute bottom-2 left-3 text-white text-xs font-bold uppercase tracking-wider drop-shadow-md">{img.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ColorWallpaperModal;

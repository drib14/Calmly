import React, { useState } from 'react';
import axios from 'axios';
import { X, Image as ImageIcon, Film, Send, Loader2 } from 'lucide-react';
import Modal from '../Modal';
import { toast } from 'react-hot-toast';
import { useIdentity } from '../../context/IdentityContext';

const CreateClipModal = ({ isOpen, onClose, onCreated }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [loading, setLoading] = useState(false);

    const { currentIdentity } = useIdentity();

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setMediaType(selected.type.startsWith('video') ? 'video' : 'image');
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('media', file); // 'media' matches upload.single('media')
        formData.append('identityId', currentIdentity._id);

        try {
            await axios.post('/clips', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success("Clip created!");
            setFile(null);
            setPreview(null);
            if (onCreated) onCreated();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl border border-soft-border overflow-hidden">
                <div className="p-4 border-b border-soft-border flex justify-between items-center">
                    <h3 className="font-serif font-bold text-lg text-text">New Clip</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-background text-secondary">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {!file ? (
                        <div className="border-2 border-dashed border-soft-border rounded-xl p-8 flex flex-col items-center justify-center text-secondary hover:bg-background hover:border-primary transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*,video/*"
                                onChange={handleFileChange}
                            />
                            <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-3">
                                <ImageIcon size={24} />
                            </div>
                            <p className="font-medium">Upload Media</p>
                            <p className="text-xs mt-1">Photos or Videos</p>
                        </div>
                    ) : (
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-h-[400px]">
                            <button
                                onClick={() => { setFile(null); setPreview(null); }}
                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 z-10"
                            >
                                <X size={16} />
                            </button>

                            {mediaType === 'video' ? (
                                <video src={preview} className="w-full h-full object-contain" controls />
                            ) : (
                                <img src={preview} className="w-full h-full object-contain" />
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-soft-border flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!file || loading}
                        className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        <span>Share Clip</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateClipModal;

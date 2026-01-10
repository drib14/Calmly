import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Mail, Send, CheckCircle, Clock } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

const SupportInbox = () => {
    const { data: tickets, mutate } = useSWR('/admin/support', fetcher);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        try {
            await axios.post(`/admin/support/${selectedTicket._id}/reply`, {
                message: reply,
                close: true // Auto close for simplicity in this iteration
            });
            mutate();
            toast.success("Reply sent & ticket closed");
            setReply('');
            setSelectedTicket(null);
        } catch (err) {
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* List */}
            <div className="w-1/3 flex flex-col bg-[#1a1d24] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-[#1a1d24]">
                    <h2 className="text-white font-bold">Inbox</h2>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {tickets?.map(ticket => (
                        <div
                            key={ticket._id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 border-b border-white/5 cursor-pointer transition hover:bg-white/5 ${selectedTicket?._id === ticket._id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded ${ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                                    {ticket.status}
                                </span>
                                <span className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="text-white font-medium truncate mb-1">{ticket.subject}</h3>
                            <p className="text-gray-400 text-sm truncate">{ticket.user?.email}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail */}
            <div className="flex-1 bg-[#1a1d24] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                {selectedTicket ? (
                    <>
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedTicket.subject}</h2>
                            <div className="flex items-center space-x-3 text-sm text-gray-400">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <p className="text-white">{selectedTicket.user?.email}</p>
                                        <p className="text-xs">User ID: {selectedTicket.user?._id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-gray-300 leading-relaxed mb-6">
                                {selectedTicket.message}
                            </div>

                            {selectedTicket.replies?.map((r, i) => (
                                <div key={i} className="ml-8 mb-4">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-xs font-bold text-blue-400 uppercase">Admin Support</span>
                                        <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-gray-300 text-sm">
                                        {r.message}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <div className="p-4 border-t border-white/5 bg-[#15171c]">
                                <form onSubmit={handleReply}>
                                    <textarea
                                        className="w-full bg-[#1a1d24] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 resize-none h-24 mb-3"
                                        placeholder="Write a reply... (This will simulate an email)"
                                        value={reply}
                                        onChange={e => setReply(e.target.value)}
                                    />
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center space-x-2 transition disabled:opacity-50"
                                        >
                                            {sending ? 'Sending...' : <><Send size={16} /> <span>Reply & Close</span></>}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <Mail size={48} className="mb-4 opacity-20" />
                        <p>Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportInbox;

import React, { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Flag, Check, X, ExternalLink } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

const ReportManagement = () => {
    const { data: reports, mutate } = useSWR('/admin/reports', fetcher);

    const resolveReport = async (id, status) => {
        try {
            await axios.put(`/admin/reports/${id}`, { status });
            mutate();
            toast.success(`Report marked as ${status}`);
        } catch (err) {
            toast.error("Failed to update report");
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Content Reports</h1>
                <p className="text-gray-400">Review and resolve community reports.</p>
            </div>

            <div className="grid gap-4">
                {reports?.map(report => (
                    <div key={report._id} className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                    report.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                    report.status === 'resolved' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                                }`}>
                                    {report.status}
                                </span>
                                <span className="text-gray-500 text-sm">Reported {new Date(report.createdAt).toLocaleDateString()}</span>
                                <span className="text-gray-500 text-sm">• Type: {report.targetType}</span>
                            </div>

                            <h3 className="text-white font-medium text-lg mb-1">{report.reason}</h3>
                            <p className="text-gray-400 text-sm mb-4">Reporter: {report.reporter?.email || 'Unknown'}</p>

                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                <p className="text-sm text-gray-300 italic">
                                    "{report.target?.content || report.target?.name || 'Content unavailable or deleted'}"
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                            {report.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => resolveReport(report._id, 'resolved')}
                                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 py-2 rounded-lg text-sm font-bold transition"
                                    >
                                        <Check size={16} /> <span>Resolve</span>
                                    </button>
                                    <button
                                        onClick={() => resolveReport(report._id, 'dismissed')}
                                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-white/5 text-gray-400 hover:bg-white/10 py-2 rounded-lg text-sm font-bold transition"
                                    >
                                        <X size={16} /> <span>Dismiss</span>
                                    </button>
                                </>
                            )}
                            {/* In real app, Link to view context */}
                        </div>
                    </div>
                ))}

                {(!reports || reports.length === 0) && (
                    <div className="text-center py-12 text-gray-500 bg-[#1a1d24] rounded-2xl border border-white/5">
                        <Flag size={32} className="mx-auto mb-3 opacity-20" />
                        <p>No reports found. The community is calm.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportManagement;

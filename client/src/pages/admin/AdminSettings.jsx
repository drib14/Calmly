import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ToggleLeft, ToggleRight, Save } from 'lucide-react';

const fetcher = url => axios.get(url).then(res => res.data);

const AdminSettings = () => {
    const { data: settings, mutate } = useSWR('/admin/settings', fetcher);

    const toggleSetting = async (key) => {
        const currentValue = settings?.[key];
        const newValue = !currentValue;

        // Optimistic update
        mutate({ ...settings, [key]: newValue }, false);

        try {
            await axios.put('/admin/settings', { key, value: newValue });
            toast.success("Setting updated");
        } catch (err) {
            toast.error("Failed to update");
            mutate(); // Revert
        }
    };

    if (!settings) return <div className="text-white">Loading...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">System Settings</h1>
                <p className="text-gray-400">Configure global platform behavior.</p>
            </div>

            <div className="grid gap-6">
                {/* Maintenance Mode */}
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Maintenance Mode</h3>
                        <p className="text-gray-400 text-sm">
                            When enabled, non-admin users will see a maintenance page and cannot access the app.
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSetting('maintenanceMode')}
                        className={`text-4xl transition-colors ${settings.maintenanceMode ? 'text-green-500' : 'text-gray-600'}`}
                    >
                        {settings.maintenanceMode ? <ToggleRight /> : <ToggleLeft />}
                    </button>
                </div>

                {/* Registration */}
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Allow Registrations</h3>
                        <p className="text-gray-400 text-sm">
                            Enable or disable new user sign-ups.
                        </p>
                    </div>
                    <button
                        onClick={() => toggleSetting('allowRegistration')}
                        className={`text-4xl transition-colors ${settings.allowRegistration !== false ? 'text-green-500' : 'text-gray-600'}`}
                    >
                        {settings.allowRegistration !== false ? <ToggleRight /> : <ToggleLeft />}
                    </button>
                </div>

                {/* System Announcements */}
                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">System Announcements</h3>
                            <p className="text-gray-400 text-sm">Broadcast a message to all users.</p>
                        </div>
                        <button
                            onClick={() => {
                                const current = settings.systemAnnouncement || { text: '', active: false };
                                const newVal = { ...current, active: !current.active };
                                mutate({ ...settings, systemAnnouncement: newVal }, false);
                                axios.put('/admin/settings', { key: 'systemAnnouncement', value: newVal })
                                    .then(() => toast.success("Status updated"))
                                    .catch(() => toast.error("Failed to update"));
                            }}
                            className={`text-4xl transition-colors ${settings.systemAnnouncement?.active ? 'text-green-500' : 'text-gray-600'}`}
                        >
                             {settings.systemAnnouncement?.active ? <ToggleRight /> : <ToggleLeft />}
                        </button>
                    </div>

                    <div className="flex gap-2">
                         <input
                            className="bg-black/20 border border-white/10 rounded px-3 py-2 text-white flex-1"
                            placeholder="Announcement text..."
                            defaultValue={settings.systemAnnouncement?.text || ''}
                            id="announcementInput"
                         />
                         <button
                            onClick={() => {
                                const text = document.getElementById('announcementInput').value;
                                const active = settings.systemAnnouncement?.active !== false; // Default true if undefined? No, explicit.
                                // Logic: If clicking send, we update text. Active state handled by toggle?
                                // Let's update both.
                                const newVal = { text, active };
                                mutate({ ...settings, systemAnnouncement: newVal }, false);
                                axios.put('/admin/settings', { key: 'systemAnnouncement', value: newVal })
                                    .then(() => toast.success("Announcement updated"))
                                    .catch(() => toast.error("Failed to update"));
                            }}
                            className="bg-blue-600 px-4 py-2 rounded text-white font-bold hover:bg-blue-500 transition"
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;

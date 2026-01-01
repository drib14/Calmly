import useSWR from 'swr';
import axios from 'axios';

const fetcher = url => axios.get(url).then(res => res.data);

export const useNotifications = () => {
    const { data: notifications, error, mutate } = useSWR('/notifications', fetcher, { refreshInterval: 10000 });

    const markAllRead = async () => {
        try {
            await axios.put('/notifications/read');
            mutate(); // Re-fetch to update read status
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        try {
            await axios.delete('/notifications');
            mutate([], false);
        } catch (err) {
            console.error(err);
        }
    }

    const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

    return {
        notifications,
        unreadCount,
        isLoading: !notifications && !error,
        error,
        markAllRead,
        clearAll
    };
};

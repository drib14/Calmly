import { formatDistanceToNowStrict } from 'date-fns';

export const formatShortTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);

    if (diffInSeconds < 60) return 'just now';

    const distance = formatDistanceToNowStrict(d);

    // date-fns returns "5 minutes", "1 hour", "2 years"
    // We parse and abbreviate.

    const parts = distance.split(' ');
    const val = parts[0];
    const unit = parts[1];

    if (unit.startsWith('second')) return 'just now';
    if (unit.startsWith('minute')) return `${val}m`;
    if (unit.startsWith('hour')) return `${val}h`;
    if (unit.startsWith('day')) return `${val}d`;
    if (unit.startsWith('month')) return `${val}mo`;
    if (unit.startsWith('year')) return `${val}y`;

    return distance;
};

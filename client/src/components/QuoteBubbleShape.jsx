import React from 'react';

const QuoteBubbleShape = ({ className, style, moodColorClass }) => {
    // Determine fill, stroke based on moodColorClass string if passed, or rely on className
    // moodColorClass example: 'bg-slate-100 text-slate-900 border-slate-200'
    // We need to convert it to SVG fill/stroke classes if provided, usually parent handles logic.
    // The parent passes `fill-... stroke-...` via className.

    return (
        <svg
            viewBox="0 0 120 100"
            className={className}
            preserveAspectRatio="none"
            style={style}
        >
            {/* Rounded Rectangle */}
            <rect x="5" y="5" width="110" height="75" rx="15" ry="15" strokeWidth="2" />

            {/* Trailing Circles (Tail) - Right Side */}
            <circle cx="95" cy="85" r="6" strokeWidth="2" />
            <circle cx="105" cy="95" r="4" strokeWidth="2" />
        </svg>
    );
};

export default QuoteBubbleShape;

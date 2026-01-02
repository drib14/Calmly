// Placeholder for wallpapers or future API integration
export const WALLPAPERS = {
    'soft-light': 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=2400&auto=format&fit=crop', // White silk/texture
    'dark': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2400&auto=format&fit=crop', // Abstract dark
    'sage': 'https://images.unsplash.com/photo-1615716260197-2804d99435b6?q=80&w=2400&auto=format&fit=crop', // Sage watercolor
    'ocean': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2400&auto=format&fit=crop', // Ocean/Sand
};

export const THEMES = {
    'soft-light': {
        name: 'Soft Light',
        bg: 'bg-slate-50',
        text: 'text-slate-900',
        primary: 'bg-slate-900',
        wallpaper: WALLPAPERS['soft-light']
    },
    'dark': {
        name: 'Midnight',
        bg: 'bg-slate-900',
        text: 'text-slate-100',
        primary: 'bg-white',
        wallpaper: WALLPAPERS['dark']
    },
    'sage': {
        name: 'Sage',
        bg: 'bg-stone-50',
        text: 'text-stone-800',
        primary: 'bg-emerald-900',
        wallpaper: WALLPAPERS['sage']
    },
    'ocean': {
        name: 'Ocean',
        bg: 'bg-cyan-50',
        text: 'text-cyan-900',
        primary: 'bg-cyan-800',
        wallpaper: WALLPAPERS['ocean']
    }
};

// Local CSS Gradients/Patterns for Wallpapers (No External APIs)

// We use data:image SVGs or CSS gradients to ensure speed and privacy
const PATTERNS = {
    soft: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    dark: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
};

export const WALLPAPERS = {
    'soft-light': PATTERNS.soft,
    'dark': PATTERNS.dark,
};

export const THEMES = {
    'soft-light': {
        name: 'Light',
        bg: 'bg-slate-50',
        text: 'text-slate-900',
        primary: 'bg-slate-900',
        wallpaper: WALLPAPERS['soft-light']
    },
    'dark': {
        name: 'Dark',
        bg: 'bg-slate-900',
        text: 'text-slate-100',
        primary: 'bg-white',
        wallpaper: WALLPAPERS['dark']
    }
};

// Post Backgrounds (For Plain Posts)
export const POST_BACKGROUNDS = [
    { id: 'none', label: 'None', class: 'bg-white' },
    { id: 'paper', label: 'Paper', class: 'bg-[#fdfbf7] shadow-inner', style: { backgroundImage: PATTERNS.soft } },
    { id: 'dark', label: 'Night', class: 'bg-slate-900 text-white', style: { backgroundImage: PATTERNS.dark } },
    { id: 'gradient-1', label: 'Sunrise', class: 'bg-gradient-to-br from-orange-100 to-rose-200' },
    { id: 'gradient-2', label: 'Dusk', class: 'bg-gradient-to-br from-slate-200 to-purple-200' },
];

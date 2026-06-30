type IconProps = { className?: string };

const wrap = (className: string | undefined, children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="url(#gc-gold)"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="gc-gold" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f5d57a" />
        <stop offset="50%" stopColor="#e6b450" />
        <stop offset="100%" stopColor="#b07d2a" />
      </linearGradient>
    </defs>
    {children}
  </svg>
);

export const IconPackage = ({ className }: IconProps) => wrap(className, <>
  <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
  <path d="M3 8l9 5 9-5" />
  <path d="M12 13v8" />
  <path d="M7.5 5.5l9 5" />
</>);

export const IconPalette = ({ className }: IconProps) => wrap(className, <>
  <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-1 2-2 0-1.2-1-1.5-1-2.5 0-.8.7-1.5 1.5-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" />
  <circle cx="7.5" cy="11" r="1" fill="url(#gc-gold)" />
  <circle cx="10" cy="7" r="1" fill="url(#gc-gold)" />
  <circle cx="14.5" cy="7" r="1" fill="url(#gc-gold)" />
  <circle cx="17" cy="11" r="1" fill="url(#gc-gold)" />
</>);

export const IconFlask = ({ className }: IconProps) => wrap(className, <>
  <path d="M9 3h6" />
  <path d="M10 3v6L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3" />
  <path d="M7 15h10" />
</>);

export const IconGamepad = ({ className }: IconProps) => wrap(className, <>
  <path d="M6 8h12a4 4 0 0 1 4 4v2a3 3 0 0 1-5.5 1.7L15 14H9l-1.5 1.7A3 3 0 0 1 2 14v-2a4 4 0 0 1 4-4Z" />
  <path d="M7 12h3M8.5 10.5v3" />
  <circle cx="15.5" cy="12" r="0.8" fill="url(#gc-gold)" />
  <circle cx="17.5" cy="13.5" r="0.8" fill="url(#gc-gold)" />
</>);

export const IconBot = ({ className }: IconProps) => wrap(className, <>
  <rect x="4" y="8" width="16" height="11" rx="3" />
  <path d="M12 4v4" />
  <circle cx="12" cy="3" r="1" fill="url(#gc-gold)" />
  <circle cx="9" cy="13" r="1" fill="url(#gc-gold)" />
  <circle cx="15" cy="13" r="1" fill="url(#gc-gold)" />
  <path d="M9 17h6" />
  <path d="M2 13v2M22 13v2" />
</>);

export const IconCube = ({ className }: IconProps) => wrap(className, <>
  <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
  <path d="M3 8l9 5 9-5M12 13v8" />
</>);

export const IconChat = ({ className }: IconProps) => wrap(className, <>
  <path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
  <path d="M8 10h8M8 13h5" />
</>);

export const IconSearch = ({ className }: IconProps) => wrap(className, <>
  <circle cx="11" cy="11" r="6" />
  <path d="m20 20-4.3-4.3" />
</>);


export const IconDownload = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M4 19h16" />
  </svg>
);

export const IconGlobe = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

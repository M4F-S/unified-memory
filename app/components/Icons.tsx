"use client";

import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

export const BrainIcon = ({ className = "", size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9.5 4C7.5 4 6 5.5 6 7.5c0 .8.3 1.5.8 2.1-.3.4-.5.9-.5 1.4 0 .8.4 1.5 1 1.9-.2.4-.3.8-.3 1.2 0 1.1.9 2 2 2h.5c.3 1.2 1.3 2 2.5 2s2.2-.8 2.5-2h.5c1.1 0 2-.9 2-2 0-.4-.1-.8-.3-1.2.6-.4 1-1.1 1-1.9 0-.5-.2-1-.5-1.4.5-.6.8-1.3.8-2.1C17 5.5 15.5 4 13.5 4c-.8 0-1.5.3-2.1.8C10.9 4.3 10.2 4 9.5 4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M9 10c-.5 0-1-.2-1.4-.6M15 10c.5 0 1-.2 1.4-.6M12 13v3M10.5 15l1.5 1.5 1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TrophyIcon = ({ className = "", size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 4H5a2 2 0 00-2 2v1a3 3 0 003 3h1M17 4h2a2 2 0 012 2v1a3 3 0 01-3 3h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const MailIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 7l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GitHubIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.01 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12c0-5.52-4.48-10-10-10z"/>
  </svg>
);

export const ChatGPTIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 009.89 1.03 6.046 6.046 0 006.035.56a6.056 6.056 0 00-5.14 4.48 6.052 6.052 0 00-2.88 4.24 6.046 6.046 0 00.996 4.87 5.99 5.99 0 00.516 4.899 6.046 6.046 0 006.51 2.9 6.065 6.065 0 004.855 1.98 6.046 6.046 0 003.854 1.47 6.056 6.056 0 005.14-4.48 6.052 6.052 0 002.88-4.24 6.046 6.046 0 00-.996-4.869zM13.47 18.62a3.82 3.82 0 01-2.458-.886l.13-.752.012-.06a5.44 5.44 0 001.76.296 5.41 5.41 0 002.07-.412 3.03 3.03 0 01-1.172-2.36v-.06c0-.284.036-.556.104-.816a3.7 3.7 0 01-.712.072 3.73 3.73 0 01-1.61-.38 5.38 5.38 0 002.798-2.932 5.37 5.37 0 00.188-.784 3.74 3.74 0 012.178 2.03 3.73 3.73 0 01.12 2.83 3.75 3.75 0 01-2.86 2.107z"/>
  </svg>
);

export const ClaudeIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.304 3.541c-2.51.052-4.72 1.453-5.995 3.495a7.31 7.31 0 00-.54 1.094 7.2 7.2 0 00-.54-1.094C8.954 5.002 6.744 3.6 4.234 3.55.072 3.468-1.596 8.94 1.34 11.604c-.84 2.697.688 5.893 3.56 6.566 2.51.052 4.72-1.453 5.995-3.495a7.31 7.31 0 00.54-1.094 7.2 7.2 0 00.54 1.094c1.275 2.042 3.485 3.547 5.995 3.495 3.68-.076 5.35-4.64 2.89-7.054 2.934-2.666 1.265-8.138-2.895-8.057l.34-.518zM7.337 16.57c-2.055-.137-3.475-2.11-3.085-4.088.39-1.978 2.42-3.358 4.475-3.22 1.344.09 2.556.9 3.13 2.126a6.68 6.68 0 00-1.22 2.97 6.62 6.62 0 00-3.3 2.212zm9.325 0c-.924-.88-2.12-1.432-3.396-1.582a6.68 6.68 0 00-1.22-2.97c.575-1.225 1.787-2.035 3.13-2.126 2.055-.138 4.085 1.242 4.475 3.22.39 1.978-1.03 3.95-3.085 4.088l.096.37z"/>
  </svg>
);

export const MusicIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const ChatIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CameraIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 6l1.5-2h5L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TwitterIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const BriefcaseIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="2" y="7" width="20" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const DocumentIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HashIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GamepadIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M6 11h2M7 10v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17 11.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM15 13.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
    <path d="M2 10.5a4.5 4.5 0 014.5-4.5h11a4.5 4.5 0 014.5 4.5v3a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 13.5v-3z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

export const PlaneIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const UsersIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const PlayIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5v14l11-7z"/>
  </svg>
);

export const HeartIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FistIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M18 11V7a2 2 0 00-2-2h-1M14 5V3a2 2 0 00-2-2h-1M10 5V3a2 2 0 00-2-2H7a2 2 0 00-2 2v8a6 6 0 006 6h.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 11v2a6 6 0 01-6 6h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RunIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="13" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 21l2-4 3 3 1-4M14 14l-2-2-3 2-1-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 10l3 2 2-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ClockIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BookIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GearIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HeartFilledIcon = ({ className = "", size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

export const LockIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const LinkIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const BoltIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const RobotIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="13" r="1" fill="currentColor"/>
    <circle cx="15" cy="13" r="1" fill="currentColor"/>
    <path d="M12 13v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const DnaIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 15c2-2 4-2 6 0s4 2 6 0M2 9c2 2 4 2 6 0s4-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 9c2-2 4-2 6 0s4 2 6 0M10 15c2 2 4 2 6 0s4-2 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 3"/>
  </svg>
);

export const SatelliteIcon = ({ className = "", size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const CircleIcon = ({ className = "", size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

export const RedCircleIcon = ({ className = "", size = 10 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="12" cy="12" r="10"/>
  </svg>
);

export const SunIcon = ({ className = "", size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const MoonIcon = ({ className = "", size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

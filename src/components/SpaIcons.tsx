import React from 'react';

// Facial Outline with sparkle stars
export const FacialIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle */}
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Head & shoulders contour */}
    <path
      d="M32 18C26.5 18 22.5 22.5 22.5 28C22.5 34 26.5 39 32 39C37.5 39 41.5 34 41.5 28C41.5 22.5 37.5 18 32 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Hair parting / sweep */}
    <path
      d="M23.5 25C26 21.5 28.5 20.5 32 20.5C35.5 20.5 38 21.5 40.5 25"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Eyes serene closed curves */}
    <path
      d="M27 28.5C28 29.5 29.5 29.5 30 28.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M34 28.5C34.5 29.5 36 29.5 37 28.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Gentle smile */}
    <path
      d="M29.5 34C30.5 35 33.5 35 34.5 34"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    {/* Neck & Shoulders */}
    <path
      d="M29 38.5V43C25 45 19 48 16 52"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M35 38.5V43C39 45 45 48 48 52"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Sparkle 1 */}
    <path
      d="M16 20L17 17L20 16L17 15L16 12L15 15L12 16L15 17L16 20Z"
      fill="currentColor"
    />
    {/* Sparkle 2 */}
    <path
      d="M48 22L48.8 19.5L51.3 18.7L48.8 17.9L48 15.4L47.2 17.9L44.7 18.7L47.2 19.5L48 22Z"
      fill="currentColor"
    />
  </svg>
);

// Lotus Flower Body Massage Icon
export const LotusIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle */}
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Center petal */}
    <path
      d="M32 20C32 20 27 27 27 34C27 38.5 29.5 42 32 43C34.5 42 37 38.5 37 34C37 27 32 20 32 20Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left inner petal */}
    <path
      d="M28 25C24.5 27 21 32 22 36.5C22.8 40 25.5 41.5 28.5 42C26.5 39 26.5 33 28 25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right inner petal */}
    <path
      d="M36 25C39.5 27 43 32 42 36.5C41.2 40 38.5 41.5 35.5 42C37.5 39 37.5 33 36 25Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left wide outer petal */}
    <path
      d="M24 32C19 34 16 38.5 17.5 42.5C18.8 45.5 22.5 46 26.5 44C23.5 41.5 23 36.5 24 32Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Right wide outer petal */}
    <path
      d="M40 32C45 34 48 38.5 46.5 42.5C45.2 45.5 41.5 46 37.5 44C40.5 41.5 41 36.5 40 32Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Base water line/cradle */}
    <path
      d="M22 46C26 48 38 48 42 46"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

// Stacked Zen Hot Stones Icon
export const HotStoneIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer circle */}
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
    
    {/* Top Stone */}
    <ellipse
      cx="32"
      cy="23"
      rx="7"
      ry="4.5"
      fill="currentColor"
      opacity="0.85"
    />
    {/* Middle Stone */}
    <ellipse
      cx="32"
      cy="32"
      rx="11"
      ry="5.5"
      fill="currentColor"
      opacity="0.9"
    />
    {/* Bottom Stone */}
    <ellipse
      cx="32"
      cy="42"
      rx="15"
      ry="6.5"
      fill="currentColor"
    />
  </svg>
);

// Treatment Packages Gift / Sparkle Icon
export const PackagesIcon: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M20 28H44V44C44 45.1 43.1 46 42 46H22C20.9 46 20 45.1 20 44V28Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18 24H46V28H18V24Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M32 24V46"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M26 24C24 24 23 21 26 18C29 15 32 23 32 24"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M38 24C40 24 41 21 38 18C35 15 32 23 32 24"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

// Small decorative delicate heart with subtle wings/lines
export const SpaHeartDivider: React.FC<{ className?: string }> = ({ className = "text-[#BE757C]" }) => (
  <div className={`flex items-center justify-center gap-3 w-full my-2 ${className}`}>
    <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#BE757C]/60"></span>
    <span className="text-xs text-[#BE757C] select-none font-serif">♡</span>
    <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#BE757C]/60"></span>
  </div>
);

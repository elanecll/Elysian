import React from 'react';
import { SpaHeartDivider } from './SpaIcons';
import { ChevronRight, Home } from 'lucide-react';
import { PageTab } from '../types';

interface PageBannerProps {
  title: string;
  subtitle: string;
  tagline?: string;
  backgroundImage?: string;
  currentPageName: string;
  onNavigateHome: () => void;
}

export const PageBanner: React.FC<PageBannerProps> = ({
  title,
  subtitle,
  tagline = 'SANCTUARY OF WELLNESS',
  backgroundImage,
  currentPageName,
  onNavigateHome,
}) => {
  return (
    <div className="relative bg-gradient-to-b from-[#F1EADC] to-[#FAF7F1] border-b border-[#D6C3A3]/40 pt-6 pb-7 sm:pt-8 sm:pb-9 px-4 overflow-hidden">
      {backgroundImage && (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
          <img
            src={backgroundImage}
            alt=""
            className="h-full w-full object-cover object-[center_25%] saturate-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(241,234,220,0.72),rgba(248,244,234,0.82)_50%,rgba(250,247,241,0.94))]" />
        </div>
      )}
      {/* Subtle decorative background circles */}
      <div className="absolute top-0 right-10 w-72 h-72 rounded-full bg-[#806035]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full bg-[#D6C3A3]/15 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10 text-center">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-2 text-xs text-[#7C674D] mb-4">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1 hover:text-[#806035] transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          <ChevronRight className="w-3 h-3 text-[#806035]/50" />
          <span className={`${backgroundImage ? 'text-[#72512F]' : 'text-[#806035]'} font-semibold`}>{currentPageName}</span>
        </nav>

        {/* Tagline & Heart */}
        <p className={`text-xs sm:text-sm tracking-[0.3em] ${backgroundImage ? 'text-[#72512F]' : 'text-[#806035]'} uppercase font-semibold font-sans-clean`}>
          {tagline}
        </p>
        <div className="max-w-xs mx-auto my-2">
          <SpaHeartDivider />
        </div>

        {/* Page Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display text-[#493A2D] mt-2 mb-3">
          {title}
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg font-serif-luxury italic text-[#71604E] max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

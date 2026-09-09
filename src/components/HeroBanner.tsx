import React from 'react';
import { FacialIcon, LotusIcon, HotStoneIcon, SpaHeartDivider } from './SpaIcons';
import { motion } from 'motion/react';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';

interface HeroBannerProps {
  onOpenBooking: (serviceCategory?: string) => void;
  onExploreTreatments: (category?: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenBooking, onExploreTreatments }) => {
  const bgImageUrl = "https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6a955cf2f22eac14d9b37f77.jpeg";

  return (
    <section id="hero" className="relative w-full overflow-hidden bg-[#FFF5F5] min-h-[640px] lg:min-h-[740px] flex items-center">
      {/* Background Image Container */}
      <div 
        className="absolute inset-0 bg-cover bg-right md:bg-center lg:bg-right bg-no-repeat transition-all duration-700"
        style={{ backgroundImage: `url(${bgImageUrl})` }}
      >
        {/* Soft gradient wash on mobile and left side for optimal contrast while retaining visual warmth */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF7F7]/95 via-[#FFF7F7]/85 to-transparent sm:via-[#FFF7F7]/70 md:via-[#FFF7F7]/50 lg:from-[#FFF7F7]/90 lg:via-[#FFF7F7]/40 lg:to-transparent pointer-events-none" />
        
        {/* Ambient cherry blossom petal floating elements */}
        <div className="absolute top-8 left-12 w-3 h-3 rounded-full bg-pink-200/50 blur-[1px] animate-float-slow pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-4 h-4 rounded-full bg-pink-300/40 blur-[1px] animate-float-slow [animation-delay:2s] pointer-events-none" />
        <div className="absolute bottom-20 left-16 w-2.5 h-2.5 rounded-full bg-pink-200/60 blur-[1px] animate-float-slow [animation-delay:4s] pointer-events-none" />
      </div>

      {/* Main Content Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="max-w-2xl lg:max-w-2xl">
          
          {/* Top Tagline with decorative heart & fine lines */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-start mb-3"
          >
            <p className="text-[11px] sm:text-[13px] md:text-[14px] tracking-[0.28em] sm:tracking-[0.35em] text-[#BE757C] uppercase font-semibold font-sans-clean select-none">
              RELAX &nbsp;•&nbsp; REJUVENATE &nbsp;•&nbsp; RESTORE
            </p>
            <div className="w-full max-w-xs my-1">
              <SpaHeartDivider className="text-[#BE757C] justify-start" />
            </div>
          </motion.div>

          {/* Main Headline with exact dual-color typography */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-display font-normal text-[#3D2B27] tracking-tight leading-[1.12] sm:leading-[1.15] mb-3"
          >
            <span className="block text-[#3D2B27] uppercase drop-shadow-sm">
              FACIAL, BODY MASSAGE
            </span>
            <span className="block uppercase drop-shadow-sm">
              <span className="text-[#BE757C] font-normal">&amp; HOT STONE </span>
              <span className="text-[#3D2B27]">MASSAGE</span>
            </span>
          </motion.h1>

          {/* Middle Sub-Tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-5 sm:mb-6"
          >
            <p className="text-xs sm:text-sm tracking-[0.28em] sm:tracking-[0.34em] text-[#BE757C] uppercase font-medium font-sans-clean">
              RELAX &nbsp;•&nbsp; REJUVENATE &nbsp;•&nbsp; RESTORE
            </p>
          </motion.div>

          {/* Editorial Italic Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base sm:text-lg md:text-[19px] font-serif-luxury italic text-[#4A352F] leading-[1.65] max-w-xl mb-8 font-normal"
          >
            Indulge in a complete journey of relaxation and renewal. Our expert therapists are dedicated to help you feel refreshed, balanced and radiant — inside and out.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 sm:mb-4"
          >
            <button
              id="hero-book-btn"
              onClick={() => onOpenBooking()}
              className="group relative inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs sm:text-sm tracking-[0.15em] uppercase transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-pink-100 transition-transform group-hover:scale-110" />
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              id="hero-explore-btn"
              onClick={() => onExploreTreatments('all')}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-full border border-[#BE757C]/40 hover:border-[#BE757C] text-[#3D2B27] hover:text-[#BE757C] bg-white/70 hover:bg-white backdrop-blur-xs font-medium text-xs sm:text-sm tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer shadow-xs hover:shadow-sm"
            >
              <span>Explore Treatments</span>
            </button>
          </motion.div>

          {/* 50% Downpayment Policy note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="text-[11px] sm:text-xs text-[#5C4A45]/85 font-medium mb-10 flex items-center gap-2 font-sans-clean"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#BE757C]" />
            <span>50% Downpayment secures booking • Remaining balance settled on arrival</span>
          </motion.p>

          {/* 3 Bottom Feature Badges matching the exact image layout */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="pt-2 border-t border-[#BE757C]/15 sm:border-transparent"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-4 md:gap-6">
              
              {/* Badge 1: Facial */}
              <button
                id="badge-facial"
                onClick={() => onExploreTreatments('facial')}
                className="group flex items-center gap-3 text-left hover:opacity-90 transition-all duration-200 cursor-pointer"
              >
                <div className="text-[#BE757C] transition-transform duration-300 group-hover:scale-105">
                  <FacialIcon className="w-11 h-11 sm:w-12 sm:h-12 text-[#BE757C]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold tracking-[0.14em] text-[#BE757C] uppercase font-sans-clean">
                    FACIAL
                  </h4>
                  <p className="text-[10px] sm:text-[11px] tracking-[0.1em] text-[#BE757C]/90 uppercase font-sans-clean whitespace-nowrap">
                    BRIGHTEN &amp; REJUVENATE
                  </p>
                </div>
              </button>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-9 w-[1px] bg-[#E8BAC0]/70" />

              {/* Badge 2: Body Massage */}
              <button
                id="badge-body-massage"
                onClick={() => onExploreTreatments('body-massage')}
                className="group flex items-center gap-3 text-left hover:opacity-90 transition-all duration-200 cursor-pointer"
              >
                <div className="text-[#BE757C] transition-transform duration-300 group-hover:scale-105">
                  <LotusIcon className="w-11 h-11 sm:w-12 sm:h-12 text-[#BE757C]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold tracking-[0.14em] text-[#BE757C] uppercase font-sans-clean">
                    BODY MASSAGE
                  </h4>
                  <p className="text-[10px] sm:text-[11px] tracking-[0.1em] text-[#BE757C]/90 uppercase font-sans-clean whitespace-nowrap">
                    RELAX &amp; REBALANCE
                  </p>
                </div>
              </button>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-9 w-[1px] bg-[#E8BAC0]/70" />

              {/* Badge 3: Hot Stone Massage */}
              <button
                id="badge-hot-stone"
                onClick={() => onExploreTreatments('hot-stone')}
                className="group flex items-center gap-3 text-left hover:opacity-90 transition-all duration-200 cursor-pointer"
              >
                <div className="text-[#BE757C] transition-transform duration-300 group-hover:scale-105">
                  <HotStoneIcon className="w-11 h-11 sm:w-12 sm:h-12 text-[#BE757C]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-bold tracking-[0.14em] text-[#BE757C] uppercase font-sans-clean">
                    HOT STONE MASSAGE
                  </h4>
                  <p className="text-[10px] sm:text-[11px] tracking-[0.1em] text-[#BE757C]/90 uppercase font-sans-clean whitespace-nowrap">
                    SOOTHE &amp; RESTORE
                  </p>
                </div>
              </button>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

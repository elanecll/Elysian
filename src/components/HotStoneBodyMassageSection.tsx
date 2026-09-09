import React from 'react';
import { SpaHeartDivider, HotStoneIcon, LotusIcon, FacialIcon } from './SpaIcons';
import { Sparkles, ArrowRight, Clock, ShieldCheck, Flower2, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface HotStoneBodyMassageSectionProps {
  onOpenBooking: (serviceId?: string) => void;
}

export const HotStoneBodyMassageSection: React.FC<HotStoneBodyMassageSectionProps> = ({
  onOpenBooking,
}) => {
  return (
    <section
      id="hotstone-body-massage"
      className="py-16 lg:py-24 bg-[#FFF9F9] relative overflow-hidden border-t border-[#E8BAC0]/30"
    >
      {/* Ambient background soft glow */}
      <div className="absolute top-1/3 left-0 -translate-y-1/2 w-96 h-96 bg-[#FAD9DC]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#F5E6E8]/35 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Top Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
            FEATURED SANCTUARY RITUAL
          </p>
          <div className="max-w-xs mx-auto my-2">
            <SpaHeartDivider />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-3 mb-4 leading-tight">
            Facial, Body Massage &amp; Hot Stone Therapy
          </h2>
          <p className="text-base sm:text-lg font-serif-luxury italic text-[#5C4A45] leading-relaxed">
            A harmonious fusion combining revitalizing botanical facials, customized neuromuscular bodywork, and heated volcanic basalt stone grounding.
          </p>
        </div>

        {/* Main Showcase Layout */}
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Description & Highlights */}
          <div className="text-center space-y-4">
            <p className="text-xs tracking-[0.25em] text-[#BE757C] uppercase font-semibold font-sans-clean">
              TRIPLE HARMONY IMMERSION
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display text-[#3D2B27] leading-snug">
              The Complete Sanctuary Journey for Mind &amp; Body
            </h3>
            <p className="text-sm sm:text-base text-[#5C4A45] leading-relaxed font-sans-clean max-w-2xl mx-auto">
              Indulge in our most celebrated wellness ritual. Begin with a personalized botanical skin enzyme facial, transition into a customized deep tissue and Swedish body massage, and finish with grounding heated volcanic basalt stones positioned along your energy channels.
            </p>
          </div>

          {/* Feature Mini Cards: Heated Volcanic Basalt & Therapeutic Massage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8BAC0]/40 shadow-xs hover:border-[#BE757C]/60 transition-colors">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="p-2 rounded-xl bg-[#FFF0F2] text-[#BE757C]">
                  <HotStoneIcon className="w-5 h-5 text-[#BE757C]" />
                </div>
                <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#3D2B27]">
                  Heated Volcanic Basalt
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed">
                Smooth river-polished stones heated to 125°F melt deep muscular tension and improve circulation.
              </p>
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E8BAC0]/40 shadow-xs hover:border-[#BE757C]/60 transition-colors">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="p-2 rounded-xl bg-[#FFF0F2] text-[#BE757C]">
                  <LotusIcon className="w-5 h-5 text-[#BE757C]" />
                </div>
                <h4 className="text-sm sm:text-base font-bold uppercase tracking-wider text-[#3D2B27]">
                  Therapeutic Massage
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed">
                Rhythmic Swedish and acupressure bodywork paired with warm organic damask rose and arnica oils.
              </p>
            </div>
          </div>

          {/* Mockup Image directly under Heated Volcanic & Therapeutic Massage */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#E8BAC0]/50 group bg-white">
              {/* Exact Mockup Image */}
              <img
                id="mockup-showcase-image"
                src="https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6a955c2f9ced56098acb6593.png"
                alt="Facial, Body Massage & Hot Stone Therapy at Elysian Spa"
                className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />

              {/* Bottom Subtle Overlay Bar */}
              <div className="p-4 sm:p-5 bg-gradient-to-t from-[#3D2B27]/95 via-[#3D2B27]/75 to-transparent absolute bottom-0 inset-x-0 text-white flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#E8BAC0] font-sans-clean font-semibold">
                    RELAX • REJUVENATE • RESTORE
                  </p>
                  <p className="font-serif-luxury italic text-sm text-[#FFF0F2]">
                    Complete mind &amp; somatic recalibration
                  </p>
                </div>
                <span className="text-xs bg-[#BE757C] text-white px-3 py-1 rounded-full font-sans-clean font-semibold">
                  75 - 90 Min
                </span>
              </div>
            </div>

            {/* Floating Decorative Badge */}
            <div className="hidden sm:flex absolute -bottom-4 -right-4 z-20 bg-white/95 backdrop-blur-md py-3 px-5 rounded-2xl border border-[#E8BAC0] shadow-lg items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#BE757C] border border-[#BE757C]/30">
                <HotStoneIcon className="w-5 h-5 text-[#BE757C]" />
              </div>
              <div>
                <p className="text-[10px] tracking-wider uppercase font-bold text-[#BE757C]">Botanical Radiance</p>
                <p className="text-xs font-bold text-[#3D2B27]">100% Organic Essential Oils</p>
              </div>
            </div>
          </motion.div>

          {/* Inclusions & Booking Trigger Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF0F2] border border-[#F0D5D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#BE757C] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Includes Scalp &amp; Foot Acupressure</span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4A45] mt-1 font-serif-luxury italic">
                Private tea lounge admission with warm botanical towels
              </p>
            </div>

            <button
              id="book-mockup-section-btn"
              onClick={() => onOpenBooking('elysian-glow-4in1')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-widest uppercase transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reserve Ritual</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};

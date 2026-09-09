import React from 'react';
import { FacialIcon, LotusIcon, HotStoneIcon, SpaHeartDivider } from './SpaIcons';
import { Clock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ServiceHighlightsProps {
  onSelectService: (serviceId: string) => void;
}

export const ServiceHighlights: React.FC<ServiceHighlightsProps> = ({ onSelectService }) => {
  const pillars = [
    {
      id: 'facial-hydraglow',
      categoryKey: 'facial',
      badge: 'SKIN ILLUMINATION',
      title: 'Facial Aesthetics',
      subtitle: 'Brighten & Rejuvenate',
      icon: <FacialIcon className="w-14 h-14 text-[#BE757C]" />,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      duration: '30 - 75 min',
      price: 'From £35',
      description: 'Revitalize cellular radiance through Hydro-Facials, EMS lifting, Radio Frequency, Ultrasonic infusion, and PDT Oxygen LED therapy.',
      features: [
        'Hydro-Facial deep extraction & hydration',
        'EMS & Radio Frequency collagen lift',
        'Ultrasonic nutrient infusion',
        '🌿 Tropic Organic & 🔬 Clinicare active tiers'
      ]
    },
    {
      id: 'swedish-back-massage',
      categoryKey: 'body-massage',
      badge: 'HOLISTIC BODYWORK',
      title: 'Body Massage',
      subtitle: 'Relax & Rebalance',
      icon: <LotusIcon className="w-14 h-14 text-[#BE757C]" />,
      image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      duration: '30 - 60 min',
      price: 'From £20',
      description: 'Melt accumulated muscular tension with customized targeted back, neck & shoulder, and revitalizing leg massages.',
      features: [
        'Swedish Full Body Massage (60 min)',
        'Swedish Back Massage (30 min)',
        'Focused Back, Neck & Shoulder relief',
        'Leg tiredness & circulation revival'
      ]
    },
    {
      id: 'hot-stone-full-body-massage',
      categoryKey: 'hot-stone',
      badge: 'THERMAL HEALING',
      title: 'Hot Stone Therapy',
      subtitle: 'Soothe & Restore',
      icon: <HotStoneIcon className="w-14 h-14 text-[#BE757C]" />,
      image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80',
      duration: '30 - 60 min',
      price: 'From £40',
      description: 'Harness the therapeutic deep warmth of heated volcanic basalt stones placed on key energy meridians to ground and renew your spirit.',
      features: [
        'Hot Stone Full Body Massage (60 min)',
        'Hot Stone Back Massage (30 min)',
        'Heated smooth volcanic basalt stones',
        'Remineralizing organic body oils'
      ]
    }
  ];

  return (
    <section id="services" className="py-20 lg:py-28 bg-[#FFF9F9] relative overflow-hidden">
      {/* Decorative ambient background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FAD9DC]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#F5E6E8]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
            OUR THREE SIGNATURE PILLARS
          </p>
          <div className="max-w-xs mx-auto my-2">
            <SpaHeartDivider />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-3 mb-4">
            Curated Sanctuary Rituals
          </h2>
          <p className="text-base sm:text-lg font-serif-luxury italic text-[#5C4A45] leading-relaxed">
            Every therapy is thoughtfully customized to your unique somatic rhythms, blending ancient holistic techniques with clean botanical active formulations.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="group bg-white rounded-2xl p-7 lg:p-8 border border-[#E8BAC0]/40 hover:border-[#BE757C]/60 shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle top rose gradient highlight */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F5D2D6] via-[#BE757C] to-[#F5D2D6] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div>
                {/* Header Icon + Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className="p-1 rounded-full text-[#BE757C] transition-transform duration-300 group-hover:scale-110">
                    {pillar.icon}
                  </div>
                  <span className="text-[10px] tracking-widest font-semibold uppercase px-3 py-1 rounded-full bg-[#FFF0F2] text-[#BE757C] border border-[#BE757C]/20">
                    {pillar.badge}
                  </span>
                </div>

                {/* Pillar Titles matching design */}
                <h3 className="text-2xl font-display text-[#3D2B27] uppercase tracking-wide mb-1 group-hover:text-[#BE757C] transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#BE757C] uppercase font-sans-clean mb-4">
                  {pillar.subtitle}
                </p>

                {/* Duration & Price Row */}
                <div className="flex items-center gap-4 py-2 px-3 rounded-lg bg-[#FAF2F3] text-xs text-[#5C423E] mb-5 font-sans-clean">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#BE757C]" />
                    {pillar.duration}
                  </span>
                  <span className="text-[#BE757C]">•</span>
                  <span className="font-semibold text-[#BE757C]">
                    {pillar.price}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[#5C4A45] leading-relaxed mb-6 font-sans-clean">
                  {pillar.description}
                </p>

                {/* Key Benefits List */}
                <div className="space-y-2.5 mb-8 border-t border-[#F0D5D8]/50 pt-5">
                  {pillar.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-[#4A352F]">
                      <CheckCircle2 className="w-4 h-4 text-[#BE757C] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                id={`book-${pillar.categoryKey}-btn`}
                onClick={() => onSelectService(pillar.id)}
                className="w-full mt-auto py-3 px-4 rounded-xl bg-[#FFF0F2] hover:bg-[#BE757C] text-[#BE757C] hover:text-white font-medium text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-[#BE757C]/30 hover:border-[#BE757C] cursor-pointer shadow-2xs hover:shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Reserve This Ritual</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

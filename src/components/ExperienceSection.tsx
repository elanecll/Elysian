import React from 'react';
import { SpaHeartDivider } from './SpaIcons';
import { Leaf, Flame, ShieldCheck, HeartHandshake, Sparkles, Moon, Flower2, Calendar, ArrowRight, Coffee, Heart, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface ExperienceSectionProps {
  onOpenBooking?: () => void;
  onExploreTreatments?: () => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  onOpenBooking,
  onExploreTreatments,
}) => {
  const experiences = [
    {
      icon: <Leaf className="w-6 h-6 text-[#BE757C]" />,
      title: 'Pure Organic Botanicals',
      desc: 'Formulated with fresh cold-pressed rosehip, damask rose essence, soothing calendula, and therapeutic grade arnica with zero synthetic additives.'
    },
    {
      icon: <Flame className="w-6 h-6 text-[#BE757C]" />,
      title: 'Heated Basalt & Salt Stones',
      desc: 'Naturally smooth, energy-conductive volcanic stones and hand-cut Himalayan pink crystals warmed precisely to 125°F for profound thermal relief.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#BE757C]" />,
      title: 'Licensed Master Therapists',
      desc: 'Each aesthetician and bodywork specialist possesses extensive dedicated practice across aesthetic dermatology and neuromuscular therapy.'
    },
    {
      icon: <Moon className="w-6 h-6 text-[#BE757C]" />,
      title: 'Private Acoustic Suites',
      desc: 'Sound-insulated treatment sanctuaries fitted with ergonomic memory foam heated tables, ambient candlelight, and custom botanical aroma diffusion.'
    }
  ];

  const ritualSteps = [
    {
      step: '01',
      title: 'Aromatherapy Welcome',
      desc: 'Begin with soothing botanical flower tea and a calming warm herbal towel while choosing your bespoke essential oil blend.'
    },
    {
      step: '02',
      title: 'Personalized Consultation',
      desc: 'A private discussion covering your skincare goals, pressure preferences, and tension focus areas for a tailored treatment.'
    },
    {
      step: '03',
      title: 'The Restorative Ritual',
      desc: 'Immerse into our heated memory foam beds as rhythmic touch, warm basalt stones, or active botanical serums work in harmony.'
    },
    {
      step: '04',
      title: 'Sanctuary Awakening',
      desc: 'Gentle somatic grounding followed by fresh botanical herbal tea and tailored post-treatment skincare advice.'
    }
  ];

  return (
    <section id="experience" className="py-16 lg:py-24 bg-[#FAF3F3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Main Grid: Story + Feature Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mb-20">
          
          {/* Left Text / Sanctuary Story */}
          <div className="lg:col-span-6">
            <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
              THE ELYSIAN PHILOSOPHY
            </p>
            <div className="w-32 my-2">
              <SpaHeartDivider className="justify-start" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-3 mb-6 leading-tight">
              An Oasis of Serenity Designed for Deep Restoration
            </h2>

            <p className="text-base sm:text-lg font-serif-luxury italic text-[#5C4A45] leading-relaxed mb-6">
              "We believe that authentic rejuvenation occurs when the senses are gently stilled, allowing the mind and body to recalibrate in harmony."
            </p>

            <p className="text-sm text-[#4A352F]/90 leading-relaxed font-sans-clean mb-8">
              From the moment you step into our Blackpool sanctuary, your bespoke journey commences. Unwind in our serene botanical courtyard lounge with complimentary flower tea, complete a tailored consultation, and surrender to skilled restorative hands.
            </p>

            {/* Quality Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E8BAC0]/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#BE757C] border border-[#BE757C]/20">
                  <Flower2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27]">100% Clean</h4>
                  <p className="text-[11px] text-[#5C4A45]">🌿 Tropic &amp; 🔬 Clinicare Actives</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#BE757C] border border-[#BE757C]/20">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27]">Tailored Care</h4>
                  <p className="text-[11px] text-[#5C4A45]">Bespoke Pressure &amp; Rhythm</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Feature Grid */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-[#E8BAC0]/40 hover:border-[#BE757C]/60 shadow-xs hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFF2F4] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {exp.icon}
                </div>
                <h3 className="text-base font-display text-[#3D2B27] uppercase tracking-wide mb-2 group-hover:text-[#BE757C] transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-[#5C4A45] leading-relaxed font-sans-clean">
                  {exp.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>

        {/* The 4-Step Guest Journey Breakdown */}
        <div className="pt-12 border-t border-[#E8BAC0]/50">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
              YOUR TIME WITH US
            </p>
            <div className="max-w-xs mx-auto my-2">
              <SpaHeartDivider />
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display text-[#3D2B27] mt-2 mb-3">
              The 4-Step Sanctuary Ritual
            </h3>
            <p className="text-sm sm:text-base font-serif-luxury italic text-[#5C4A45]">
              Every appointment is a seamless flow of attentive care and unhurried peace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ritualSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-[#E8BAC0]/40 shadow-xs flex flex-col justify-between relative group hover:border-[#BE757C]/60 transition-all"
              >
                <div>
                  <span className="text-3xl font-display text-[#E8BAC0] group-hover:text-[#BE757C] transition-colors font-light block mb-2">
                    {step.step}
                  </span>
                  <h4 className="text-base font-display text-[#3D2B27] mb-2 uppercase tracking-wide">
                    {step.title}
                  </h4>
                  <p className="text-xs text-[#5C4A45] leading-relaxed font-sans-clean">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTAs */}
          {(onOpenBooking || onExploreTreatments) && (
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              {onOpenBooking && (
                <button
                  onClick={onOpenBooking}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs sm:text-sm tracking-widest uppercase transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Your Experience</span>
                </button>
              )}
              {onExploreTreatments && (
                <button
                  onClick={onExploreTreatments}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-[#BE757C]/50 hover:border-[#BE757C] text-[#3D2B27] hover:text-[#BE757C] bg-white font-medium text-xs sm:text-sm tracking-widest uppercase transition-all cursor-pointer"
                >
                  <span>View Treatment Tariff</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

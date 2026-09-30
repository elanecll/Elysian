import React, { useState, useEffect } from 'react';
import { SPA_SERVICES } from '../data/spaData';
import { SpaHeartDivider, FacialIcon, LotusIcon, HotStoneIcon, PackagesIcon } from './SpaIcons';
import { Clock, Sparkles, Check, ArrowRight, PlusCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TreatmentMenuProps {
  onBookTreatment: (
    treatmentId: string,
    preferredProduct?: 'tropic' | 'clinicare',
    preferredDuration?: '30' | '60',
    isCourse?: boolean
  ) => void;
  selectedCategory?: string;
}

export const TreatmentMenu: React.FC<TreatmentMenuProps> = ({ onBookTreatment, selectedCategory = 'all' }) => {
  const [activeTab, setActiveTab] = useState<string>(selectedCategory || 'all');
  const [durationFilter, setDurationFilter] = useState<'all' | '30' | '60'>('all');
  const [cardDurations, setCardDurations] = useState<Record<string, '30' | '60'>>({});
  const [activeImageKey, setActiveImageKey] = useState<Record<string, 'main' | 'beforeAfter'>>({});

  useEffect(() => {
    if (selectedCategory) {
      setActiveTab(selectedCategory);
    }
  }, [selectedCategory]);

  const tabs = [
    { id: 'all', label: 'All Treatments' },
    { id: 'packages', label: 'Treatment Packages', icon: <PackagesIcon className="w-4 h-4" /> },
    { id: 'facial', label: 'Facial Aesthetics', icon: <FacialIcon className="w-4 h-4" /> },
    { id: 'body-massage', label: 'Body Massage', icon: <LotusIcon className="w-4 h-4" /> },
    { id: 'hot-stone', label: 'Hot Stone Therapy', icon: <HotStoneIcon className="w-4 h-4" /> },
    { id: 'addons', label: 'Add-Ons', icon: <PlusCircle className="w-4 h-4" /> },
  ];

  const filteredTreatments = SPA_SERVICES.filter((treatment) => {
    if (activeTab !== 'all' && treatment.category !== activeTab) {
      return false;
    }
    // Filter by duration when in facial or packages category and durationFilter is not 'all'
    if ((treatment.category === 'facial' || treatment.category === 'packages') && durationFilter !== 'all') {
      if (durationFilter === '30') {
        const has30 =
          treatment.priceOptions?.some((opt) => opt.duration.toLowerCase().includes('30') || opt.duration.toLowerCase().includes('35')) ||
          treatment.duration.includes('30') ||
          treatment.duration.includes('35');
        return has30;
      }
      if (durationFilter === '60') {
        const has60 =
          treatment.priceOptions?.some((opt) => opt.duration.toLowerCase().includes('60') || opt.duration.toLowerCase().includes('45')) ||
          treatment.duration.includes('60') ||
          treatment.duration.includes('75') ||
          treatment.duration.includes('45');
        return has60;
      }
    }
    return true;
  });

  const getActiveDurationForCard = (treatmentId: string): '30' | '60' => {
    if (cardDurations[treatmentId]) return cardDurations[treatmentId];
    if (durationFilter === '60') return '60';
    return '30';
  };

  const handleCardDurationChange = (treatmentId: string, duration: '30' | '60') => {
    setCardDurations((prev) => ({ ...prev, [treatmentId]: duration }));
  };

  return (
    <section id="menu" className="py-8 sm:py-12 bg-[#FFF9F9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <p className="text-xs tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
            THE WELLNESS TARIFF
          </p>
          <div className="max-w-xs mx-auto my-1.5">
            <SpaHeartDivider />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display text-[#3D2B27] mt-2 mb-2">
            Treatment Menu &amp; Pricing
          </h2>
          <p className="text-sm sm:text-base font-serif-luxury italic text-[#5C4A45]">
            Featuring advanced medical-grade 🔬 CLINICARE Swedish cosmeceutical formulations.
          </p>
        </div>

        {/* Filter Tabs / Treatment Packages Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isPackageTab = tab.id === 'packages';
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-sans-clean tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  isActive
                    ? isPackageTab
                      ? 'bg-gradient-to-r from-[#BE757C] to-[#A9636A] text-white shadow-md ring-2 ring-[#BE757C]/30'
                      : 'bg-[#BE757C] text-white shadow-md'
                    : isPackageTab
                    ? 'bg-[#FFF0F2] text-[#BE757C] border border-[#BE757C]/50 hover:bg-[#FBE8EB]'
                    : 'bg-white text-[#5C423E] border border-[#E8BAC0]/50 hover:border-[#BE757C] hover:text-[#BE757C]'
                }`}
              >
                {tab.icon && <span className={isActive ? 'text-white' : 'text-[#BE757C]'}>{tab.icon}</span>}
                <span className="font-medium">{tab.label}</span>
                {isPackageTab && !isActive && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#BE757C] text-white text-[9px] font-bold tracking-normal normal-case">
                    Save
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Skincare Formulation & Duration Filter Bar for Facials & Series */}
        {(activeTab === 'facial' || activeTab === 'all' || activeTab === 'packages') && (
          <div className="mb-6 bg-white rounded-2xl p-4 sm:p-5 border border-[#E8BAC0]/70 shadow-xs max-w-4xl mx-auto">
            <div className="text-center mb-3">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#BE757C]" />
                <span className="text-xs sm:text-sm uppercase tracking-widest text-[#3D2B27] font-bold font-sans-clean">
                  Facial Aesthetics — 🔬 CLINICARE Cosmeceuticals
                </span>
              </div>
              <p className="text-xs text-[#5C4A45] max-w-2xl mx-auto">
                Formulated exclusively with medical-grade <strong className="text-[#8C3F48] font-semibold">🔬 CLINICARE Swedish cosmeceuticals</strong> (low-molecular hyaluronic acid &amp; biomimetic peptides). Choose from 30-min express and 60-min luxury rituals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F0D5D8]">
              <div className="flex items-center gap-2 text-xs text-[#5C4A45]">
                <Clock className="w-4 h-4 text-[#BE757C]" />
                <span className="font-semibold text-[#3D2B27]">Filter By Duration:</span>
              </div>
              <div className="inline-flex flex-wrap p-1 bg-[#FFF9F9] rounded-xl border border-[#E8BAC0]/80 gap-1">
                <button
                  type="button"
                  id="btn-facial-all"
                  onClick={() => setDurationFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    durationFilter === 'all'
                      ? 'bg-[#3D2B27] text-white shadow-xs'
                      : 'text-[#6B5550] hover:text-[#BE757C]'
                  }`}
                >
                  All Durations
                </button>
                <button
                  type="button"
                  id="btn-facial-30-mins"
                  onClick={() => {
                    setDurationFilter('30');
                    const updated: Record<string, '30' | '60'> = {};
                    SPA_SERVICES.forEach((s) => {
                      updated[s.id] = '30';
                    });
                    setCardDurations(updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    durationFilter === '30'
                      ? 'bg-[#BE757C] text-white shadow-xs ring-1 ring-[#A9636A]'
                      : 'text-[#5C423E] hover:bg-[#FFF0F2]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> 30 Mins Express
                </button>
                <button
                  type="button"
                  id="btn-facial-60-mins"
                  onClick={() => {
                    setDurationFilter('60');
                    const updated: Record<string, '30' | '60'> = {};
                    SPA_SERVICES.forEach((s) => {
                      updated[s.id] = '60';
                    });
                    setCardDurations(updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    durationFilter === '60'
                      ? 'bg-[#BE757C] text-white shadow-xs ring-1 ring-[#A9636A]'
                      : 'text-[#5C423E] hover:bg-[#FFF0F2]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> 60 Mins Full
                </button>
              </div>
            </div>

            {/* 50% Deposit Policy Bar */}
            <div className="mt-3 px-3.5 py-2 rounded-xl bg-[#5C423E] text-[#FFF0F2] flex items-center justify-between gap-2 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#BE757C] text-white text-[10px] font-bold tracking-wider uppercase font-sans-clean shrink-0">
                  50% Deposit Policy
                </span>
                <span className="text-[11px] leading-tight">
                  Every booking requires a 50% downpayment at checkout to reserve your treatment room. Balance is settled upon arrival.
                </span>
              </div>
              <span className="text-[10px] text-[#E8BAC0] font-sans-clean italic hidden sm:inline">
                Instant digital receipt &amp; 24h flexible rescheduling
              </span>
            </div>
          </div>
        )}

        {/* Treatments Grid */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <AnimatePresence>
            {filteredTreatments.map((treatment) => {
              const opt30 = treatment.priceOptions?.find((o) =>
                o.duration.toLowerCase().includes('30')
              );
              const opt60 = treatment.priceOptions?.find((o) =>
                o.duration.toLowerCase().includes('60')
              );
              const hasDurationChoice = !!(opt30 && opt60);
              const activeCardDur = getActiveDurationForCard(treatment.id);
              const activeOpt = activeCardDur === '60' && opt60 ? opt60 : opt30 || treatment.priceOptions?.[0];

              const contentBlock = (
                <>
                  <div>
                    <div className="mb-2">
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-[#BE757C] uppercase font-sans-clean">
                        {treatment.tagline}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-display text-[#3D2B27] mt-1 group-hover:text-[#BE757C] transition-colors pr-24">
                        {treatment.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed mb-4 font-sans-clean">
                      {treatment.description}
                    </p>

                    {/* Formulation Breakdown & Duration Options */}
                    {hasDurationChoice && (
                      <div className="mb-5 space-y-3">
                        {/* Interactive Duration Selector on Card */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C4A45] font-sans-clean">
                            Select Duration:
                          </span>
                          <div className="inline-flex items-center p-1 bg-[#FAF0F2] rounded-xl border border-[#F0D5D8]">
                            <button
                              type="button"
                              onClick={() => handleCardDurationChange(treatment.id, '30')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeCardDur === '30'
                                  ? 'bg-[#BE757C] text-white shadow-xs'
                                  : 'text-[#6B5550] hover:text-[#BE757C]'
                              }`}
                            >
                              30 Mins Express
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCardDurationChange(treatment.id, '60')}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                activeCardDur === '60'
                                  ? 'bg-[#BE757C] text-white shadow-xs'
                                  : 'text-[#6B5550] hover:text-[#BE757C]'
                              }`}
                            >
                              60 Mins Full Ritual
                            </button>
                          </div>
                        </div>

                        {/* 🔬 CLINICARE TREATMENT BOX */}
                        <div className="rounded-xl p-3.5 border bg-gradient-to-br from-[#FFF4F6] to-[#FAF0F2] border-[#BE757C]/40 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F48] tracking-wide">
                              <span>🔬</span> CLINICARE Cosmeceuticals
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBE8EB] text-[#8C3F48] font-sans-clean">
                              Active Peptides &amp; HA
                            </span>
                          </div>

                          <p className="text-[11px] text-[#7A5852] mb-2 leading-tight">
                            Advanced Swedish medical-grade low-molecular hyaluronic acid and biomimetic peptide complex.
                          </p>

                          <div className="flex items-center justify-between pt-1 border-t border-[#F0D0D5]/70">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-[#3D2B27] font-medium">
                                {activeCardDur === '30' ? '30m Express:' : '60m Full:'}
                              </span>
                              <span className="text-base font-bold text-[#BE757C] font-display">
                                £{activeCardDur === '30' ? (opt30?.priceClinicare ?? opt30?.priceSingle) : (opt60?.priceClinicare ?? opt60?.priceSingle)}
                              </span>
                              <span className="text-[10px] text-[#8C3F48] font-semibold bg-[#FCE8EB] px-1.5 py-0.5 rounded">
                                50% dep: £{(Number(activeCardDur === '30' ? (opt30?.priceClinicare ?? opt30?.priceSingle) : (opt60?.priceClinicare ?? opt60?.priceSingle)) * 0.5).toFixed(2).replace('.00', '')}
                              </span>
                              <span className="text-[10px] text-[#7A5852]">
                                {activeCardDur === '30' ? `(60m: £${opt60?.priceClinicare ?? opt60?.priceSingle})` : `(30m: £${opt30?.priceClinicare ?? opt30?.priceSingle})`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onBookTreatment(treatment.id, 'clinicare', activeCardDur)}
                              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#BE757C] hover:bg-[#A9636A] text-white transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                            >
                              Book Ritual
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!hasDurationChoice && treatment.priceOptions && treatment.priceOptions.length > 0 && (
                      <div className="bg-[#FFF9F9] rounded-xl p-3.5 border border-[#F0D5D8] mb-4 space-y-2">
                        <p className="text-[10px] tracking-wider uppercase font-bold text-[#BE757C] font-sans-clean">
                          Pricing &amp; Duration Breakdown:
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {treatment.priceOptions.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="flex flex-wrap items-center justify-between gap-1 py-1 border-b border-[#F5E6E8] last:border-0"
                            >
                              <span className="font-medium text-[#3D2B27]">
                                {opt.label ? opt.label : opt.duration}
                              </span>
                              <div className="flex items-center gap-3">
                                {(opt.priceClinicare !== undefined || opt.priceSingle !== undefined) && (
                                  <span className="font-bold text-[#BE757C]">
                                    £{opt.priceClinicare ?? opt.priceSingle}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefit highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3 pt-2.5 border-t border-[#F5E6E8]">
                      {treatment.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5 text-xs text-[#4A352F]">
                          <Check className="w-3.5 h-3.5 text-[#BE757C] shrink-0 mt-0.5" />
                          <span className="leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer with Price and Book Button */}
                  <div className="pt-3 border-t border-[#F5E6E8] flex flex-wrap items-center justify-between gap-2 mt-auto">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5C4A45]">
                        <Clock className="w-3.5 h-3.5 text-[#BE757C]" />
                        <span>
                          {hasDurationChoice
                            ? activeCardDur === '30'
                              ? '30 mins (Express)'
                              : '60 mins (Full Ritual)'
                            : treatment.duration}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-display font-medium text-[#3D2B27] mt-0.5">
                        {hasDurationChoice ? (
                          <span>
                            <span className="font-bold text-[#BE757C]">
                              £{activeCardDur === '30' ? (opt30?.priceClinicare ?? opt30?.priceSingle) : (opt60?.priceClinicare ?? opt60?.priceSingle)}
                            </span>{' '}
                            <span className="text-xs text-[#5C4A45] font-sans-clean font-normal">
                              (🔬 CLINICARE)
                            </span>
                          </span>
                        ) : (
                          treatment.priceDisplay
                        )}
                      </div>
                      <span className="inline-block text-[10px] text-[#BE757C] font-semibold mt-0.5">
                        💳 50% deposit to secure booking
                      </span>
                    </div>

                    <button
                      id={`book-item-${treatment.id}`}
                      type="button"
                      onClick={() => onBookTreatment(
                        treatment.id,
                        'clinicare',
                        hasDurationChoice ? activeCardDur : undefined,
                        false
                      )}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#BE757C] to-[#8C3F48] hover:from-[#A9636A] hover:to-[#7A363E] text-white font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FFDDE2]" />
                      <span>Book Treatment</span>
                    </button>
                  </div>
                </>
              );

              return (
                <motion.div
                  key={treatment.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-2xl p-5 sm:p-6 border ${
                    treatment.image
                      ? 'border-[#BE757C]/60 shadow-md ring-1 ring-[#BE757C]/20 bg-gradient-to-b from-white to-[#FFF9F9]'
                      : treatment.category === 'packages'
                      ? 'border-[#BE757C]/50 shadow-md ring-1 ring-[#BE757C]/20 bg-gradient-to-b from-white to-[#FFF9F9]'
                      : 'border-[#E8BAC0]/40 hover:border-[#BE757C]/70 shadow-xs hover:shadow-lg'
                  } transition-all duration-300 flex flex-col justify-between relative group`}
                >
                  {treatment.id === 'bring-a-friend-package' ? (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#BE757C] to-[#8C3F48] text-white text-[10px] tracking-widest font-bold uppercase shadow-sm">
                        <Sparkles className="w-3 h-3" /> Both Save 15% OFF
                      </span>
                    </div>
                  ) : treatment.id === 'facial-product-bundle-package' ? (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BE757C] text-white text-[10px] tracking-widest font-bold uppercase shadow-2xs">
                        <Gift className="w-3 h-3" /> 10% OFF Skincare
                      </span>
                    </div>
                  ) : treatment.category === 'packages' ? (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BE757C] text-white text-[10px] tracking-widest font-bold uppercase shadow-2xs">
                        <Gift className="w-3 h-3" /> Curated Package
                      </span>
                    </div>
                  ) : treatment.popular ? (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF0F2] text-[#BE757C] border border-[#BE757C]/30 text-[10px] tracking-widest font-bold uppercase">
                        <Sparkles className="w-3 h-3" /> Most Requested
                      </span>
                    </div>
                  ) : treatment.isAddon ? (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5EBE6] text-[#5C423E] border border-[#E8BAC0] text-[10px] tracking-widest font-bold uppercase">
                        Add-on Only
                      </span>
                    </div>
                  ) : null}

                  {treatment.image ? (
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch w-full h-full">
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        {contentBlock}
                      </div>
                      <div className="w-full sm:w-48 md:w-52 lg:w-56 shrink-0 flex flex-col items-center justify-center my-auto self-center">
                        {treatment.beforeAfterImage && (
                          <div className="flex items-center gap-1 p-1 bg-[#FAF0F2] rounded-xl border border-[#F0D5D8] mb-2 w-full justify-center">
                            <button
                              type="button"
                              onClick={() => setActiveImageKey((prev) => ({ ...prev, [treatment.id]: 'main' }))}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                (activeImageKey[treatment.id] ?? 'main') === 'main'
                                  ? 'bg-[#BE757C] text-white shadow-xs'
                                  : 'text-[#6B5550] hover:text-[#BE757C]'
                              }`}
                            >
                              Protocol
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveImageKey((prev) => ({ ...prev, [treatment.id]: 'beforeAfter' }))}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeImageKey[treatment.id] === 'beforeAfter'
                                  ? 'bg-[#BE757C] text-white shadow-xs'
                                  : 'text-[#6B5550] hover:text-[#BE757C]'
                              }`}
                            >
                              ✨ Before &amp; After
                            </button>
                          </div>
                        )}
                        <div className="w-full rounded-2xl overflow-hidden border border-[#E8BAC0]/70 shadow-sm bg-[#FAF0F2]">
                          <img
                            src={
                              activeImageKey[treatment.id] === 'beforeAfter' && treatment.beforeAfterImage
                                ? treatment.beforeAfterImage
                                : treatment.image
                            }
                            alt={
                              activeImageKey[treatment.id] === 'beforeAfter'
                                ? `${treatment.title} Before & After`
                                : treatment.title
                            }
                            className="w-full h-auto max-h-64 sm:max-h-72 object-contain block rounded-2xl mx-auto"
                            loading="lazy"
                          />
                        </div>
                        {treatment.beforeAfterImage && (
                          <div className="flex items-center justify-center gap-2 mt-2 w-full">
                            <button
                              type="button"
                              onClick={() => setActiveImageKey((prev) => ({ ...prev, [treatment.id]: 'main' }))}
                              className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-[#FAF0F2] ${
                                (activeImageKey[treatment.id] ?? 'main') === 'main'
                                  ? 'border-[#BE757C] shadow-xs ring-1 ring-[#BE757C]'
                                  : 'border-[#E8BAC0]/60 opacity-60 hover:opacity-100'
                              }`}
                              title="View Protocol Overview"
                            >
                              <img src={treatment.image} alt="Protocol Preview" className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveImageKey((prev) => ({ ...prev, [treatment.id]: 'beforeAfter' }))}
                              className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer bg-[#FAF0F2] ${
                                activeImageKey[treatment.id] === 'beforeAfter'
                                  ? 'border-[#BE757C] shadow-xs ring-1 ring-[#BE757C]'
                                  : 'border-[#E8BAC0]/60 opacity-60 hover:opacity-100'
                              }`}
                              title="View Before & After Results"
                            >
                              <img src={treatment.beforeAfterImage} alt="Before & After Preview" className="w-full h-full object-cover" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    contentBlock
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};

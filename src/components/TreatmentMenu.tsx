import React, { useState, useEffect } from 'react';
import { SPA_SERVICES } from '../data/spaData';
import { FACIAL_BUNDLE_ID } from '../../shared/facialBundle';
import { FacialIcon, LotusIcon, HotStoneIcon, PackagesIcon } from './SpaIcons';
import { Clock, Sparkles, Check, ArrowRight, PlusCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TreatmentMenuProps {
  onBookTreatment: (
    treatmentId: string,
    preferredProduct?: 'tropic' | 'clinicare',
    preferredDuration?: '30' | '60',
    isCourse?: boolean,
    asAddon?: boolean
  ) => void;
  selectedCategory?: string;
}

const panelClass = 'rounded-2xl border border-[#E8BAC0]/40 bg-white p-5 sm:p-6 shadow-xs';
const menuGroups = [
  { id: 'facials', title: 'Facial Treatments', categories: ['facial'] },
  { id: 'massages', title: 'Body Massage, Hot Stone & Add-ons', categories: ['hot-stone', 'body-massage', 'addons'] },
  { id: 'packages', title: 'Treatment Packages', categories: ['packages'] },
];
const formatTreatmentPrice = (price: number | string | undefined) =>
  typeof price === 'number' ? `£${price.toFixed(2).replace('.00', '')}` : price || 'Price on approval';
const filterButtonClass = (active: boolean) =>
  `inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm sm:text-base font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87464D] ${active
    ? 'border-[#87464D] bg-[#87464D] text-white'
    : 'border-[#E8BAC0]/40 bg-white text-[#5C4A45] hover:bg-[#FFF0F2] hover:border-[#BE757C]'}`;

export const TreatmentMenu: React.FC<TreatmentMenuProps> = ({ onBookTreatment, selectedCategory = 'all' }) => {
  const [activeTab, setActiveTab] = useState<string>(selectedCategory || 'all');
  const [durationFilter, setDurationFilter] = useState<'all' | '30' | '60'>('all');
  const [cardDurations, setCardDurations] = useState<Record<string, '30' | '60'>>({});

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
    if (activeTab !== 'all' && treatment.category !== activeTab && !(activeTab === 'addons' && treatment.canBeAddon)) {
      return false;
    }
    // Filter by duration when in facial or packages category and durationFilter is not 'all'
    if (activeTab !== 'addons' && (treatment.category === 'facial' || treatment.category === 'packages') && durationFilter !== 'all') {
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

  const menuItems = menuGroups.flatMap((group) =>
    filteredTreatments
      .filter((treatment) => group.categories.includes(treatment.category))
      .map((treatment, index) => ({
        treatment,
        heading: activeTab === 'all' && index === 0 ? group.title : null,
        groupId: group.id,
      }))
  );

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
        
        {/* Filter Tabs / Treatment Packages Bar */}
        <div className={`${panelClass} grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6`} aria-label="Treatment categories">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isPackageTab = tab.id === 'packages';
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={`${filterButtonClass(isActive)} flex-wrap font-sans-clean`}
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
          <div className={`${panelClass} mb-6`}>
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
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  id="btn-facial-all"
                  onClick={() => setDurationFilter('all')}
                  aria-pressed={durationFilter === 'all'}
                  className={filterButtonClass(durationFilter === 'all')}
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
                  aria-pressed={durationFilter === '30'}
                  className={filterButtonClass(durationFilter === '30')}
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
                  aria-pressed={durationFilter === '60'}
                  className={filterButtonClass(durationFilter === '60')}
                >
                  <Clock className="w-3.5 h-3.5" /> 60 Mins Full
                </button>
              </div>
            </div>

          </div>
        )}

        <div className={`${panelClass} mb-6`}>
          <h2 className="text-sm font-semibold text-[#3D2B27] mb-2">50% Deposit Policy</h2>
          <p className="text-xs sm:text-sm text-[#5C4A45] leading-relaxed">
            A 50% deposit confirms your treatment booking. Once confirmed, the deposit is non-refundable, subject to your statutory cancellation and refund rights. The remaining balance is due upon arrival.
          </p>
          <p className="mt-2 text-xs text-[#7A5852]">Contact us to discuss rescheduling.</p>
        </div>

        {/* Treatments Grid */}
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <AnimatePresence>
            {menuItems.flatMap(({ treatment, heading, groupId }) => {
              const opt30 = treatment.priceOptions?.find((o) =>
                o.duration.toLowerCase().includes('30')
              );
              const opt60 = treatment.priceOptions?.find((o) =>
                o.duration.toLowerCase().includes('60')
              );
              const hasDurationChoice = treatment.category === 'facial' && !!(opt30 && opt60);
              const activeCardDur = getActiveDurationForCard(treatment.id);
              const activeOpt = activeCardDur === '60' && opt60 ? opt60 : opt30 || treatment.priceOptions?.[0];
              const activePrice = activeOpt?.priceClinicare ?? activeOpt?.priceSingle;
              const activeDeposit = typeof activePrice === 'number' && Number.isFinite(activePrice)
                ? formatTreatmentPrice(Math.round(activePrice * 100 / 2) / 100) : undefined;
              const badge = treatment.comingSoon ? 'COMING SOON'
                : treatment.id === 'bring-a-friend-package' ? treatment.priceDisplay
                : treatment.id === 'facial-product-bundle-package' ? '10% OFF Skincare'
                : treatment.category === 'packages' ? 'Curated Package'
                : treatment.canBeAddon ? 'Also available as an add-on'
                : treatment.popular ? 'Most Requested'
                : treatment.isAddon ? 'Add-on Only' : null;

              const contentBlock = (
                <>
                  <div>
                    {badge && (
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E8BAC0]/40 bg-[#FFF0F2] px-3 py-1 text-xs font-semibold text-[#87464D]">
                          {treatment.category === 'packages' ? <Gift className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          {badge}
                        </span>
                      </div>
                    )}
                    <div className={`mb-4 grid items-start gap-4 ${treatment.image ? 'grid-cols-[minmax(0,1fr)_6rem] sm:grid-cols-[minmax(0,1fr)_8rem]' : 'grid-cols-1'}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold tracking-wide text-[#87464D] uppercase font-sans-clean mb-2 leading-relaxed">
                          {treatment.tagline}
                        </p>
                        <h3 id={`treatment-title-${treatment.id}`} className="text-xl sm:text-2xl font-display text-[#3D2B27] group-hover:text-[#BE757C] transition-colors leading-snug break-words">
                          {treatment.title}
                        </h3>
                      </div>
                      {treatment.image && (
                        <div className="aspect-square w-full rounded-xl overflow-hidden border border-[#E8BAC0]/40 bg-[#FFF9F9]">
                          <img src={treatment.image} alt={treatment.title} className="block h-full w-full object-cover object-center" loading="lazy" />
                        </div>
                      )}
                    </div>

                    <p data-treatment-description className="text-sm sm:text-base text-[#5C4A45] leading-relaxed mb-5 font-sans-clean">
                      {treatment.description}
                    </p>

                    {/* Formulation Breakdown & Duration Options */}
                    {hasDurationChoice && (
                      <div className="mb-5 space-y-3">
                        {/* Interactive Duration Selector on Card */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#5C4A45] font-sans-clean">
                            Select Duration:
                          </span>
                          <div className="inline-flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCardDurationChange(treatment.id, '30')}
                              aria-pressed={activeCardDur === '30'}
                              className={filterButtonClass(activeCardDur === '30')}
                            >
                              30 Mins Express
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCardDurationChange(treatment.id, '60')}
                              aria-pressed={activeCardDur === '60'}
                              className={filterButtonClass(activeCardDur === '60')}
                            >
                              60 Mins Full Ritual
                            </button>
                          </div>
                        </div>

                        {/* 🔬 CLINICARE TREATMENT BOX */}
                        <div className="rounded-xl p-3.5 border border-[#E8BAC0]/40 bg-[#FFF9F9]">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F48] tracking-wide">
                              <span>🔬</span> CLINICARE Cosmeceuticals
                            </span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBE8EB] text-[#8C3F48] font-sans-clean">
                              Active Peptides &amp; HA
                            </span>
                          </div>

                          <p className="text-sm text-[#5C4A45] mb-3 leading-relaxed">
                            Advanced Swedish medical-grade low-molecular hyaluronic acid and biomimetic peptide complex.
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0D0D5]/70">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="text-[#3D2B27] font-medium">
                                {activeCardDur === '30' ? '30m Express:' : '60m Full:'}
                              </span>
                              <span className="text-base font-bold text-[#BE757C] font-display">
                                {formatTreatmentPrice(activePrice)}
                              </span>
                              <span className="text-[10px] text-[#8C3F48] font-semibold bg-[#FCE8EB] px-1.5 py-0.5 rounded">
                                {activeDeposit ? `50% dep: ${activeDeposit}` : 'Deposit confirmed on approval'}
                              </span>
                              <span className="text-[10px] text-[#7A5852]">
                                {activeCardDur === '30' ? `(60m: ${formatTreatmentPrice(opt60?.priceClinicare ?? opt60?.priceSingle)})` : `(30m: ${formatTreatmentPrice(opt30?.priceClinicare ?? opt30?.priceSingle)})`}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onBookTreatment(treatment.id, 'clinicare', activeCardDur)}
                              className="min-h-12 text-sm sm:text-base font-semibold px-5 py-3 rounded-full bg-[#87464D] hover:bg-[#71383F] text-white transition-colors cursor-pointer shadow-xs shrink-0"
                            >
                              Book Ritual
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {treatment.id === FACIAL_BUNDLE_ID && (
                      <div className="bg-[#FFF9F9] rounded-xl p-3.5 border border-[#E8BAC0]/40 mb-4 space-y-2 text-sm">
                        <p className="font-bold text-[#87464D]">Build your Facial + Product Bundle</p>
                        <p>Choose your CLINICARE facial at its usual price and duration, then choose skincare products with 10% off.</p>
                        <p>After approval, pay a 50% facial deposit plus the full discounted product price. Collect your products at your appointment.</p>
                      </div>
                    )}
                    {treatment.id !== FACIAL_BUNDLE_ID && !hasDurationChoice && treatment.priceOptions && treatment.priceOptions.length > 0 && (
                      <div className="bg-[#FFF9F9] rounded-xl p-3.5 border border-[#E8BAC0]/40 mb-4 space-y-2">
                        <p className="text-xs tracking-wide uppercase font-bold text-[#87464D] font-sans-clean">
                          Pricing &amp; Duration Breakdown:
                        </p>
                        <div className="space-y-2 text-sm">
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
                                    {formatTreatmentPrice(opt.priceClinicare ?? opt.priceSingle)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {treatment.addonPrice !== undefined && (
                      <p className="mb-4 rounded-xl bg-[#FFF0F2] p-3 text-sm font-semibold text-[#87464D]">
                        On its own: {treatment.priceDisplay}. Add to another treatment for only {formatTreatmentPrice(treatment.addonPrice)}.
                      </p>
                    )}

                    {/* Benefit highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 pt-4 border-t border-[#F5E6E8]">
                      {treatment.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-sm text-[#4A352F]">
                          <Check className="w-3.5 h-3.5 text-[#BE757C] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{benefit}</span>
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
                              {formatTreatmentPrice(activePrice)}
                            </span>{' '}
                            <span className="text-xs text-[#5C4A45] font-sans-clean font-normal">
                              (🔬 CLINICARE)
                            </span>
                          </span>
                        ) : (
                          activeTab === 'addons' && treatment.addonPrice !== undefined
                            ? `${formatTreatmentPrice(treatment.addonPrice)} as an add-on`
                            : treatment.priceDisplay
                        )}
                      </div>
                      <span className="inline-block text-[10px] text-[#BE757C] font-semibold mt-0.5">
                        {treatment.id === FACIAL_BUNDLE_ID ? '💳 50% facial deposit + discounted products paid in full' : '💳 50% deposit to secure booking'}
                      </span>
                    </div>

                    <button
                      id={`book-item-${treatment.id}`}
                      type="button"
                      disabled={treatment.comingSoon}
                      onClick={() => onBookTreatment(
                        treatment.id,
                        'clinicare',
                        hasDurationChoice ? activeCardDur : undefined,
                        false,
                        activeTab === 'addons' && treatment.addonPrice !== undefined
                      )}
                      className="inline-flex min-h-12 items-center gap-2 px-5 py-3 rounded-full bg-[#87464D] hover:bg-[#71383F] text-white font-semibold text-sm sm:text-base tracking-wide uppercase transition-colors shadow-xs hover:shadow-md cursor-pointer shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FFDDE2]" />
                      <span>{treatment.comingSoon ? 'COMING SOON' : activeTab === 'addons' && treatment.addonPrice !== undefined ? 'Add to booking' : 'Book Treatment'}</span>
                    </button>
                  </div>
                </>
              );

              const card = (
                <motion.div
                  key={treatment.id}
                  role="article"
                  aria-labelledby={`treatment-title-${treatment.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className={`${panelClass} hover:border-[#BE757C]/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group`}
                >
                  {contentBlock}
                </motion.div>
              );
              return heading ? [
                <motion.h2
                  key={`menu-group-${groupId}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full pt-4 first:pt-0 font-display text-2xl sm:text-3xl text-[#3D2B27]"
                >
                  {heading}
                </motion.h2>,
                card,
              ] : [card];
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};

import React, { useState, useEffect } from 'react';
import { SPA_SERVICES } from '../data/spaData';
import { SpaHeartDivider, FacialIcon, LotusIcon, HotStoneIcon, PackagesIcon } from './SpaIcons';
import { Clock, Sparkles, Check, ArrowRight, PlusCircle, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TreatmentMenuProps {
  onBookTreatment: (
    treatmentId: string,
    preferredProduct?: 'tropic' | 'clinicare',
    preferredDuration?: '30' | '60'
  ) => void;
  selectedCategory?: string;
}

export const TreatmentMenu: React.FC<TreatmentMenuProps> = ({ onBookTreatment, selectedCategory = 'all' }) => {
  const [activeTab, setActiveTab] = useState<string>(selectedCategory || 'all');
  const [durationFilter, setDurationFilter] = useState<'all' | '30' | '60'>('all');
  const [productLineFilter, setProductLineFilter] = useState<'all' | 'tropic' | 'clinicare'>('all');
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
    if (activeTab !== 'all' && treatment.category !== activeTab) {
      return false;
    }
    // Filter by duration when in facial or packages category and durationFilter is not 'all'
    if ((treatment.category === 'facial' || treatment.category === 'packages') && durationFilter !== 'all') {
      if (durationFilter === '30') {
        const has30 =
          treatment.priceOptions?.some((opt) => opt.duration.toLowerCase().includes('30')) ||
          treatment.duration.includes('30');
        return has30;
      }
      if (durationFilter === '60') {
        const has60 =
          treatment.priceOptions?.some((opt) => opt.duration.toLowerCase().includes('60')) ||
          treatment.duration.includes('60') ||
          treatment.duration.includes('75');
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
    <section id="menu" className="py-20 lg:py-28 bg-[#FFF9F9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
            THE WELLNESS TARIFF
          </p>
          <div className="max-w-xs mx-auto my-2">
            <SpaHeartDivider />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-3 mb-4">
            Treatment Menu &amp; Pricing
          </h2>
          <p className="text-base sm:text-lg font-serif-luxury italic text-[#5C4A45]">
            Featuring organic 🌿 Tropic botanicals and medical-grade 🔬 Clinicare cosmeceutical formulations.
          </p>
        </div>

        {/* Filter Tabs / Treatment Packages Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isPackageTab = tab.id === 'packages';
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-sans-clean tracking-wider uppercase transition-all duration-300 cursor-pointer ${
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

        {/* Skincare Product Line & Duration Filter Selector for Facials & Series */}
        {(activeTab === 'facial' || activeTab === 'all' || activeTab === 'packages') && (
          <div className="mb-10 bg-white rounded-2xl p-5 sm:p-7 border border-[#E8BAC0]/70 shadow-xs max-w-4xl mx-auto">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#BE757C]" />
                <span className="text-xs sm:text-sm uppercase tracking-widest text-[#3D2B27] font-bold font-sans-clean">
                  Facial Aesthetics &amp; Series Packages — Product Line &amp; Duration Selector
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4A45] max-w-2xl mx-auto">
                Select your preferred formulation: organic <strong className="text-emerald-900 font-semibold">🌿 Product Tropic</strong> botanicals or advanced <strong className="text-[#8C3F48] font-semibold">🔬 Product Clinicare</strong> cosmeceuticals, with 30-min express, 60-min rituals, and <strong className="text-[#BE757C] font-semibold">Buy 3 Get 1 FREE packages</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F0D5D8]">
              {/* 1. Product Line Separation */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#3D2B27] mb-2 flex items-center gap-1.5 font-sans-clean">
                  <span>🌿 / 🔬</span> Step 1: Skincare Product Line
                </label>
                <div className="inline-flex flex-wrap p-1 bg-[#FFF9F9] rounded-xl border border-[#E8BAC0]/80 gap-1 w-full justify-center sm:justify-start">
                  <button
                    type="button"
                    id="btn-filter-all-products"
                    onClick={() => setProductLineFilter('all')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      productLineFilter === 'all'
                        ? 'bg-[#3D2B27] text-white shadow-xs'
                        : 'text-[#6B5550] hover:text-[#BE757C]'
                    }`}
                  >
                    Compare Both
                  </button>
                  <button
                    type="button"
                    id="btn-filter-tropic"
                    onClick={() => setProductLineFilter('tropic')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      productLineFilter === 'tropic'
                        ? 'bg-emerald-800 text-white shadow-xs ring-1 ring-emerald-700'
                        : 'text-emerald-900 hover:bg-emerald-50'
                    }`}
                  >
                    <span>🌿</span> Product Tropic
                  </button>
                  <button
                    type="button"
                    id="btn-filter-clinicare"
                    onClick={() => setProductLineFilter('clinicare')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      productLineFilter === 'clinicare'
                        ? 'bg-[#BE757C] text-white shadow-xs ring-1 ring-[#A9636A]'
                        : 'text-[#8C3F48] hover:bg-[#FFF0F2]'
                    }`}
                  >
                    <span>🔬</span> Product Clinicare
                  </button>
                </div>
              </div>

              {/* 2. Duration Filter */}
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#3D2B27] mb-2 flex items-center gap-1.5 font-sans-clean">
                  <Clock className="w-3.5 h-3.5 text-[#BE757C]" /> Step 2: Treatment Duration
                </label>
                <div className="inline-flex flex-wrap p-1 bg-[#FFF9F9] rounded-xl border border-[#E8BAC0]/80 gap-1 w-full justify-center sm:justify-start">
                  <button
                    type="button"
                    id="btn-facial-all"
                    onClick={() => setDurationFilter('all')}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      durationFilter === '60'
                        ? 'bg-[#BE757C] text-white shadow-xs ring-1 ring-[#A9636A]'
                        : 'text-[#5C423E] hover:bg-[#FFF0F2]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> 60 Mins Full
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Product Breakdown Banner */}
            {productLineFilter === 'clinicare' && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-[#FFF4F6] to-[#FAF0F2] border border-[#F0D0D5] text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 font-bold text-sm text-[#3D2B27]">
                    <span className="p-1 rounded-md bg-[#BE757C] text-white text-xs">🔬</span>
                    Product Clinicare — Medical-Grade Cosmeceuticals &amp; Series
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#BE757C] text-white font-bold">
                    30 Min Express (£45–£52) • Series £135 / £186
                  </span>
                </div>
                <p className="text-xs text-[#5C4A45] leading-relaxed mb-3 font-sans-clean">
                  Advanced Swedish cosmeceuticals enriched with low-molecular hyaluronic acid, biomimetic peptides, and cellular bio-actives.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">Hydrodemabrasion (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£52</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">Radio Frequency (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£52</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">EMS Facial (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£50</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">Ultrasonic Facial (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£46</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">Lymphatic Drainage (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£46</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-[#F0D5D8] flex items-center justify-between">
                    <span className="text-[#3D2B27] font-medium">Microdermabrasion (30 min)</span>
                    <span className="font-bold text-[#BE757C]">£45</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-[#FBE8EB] to-[#FAF0F2] p-2.5 rounded-lg border border-[#BE757C]/40 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#BE757C] text-white">
                        4th FREE Series
                      </span>
                      <span className="text-[#3D2B27] font-semibold">
                        Microdermabrasion Series (Buy 3, Get 4th FREE)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8C3F48] font-bold">30 mins: £135</span>
                      <span className="text-[#5C4A45]">|</span>
                      <span className="text-[#8C3F48] font-bold">60 mins: £186</span>
                      <span className="text-[10px] text-[#7A5852]">(Save up to £62)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {productLineFilter === 'tropic' && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200 text-left">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center gap-2 font-bold text-sm text-emerald-950">
                    <span className="p-1 rounded-md bg-emerald-800 text-white text-xs">🌿</span>
                    Product Tropic — Fresh Organic Botanicals &amp; Series
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-800 text-white font-bold">
                    30 Min Express (£35–£42) • Series £105 / £144
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80 leading-relaxed mb-3 font-sans-clean">
                  100% natural, freshly blended cruelty-free tropical botanicals and bio-retinol plant extracts formulated for soothing, radiant glass skin.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">Hydrodemabrasion (30 min)</span>
                    <span className="font-bold text-emerald-800">£42</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">Radio Frequency (30 min)</span>
                    <span className="font-bold text-emerald-800">£42</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">EMS Facial (30 min)</span>
                    <span className="font-bold text-emerald-800">£40</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">Ultrasonic Facial (30 min)</span>
                    <span className="font-bold text-emerald-800">£36</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">Lymphatic Drainage (30 min)</span>
                    <span className="font-bold text-emerald-800">£36</span>
                  </div>
                  <div className="bg-white/90 p-2 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <span className="text-emerald-950 font-medium">Microdermabrasion (30 min)</span>
                    <span className="font-bold text-emerald-800">£35</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 bg-gradient-to-r from-emerald-100/70 to-teal-50 p-2.5 rounded-lg border border-emerald-300 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-800 text-white">
                        4th FREE Series
                      </span>
                      <span className="text-emerald-950 font-semibold">
                        Microdermabrasion Series (Buy 3, Get 4th FREE)
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-800 font-bold">30 mins: £105</span>
                      <span className="text-emerald-700">|</span>
                      <span className="text-emerald-800 font-bold">60 mins: £144</span>
                      <span className="text-[10px] text-emerald-800/80">(Save up to £48)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {productLineFilter === 'all' && (
              <div className="mt-5 p-3.5 rounded-xl bg-[#FAF0F2] border border-[#F0D5D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5C4A45]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#3D2B27]">Separate Skincare Lines Available:</span>
                  <span>🌿 Product Tropic (£35–£42 / Series £105/£144) &amp; 🔬 Product Clinicare (£45–£52 / Series £135/£186) are clearly separated in distinct panels below.</span>
                </div>
                <span className="text-[11px] text-[#BE757C] font-semibold font-sans-clean">
                  Switch tabs above or compare side-by-side
                </span>
              </div>
            )}

            {/* 50% Downpayment Policy Banner */}
            <div className="mt-3 px-4 py-2.5 rounded-xl bg-[#5C423E] text-[#FFF0F2] flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#BE757C] text-white text-[10px] font-bold tracking-wider uppercase font-sans-clean">
                  50% Deposit Policy
                </span>
                <span className="font-medium text-[11px] sm:text-xs">
                  Every booking takes a <strong className="text-[#E8BAC0] font-bold">50% downpayment</strong> at checkout to reserve your treatment room. The remaining 50% balance is settled upon arrival.
                </span>
              </div>
              <span className="text-[11px] text-[#E8BAC0]/90 font-sans-clean italic hidden sm:inline">
                Instant digital receipt &amp; 24h flexible rescheduling
              </span>
            </div>
          </div>
        )}

        {/* Treatments Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
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
              const isSeriesPackage =
                treatment.id === 'microdermabrasion-buy-3-get-1-free-package' ||
                treatment.id === 'buy-3-get-1-free-facial-series';

              return (
                <motion.div
                  key={treatment.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-2xl p-6 sm:p-7 border ${
                    treatment.category === 'packages'
                      ? 'border-[#BE757C]/50 shadow-md ring-1 ring-[#BE757C]/20 bg-gradient-to-b from-white to-[#FFF9F9]'
                      : 'border-[#E8BAC0]/40 hover:border-[#BE757C]/70 shadow-xs hover:shadow-lg'
                  } transition-all duration-300 flex flex-col justify-between relative group`}
                >
                  {treatment.id === 'buy-3-get-1-free-facial-series' ||
                  treatment.id === 'microdermabrasion-buy-3-get-1-free-package' ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#BE757C] to-[#8C3F48] text-white text-[10px] tracking-widest font-bold uppercase shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3" /> Buy 3 Get 1 FREE
                      </span>
                    </div>
                  ) : treatment.id === 'bring-a-friend-package' ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#BE757C] to-[#8C3F48] text-white text-[10px] tracking-widest font-bold uppercase shadow-sm">
                        <Sparkles className="w-3 h-3" /> Both Save 15% OFF
                      </span>
                    </div>
                  ) : treatment.id === 'facial-product-bundle-package' ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BE757C] text-white text-[10px] tracking-widest font-bold uppercase shadow-2xs">
                        <Gift className="w-3 h-3" /> 10% OFF Skincare
                      </span>
                    </div>
                  ) : treatment.category === 'packages' ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BE757C] text-white text-[10px] tracking-widest font-bold uppercase shadow-2xs">
                        <Gift className="w-3 h-3" /> Curated Package
                      </span>
                    </div>
                  ) : treatment.popular ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF0F2] text-[#BE757C] border border-[#BE757C]/30 text-[10px] tracking-widest font-bold uppercase">
                        <Sparkles className="w-3 h-3" /> Most Requested
                      </span>
                    </div>
                  ) : treatment.isAddon ? (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5EBE6] text-[#5C423E] border border-[#E8BAC0] text-[10px] tracking-widest font-bold uppercase">
                        Add-on Only
                      </span>
                    </div>
                  ) : null}

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

                    {/* Separated Product Line Breakdown & Duration Options */}
                    {hasDurationChoice && (
                      <div className="mb-5 space-y-3">
                        {/* Interactive Duration Selector on Card */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C4A45] font-sans-clean">
                            {isSeriesPackage ? 'Select Series Course:' : 'Select Duration:'}
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
                              {isSeriesPackage ? '30 Mins Series' : '30 Mins Express'}
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
                              {isSeriesPackage ? '60 Mins Series' : '60 Mins Full Ritual'}
                            </button>
                          </div>
                        </div>

                        {/* 🌿 PRODUCT TROPIC SEPARATE BOX */}
                        {(productLineFilter === 'all' || productLineFilter === 'tropic') && (
                          <div className={`rounded-xl p-3.5 border transition-all ${
                            productLineFilter === 'tropic'
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-300 ring-2 ring-emerald-600/30 shadow-xs'
                              : 'bg-emerald-50/60 border-emerald-200/90'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 tracking-wide">
                                <span>🌿</span> Product Tropic
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans-clean">
                                {isSeriesPackage ? 'Buy 3, 4th FREE' : 'Fresh Botanicals'}
                              </span>
                            </div>

                            <p className="text-[11px] text-emerald-900/80 mb-2 leading-tight">
                              {isSeriesPackage
                                ? 'Pay for 3 sessions and receive your 4th session completely FREE with fresh 100% natural Tropic botanicals.'
                                : '100% freshly made vegan botanicals, pure essential oils, and soothing antioxidant bio-actives.'}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-emerald-950 font-medium">
                                  {isSeriesPackage
                                    ? (activeCardDur === '30' ? 'Tropic 30 mins:' : 'Tropic 60 mins:')
                                    : (activeCardDur === '30' ? '30m Express:' : '60m Full:')}
                                </span>
                                <span className="text-base font-bold text-emerald-800 font-display">
                                  £{activeCardDur === '30' ? opt30?.priceTropic : opt60?.priceTropic}
                                </span>
                                <span className="text-[10px] text-emerald-900/90 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                  50% dep: £{(((activeCardDur === '30' ? opt30?.priceTropic : opt60?.priceTropic) ?? 0) * 0.5).toFixed(2).replace('.00', '')}
                                </span>
                                <span className="text-[10px] text-emerald-800/70">
                                  {isSeriesPackage
                                    ? (activeCardDur === '30' ? '(Save £35)' : '(Save £48)')
                                    : (activeCardDur === '30' ? `(60m: £${opt60?.priceTropic})` : `(30m: £${opt30?.priceTropic})`)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => onBookTreatment(treatment.id, 'tropic', activeCardDur)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                              >
                                {isSeriesPackage ? 'Book Tropic Series' : 'Book Tropic'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 🔬 PRODUCT CLINICARE SEPARATE BOX */}
                        {(productLineFilter === 'all' || productLineFilter === 'clinicare') && (
                          <div className={`rounded-xl p-3.5 border transition-all ${
                            productLineFilter === 'clinicare'
                              ? 'bg-gradient-to-br from-[#FFF4F6] to-[#FAF0F2] border-[#BE757C] ring-2 ring-[#BE757C]/30 shadow-xs'
                              : 'bg-[#FFF6F7] border-[#F0D0D5]'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F48] tracking-wide">
                                <span>🔬</span> Product Clinicare
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBE8EB] text-[#8C3F48] font-sans-clean">
                                {isSeriesPackage ? 'Buy 3, 4th FREE' : 'Cosmeceutical Active'}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#7A5852] mb-2 leading-tight">
                              {isSeriesPackage
                                ? 'Pay for 3 sessions and receive your 4th session completely FREE with Swedish low-molecular hyaluronic cosmeceuticals.'
                                : 'Advanced Swedish medical-grade low-molecular hyaluronic acid and biomimetic peptide complex.'}
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-[#F0D0D5]/70">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-[#3D2B27] font-medium">
                                  {isSeriesPackage
                                    ? (activeCardDur === '30' ? 'Clinicare 30 mins:' : 'Clinicare 60 mins:')
                                    : (activeCardDur === '30' ? '30m Express:' : '60m Full:')}
                                </span>
                                <span className="text-base font-bold text-[#BE757C] font-display">
                                  £{activeCardDur === '30' ? opt30?.priceClinicare : opt60?.priceClinicare}
                                </span>
                                <span className="text-[10px] text-[#8C3F48] font-semibold bg-[#FCE8EB] px-1.5 py-0.5 rounded">
                                  50% dep: £{(((activeCardDur === '30' ? opt30?.priceClinicare : opt60?.priceClinicare) ?? 0) * 0.5).toFixed(2).replace('.00', '')}
                                </span>
                                <span className="text-[10px] text-[#7A5852]">
                                  {isSeriesPackage
                                    ? (activeCardDur === '30' ? '(Save £45)' : '(Save £62)')
                                    : (activeCardDur === '30' ? `(60m: £${opt60?.priceClinicare})` : `(30m: £${opt30?.priceClinicare})`)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => onBookTreatment(treatment.id, 'clinicare', activeCardDur)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#BE757C] hover:bg-[#A9636A] text-white transition-all duration-200 cursor-pointer shadow-2xs shrink-0"
                              >
                                {isSeriesPackage ? 'Book Clinicare Series' : 'Book Clinicare'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* If service has both Tropic & Clinicare options without 30/60 toggle, separate them cleanly */}
                    {!hasDurationChoice && treatment.priceOptions && (
                      treatment.priceOptions.some(o => o.priceTropic !== undefined || o.label?.includes('Tropic')) &&
                      treatment.priceOptions.some(o => o.priceClinicare !== undefined || o.label?.includes('CLINICCARE') || o.label?.includes('Clinicare'))
                    ) ? (
                      <div className="mb-5 space-y-3">
                        {/* 🌿 PRODUCT TROPIC SEPARATE BOX */}
                        {(productLineFilter === 'all' || productLineFilter === 'tropic') && (
                          <div className={`rounded-xl p-3.5 border transition-all ${
                            productLineFilter === 'tropic'
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-300 ring-2 ring-emerald-600/30 shadow-xs'
                              : 'bg-emerald-50/60 border-emerald-200/90'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 tracking-wide">
                                <span>🌿</span> Product Tropic
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans-clean">
                                Fresh Botanicals
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-900/80 mb-2 leading-tight">
                              100% freshly made vegan botanicals, pure essential oils, and soothing antioxidant bio-actives.
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-emerald-950 font-medium">Session Fee:</span>
                                <span className="text-base font-bold text-emerald-800 font-display">
                                  £{treatment.priceOptions.find(o => o.priceTropic !== undefined || o.label?.includes('Tropic'))?.priceTropic ?? treatment.priceOptions.find(o => o.label?.includes('Tropic'))?.priceSingle}
                                </span>
                                <span className="text-[10px] text-emerald-800/70">
                                  ({treatment.priceOptions.find(o => o.label?.includes('Tropic'))?.duration || treatment.duration})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onBookTreatment(treatment.id)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white transition-all duration-200 cursor-pointer shadow-2xs"
                              >
                                Book Tropic
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 🔬 PRODUCT CLINICARE SEPARATE BOX */}
                        {(productLineFilter === 'all' || productLineFilter === 'clinicare') && (
                          <div className={`rounded-xl p-3.5 border transition-all ${
                            productLineFilter === 'clinicare'
                              ? 'bg-gradient-to-br from-[#FFF4F6] to-[#FAF0F2] border-[#BE757C] ring-2 ring-[#BE757C]/30 shadow-xs'
                              : 'bg-[#FFF6F7] border-[#F0D0D5]'
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C3F48] tracking-wide">
                                <span>🔬</span> Product Clinicare
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBE8EB] text-[#8C3F48] font-sans-clean">
                                Cosmeceutical Active
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7A5852] mb-2 leading-tight">
                              Advanced Swedish medical-grade low-molecular hyaluronic acid and biomimetic peptide complex.
                            </p>
                            <div className="flex items-center justify-between pt-1 border-t border-[#F0D0D5]/70">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-[#3D2B27] font-medium">Session Fee:</span>
                                <span className="text-base font-bold text-[#BE757C] font-display">
                                  £{treatment.priceOptions.find(o => o.priceClinicare !== undefined || o.label?.includes('CLINICCARE') || o.label?.includes('Clinicare'))?.priceClinicare ?? treatment.priceOptions.find(o => o.label?.includes('CLINICCARE') || o.label?.includes('Clinicare'))?.priceSingle}
                                </span>
                                <span className="text-[10px] text-[#7A5852]">
                                  ({treatment.priceOptions.find(o => o.label?.includes('CLINICCARE') || o.label?.includes('Clinicare'))?.duration || treatment.duration})
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onBookTreatment(treatment.id)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#BE757C] hover:bg-[#A9636A] text-white transition-all duration-200 cursor-pointer shadow-2xs"
                              >
                                Book Clinicare
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : !hasDurationChoice && treatment.priceOptions && treatment.priceOptions.length > 0 ? (
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
                                {opt.priceSingle !== undefined && (
                                  <span className="font-bold text-[#3D2B27]">
                                    {typeof opt.priceSingle === 'number'
                                      ? `£${opt.priceSingle}`
                                      : String(opt.priceSingle).startsWith('£')
                                      ? opt.priceSingle
                                      : `£${opt.priceSingle}`}
                                  </span>
                                )}
                                {opt.priceTropic !== undefined && (
                                  <span className="text-[#5C4A45]">
                                    <span className="text-emerald-800 font-bold">£{opt.priceTropic}</span> (🌿 Tropic)
                                  </span>
                                )}
                                {opt.priceClinicare !== undefined && (
                                  <span className="text-[#5C4A45]">
                                    <span className="text-[#BE757C] font-bold">£{opt.priceClinicare}</span> (🔬 Clinicare)
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Benefit highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 pt-3 border-t border-[#F5E6E8]">
                      {treatment.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-[#4A352F]">
                          <Check className="w-3.5 h-3.5 text-[#BE757C] shrink-0 mt-0.5" />
                          <span className="leading-snug">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer with Price and Book Button */}
                  <div className="pt-4 border-t border-[#F5E6E8] flex items-center justify-between gap-4 mt-auto">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-[#5C4A45]">
                        <Clock className="w-3.5 h-3.5 text-[#BE757C]" />
                        <span>
                          {isSeriesPackage
                            ? activeCardDur === '30'
                              ? '4 x 30 mins Series (Buy 3, Get 1 FREE)'
                              : '4 x 60 mins Series (Buy 3, Get 1 FREE)'
                            : hasDurationChoice
                            ? activeCardDur === '30'
                              ? '30 mins (Express)'
                              : '60 mins (Full Ritual)'
                            : treatment.duration}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-display font-medium text-[#3D2B27] mt-0.5">
                        {hasDurationChoice ? (
                          <span>
                            <span className="text-emerald-800 font-bold">
                              £{activeCardDur === '30' ? opt30?.priceTropic : opt60?.priceTropic}
                            </span>{' '}
                            <span className="text-xs text-[#5C4A45] font-sans-clean font-normal">
                              🌿 Tropic
                            </span>{' '}
                            <span className="text-xs text-[#8C3F48] font-semibold">
                              / £{activeCardDur === '30' ? opt30?.priceClinicare : opt60?.priceClinicare} 🔬 Clinicare
                            </span>
                          </span>
                        ) : (
                          treatment.priceDisplay
                        )}
                      </div>
                      <span className="inline-block text-[11px] text-[#BE757C] font-semibold mt-0.5">
                        💳 50% deposit to secure booking
                      </span>
                    </div>

                    <button
                      id={`book-item-${treatment.id}`}
                      onClick={() => onBookTreatment(
                        treatment.id,
                        productLineFilter === 'all' ? undefined : productLineFilter,
                        hasDurationChoice ? activeCardDur : undefined
                      )}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-wider uppercase transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer shrink-0"
                    >
                      <span>{isSeriesPackage ? 'Book Series' : 'Book Now'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

      </div>
    </section>
  );
};

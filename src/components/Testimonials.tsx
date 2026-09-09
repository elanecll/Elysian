import React, { useState } from 'react';
import { SPA_REVIEWS } from '../data/spaData';
import { SpaHeartDivider } from './SpaIcons';
import { Star, Quote, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Testimonials: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'facials' | 'massage' | 'packages'>('all');

  const filteredReviews = SPA_REVIEWS.filter((review) => {
    if (activeCategory === 'all') return true;
    const serviceLower = review.service.toLowerCase();
    if (activeCategory === 'facials') {
      return serviceLower.includes('facial') || serviceLower.includes('glow') || serviceLower.includes('mask');
    }
    if (activeCategory === 'massage') {
      return serviceLower.includes('massage') || serviceLower.includes('stone') || serviceLower.includes('head');
    }
    if (activeCategory === 'packages') {
      return serviceLower.includes('twin') || serviceLower.includes('ritual') || serviceLower.includes('package') || serviceLower.includes('polish');
    }
    return true;
  });

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[#FAF2F3] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
            CLIENT EXPERIENCES
          </p>
          <div className="max-w-xs mx-auto my-2">
            <SpaHeartDivider />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-3 mb-4">
            Words of Serenity
          </h2>
          <p className="text-base sm:text-lg font-serif-luxury italic text-[#5C4A45]">
            Discover what our cherished guests have experienced in our tranquil sanctuary.
          </p>
        </div>

        {/* Rating Summary Bar */}
        <div className="max-w-3xl mx-auto mb-12 bg-white/80 backdrop-blur-xs rounded-2xl p-4 sm:p-6 border border-[#E8BAC0]/40 shadow-xs flex flex-wrap items-center justify-around gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-display text-[#BE757C]">5.0</div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-[#BE757C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-[11px] font-bold text-[#3D2B27] uppercase tracking-wider">Overall Guest Rating</p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#E8BAC0]/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#BE757C]" />
            <span className="text-xs font-semibold text-[#5C4A45]">100% Verified Guest Feedback</span>
          </div>
          <div className="h-8 w-px bg-[#E8BAC0]/40 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#BE757C]" />
            <span className="text-xs font-semibold text-[#5C4A45]">Tropic &amp; CLINICCARE Certified</span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex justify-center items-center gap-2 sm:gap-3 flex-wrap mb-10">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'facials', label: 'Facial Aesthetics' },
            { id: 'massage', label: 'Bodywork & Massage' },
            { id: 'packages', label: 'Packages & Rituals' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                activeCategory === tab.id
                  ? 'bg-[#BE757C] text-white shadow-xs'
                  : 'bg-white text-[#5C4A45] hover:bg-[#FFF0F2] border border-[#E8BAC0]/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredReviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-[#E8BAC0]/40 shadow-xs flex flex-col justify-between hover:border-[#BE757C]/60 hover:shadow-md transition-all"
              >
                <div>
                  {/* Rating stars & quote mark */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-[#BE757C]">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-[#E8BAC0]/60" />
                  </div>

                  {/* Treatment badge */}
                  <span className="inline-block text-[10px] font-semibold tracking-wider text-[#BE757C] uppercase bg-[#FFF0F2] px-2.5 py-1 rounded-md mb-3">
                    {review.service}
                  </span>

                  {/* Comment */}
                  <p className="text-xs sm:text-sm text-[#4A352F] leading-relaxed italic font-serif-luxury mb-6">
                    "{review.comment}"
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#F5E6E8]">
                  <div className="w-8 h-8 rounded-full bg-[#BE757C] text-white flex items-center justify-center text-xs font-bold font-sans-clean">
                    {review.avatarText}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3D2B27]">{review.author}</h4>
                    <p className="text-[10px] text-[#5C4A45]/70">{review.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};


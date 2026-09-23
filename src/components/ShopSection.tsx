import React, { useState } from 'react';
import { SpaHeartDivider } from './SpaIcons';
import { ShoppingBag, Sparkles, Heart, Check, ExternalLink, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { SPA_PRODUCTS } from '../data/shopData';

interface ShopSectionProps {
  onAddToCart: (product: Product) => void;
  cartCount?: number;
  onViewBasket?: () => void;
}

export const ShopSection: React.FC<ShopSectionProps> = ({
  onAddToCart,
  cartCount = 0,
  onViewBasket,
}) => {
  const [activeBrand, setActiveBrand] = useState<'cliniccare' | 'tropic' | 'all'>('cliniccare');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const products: Product[] = SPA_PRODUCTS;

  const handleBuyItNow = (product: Product) => {
    setJustAddedId(product.id);
    onAddToCart(product);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1500);
  };

  const filteredProducts = products.filter((product) => {
    // Brand filtering
    if (activeBrand === 'cliniccare' && product.brandType !== 'clinicare') {
      return false;
    }
    if (activeBrand === 'tropic' && product.brandType !== 'tropic') {
      return false;
    }

    // Category filtering
    if (activeCategory === 'all') return true;
    if (activeCategory === 'cliniccare_all') return product.brandType === 'clinicare';
    if (activeCategory === 'tropic_all') return product.brandType === 'tropic';

    // CLINICCARE Range-specific filtering
    if (product.brandType === 'clinicare' && product.rangeKey === activeCategory) {
      return true;
    }

    if (activeCategory === 'masks') return product.category === 'masks' || product.category === 'collections';
    if (activeCategory === 'sunscreen') return product.category === 'sunscreen';
    if (activeCategory === 'cleansers') return product.category === 'cleansers' || product.category === 'daily';
    if (activeCategory === 'serums') return product.category === 'serums';
    if (activeCategory === 'daily') return product.category === 'daily';
    if (activeCategory === 'body') return product.category === 'body';
    if (activeCategory === 'collections') return product.category === 'collections';

    return product.category === activeCategory;
  });

  const cliniccareCategories = [
    { key: 'all', label: 'All CLINICARE' },
    { key: 'masks', label: '🎭 Face Masks' },
    { key: 'pure', label: '🌿 EGF Pure' },
    { key: 'glow', label: '✨ EGF Glow' },
    { key: 'tight', label: '💎 EGF Tight & Refresh' },
    { key: 'sun_dermo', label: '☀️ Dermo SPF50' },
    { key: 'cleansing', label: '🧼 Cleansing & Peeling' },
    { key: 'lip_eye', label: '👁️ Lip & Eye' },
    { key: 'specialised', label: '🔬 Specialised & Hair' },
  ];

  const tropicCategories = [
    { key: 'all', label: 'All Tropic Skincare' },
    { key: 'daily', label: 'Daily Essentials & Creams' },
    { key: 'serums', label: 'Targeted Serums & Elixirs' },
    { key: 'collections', label: 'Masks & Collections' },
    { key: 'body', label: 'Body Care & Polishes' },
  ];

  const allCategories = [
    { key: 'all', label: 'All Sanctuary Skincare' },
    { key: 'cliniccare_all', label: '🔬 CLINICARE Cosmeceuticals' },
    { key: 'tropic_all', label: '🌿 Tropic Botanicals' },
    { key: 'serums', label: 'Serums & Elixirs' },
    { key: 'sunscreen', label: 'SPF & Sun Protection' },
    { key: 'cleansers', label: 'Cleansers & Essences' },
    { key: 'daily', label: 'Daily Moisturisers' },
    { key: 'masks', label: 'Masks & Sets' },
    { key: 'body', label: 'Body Care' },
  ];

  const currentCategories =
    activeBrand === 'cliniccare'
      ? cliniccareCategories
      : activeBrand === 'tropic'
      ? tropicCategories
      : allCategories;

  return (
    <section id="shop" className="py-20 lg:py-24 bg-[#FFF9F9] relative overflow-hidden border-b border-[#E8BAC0]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F2] border border-[#BE757C]/30 text-[#BE757C] text-xs uppercase tracking-[0.2em] font-semibold mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>SPA BOUTIQUE &amp; RETAIL</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-[#3D2B27] mt-2 mb-4">
            {activeBrand === 'cliniccare' ? (
              <>
                Elysian Boutique: <span className="text-[#8C3F48]">🔬 CLINICARE Skincare Bar</span>{' '}
                <span className="text-[#3D2B27] font-normal">&amp;</span>{' '}
                <span className="text-[#3F6848]">🌿 TROPIC Skincare Bar</span>
              </>
            ) : activeBrand === 'tropic' ? (
              <>
                Elysian Boutique: <span className="text-[#3F6848]">🌿 TROPIC Skincare Bar</span>{' '}
                <span className="text-[#3D2B27] font-normal">&amp;</span>{' '}
                <span className="text-[#8C3F48]">🔬 CLINICARE Skincare Bar</span>
              </>
            ) : (
              <>
                Elysian Boutique: <span className="text-[#8C3F48]">🔬 CLINICARE Skincare Bar</span>{' '}
                <span className="text-[#3D2B27] font-normal">&amp;</span>{' '}
                <span className="text-[#3F6848]">🌿 TROPIC Skincare Bar</span>
              </>
            )}
          </h2>

          <div className="w-40 mx-auto my-3">
            <SpaHeartDivider className="justify-center" />
          </div>

          <p className="text-sm sm:text-base text-[#5C4A45] max-w-2xl mx-auto leading-relaxed">
            {activeBrand === 'cliniccare' ? (
              <>
                Take home Sweden's premier medical-grade cosmeceuticals — formulated with 5nm low-molecular hyaluronic acid, biomimetic peptides, and EGF growth factors for advanced barrier recovery, post-facial soothing, and daily protection.
              </>
            ) : activeBrand === 'tropic' ? (
              <>
                Extend your sanctuary ritual home with freshly made 🌿 Tropic Skincare botanicals — 100% freshly crafted, natural, vegan, and clinically proven to nourish, protect, and transform your skin barrier.
              </>
            ) : (
              <>
                Curated retail formulations featuring Sweden's 🔬 CLINICARE medical cosmeceuticals and fresh handcrafted 🌿 Tropic organic botanicals for complete at-home skin wellness.
              </>
            )}
          </p>

          {/* Targeted Selected Element: Skincare Bar & Category Filter Container */}
          <div className="mt-8 space-y-4">
            {/* Master Brand Switcher Bar */}
            <div className="inline-flex p-1.5 bg-white/95 backdrop-blur-xs rounded-full border border-[#E8BAC0]/60 shadow-xs max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveBrand('cliniccare');
                  setActiveCategory('all');
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeBrand === 'cliniccare'
                    ? 'bg-[#8C3F48] text-white shadow-sm'
                    : 'text-[#5C4A45] hover:text-[#8C3F48] hover:bg-[#FFF0F2]'
                }`}
              >
                <span>🔬 CLINICARE Skincare Bar</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeBrand === 'cliniccare' ? 'bg-white/20 text-white' : 'bg-[#FFF0F2] text-[#8C3F48]'
                }`}>
                  Medical Grade
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveBrand('tropic');
                  setActiveCategory('all');
                }}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeBrand === 'tropic'
                    ? 'bg-[#3F6848] text-white shadow-sm'
                    : 'text-[#5C4A45] hover:text-[#3F6848] hover:bg-[#F2F7F3]'
                }`}
              >
                <span>🌿 TROPIC Skincare Bar</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeBrand === 'tropic' ? 'bg-white/20 text-white' : 'bg-[#F2F7F3] text-[#3F6848]'
                }`}>
                  Fresh Botanicals
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveBrand('all');
                  setActiveCategory('all');
                }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeBrand === 'all'
                    ? 'bg-[#BE757C] text-white shadow-sm'
                    : 'text-[#5C4A45] hover:text-[#BE757C] hover:bg-[#FFF0F2]'
                }`}
              >
                <span>✨ All Skincare</span>
              </button>
            </div>

            {/* Sub-Category Filter Pills Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {currentCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    activeCategory === cat.key
                      ? activeBrand === 'cliniccare'
                        ? 'bg-[#8C3F48] text-white shadow-xs'
                        : activeBrand === 'tropic'
                        ? 'bg-[#3F6848] text-white shadow-xs'
                        : 'bg-[#BE757C] text-white shadow-xs'
                      : 'bg-white text-[#5C4A45] hover:bg-[#FFF0F2] border border-[#E8BAC0]/40'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* CLINICCARE Feature Info Strip */}
            {activeBrand === 'cliniccare' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-4 bg-gradient-to-r from-[#FFF5F6] via-white to-[#FFF5F6] rounded-2xl border border-[#8C3F48]/25 text-center max-w-3xl mx-auto shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[#5C4A45]">
                  <span className="font-semibold text-[#8C3F48] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Swedish Cosmeceutical Guarantee:
                  </span>
                  <span className="flex items-center gap-1">
                    🔬 5nm Low-Molecular HA
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    🧬 Biomimetic EGF Peptides
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    🛡️ Post-Treatment Safe
                  </span>
                  <span>•</span>
                  <span className="text-[#8C3F48] font-bold">
                    🏷️ 10% OFF with Facials
                  </span>
                </div>

                {/* Range Guide Note */}
                <div className="pt-2 border-t border-[#E8BAC0]/30 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80">
                    <div className="text-[11px] font-bold text-amber-900 tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      GLOW RANGE
                    </div>
                    <p className="text-xs text-[#5C4A45] leading-snug">
                      For pigmentation, age spot and dull tired skin
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                    <div className="text-[11px] font-bold text-emerald-900 tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      PURE RANGE
                    </div>
                    <p className="text-xs text-[#5C4A45] leading-snug">
                      For sensitive, irritated and inflamed skin
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
                    <div className="text-[11px] font-bold text-blue-900 tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      REFRESH RANGE
                    </div>
                    <p className="text-xs text-[#5C4A45] leading-snug">
                      For fine lines, wrinkles, firmness and moisture skin
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8BAC0]/40 p-12 text-center max-w-lg mx-auto">
            <ShoppingBag className="w-10 h-10 text-[#8C3F48] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-display text-[#3D2B27] mb-2">No Products in this Filter</h3>
            <p className="text-xs text-[#5C4A45] mb-4">
              Select another category from the skincare bar to explore available formulations.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="px-4 py-2 rounded-full bg-[#8C3F48] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              View All {activeBrand === 'cliniccare' ? `CLINICARE (${products.filter(p => p.brandType === 'clinicare').length})` : 'Products'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isCliniccare = product.brandType === 'clinicare';

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group border ${
                    isCliniccare
                      ? 'border-[#8C3F48]/25 hover:border-[#8C3F48]/50'
                      : 'border-[#E8BAC0]/40 hover:border-[#BE757C]/50'
                  }`}
                >
                  {/* Image Container - uncropped, crisp and preserved */}
                  <div
                    className={`relative overflow-hidden ${
                      isCliniccare
                        ? 'aspect-square bg-white flex items-center justify-center p-3 border-b border-[#8C3F48]/10'
                        : 'aspect-4/3 bg-[#FAF3F3]'
                    }`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className={`transition-transform duration-500 group-hover:scale-105 ${
                        isCliniccare
                          ? 'max-h-full max-w-full object-contain'
                          : 'w-full h-full object-cover'
                      }`}
                    />
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      {product.range && (
                        <span className="px-2 py-0.5 rounded-full bg-[#8C3F48] text-white text-[9px] font-bold tracking-wider uppercase shadow-xs">
                          {product.range}
                        </span>
                      )}
                      {product.volume && (
                        <span className="px-2 py-0.5 rounded-full bg-white/95 text-[#5C4A45] border border-[#E8BAC0]/40 text-[9px] font-semibold tracking-wider shadow-xs">
                          {product.volume}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[11px] font-semibold tracking-widest uppercase ${
                          isCliniccare ? 'text-[#8C3F48]' : 'text-[#3F6848]'
                        }`}
                      >
                        {product.brand}
                      </span>
                      {product.volume && (
                        <span className="text-[10px] text-[#8C6B64] font-medium">
                          {product.volume}
                        </span>
                      )}
                    </div>

                    <h3
                      className={`text-base font-display text-[#3D2B27] mt-1 mb-1 transition-colors leading-snug ${
                        isCliniccare ? 'group-hover:text-[#8C3F48]' : 'group-hover:text-[#BE757C]'
                      }`}
                    >
                      {product.name}
                    </h3>

                    <p className="text-[11px] text-[#8C6B64] uppercase tracking-wider font-medium mb-3">
                      {product.tagline}
                    </p>

                    <p className="text-xs text-[#5C4A45] leading-relaxed mb-4 flex-grow line-clamp-3">
                      {product.description}
                    </p>

                    {/* Price & Order Action */}
                    <div className="pt-3 border-t border-[#E8BAC0]/30 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[11px] text-[#8C6B64] block">Price</span>
                        <span
                          className={`text-sm font-bold font-display ${
                            isCliniccare ? 'text-[#8C3F48]' : 'text-[#BE757C]'
                          }`}
                        >
                          {product.price}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBuyItNow(product)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-medium tracking-wider uppercase transition-all shadow-xs cursor-pointer ${
                          justAddedId === product.id
                            ? 'bg-[#25D366] scale-105'
                            : isCliniccare
                            ? 'bg-[#8C3F48] hover:bg-[#72323A]'
                            : 'bg-[#BE757C] hover:bg-[#A9636A]'
                        }`}
                      >
                        {justAddedId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Buy It Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View Basket Banner if items in cart */}
        {cartCount > 0 && onViewBasket && (
          <div className="mt-8 p-4 bg-[#BE757C] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md max-w-2xl mx-auto">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">
                  {cartCount} {cartCount === 1 ? 'Product' : 'Products'} in your sanctuary basket
                </p>
                <p className="text-[11px] text-white/85">
                  Ready for purchase with collection or tracked delivery.
                </p>
              </div>
            </div>

            <button
              onClick={onViewBasket}
              className="px-5 py-2 rounded-full bg-white text-[#BE757C] hover:bg-[#FFF0F2] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Basket &amp; Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Boutique Assistance Note */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-[#E8BAC0]/40 max-w-3xl mx-auto text-center shadow-xs">
          <div className="flex items-center justify-center gap-2 text-[#BE757C] mb-2 font-display text-base">
            <Sparkles className="w-4 h-4" />
            <span>Personalized Skincare Consultation &amp; Collection</span>
          </div>
          <p className="text-xs text-[#5C4A45] leading-relaxed max-w-xl mx-auto">
            Not sure which formulas suit your skin barrier? Elaine provides tailored skincare consultations at the sanctuary in Blackpool or via WhatsApp.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <a
              href="https://wa.me/447707328060?text=Hi%20Elaine,%20I'd%20love%20a%20personalized%20skincare%20recommendation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5C423E] hover:bg-[#4A352F] text-white text-xs font-medium tracking-widest uppercase transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#E8BAC0]" />
              <span>Ask Elaine on WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

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

const shopPanelClass = 'rounded-2xl border border-[#E8BAC0]/40 bg-white p-5 sm:p-6 shadow-xs';
const shopButtonClass = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm sm:text-base font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#87464D]';
const shopFilterClass = (active: boolean) => `${shopButtonClass} border ${active
  ? 'border-[#87464D] bg-[#87464D] text-white'
  : 'border-[#E8BAC0]/40 bg-white text-[#5C4A45] hover:bg-[#FFF0F2] hover:border-[#BE757C]'}`;
const shopActionClass = `${shopButtonClass} bg-[#87464D] hover:bg-[#71383F] text-white shadow-xs`;

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
    <section id="shop" className="pb-20 lg:pb-24 bg-[#FFF9F9] relative overflow-hidden border-b border-[#E8BAC0]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="relative isolate pt-20 lg:pt-24 pb-8">
            <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-screen -translate-x-1/2 pointer-events-none -z-10">
              <img
                src="/images/banners/boutique-skincare.jpeg"
                alt=""
                className="h-full w-full object-cover object-[70%_center] sm:object-[center_35%] saturate-75"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,249,249,0.319872),rgba(255,246,247,0.327488)_50%,rgba(255,240,242,0.0986272))]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,249,249,0.405)_40%,rgba(255,249,249,0)_70%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,249,249,0.10)_50%,rgba(255,249,249,1))]" />
            </div>
            <h2 className="max-w-3xl mx-auto text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-[#3D2B27] mt-2 mb-4">
              <span className="block text-[#8C3F48]">
                🔬 CLINICARE Skincare Bar{' '}
                <span className="text-[#3D2B27]">&amp;</span>
              </span>
              <span className="block text-[#3F6848]">🌿 TROPIC Skincare Bar</span>
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
          </div>

          {/* Targeted Selected Element: Skincare Bar & Category Filter Container */}
          <div className="space-y-6">
            {/* Master Brand Switcher Bar */}
            <div className={`${shopPanelClass} grid grid-cols-1 sm:grid-cols-2 gap-3`} aria-label="Skincare brands">
              <button
                type="button"
                onClick={() => {
                  setActiveBrand('cliniccare');
                  setActiveCategory('all');
                }}
                aria-pressed={activeBrand === 'cliniccare'}
                className={`${shopFilterClass(activeBrand === 'cliniccare')} flex-wrap`}
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
                aria-pressed={activeBrand === 'tropic'}
                className={`${shopFilterClass(activeBrand === 'tropic')} flex-wrap`}
              >
                <span>🌿 TROPIC Skincare Bar</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  activeBrand === 'tropic' ? 'bg-white/20 text-white' : 'bg-[#F2F7F3] text-[#3F6848]'
                }`}>
                  Fresh Botanicals
                </span>
              </button>

            </div>

            {/* Sub-Category Filter Pills Bar */}
            <div className={`${shopPanelClass} grid grid-cols-2 lg:grid-cols-3 gap-3`} aria-label="Skincare categories">
              {currentCategories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  aria-pressed={activeCategory === cat.key}
                  className={shopFilterClass(activeCategory === cat.key)}
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
                className={`${shopPanelClass} text-center space-y-3`}
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
                  <div className="p-3.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0]/40">
                    <div className="text-xs font-bold text-[#3D2B27] tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                      GLOW RANGE
                    </div>
                    <p className="text-xs text-[#5C4A45] leading-snug">
                      For pigmentation, age spot and dull tired skin
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0]/40">
                    <div className="text-xs font-bold text-[#3D2B27] tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      PURE RANGE
                    </div>
                    <p className="text-xs text-[#5C4A45] leading-snug">
                      For sensitive, irritated and inflamed skin
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FFF9F9] border border-[#E8BAC0]/40">
                    <div className="text-xs font-bold text-[#3D2B27] tracking-wider flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
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
              className={shopActionClass}
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
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8BAC0]/40 hover:border-[#BE757C]/60 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group"
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
                    <div className="pt-3 border-t border-[#E8BAC0]/30 flex flex-wrap items-center justify-between gap-3 mt-auto">
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
                        className={`${shopButtonClass} w-full shadow-xs text-white ${
                          justAddedId === product.id
                            ? 'bg-[#3F6848]'
                            : 'bg-[#87464D] hover:bg-[#71383F]'
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
          <div className={`${shopPanelClass} mt-6 text-[#5C4A45] flex flex-col sm:flex-row items-center justify-between gap-5`}>
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-xl bg-[#FFF0F2] flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-[#BE757C]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#3D2B27]">
                  {cartCount} {cartCount === 1 ? 'Product' : 'Products'} in your sanctuary basket
                </p>
                <p className="text-xs mt-1 text-[#5C4A45]">
                  Ready for purchase with collection or tracked delivery.
                </p>
              </div>
            </div>

            <button
              onClick={onViewBasket}
              className={`${shopActionClass} w-full sm:w-auto shrink-0`}
            >
              <span>View Basket &amp; Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Boutique Assistance Note */}
        <div className={`${shopPanelClass} mt-6 text-center`}>
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
              className={`${shopActionClass} w-full sm:w-auto`}
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

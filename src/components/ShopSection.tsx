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

  const filteredProducts = activeCategory === 'all' || activeCategory === 'tropic'
    ? products
    : products.filter((p) => p.category === activeCategory);

  const categories = [
    { key: 'all', label: 'All Skincare' },
    { key: 'tropic', label: '🌿 Tropic Skincare' },
    { key: 'daily', label: 'Daily Essentials & Moisturisers' },
    { key: 'serums', label: 'Targeted Serums & Elixirs' },
    { key: 'collections', label: 'Masks & Collections' },
    { key: 'body', label: 'Body Care & Polishes' },
  ];

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
            Elysian Boutique: 🌿 Tropic Skincare
          </h2>

          <div className="w-40 mx-auto my-3">
            <SpaHeartDivider className="justify-center" />
          </div>

          <p className="text-sm sm:text-base text-[#5C4A45] max-w-2xl mx-auto leading-relaxed">
            Extend your sanctuary ritual home with freshly made 🌿 Tropic Skincare botanicals — 100% freshly crafted, natural, vegan, and clinically proven to nourish, protect, and transform your skin barrier.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-xs tracking-wider uppercase font-medium transition-all duration-300 cursor-pointer ${
                  activeCategory === cat.key
                    ? 'bg-[#BE757C] text-white shadow-sm'
                    : 'bg-white text-[#5C4A45] hover:bg-[#FFF0F2] border border-[#E8BAC0]/40'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-[#E8BAC0]/40 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group"
            >
              {/* Image Container */}
              <div className="relative aspect-4/3 overflow-hidden bg-[#FAF3F3]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  {product.badges.slice(0, 2).map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#BE757C] text-[10px] font-semibold tracking-wider uppercase shadow-2xs"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex flex-col flex-grow">
                <span className="text-[11px] font-semibold text-[#BE757C] tracking-widest uppercase">
                  {product.brand}
                </span>

                <h3 className="text-base font-display text-[#3D2B27] mt-1 mb-1 group-hover:text-[#BE757C] transition-colors leading-snug">
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
                    <span className="text-sm font-bold text-[#BE757C] font-display">
                      {product.price}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuyItNow(product)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-medium tracking-wider uppercase transition-all shadow-xs cursor-pointer ${
                      justAddedId === product.id
                        ? 'bg-[#25D366] scale-105'
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
          ))}
        </div>

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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ServiceHighlights } from './components/ServiceHighlights';
import { HotStoneBodyMassageSection } from './components/HotStoneBodyMassageSection';
import { ExperienceSection } from './components/ExperienceSection';
import { TreatmentMenu } from './components/TreatmentMenu';
import { Testimonials } from './components/Testimonials';
import { LocationAndFaq } from './components/LocationAndFaq';
import { ShopSection } from './components/ShopSection';
import { BuyProductPage } from './components/BuyProductPage';
import { TermsAndConditionsPage } from './components/TermsAndConditionsPage';
import { Footer } from './components/Footer';
import { BookingModal } from './components/BookingModal';
import { OwnerCRMModal } from './components/OwnerCRMModal';
import { AmbientSoundPlayer } from './components/AmbientSoundPlayer';
import { PageBanner } from './components/PageBanner';
import { PageTab, Product, CartItem } from './types';
import { Calendar, Phone, Sparkles, ArrowRight, Star, Heart, MapPin, ShoppingBag, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageTab>('home');
  const [treatmentCategory, setTreatmentCategory] = useState<string>('all');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();
  const [preselectedProduct, setPreselectedProduct] = useState<'tropic' | 'clinicare' | undefined>();
  const [preselectedDuration, setPreselectedDuration] = useState<'30' | '60' | undefined>();
  const [preselectedIsCourse, setPreselectedIsCourse] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Persistent shopping cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('elysian_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('elysian_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart to localStorage', e);
    }
  }, [cart]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Immediately open the buy product / basket page ready for purchase
    handleNavigate('basket');
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Parse initial page from hash on mount
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (hash === 'treatments' || hash === 'menu' || hash === 'services') {
        setCurrentPage('treatments');
      } else if (hash === 'experience' || hash === 'about') {
        setCurrentPage('experience');
      } else if (hash === 'shop' || hash === 'boutique' || hash === 'vouchers') {
        setCurrentPage('shop');
      } else if (hash === 'basket' || hash === 'cart' || hash === 'checkout') {
        setCurrentPage('basket');
      } else if (hash === 'reviews' || hash === 'testimonials') {
        setCurrentPage('reviews');
      } else if (hash === 'location' || hash === 'contact' || hash === 'faq' || hash === 'hours') {
        setCurrentPage('location');
      } else if (hash === 'terms' || hash === 'conditions' || hash === 'deposit-policy' || hash === 'policy') {
        setCurrentPage('terms');
      } else if (hash === 'admin' || hash === 'crm' || hash === 'owner') {
        setIsCRMOpen(true);
      } else {
        setCurrentPage('home');
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);

    // Private Owner Shortcut: Ctrl + Shift + A or Cmd + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        setIsCRMOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('hashchange', parseHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNavigate = (page: PageTab, categoryFilter?: string) => {
    setCurrentPage(page);
    if (categoryFilter) {
      setTreatmentCategory(categoryFilter);
    }
    window.location.hash = page === 'home' ? '' : `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (
    serviceId?: string,
    preferredProduct?: 'tropic' | 'clinicare',
    preferredDuration?: '30' | '60',
    isCourse?: boolean
  ) => {
    setPreselectedServiceId(serviceId);
    setPreselectedProduct(preferredProduct);
    setPreselectedDuration(preferredDuration);
    setPreselectedIsCourse(!!isCourse);
    setIsBookingOpen(true);
  };

  const handleExploreTreatments = (category: string = 'all') => {
    setTreatmentCategory(category);
    handleNavigate('treatments', category);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F9] text-[#3D2B27] flex flex-col selection:bg-[#E8BAC0] selection:text-[#3D2B27]">
      {/* Ambient Spa Audio Engine (Web Audio Synth) */}
      <AmbientSoundPlayer isPlaying={isAudioPlaying} />

      {/* Header Navigation with Multi-Page Tabs */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCRM={() => setIsCRMOpen(true)}
        isAudioPlaying={isAudioPlaying}
        onToggleAudio={() => setIsAudioPlaying(!isAudioPlaying)}
        cartCount={totalCartCount}
      />

      {/* Main Multi-Page Content with Animated Transitions */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home-page"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero Banner with direct CTAs and category badges */}
              <HeroBanner
                onOpenBooking={handleOpenBooking}
                onExploreTreatments={handleExploreTreatments}
              />

              {/* 3 Pillars Deep Dive: Facial Aesthetics, Body Massage, Hot Stone Therapy */}
              <ServiceHighlights onSelectService={(serviceId) => handleOpenBooking(serviceId)} />

              {/* Featured Showcase: Facial, Body Massage & Hot Stone Therapy */}
              <HotStoneBodyMassageSection onOpenBooking={handleOpenBooking} />

              {/* Quick Sanctuary Experience Teaser */}
              <section className="py-16 bg-[#FAF3F3] border-y border-[#E8BAC0]/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
                  <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E8BAC0]/50 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="max-w-2xl text-center lg:text-left">
                      <span className="text-[11px] tracking-[0.3em] uppercase text-[#BE757C] font-semibold font-sans-clean">
                        THE ELYSIAN PROMISE
                      </span>
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display text-[#3D2B27] mt-2 mb-3">
                        Experience Our Dedicated Sanctuary
                      </h3>
                      <p className="text-sm sm:text-base font-serif-luxury italic text-[#5C4A45] leading-relaxed">
                        Immerse in private sound-insulated acoustic suites, heated memory foam beds, organic botanical oils, and complimentary tea lounge relaxation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => handleNavigate('experience')}
                        className="px-6 py-3 rounded-full border border-[#BE757C]/50 hover:border-[#BE757C] text-[#3D2B27] hover:text-[#BE757C] bg-[#FFF9F9] font-medium text-xs tracking-widest uppercase transition-all cursor-pointer"
                      >
                        Our Philosophy
                      </button>
                      <button
                        onClick={() => handleNavigate('treatments')}
                        className="px-6 py-3 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-widest uppercase transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center gap-2"
                      >
                        <span>View Treatment Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick Reviews Preview Bar */}
              <section className="py-14 bg-[#FFF9F9]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFF0F2] text-[#BE757C] text-xs font-semibold uppercase tracking-wider mb-4 border border-[#BE757C]/20">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>5.0 Star Guest Rated Sanctuary in Blackpool</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-display text-[#3D2B27] mb-2">
                    Loved for Tailored Care &amp; Deep Radiance
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C4A45] font-serif-luxury italic max-w-xl mx-auto mb-6">
                    "From the moment you walk in, the tension leaves your shoulders. The hot stones and facial left my skin glowing for weeks."
                  </p>
                  <button
                    onClick={() => handleNavigate('reviews')}
                    className="inline-flex items-center gap-1.5 text-xs text-[#BE757C] hover:text-[#9F5158] font-bold uppercase tracking-widest cursor-pointer underline underline-offset-4"
                  >
                    <span>Read Verified Guest Reviews</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {currentPage === 'treatments' && (
            <motion.div
              key="treatments-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Treatment Menu"
                title="Treatment Menu & Tariff"
                subtitle="Explore our complete bespoke therapies featuring advanced Swedish CLINICARE medical-grade cosmeceuticals and therapeutic bodywork."
                tagline="HOLISTIC BEAUTY & BODYWORK"
                onNavigateHome={() => handleNavigate('home')}
              />
              <TreatmentMenu
                onBookTreatment={(serviceId, preferredProduct, preferredDuration, isCourse) =>
                  handleOpenBooking(serviceId, preferredProduct, preferredDuration, isCourse)
                }
                selectedCategory={treatmentCategory}
              />
            </motion.div>
          )}

          {currentPage === 'experience' && (
            <motion.div
              key="experience-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="The Experience"
                title="The Sanctuary Experience"
                subtitle="Discover how we blend ancient thermal therapies, mindful touch, and pure active botanicals into a transformative wellness retreat."
                tagline="HOLISTIC HARMONY & COMFORT"
                onNavigateHome={() => handleNavigate('home')}
              />
              <ExperienceSection
                onOpenBooking={() => handleOpenBooking()}
                onExploreTreatments={() => handleNavigate('treatments')}
              />
            </motion.div>
          )}

          {currentPage === 'shop' && (
            <motion.div
              key="shop-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ShopSection
                onAddToCart={handleAddToCart}
                cartCount={totalCartCount}
                onViewBasket={() => handleNavigate('basket')}
              />
            </motion.div>
          )}

          {currentPage === 'basket' && (
            <motion.div
              key="basket-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Basket & Checkout"
                title="Your Boutique Basket"
                subtitle="Review your selected CLINICARE medical cosmeceuticals and Tropic botanicals, with sanctuary collection or tracked postal delivery."
                tagline="SANCTUARY BOUTIQUE ORDER"
                onNavigateHome={() => handleNavigate('home')}
              />
              <BuyProductPage
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                onNavigate={handleNavigate}
              />
            </motion.div>
          )}

          {currentPage === 'reviews' && (
            <motion.div
              key="reviews-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Guest Testimonials"
                title="Guest Reflections & Praise"
                subtitle="Discover authentic reviews and feedback from guests who have experienced deep somatic calm and renewed radiance."
                tagline="COMMUNITY & SERENITY"
                onNavigateHome={() => handleNavigate('home')}
              />
              <Testimonials />

              {/* Bottom booking encouragement */}
              <div className="py-14 bg-white border-t border-[#E8BAC0]/30 text-center">
                <div className="max-w-xl mx-auto px-4">
                  <h3 className="text-2xl font-display text-[#3D2B27] mb-2">
                    Ready for Your Own Transformative Ritual?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C4A45] font-serif-luxury italic mb-6">
                    Book online today and enjoy complimentary botanical flower tea with every reservation.
                  </p>
                  <button
                    onClick={() => handleOpenBooking()}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-widest uppercase shadow-md transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Your Appointment</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'location' && (
            <motion.div
              key="location-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Location & FAQ"
                title="Sanctuary Location, Hours & FAQ"
                subtitle="Everything you need to know for your visit to our Blackpool courtyard sanctuary, concierge details, and treatment questions."
                tagline="VISIT & CONCIERGE"
                onNavigateHome={() => handleNavigate('home')}
              />
              <LocationAndFaq />
            </motion.div>
          )}

          {currentPage === 'terms' && (
            <motion.div
              key="terms-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TermsAndConditionsPage
                onNavigate={handleNavigate}
                onOpenBooking={() => handleOpenBooking()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with synchronized navigation callbacks */}
      <Footer onNavigate={handleNavigate} onOpenCRM={() => setIsCRMOpen(true)} />

      {/* Interactive Reservation Modal accessible across all pages */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setPreselectedProduct(undefined);
          setPreselectedDuration(undefined);
          setPreselectedIsCourse(false);
        }}
        preselectedServiceId={preselectedServiceId}
        initialProduct={preselectedProduct}
        initialDuration={preselectedDuration}
        initialIsCourse={preselectedIsCourse}
        onOpenCRM={() => setIsCRMOpen(true)}
        onOpenTerms={() => {
          setIsBookingOpen(false);
          handleNavigate('terms');
        }}
      />

      {/* Owner Private CRM & Sales Portal Modal */}
      <OwnerCRMModal
        isOpen={isCRMOpen}
        onClose={() => setIsCRMOpen(false)}
      />

      {/* Floating Quick Reservation & Phone Action buttons */}
      <aside aria-label="Quick Actions" className="fixed bottom-5 right-5 z-30 flex items-center gap-2">
        {/* Owner CRM Portal Quick Access */}
        <button
          onClick={() => setIsCRMOpen(true)}
          className="p-3.5 rounded-full bg-[#5C423E] hover:bg-[#43302C] text-[#E8BAC0] hover:text-white border border-[#BE757C]/40 shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
          title="Open Owner CRM & Payment Ledger"
          aria-label="Owner CRM"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {totalCartCount > 0 && currentPage !== 'basket' && (
          <button
            onClick={() => handleNavigate('basket')}
            className="flex items-center gap-2 px-4 py-3.5 rounded-full bg-[#3D2B27] hover:bg-[#2A1D1A] text-white text-xs font-semibold tracking-wider uppercase shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
            title="View Shopping Basket"
          >
            <ShoppingBag className="w-4 h-4 text-[#E8BAC0]" />
            <span className="hidden sm:inline">Basket</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#BE757C] text-white text-[10px] font-bold">
              {totalCartCount}
            </span>
          </button>
        )}

        <a
          href="tel:+447707328060"
          className="p-3.5 rounded-full bg-white text-[#BE757C] border border-[#BE757C]/40 shadow-lg hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
          title="Call Spa Concierge (+44 7707328060)"
          aria-label="Call Spa Concierge"
        >
          <Phone className="w-5 h-5" />
        </a>

        <button
          id="floating-book-btn"
          onClick={() => handleOpenBooking()}
          className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white text-xs font-semibold tracking-widest uppercase shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Book Appointment</span>
          <span className="sm:hidden">Book</span>
        </button>
      </aside>
    </div>
  );
}

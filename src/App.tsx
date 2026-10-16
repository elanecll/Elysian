/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Navbar } from "./components/Navbar";
import { HeroBanner } from "./components/HeroBanner";
import { ServiceHighlights } from "./components/ServiceHighlights";
import { HotStoneBodyMassageSection } from "./components/HotStoneBodyMassageSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { TreatmentMenu } from "./components/TreatmentMenu";
import { Testimonials } from "./components/Testimonials";
import { LocationAndFaq } from "./components/LocationAndFaq";
import { ShopSection } from "./components/ShopSection";
import { BuyProductPage } from "./components/BuyProductPage";
import { TermsAndConditionsPage } from "./components/TermsAndConditionsPage";
import { Footer } from "./components/Footer";
import { BookingModal } from "./components/BookingModal";
import { OwnerCRMModal } from "./components/OwnerCRMModal";
import { PageBanner } from "./components/PageBanner";
import { PaymentReturnPage } from "./components/PaymentReturnPage";
import { SPA_PRODUCTS } from "./data/shopData";
import type { Receipt } from "../shared/payments";
import { PageTab, Product, CartItem } from "./types";
import {
  Calendar,
  Phone,
  Sparkles,
  ArrowRight,
  Star,
  Heart,
  MapPin,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const scrollToDepositPolicy = () =>
  document.getElementById("deposit-policy")?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageTab>("home");
  const [treatmentCategory, setTreatmentCategory] = useState<string>("all");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isCRMOpen, setIsCRMOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<
    string | undefined
  >();
  const [preselectedProduct, setPreselectedProduct] = useState<
    "tropic" | "clinicare" | undefined
  >();
  const [preselectedDuration, setPreselectedDuration] = useState<
    "30" | "60" | undefined
  >();
  const [preselectedIsCourse, setPreselectedIsCourse] =
    useState<boolean>(false);

  // Persistent shopping cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("elysian_cart");
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((item) => {
        const product = SPA_PRODUCTS.find((p) => p.id === item?.product?.id);
        return product && Number.isInteger(item.quantity) && item.quantity > 0
          ? [{ product, quantity: Math.min(item.quantity, 20) }]
          : [];
      });
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("elysian_cart", JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to sync cart to localStorage", e);
    }
  }, [cart]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id,
      );
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
    handleNavigate("basket");
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
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
    setCart((prevCart) =>
      prevCart.filter((item) => item.product.id !== productId),
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const clearedPayments = useRef(new Set<string>());
  const handlePaidOrder = useCallback((receipt: Receipt) => {
    if (
      receipt.type !== "sale" ||
      receipt.paidPence <= 0 ||
      clearedPayments.current.has(receipt.id)
    )
      return;
    const marker = `elysian_cart_cleared_${receipt.id}`;
    try {
      if (
        localStorage.getItem(marker) ||
        !localStorage.getItem(`elysian_checkout_${receipt.id}`)
      )
        return;
    } catch {
      return;
    }
    clearedPayments.current.add(receipt.id);
    setCart((previous) =>
      previous.flatMap((item) => {
        const purchased =
          receipt.items.find((i) => i.id === item.product.id)?.quantity || 0;
        const quantity = item.quantity - purchased;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      }),
    );
    try {
      localStorage.setItem(marker, "1");
      localStorage.removeItem(`elysian_checkout_${receipt.id}`);
    } catch {
      /* Cart storage can be unavailable. */
    }
  }, []);

  // Parse initial page from hash on mount
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
      if (
        hash === "payment" ||
        (!hash && new URLSearchParams(window.location.search).has("receipt"))
      ) {
        setCurrentPage("payment");
      } else if (
        hash === "treatments" ||
        hash === "menu" ||
        hash === "services"
      ) {
        setCurrentPage("treatments");
      } else if (hash === "experience" || hash === "about") {
        setCurrentPage("reviews");
        window.history.replaceState(null, "", window.location.pathname + window.location.search + "#reviews");
      } else if (
        hash === "shop" ||
        hash === "boutique" ||
        hash === "vouchers"
      ) {
        setCurrentPage("shop");
      } else if (hash === "basket" || hash === "cart" || hash === "checkout") {
        setCurrentPage("basket");
      } else if (hash === "reviews" || hash === "testimonials") {
        setCurrentPage("reviews");
      } else if (
        hash === "location" ||
        hash === "contact" ||
        hash === "faq" ||
        hash === "hours"
      ) {
        setCurrentPage("location");
      } else if (
        hash === "terms" ||
        hash === "conditions" ||
        hash === "deposit-policy" ||
        hash === "policy"
      ) {
        setCurrentPage("terms");
      } else if (hash === "admin" || hash === "crm" || hash === "owner") {
        setIsCRMOpen(true);
      } else {
        setCurrentPage("home");
      }
    };

    parseHash();
    window.addEventListener("hashchange", parseHash);

    // Private Owner Shortcut: Ctrl + Shift + A or Cmd + Shift + A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === "A" || e.key === "a" || e.key === "O" || e.key === "o")
      ) {
        e.preventDefault();
        setIsCRMOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("hashchange", parseHash);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (currentPage !== "terms") return;
    const frame = window.requestAnimationFrame(scrollToDepositPolicy);
    return () => window.cancelAnimationFrame(frame);
  }, [currentPage]);

  const handleNavigate = (page: PageTab, categoryFilter?: string) => {
    if (page !== "payment") {
      const url = new URL(window.location.href);
      url.searchParams.delete("receipt");
      url.searchParams.delete("cancelled");
      window.history.replaceState(
        null,
        "",
        url.pathname + url.search + url.hash,
      );
    }
    setCurrentPage(page);
    if (categoryFilter) {
      setTreatmentCategory(categoryFilter);
    }
    window.location.hash = page === "home" ? "" : `#${page}`;
    if (page === "terms") scrollToDepositPolicy();
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenBooking = (
    serviceId?: string,
    preferredProduct?: "tropic" | "clinicare",
    preferredDuration?: "30" | "60",
    isCourse?: boolean,
  ) => {
    setPreselectedServiceId(serviceId);
    setPreselectedProduct(preferredProduct);
    setPreselectedDuration(preferredDuration);
    setPreselectedIsCourse(!!isCourse);
    setIsBookingOpen(true);
  };

  const handleExploreTreatments = (category: string = "all") => {
    setTreatmentCategory(category);
    handleNavigate("treatments", category);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F9] text-[#3D2B27] flex flex-col selection:bg-[#E8BAC0] selection:text-[#3D2B27]">

      {/* Header Navigation with Multi-Page Tabs */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenBooking={() => handleOpenBooking()}
        onOpenCRM={() => setIsCRMOpen(true)}
        cartCount={totalCartCount}
      />

      {/* Main Multi-Page Content with Animated Transitions */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {currentPage === "payment" && (
            <PaymentReturnPage
              key="payment-page"
              onPaid={handlePaidOrder}
              onNavigate={handleNavigate}
            />
          )}
          {currentPage === "home" && (
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
              <ServiceHighlights
                onSelectService={(serviceId) => handleOpenBooking(serviceId)}
              />

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
                        Immerse in private sound-insulated acoustic suites,
                        heated memory foam beds, organic botanical oils, and
                        complimentary tea lounge relaxation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => handleNavigate("reviews")}
                        className="px-6 py-3 rounded-full border border-[#BE757C]/50 hover:border-[#BE757C] text-[#3D2B27] hover:text-[#BE757C] bg-[#FFF9F9] font-medium text-xs tracking-widest uppercase transition-all cursor-pointer"
                      >
                        Our Philosophy
                      </button>
                      <button
                        onClick={() => handleNavigate("treatments")}
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
                    "From the moment you walk in, the tension leaves your
                    shoulders. The hot stones and facial left my skin glowing
                    for weeks."
                  </p>
                  <button
                    onClick={() => handleNavigate("reviews")}
                    className="inline-flex items-center gap-1.5 text-xs text-[#BE757C] hover:text-[#9F5158] font-bold uppercase tracking-widest cursor-pointer underline underline-offset-4"
                  >
                    <span>Read Guest Reviews</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {currentPage === "treatments" && (
            <motion.div
              key="treatments-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Treatment Menu & Pricing"
                title="Treatment Menu & Pricing"
                subtitle="Explore our complete bespoke therapies featuring advanced Swedish CLINICARE medical-grade cosmeceuticals and therapeutic bodywork."
                tagline="HOLISTIC BEAUTY & BODYWORK"
                backgroundImage="/images/treatments/treatment-menu-background.png"
                onNavigateHome={() => handleNavigate("home")}
              />
              <TreatmentMenu
                onBookTreatment={(
                  serviceId,
                  preferredProduct,
                  preferredDuration,
                  isCourse,
                ) =>
                  handleOpenBooking(
                    serviceId,
                    preferredProduct,
                    preferredDuration,
                    isCourse,
                  )
                }
                selectedCategory={treatmentCategory}
              />
            </motion.div>
          )}

          {currentPage === "shop" && (
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
                onViewBasket={() => handleNavigate("basket")}
              />
            </motion.div>
          )}

          {currentPage === "basket" && (
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
                onNavigateHome={() => handleNavigate("home")}
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

          {currentPage === "reviews" && (
            <motion.div
              key="reviews-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <PageBanner
                currentPageName="Reviews & Experience"
                title="Reviews & Experience"
                subtitle="Read our guests’ reviews, explore treatment results, and discover what to expect at Elysian."
                tagline="YOUR VISIT TO ELYSIAN"
                onNavigateHome={() => handleNavigate("home")}
              />
              <Testimonials />

              <ExperienceSection
                onOpenBooking={() => handleOpenBooking()}
                onExploreTreatments={() => handleNavigate("treatments")}
              />
            </motion.div>
          )}

          {(currentPage === "location" || currentPage === "terms") && (
            <motion.div
              key="location-page"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => {
                if (currentPage === "terms") scrollToDepositPolicy();
              }}
            >
              <PageBanner
                currentPageName="Location, FAQ & Policies"
                title="Location, FAQ & Policies"
                subtitle="Find our location and opening hours, answers to your questions, and our booking and deposit policies."
                tagline="VISIT & CONCIERGE"
                onNavigateHome={() => handleNavigate("home")}
              />
              <LocationAndFaq />
              <TermsAndConditionsPage
                embedded
                onNavigate={handleNavigate}
                onOpenBooking={() => handleOpenBooking()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer with synchronized navigation callbacks */}
      <Footer
        onNavigate={handleNavigate}
        onOpenCRM={() => setIsCRMOpen(true)}
      />

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
          handleNavigate("terms");
        }}
      />

      {/* Owner Private CRM & Sales Portal Modal */}
      <OwnerCRMModal isOpen={isCRMOpen} onClose={() => setIsCRMOpen(false)} />

      {/* Floating Quick Reservation & Phone Action buttons */}
      {currentPage !== "basket" &&
        currentPage !== "payment" &&
        !isBookingOpen &&
        !isCRMOpen && (
          <aside
            aria-label="Quick Actions"
            className="fixed bottom-5 right-5 z-30 flex items-center gap-2"
          >
            {/* Owner CRM Portal Quick Access */}
            <button
              onClick={() => setIsCRMOpen(true)}
              className="p-3.5 rounded-full bg-[#5C423E] hover:bg-[#43302C] text-[#E8BAC0] hover:text-white border border-[#BE757C]/40 shadow-xl hover:scale-105 transition-all flex items-center justify-center cursor-pointer"
              title="Open Owner CRM & Payment Ledger"
              aria-label="Owner CRM"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {totalCartCount > 0 && (
              <button
                onClick={() => handleNavigate("basket")}
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
        )}
    </div>
  );
}

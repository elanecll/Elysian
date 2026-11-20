import React, { useState } from 'react';
import { Menu, X, Phone, Calendar, Sparkles, ShoppingBag } from 'lucide-react';
import { PageTab } from '../types';

interface NavbarProps {
  currentPage: PageTab;
  onNavigate: (page: PageTab, categoryFilter?: string) => void;
  onOpenBooking: () => void;
  cartCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
  cartCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageTab; name: string; isShop?: boolean }[] = [
    { id: 'home', name: 'Home' },
    { id: 'treatments', name: 'Treatments' },
    { id: 'shop', name: 'Shop', isShop: true },
    { id: 'reviews', name: 'Reviews' },
    { id: 'location', name: 'Visit Us' },
  ];

  const handleNavClick = (page: PageTab) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF7F1]/98 backdrop-blur-md border-b border-[#D6C3A3]/30 transition-all shadow-xs">
      {/* Top Banner Ribbon */}
      <div hidden className="bg-[#5D4933] text-[#F1EADC] text-[11px] sm:text-xs py-1.5 px-4 text-center tracking-widest uppercase font-medium hidden items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#D6C3A3]" />
          Complimentary with Botanical Flowers Tea
        </span>
        <span className="hidden md:inline text-[#D6C3A3]/50">•</span>
        <button
          onClick={() => handleNavClick('terms')}
          className="text-[#D6C3A3] hover:text-white font-semibold transition-colors underline decoration-dotted underline-offset-2 cursor-pointer"
          title="View our 50% Deposit Policy & Booking Terms"
        >
          💳 50% Deposit Policy
        </button>
        <span className="hidden md:inline text-[#D6C3A3]/50">•</span>
        <a href="tel:+447707328060" className="hidden md:inline-flex items-center gap-1 text-[#D6C3A3] hover:text-white transition-colors">
          <Phone className="w-3 h-3" /> +44 7707 32 8060
        </a>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-24 sm:h-28 flex items-center justify-between">
        {/* Brand Logo Image */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center group py-1 shrink-0 text-left cursor-pointer border-none bg-transparent"
        >
          <img
            id="nav-logo-image"
            src="/images/brand/elysian-gold-logo-transparent.png"
            alt="Elysian Beauty Spa"
            width={1000}
            height={334}
            className="h-20 sm:h-24 w-[180px] sm:w-[228px] max-w-[48vw] object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3 xl:gap-7">
          {navItems.map((item) => {
            const isActive = currentPage === item.id || (item.id === 'location' && currentPage === 'terms');
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-[10px] xl:text-[11px] tracking-[0.1em] whitespace-nowrap uppercase font-medium transition-all relative py-1.5 cursor-pointer ${
                  isActive
                    ? 'text-[#806035] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#806035]'
                    : item.isShop
                    ? 'text-[#806035] hover:text-[#6E4F2B] font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#806035] hover:after:w-full after:transition-all after:duration-300'
                    : 'text-[#5C4937] hover:text-[#806035] after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#806035] hover:after:w-full after:transition-all after:duration-300'
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Basket Button with Live Badge */}
          <button
            id="nav-basket-btn"
            onClick={() => handleNavClick('basket')}
            title="View Shopping Basket"
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[11px] tracking-[0.08em] whitespace-nowrap uppercase font-medium transition-all duration-300 shadow-2xs cursor-pointer relative ${
              currentPage === 'basket'
                ? 'bg-[#806035] text-white border-[#806035]'
                : 'border-[#D6C3A3] text-[#5D4933] hover:border-[#806035] hover:text-[#806035] bg-white/90 hover:bg-[#F1EADC]'
            }`}
          >
            <ShoppingBag className={`w-3.5 h-3.5 ${currentPage === 'basket' ? 'text-white' : 'text-[#806035]'}`} />
            <span>Basket</span>
            {cartCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#806035] text-white leading-none">
                {cartCount}
              </span>
            )}
          </button>



          {/* Book Appointment CTA */}
          <button
            id="nav-book-btn"
            onClick={onOpenBooking}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#806035] hover:bg-[#684B2A] text-white font-medium text-[11px] tracking-[0.1em] whitespace-nowrap uppercase transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => handleNavClick(cartCount > 0 ? 'basket' : 'shop')}
            className={`sm:hidden p-2 rounded-full border relative ${
              currentPage === 'basket' || currentPage === 'shop'
                ? 'bg-[#806035] text-white border-[#806035]'
                : 'border-[#806035]/40 text-[#806035] bg-white/60'
            }`}
            aria-label="Shop Basket"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#493A2D] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>



          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#493A2D] hover:text-[#806035] hover:bg-[#806035]/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FAF7F1] border-b border-[#D6C3A3]/40 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id || (item.id === 'location' && currentPage === 'terms');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-[13px] tracking-[0.1em] uppercase font-medium py-2.5 px-3 rounded-lg border-b border-[#D6C3A3]/20 flex items-center justify-between text-left transition-all ${
                    isActive
                      ? 'bg-[#F1EADC] text-[#806035] font-bold border-l-4 border-l-[#806035]'
                      : 'text-[#5C4937] hover:text-[#806035] hover:bg-[#F1EADC]/50'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.isShop && <ShoppingBag className="w-4 h-4 text-[#806035]" />}
                </button>
              );
            })}

            {/* Mobile Basket Item */}
            <button
              onClick={() => handleNavClick('basket')}
              className={`text-[13px] tracking-[0.1em] uppercase font-medium py-2.5 px-3 rounded-lg border-b border-[#D6C3A3]/20 flex items-center justify-between text-left transition-all ${
                currentPage === 'basket'
                  ? 'bg-[#F1EADC] text-[#806035] font-bold border-l-4 border-l-[#806035]'
                  : 'text-[#5C4937] hover:text-[#806035] hover:bg-[#F1EADC]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#806035]" />
                <span>Shopping Basket</span>
              </div>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#806035] text-white text-xs font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#806035] text-white font-medium text-xs tracking-widest uppercase shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <a
              href="tel:+447707328060"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-[#806035]/50 text-[#806035] text-xs tracking-widest uppercase"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call +44 7707 32 8060</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

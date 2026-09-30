import React, { useState } from 'react';
import { Menu, X, Phone, Calendar, Volume2, VolumeX, Sparkles, ShoppingBag, ShieldCheck } from 'lucide-react';
import { PageTab } from '../types';

interface NavbarProps {
  currentPage: PageTab;
  onNavigate: (page: PageTab, categoryFilter?: string) => void;
  onOpenBooking: () => void;
  isAudioPlaying: boolean;
  onToggleAudio: () => void;
  cartCount?: number;
  onOpenCRM?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
  isAudioPlaying,
  onToggleAudio,
  cartCount = 0,
  onOpenCRM,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageTab; name: string; isShop?: boolean }[] = [
    { id: 'home', name: 'Home' },
    { id: 'treatments', name: 'Treatment Menu' },
    { id: 'experience', name: 'The Experience' },
    { id: 'shop', name: 'Shop', isShop: true },
    { id: 'reviews', name: 'Reviews' },
    { id: 'location', name: 'Location & FAQ' },
    { id: 'terms', name: 'Deposit Policy' },
  ];

  const handleNavClick = (page: PageTab) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFF9F9]/98 backdrop-blur-md border-b border-[#E8BAC0]/30 transition-all shadow-xs">
      {/* Top Banner Ribbon */}
      <div className="bg-[#5C423E] text-[#FFF0F2] text-[11px] sm:text-xs py-1.5 px-4 text-center tracking-widest uppercase font-medium flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#E8BAC0]" />
          Complimentary with Botanical Flowers Tea
        </span>
        <span className="hidden md:inline text-[#E8BAC0]/50">•</span>
        <button
          onClick={() => handleNavClick('terms')}
          className="text-[#E8BAC0] hover:text-white font-semibold transition-colors underline decoration-dotted underline-offset-2 cursor-pointer"
          title="View our 50% Deposit Policy & Booking Terms"
        >
          💳 50% Deposit Policy
        </button>
        <span className="hidden md:inline text-[#E8BAC0]/50">•</span>
        <a href="tel:+447707328060" className="hidden md:inline-flex items-center gap-1 text-[#E8BAC0] hover:text-white transition-colors">
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
            src="https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6a82f6cffe4291bd1018aed4.jpeg"
            alt="Elysian Spa & Wellness"
            className="h-20 sm:h-24 md:h-26 w-auto max-w-[240px] sm:max-w-[320px] md:max-w-[360px] object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-xs tracking-[0.16em] uppercase font-medium transition-all relative py-1.5 cursor-pointer ${
                  isActive
                    ? 'text-[#BE757C] font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#BE757C]'
                    : item.isShop
                    ? 'text-[#BE757C] hover:text-[#9F5158] font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#BE757C] hover:after:w-full after:transition-all after:duration-300'
                    : 'text-[#4A352F] hover:text-[#BE757C] after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#BE757C] hover:after:w-full after:transition-all after:duration-300'
                }`}
              >
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Basket Button with Live Badge */}
          <button
            id="nav-basket-btn"
            onClick={() => handleNavClick('basket')}
            title="View Shopping Basket"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs tracking-wider uppercase font-medium transition-all duration-300 shadow-2xs cursor-pointer relative ${
              currentPage === 'basket'
                ? 'bg-[#BE757C] text-white border-[#BE757C]'
                : 'border-[#E8BAC0] text-[#5C423E] hover:border-[#BE757C] hover:text-[#BE757C] bg-white/90 hover:bg-[#FFF0F2]'
            }`}
          >
            <ShoppingBag className={`w-3.5 h-3.5 ${currentPage === 'basket' ? 'text-white' : 'text-[#BE757C]'}`} />
            <span>Basket</span>
            {cartCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#BE757C] text-white leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Ambient Spa Audio Toggle Button */}
          <button
            id="ambient-audio-toggle"
            onClick={onToggleAudio}
            title={isAudioPlaying ? "Mute serene spa music" : "Play serene spa music"}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center gap-1.5 text-xs font-sans-clean tracking-wider cursor-pointer ${
              isAudioPlaying 
                ? 'bg-[#BE757C]/15 border-[#BE757C] text-[#BE757C]' 
                : 'border-[#E8BAC0]/60 text-[#5C423E] hover:border-[#BE757C] hover:text-[#BE757C] bg-white/50'
            }`}
          >
            {isAudioPlaying ? (
              <>
                <Volume2 className="w-4 h-4 text-[#BE757C] animate-pulse" />
                <span className="text-[11px] font-medium hidden xl:inline">Zen Audio: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#5C423E]" />
                <span className="text-[11px] font-medium hidden xl:inline">Zen Audio</span>
              </>
            )}
          </button>

          {/* Book Appointment CTA */}
          <button
            id="nav-book-btn"
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-xs hover:shadow-md cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Now</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => handleNavClick(cartCount > 0 ? 'basket' : 'shop')}
            className={`p-2 rounded-full border relative ${
              currentPage === 'basket' || currentPage === 'shop'
                ? 'bg-[#BE757C] text-white border-[#BE757C]'
                : 'border-[#BE757C]/40 text-[#BE757C] bg-white/60'
            }`}
            aria-label="Shop Basket"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#3D2B27] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-full border transition-all ${
              isAudioPlaying 
                ? 'bg-[#BE757C]/15 border-[#BE757C] text-[#BE757C]' 
                : 'border-[#E8BAC0]/60 text-[#5C423E]'
            }`}
            aria-label="Toggle ambient spa audio"
          >
            {isAudioPlaying ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#3D2B27] hover:text-[#BE757C] hover:bg-[#BE757C]/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#FFF9F9] border-b border-[#E8BAC0]/40 px-6 py-6 space-y-4 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg border-b border-[#E8BAC0]/20 flex items-center justify-between text-left transition-all ${
                    isActive
                      ? 'bg-[#FFF0F2] text-[#BE757C] font-bold border-l-4 border-l-[#BE757C]'
                      : 'text-[#4A352F] hover:text-[#BE757C] hover:bg-[#FFF0F2]/50'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.isShop && <ShoppingBag className="w-4 h-4 text-[#BE757C]" />}
                </button>
              );
            })}

            {/* Mobile Basket Item */}
            <button
              onClick={() => handleNavClick('basket')}
              className={`text-sm tracking-widest uppercase font-medium py-2.5 px-3 rounded-lg border-b border-[#E8BAC0]/20 flex items-center justify-between text-left transition-all ${
                currentPage === 'basket'
                  ? 'bg-[#FFF0F2] text-[#BE757C] font-bold border-l-4 border-l-[#BE757C]'
                  : 'text-[#4A352F] hover:text-[#BE757C] hover:bg-[#FFF0F2]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#BE757C]" />
                <span>Shopping Basket</span>
              </div>
              {cartCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#BE757C] text-white text-xs font-bold">
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
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#BE757C] text-white font-medium text-xs tracking-widest uppercase shadow-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <a
              href="tel:+447707328060"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-[#BE757C]/50 text-[#BE757C] text-xs tracking-widest uppercase"
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

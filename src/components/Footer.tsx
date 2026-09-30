import React from 'react';
import { SpaHeartDivider } from './SpaIcons';
import { Sparkles, Phone, Mail, MapPin, Instagram, Facebook, Heart, MessageCircle, Lock } from 'lucide-react';
import { PageTab } from '../types';

interface FooterProps {
  onNavigate?: (page: PageTab, categoryFilter?: string) => void;
  onOpenCRM?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCRM }) => {
  const handleNav = (page: PageTab, categoryFilter?: string) => {
    if (onNavigate) {
      onNavigate(page, categoryFilter);
    }
  };

  return (
    <footer className="bg-[#422F2B] text-[#F3DFE2] pt-16 pb-12 border-t border-[#BE757C]/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        
        {/* Top Newsletter / Concierge section */}
        <div className="bg-[#533B36] rounded-2xl p-8 sm:p-10 border border-[#BE757C]/30 mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="max-w-md text-center lg:text-left">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#E8BAC0] font-semibold font-sans-clean">
              SANCTUARY PRIVILEGES
            </span>
            <h3 className="text-2xl sm:text-3xl font-display text-white mt-1">
              Join Our Elysian Circle
            </h3>
            <p className="text-xs sm:text-sm text-[#E2C7CA] mt-2 font-serif-luxury italic">
              Receive seasonal wellness invitations, complimentary aromatherapy upgrades, and priority reservation slots.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto max-w-md">
            <input
              type="email"
              placeholder="Your email address"
              className="px-5 py-3 rounded-full bg-[#3D2B27] border border-[#BE757C]/40 text-xs sm:text-sm text-white placeholder-[#B89FA3] focus:outline-hidden focus:border-[#E8BAC0] min-w-[240px]"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-[#BE757C] hover:bg-[#A9636A] text-white text-xs tracking-widest uppercase font-semibold transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#BE757C]/20">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#BE757C]/20 border border-[#BE757C] flex items-center justify-center text-[#E8BAC0]">
                <span className="font-display text-base">E</span>
              </div>
              <div>
                <span className="font-display text-xl tracking-[0.16em] text-white uppercase block">
                  ELYSIAN
                </span>
                <span className="text-[9px] tracking-[0.3em] text-[#E8BAC0] uppercase font-sans-clean block">
                  Beauty Spa
                </span>
              </div>
            </div>
            <p className="text-xs text-[#D8BFC2] leading-relaxed font-sans-clean">
              A bespoke wellness haven specializing in restorative facials, therapeutic body massage, and volcanic hot stone rituals.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/elysian.beauty.spa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Profile"
                className="w-8 h-8 rounded-full bg-[#533B36] hover:bg-[#BE757C] text-[#E8BAC0] hover:text-white flex items-center justify-center transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61590445207420&sk=about"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page"
                className="w-8 h-8 rounded-full bg-[#533B36] hover:bg-[#BE757C] text-[#E8BAC0] hover:text-white flex items-center justify-center transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Treatments Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4 font-sans-clean">
              Signature Rituals
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D8BFC2]">
              <li>
                <button onClick={() => handleNav('treatments', 'facial')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Hydro-Facial &amp; Aesthetics
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments', 'facial')} className="hover:text-white transition-colors text-left cursor-pointer">
                  RADIO FREQUENCY Facial
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments', 'facial')} className="hover:text-white transition-colors text-left cursor-pointer">
                  EMS &amp; Ultrasonic Facial
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments', 'body-massage')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Swedish Full Body Massage
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments', 'hot-stone')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Hot Stone Full Body Massage
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments', 'packages')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Treatment Packages
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4 font-sans-clean">
              Sanctuary
            </h4>
            <ul className="space-y-2.5 text-xs text-[#D8BFC2]">
              <li>
                <button onClick={() => handleNav('experience')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Our Philosophy &amp; Experience
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('treatments')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Treatment Menu &amp; Pricing
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('reviews')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Guest Testimonials
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('location')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Location &amp; Opening Hours
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('location')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('shop')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Boutique &amp; Gift Vouchers
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('basket')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Shopping Basket &amp; Checkout
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('terms')} className="text-[#E8BAC0] hover:text-white transition-colors text-left cursor-pointer font-medium flex items-center gap-1">
                  <span>Terms &amp; 50% Deposit Policy</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-4 font-sans-clean">
              Sanctuary Inquiries
            </h4>
            <div className="space-y-3 text-xs text-[#D8BFC2]">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#BE757C] shrink-0 mt-0.5" />
                <span>5, St Michael's Close, FY3 7GX, Blackpool</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#BE757C] shrink-0" />
                <a href="tel:+447707328060" className="hover:text-white">+44 7707 32 8060</a>
              </p>
              <p className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#BE757C] shrink-0" />
                <a href="https://wa.me/447707328060" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Whatsapp : Elaine Chong
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Facebook className="w-4 h-4 text-[#BE757C] shrink-0" />
                <a
                  href="https://www.facebook.com/profile.php?id=61590445207420&sk=about"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Facebook Elysian Beauty Spa
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Instagram className="w-4 h-4 text-[#BE757C] shrink-0" />
                <a
                  href="https://www.instagram.com/elysian.beauty.spa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  Instagram Elysian.beauty.spa
                </a>
              </p>
              <p className="text-[11px] text-[#E8BAC0] pt-2">
                Valet parking available at private courtyard entrance.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#B89FA3] gap-4">
          <p>© {new Date().getFullYear()} Elysian Spa &amp; Wellness Sanctuary. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => handleNav('home')} className="hover:text-white transition-colors cursor-pointer">Home</button>
            <button onClick={() => handleNav('treatments')} className="hover:text-white transition-colors cursor-pointer">Treatments</button>
            <button onClick={() => handleNav('location')} className="hover:text-white transition-colors cursor-pointer">Contact &amp; FAQ</button>
            <button onClick={() => handleNav('terms')} className="hover:text-white text-[#E8BAC0] transition-colors cursor-pointer underline underline-offset-2">Terms &amp; 50% Deposit Policy</button>
            {onOpenCRM && (
              <button
                onClick={onOpenCRM}
                className="text-[#B89FA3]/50 hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-normal text-[10px]"
                title="Management Portal (Shortcut: Ctrl+Shift+A)"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Staff Access</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};

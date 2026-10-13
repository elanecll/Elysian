import React, { useEffect, useState } from "react";
import {
  DEFAULT_HOURS,
  DAY_NAMES,
  type OpeningDay,
} from "../../shared/calendar";
import { api } from "../data/paymentApi";
import { SPA_FAQS } from "../data/spaData";
import { SpaHeartDivider } from "./SpaIcons";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronDown,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { infoCardClass, infoInsetClass } from "./infoStyles";

export const LocationAndFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [schedule, setSchedule] = useState<OpeningDay[]>(DEFAULT_HOURS);
  useEffect(() => {
    const controller = new AbortController();
    api<{ hours: OpeningDay[] }>("/calendar/hours", undefined, {
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) setSchedule(result.hours);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const hours = [2, 3, 4, 5, 6, 0, 1].map((day) => {
    const entry = schedule.find((d) => d.day === day)!;
    return {
      day: DAY_NAMES[day],
      time: entry.enabled ? `${entry.open} – ${entry.close}` : "Closed",
    };
  });

  return (
    <section id="location" className="py-8 sm:py-12 bg-[#FFF9F9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Left Column: Location & Hours Card */}
          <div className={infoCardClass}>
            <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
              VISIT OUR SANCTUARY
            </p>
            <div className="w-32 my-2">
              <SpaHeartDivider className="justify-start" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-display text-[#3D2B27] mt-3 mb-3">
              Location &amp; Hours
            </h2>

            <p className="text-sm text-[#5C4A45] leading-relaxed mb-6 font-sans-clean">
              Nestled in a peaceful botanical courtyard, our spa provides
              private valet parking and discrete entry for optimal relaxation.
            </p>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#BE757C] shrink-0 border border-[#BE757C]/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-1">
                    Sanctuary Address
                  </h4>
                  <p className="text-xs text-[#5C4A45] leading-relaxed">
                    5, St Michael's Close
                    <br />
                    FY3 7GX, Blackpool
                  </p>
                </div>
              </div>

              {/* Phone & Email */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#FFF0F2] flex items-center justify-center text-[#BE757C] shrink-0 border border-[#BE757C]/20">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27] mb-1">
                    Concierge Inquiries
                  </h4>
                  <p className="text-xs text-[#5C4A45]">
                    Direct:{" "}
                    <a
                      href="tel:+447707328060"
                      className="text-[#BE757C] hover:underline font-medium"
                    >
                      +44 7707328060
                    </a>
                    <br />
                    WhatsApp:{" "}
                    <a
                      href="https://wa.me/447707328060"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BE757C] hover:underline font-medium"
                    >
                      Elaine Chong (+44 7707328060)
                    </a>
                  </p>
                </div>
              </div>

              {/* Operating Hours Table */}
              <div className="pt-4 border-t border-[#F5E6E8]">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-[#BE757C]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2B27]">
                    Opening Schedule
                  </h4>
                </div>
                <div className="space-y-2">
                  {hours.map((h, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs py-1 border-b border-dashed border-[#F0D5D8]/40"
                    >
                      <span className="text-[#4A352F] font-medium">
                        {h.day}
                      </span>
                      <span className="text-[#BE757C] font-semibold">
                        {h.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: FAQ Accordion */}
          <div id="faq" className={infoCardClass}>
            <p className="text-xs sm:text-sm tracking-[0.3em] text-[#BE757C] uppercase font-semibold font-sans-clean">
              COMMON INQUIRIES
            </p>
            <div className="w-32 my-2">
              <SpaHeartDivider className="justify-start" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-display text-[#3D2B27] mt-3 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#5C4A45] leading-relaxed mb-6">
              Find answers to common questions about your treatments and booking.
            </p>

            <div className="space-y-3">
              {SPA_FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className={`${infoInsetClass} overflow-hidden transition-all duration-200`}
                  >
                    <button
                      id={`faq-btn-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 hover:bg-[#FFF5F6] transition-colors cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-medium text-[#3D2B27]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#BE757C] shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          id={`faq-answer-${index}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#5C4A45] leading-relaxed border-t border-[#F5E6E8]">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Calendar, Clock, Pause, Play } from "lucide-react";
import { SPA_SERVICES } from "../data/spaData";
import { isWeeklySpecial } from "../../shared/weeklyPromotion";
const heroServices = SPA_SERVICES.filter((service) => !isWeeklySpecial(service.id));
import type { Treatment } from "../types";

interface HeroBannerProps {
  onOpenBooking: (serviceId?: string) => void;
  onExploreTreatments: (category?: string) => void;
}

const DEFAULT_IMAGE =
  "https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6a955cf2f22eac14d9b37f77.jpeg";
const CATEGORY_LABELS: Record<Treatment["category"], string> = {
  facial: "Facial aesthetics",
  "body-massage": "Body massage",
  "hot-stone": "Hot stone therapy",
  packages: "Treatment packages",
  addons: "Treatment add-ons",
};
const CATEGORY_IMAGES: Record<Treatment["category"], string> = {
  facial: DEFAULT_IMAGE,
  "body-massage":
    SPA_SERVICES.find((service) => service.id === "swedish-full-body-massage")
      ?.image || DEFAULT_IMAGE,
  "hot-stone":
    SPA_SERVICES.find((service) => service.id === "hot-stone-full-body-massage")
      ?.image || DEFAULT_IMAGE,
  packages: DEFAULT_IMAGE,
  addons: DEFAULT_IMAGE,
};
const controlClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#BE757C]/35 bg-white/85 text-[#87464D] transition-colors hover:bg-[#FFF0F2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87464D] cursor-pointer";

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenBooking,
  onExploreTreatments,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(140);
  const reduceMotion = useReducedMotion();
  const slideIndex = activeIndex % heroServices.length;
  const treatment = heroServices[slideIndex];
  const rotating = playing && pageVisible;

  useEffect(() => {
    // Account for the actual navigation and ribbon height at each screen size.
    const header = document.querySelector("header");
    if (!header) return;
    const measureHeader = () =>
      setHeaderHeight(Math.ceil(header.getBoundingClientRect().height));
    measureHeader();
    const observer = new ResizeObserver(measureHeader);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion) setPlaying(false);
  }, [reduceMotion]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % heroServices.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [rotating]);

  return (
    <section
      id="hero"
      aria-label="Explore all Elysian treatments"
      aria-roledescription="carousel"
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).closest("[data-slideshow-toggle]"))
          setPlaying(false);
      }}
      style={
        { "--site-header-height": `${headerHeight}px` } as React.CSSProperties
      }
      className="treatment-hero relative isolate w-full overflow-hidden bg-[#FFF5F5]"
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={treatment.id}
          src={treatment.image || CATEGORY_IMAGES[treatment.category]}
          alt=""
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6 }}
          onError={(event) => {
            if (event.currentTarget.getAttribute("src") !== DEFAULT_IMAGE)
              event.currentTarget.src = DEFAULT_IMAGE;
          }}
          className="treatment-hero-image absolute"
        />
      </AnimatePresence>
      <div className="treatment-hero-content relative flex flex-col justify-center px-5 sm:px-8 lg:px-12">
        <div className="w-full max-w-2xl">
          <div
            id="hero-treatment-slide"
            aria-live={playing ? "off" : "polite"}
            aria-atomic="true"
          >
            <motion.div
              key={treatment.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${heroServices.length}: ${treatment.title}`}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            >
              <p className="treatment-hero-category font-sans-clean text-[11px] font-semibold uppercase tracking-[0.18em] text-[#87464D] sm:text-xs">
                {CATEGORY_LABELS[treatment.category]}
                {treatment.isAddon ? " • Add-on only" : ""}
                {treatment.comingSoon ? " • COMING SOON" : ""}
              </p>
              <h1 className="treatment-hero-title font-display text-[#3D2B27]">
                {treatment.title}
              </h1>
              <p className="treatment-hero-description line-clamp-2 max-w-xl font-serif-luxury text-lg italic leading-6 text-[#4A352F]">
                {treatment.description}
              </p>
              <div className="treatment-hero-details flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-[#4A352F] sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <Clock
                    className="h-4 w-4 text-[#87464D]"
                    aria-hidden="true"
                  />
                  {treatment.duration}
                </span>
                <span className="font-semibold text-[#87464D]">
                  {treatment.priceDisplay}
                </span>
              </div>
            </motion.div>
          </div>

          <div className="treatment-hero-actions grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none">
            <button
              id="hero-book-btn"
              disabled={treatment.comingSoon}
              onClick={() =>
                treatment.isAddon
                  ? onExploreTreatments("addons")
                  : onOpenBooking(treatment.id)
              }
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#87464D] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-white shadow-md transition-colors hover:bg-[#6D373D] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87464D] sm:px-6 sm:text-xs cursor-pointer"
            >
              <Calendar
                className="hidden h-4 w-4 sm:block"
                aria-hidden="true"
              />
              <span>
                {treatment.comingSoon
                  ? "COMING SOON"
                  : treatment.isAddon
                    ? "View add-ons"
                    : "Book treatment"}
              </span>
              <ArrowRight
                className="hidden h-3.5 w-3.5 transition-transform group-hover:translate-x-1 sm:block"
                aria-hidden="true"
              />
            </button>
            <button
              id="hero-explore-btn"
              onClick={() => onExploreTreatments(treatment.category)}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#BE757C]/40 bg-white/85 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[#3D2B27] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#87464D] sm:px-5 sm:text-xs cursor-pointer"
            >
              View menu
            </button>
          </div>
          <p className="treatment-hero-policy text-[10px] leading-relaxed text-[#5C4A45] sm:text-[11px]">
            50% deposit secures your booking • Remaining balance settled on
            arrival
          </p>

          <div
            className="treatment-hero-controls flex items-center gap-2"
            aria-label="Slideshow controls"
          >
            <span
              className="px-2 text-xs tabular-nums text-[#5C4A45]"
              aria-hidden="true"
            >
              {String(slideIndex + 1).padStart(2, "0")} / {heroServices.length}
            </span>
            <button
              type="button"
              data-slideshow-toggle
              aria-label={
                playing
                  ? "Pause treatment slideshow"
                  : "Play treatment slideshow"
              }
              onClick={() => setPlaying((previous) => !previous)}
              className={controlClass}
            >
              {playing ? (
                <Pause className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Play className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

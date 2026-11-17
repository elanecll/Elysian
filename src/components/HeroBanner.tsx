import React from "react";

interface HeroBannerProps {
  onOpenBooking: (serviceId?: string) => void;
  onExploreTreatments: (category?: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenBooking,
  onExploreTreatments,
}) => (
  <section
    id="hero"
    aria-label="Elysian Beauty Spa in Blackpool"
    className="elysian-home-hero"
  >
    <img
      src="/images/brand/elysian-treatment-room-neon.jpg"
      alt="Elysian's warmly lit treatment room with a massage bed and illuminated Elysian Beauty Spa sign"
      className="elysian-home-hero-photo"
      fetchPriority="high"
      decoding="async"
    />
    <div className="elysian-home-hero-shade" aria-hidden="true" />
    <div className="elysian-home-hero-inner">
      <div className="elysian-home-hero-copy">
        <p className="elysian-home-hero-location">
          Elysian Beauty Spa · Blackpool
        </p>
        <h1>
          Your time to
          <br />
          relax <em>and glow.</em>
        </h1>
        <p className="elysian-home-hero-description">
          Personalised facials and relaxing massage in Blackpool.
        </p>
        <div className="elysian-home-hero-actions">
          <button
            id="hero-book-btn"
            type="button"
            onClick={() => onOpenBooking()}
            className="elysian-home-book"
          >
            Book an Appointment
          </button>
          <button
            id="hero-explore-btn"
            type="button"
            onClick={() => onExploreTreatments()}
            className="elysian-home-treatments"
          >
            View Treatments
          </button>
        </div>
      </div>
    </div>
  </section>
);

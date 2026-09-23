import { Treatment, Review, FaqItem } from '../types';

export const SPA_SERVICES: Treatment[] = [
  // 1. Elysian Personalised Glow Treatment
  {
    id: 'elysian-personalised-glow-treatment',
    category: 'facial',
    title: 'Elysian Personalised Glow Treatment',
    tagline: 'ULTIMATE BESPOKE MULTI-TECHNOLOGY FACIAL (SINGLE SESSION)',
    duration: '60-75 mins',
    priceDisplay: '£80 (🔬 CLINICARE)',
    priceOptions: [
      { label: '🔬 CLINICARE Professional Cosmeceuticals', duration: '60-75 mins', priceSingle: 80 },
    ],
    description: 'Our ultimate bespoke multi-technology facial tailored to your exact skin goals. Includes a full multi-modality protocol plus double cleanse, custom CLINICARE active serums, bespoke mask, moisturiser & SPF.',
    benefits: [
      'Ultrasonic Scrubber → Deep cleanse & exfoliate',
      '💧 Hydrodermabrasion → Hydrate & resurface',
      '📡 RF Skin Tightening OR ⚡ EMS Lift → Firm & contour',
      '❄️ Cold Hammer → Calm, soothe, lock in serums',
      '💜 LED Mask → Heal, repair, boost collagen',
      '✨ Plus: Double cleanse, custom CLINICARE active serums, mask, moisturiser & SPF'
    ],
    popular: true,
  },

  // Hydrodemabrasion Facial
  {
    id: 'hydrodemabrasion-facial',
    category: 'facial',
    title: 'Hydrodemabrasion Facial',
    tagline: 'DEEP CLEANSE • HYDRATE • RESURFACE & EXFOLIATE',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £32 (30m Express) / £62 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 32, priceSingle: 32 },
      { duration: '60 min — Full Treatment', priceClinicare: 62, priceSingle: 62 },
    ],
    description: 'Vortex-fusion hydrodermabrasion suction deeply extracts impurities and dead skin cells while infusing intensive CLINICARE low-molecular hyaluronic acid and peptide serums.',
    benefits: [
      'Pore Hydro-Extraction & Deep Cleansing',
      'Non-Invasive Gentle Exfoliation & Resurfacing',
      'Intensive Hydration Infusion (🔬 CLINICARE Active Peptides)',
      'Zero Downtime Glass-Skin Radiance'
    ],
    popular: true,
  },

  // EMS Facial
  {
    id: 'ems-facial',
    category: 'facial',
    title: 'EMS Facial',
    tagline: 'LIFT, TONE, FIRM & CELLULAR ACTIVATION',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £30 (30m Express) / £58 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 30, priceSingle: 30 },
      { duration: '60 min — Full Treatment', priceClinicare: 58, priceSingle: 58 },
    ],
    description: 'Electrical Muscle Stimulation (EMS) paired with CLINICARE active peptide complexes to lift, sculpt, firm facial contours, and stimulate natural collagen and elastin production.',
    benefits: [
      'Facial Contour Lifting & Sculpting',
      'Stimulates Natural Collagen & Elastin',
      'Improves Cellular Oxygenation & Microcirculation',
      'Firms Jawline & Cheek Contours'
    ],
    popular: true,
  },

  // 4. RADIO FREQUENCY Facial
  {
    id: 'radio-frequency-facial',
    category: 'facial',
    title: 'Radio Frequency Facial',
    tagline: 'TIGHTEN SKIN, BOOST COLLAGEN & SMOOTH LINES',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £32 (30m Express) / £60 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 32, priceSingle: 32 },
      { duration: '60 min — Full Treatment', priceClinicare: 60, priceSingle: 60 },
    ],
    description: 'Targeted thermal energy heats deep dermis layers while infusing CLINICARE concentrated hyaluronic acid to tighten lax skin, boost collagen matrix synthesis, and reduce fine lines.',
    benefits: [
      'Deep Dermal Thermal Tightening',
      'Reduces Fine Lines & Wrinkles',
      'Boosts Long-Term Collagen Formation',
      'Restores Elasticity & Firmness'
    ],
  },

  // 5. ULTRASONIC FACIAL
  {
    id: 'ultrasonic-facial',
    category: 'facial',
    title: 'Ultrasonic Facial',
    tagline: 'DEEP NUTRIENT INFUSION & CELLULAR STIMULATION',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £26 (30m Express) / £42 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 26, priceSingle: 26 },
      { duration: '60 min — Full Treatment', priceClinicare: 42, priceSingle: 42 },
    ],
    description: 'High-frequency ultrasonic waves provide deep nutrient infusion with CLINICARE active cosmeceuticals, ultrasonic cellular stimulation, and firm and refine skin tone.',
    benefits: [
      'Deep Nutrient Bio-Infusion',
      'Ultrasonic Cellular Stimulation',
      'Firms & Refines Skin Tone',
      'Gentle Micro-Vibration Detox'
    ],
  },

  // 6. MICRODERMABRASION
  {
    id: 'microdermabrasion',
    category: 'facial',
    title: 'Microdermabrasion Facial',
    tagline: 'RESURFACE • IMPROVE SCARS & TEXTURE',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £25 (30m Express) / £42 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 25, priceSingle: 25 },
      { duration: '60 min — Full Treatment', priceClinicare: 42, priceSingle: 42 },
    ],
    description: 'Diamond-tip exfoliation buffing away dull superficial layers followed by CLINICARE soothing epidermal hydration to resurface uneven texture and visibly improve acne scarring.',
    benefits: [
      'Precision Skin Resurfacing',
      'Improves Appearance of Scars',
      'Minimizes Enlarged Pores',
      'Enhances Skincare Absorption',
      'Series Available: Buy 3, Get 4th FREE (Clinicare 30m: £75 • 60m: £126)'
    ],
  },

  // 7. LYMPHATIC DRAINAGE FACIAL
  {
    id: 'lymphatic-drainage-facial',
    category: 'facial',
    title: 'Lymphatic Drainage Facial',
    tagline: 'REDUCE PUFFINESS • DETOXIFY • CIRCULATION',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £26 (30m Express) / £40 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 26, priceSingle: 26 },
      { duration: '60 min — Full Treatment', priceClinicare: 40, priceSingle: 40 },
    ],
    description: 'Gentle, specialized rhythmic strokes paired with CLINICARE soothing bio-serums to reduce puffiness, detoxify stagnant lymph fluid, and boost oxygenated circulation.',
    benefits: [
      'Reduces Facial Puffiness',
      'Eliminates Stagnant Toxins',
      'Improves Cellular Circulation',
      'Calms Sensitive & Inflamed Skin'
    ],
  },

  // The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy
  {
    id: 'elysian-glow-8-in-1-pdt-led-light-therapy',
    category: 'facial',
    title: 'The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy',
    tagline: '8-IN-1 HOT & COLD THERAPY • NANO-MIST HYDRATION • MULTI-SPECTRUM PDT LED',
    duration: '30 min Express / 45–60 min Full Ritual',
    priceDisplay: 'From £25 (30m Express) / £40 (Full Ritual)',
    priceOptions: [
      { duration: '30 min — Express PDT LED', priceClinicare: 25, priceSingle: 25 },
      { duration: '60 min — Full 8-in-1 Ritual (45–60 min)', priceClinicare: 40, priceSingle: 40 },
    ],
    description: 'Advanced 8-in-1 facial technology featuring medical-grade PDT LED light therapy, thermal hot and cold pore-calming therapy, and deep nano-sized mist hydration infusion with CLINICARE cosmeceuticals. Complete session includes double cleanse, skin prep, 15–25 minute targeted PDT LED phase, bespoke CLINICARE serum cocktail & finish.',
    benefits: [
      '💡 PDT Light Therapy — Targets acne, ageing, pigmentation & cellular repair',
      '🌫️ Deep Hydration Infusion — Nano-sized mist penetrates deep dermal layers',
      '🎯 Customised Skin Treatment — Tailored wavelength light targets specific concerns',
      '⏱️ 45–60 Min Full Session (15–25 min dedicated PDT LED phase)',
      '🔴 Red: Anti-ageing, collagen boost & repair | 🔵 Blue: Kills bacteria & calms acne',
      '🟢 Green: Balances pigmentation | 🟡 Yellow: Brightens & improves circulation',
      '🟣 Purple: Heals & reduces inflammation | ⚪ White: Deep cellular rejuvenation',
      '🟠 Cyan: Calms irritation, soothes sensitivity & accelerates recovery'
    ],
    popular: true,
  },

  // 9. CARBOXYTHERAPY FACE MASK TREATMENT
  {
    id: 'carboxytherapy-face-mask-treatment',
    category: 'facial',
    title: 'CARBOXYTHERAPY FACE MASK TREATMENT',
    tagline: 'OXYGENATING BOHR EFFECT • CELLULAR METABOLISM • INSTANT FIRMING',
    duration: '30-45 mins',
    priceDisplay: '£40',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 40, priceSingle: 40, label: '30–45 min Complete Carboxy Ritual' },
    ],
    description: 'An advanced non-invasive medical infusion that delivers Carbon Dioxide (CO2) directly beneath the skin surface, triggering the physiological Bohr Effect. The sudden surge of pure oxygen from deep within accelerates cellular metabolism, flushes out stagnant waste toxins, stimulates collagen synthesis, and dramatically tightens and brightens the complexion with zero downtime.',
    benefits: [
      'Triggers the Bohr Effect — floods skin cells with fresh oxygen & nutrients',
      'Stimulates neocollagenesis & restores youthful skin elasticity',
      'Visibly tightens sagging contours, jawline & shrinks dilated pores',
      'Brightens dull, fatigued skin & reduces under-eye dark circles',
      'Accelerates tissue healing, cellular detox & anti-inflammatory recovery',
      'Includes double cleanse, CO2 infusion mask, active CLINICARE serum & SPF'
    ],
    popular: true,
  },

  // 10. CLINICARE CHEMICAL PEELING
  {
    id: 'cliniccare-chemical-peeling',
    category: 'facial',
    title: 'CLINICARE CHEMICAL PEELING',
    tagline: 'SUPERFICIAL MEDICAL PEEL • CELLULAR TURNOVER • RADIANCE RENEWAL',
    duration: '35-45 mins',
    priceDisplay: '£45',
    priceOptions: [
      { duration: '35-45 mins', priceClinicare: 45, priceSingle: 45, label: '35–45 min Tailored Medical Peel' },
    ],
    description: 'Targeted Swedish superficial chemical peel tailored to your specific skin needs (GLOW for pigmentation & sun damage, PURE for blemish control & inflamed skin, or REFRESH for fine lines & laxity). Formulated with optimal concentrations of Glycolic, Mandelic, Lactic, and Salicylic acids to dissolve dead cells, unclog pores, and stimulate cellular regeneration with minimal downtime and maximum luminosity.',
    benefits: [
      'Gently dissolves dull surface keratin without harsh flaking or excessive trauma',
      'Targets stubborn hyperpigmentation, melasma, age spots & uneven skin tone',
      'Unclogs congested pores, regulates sebum & reduces acne flare-ups',
      'Refines rough skin texture, smoothing fine lines & superficial wrinkles',
      'Boosts absorption of active low-molecular Hyaluronic Acid & peptide serums',
      'Includes skin prep, tailored chemical peel, neutralizing soothing mask & SPF50'
    ],
    popular: true,
  },

  // 11. Hot Stone Full Body Massage
  {
    id: 'hot-stone-full-body-massage',
    category: 'hot-stone',
    title: 'Hot Stone Full Body Massage',
    tagline: 'VOLCANIC BASALT THERMAL GROUNDING',
    duration: '60 mins',
    priceDisplay: '£70',
    priceOptions: [
      { duration: '60 mins', priceSingle: 70 }
    ],
    description: 'Smooth heated volcanic stones glided with warm essential oils across full body energy lines for profound muscular decompression.',
    benefits: [
      'Heated River Basalt Stones',
      'Melt Deep Chronic Muscle Knots',
      'Thermal Circulation Boost',
      'Grounding Aromatherapy Infusions'
    ],
    popular: true,
  },

  // Swedish Full Body Massage
  {
    id: 'swedish-full-body-massage',
    category: 'body-massage',
    title: 'Swedish Full Body Massage',
    tagline: 'FULL BODY RELAXATION & TENSION RELEASE',
    duration: '60 mins',
    priceDisplay: '£60',
    priceOptions: [
      { duration: '60 mins', priceSingle: 60 }
    ],
    description: 'A classic full body therapeutic massage using rhythmic gliding strokes, kneading, and gentle friction to relieve accumulated physical stress, improve circulation, and restore full body wellbeing.',
    benefits: [
      'Head-to-Toe Muscular Tension Release',
      'Boosts Blood Circulation & Lymphatic Flow',
      'Eases Everyday Aches & Stress Fatigue',
      'Warm Botanical Essential Oils'
    ],
    popular: true,
  },

  // 11. Swedish Back Massage
  {
    id: 'swedish-back-massage',
    category: 'body-massage',
    title: 'Swedish Back Massage',
    tagline: 'TARGETED SPINAL & SHOULDER RELIEF',
    duration: '30 mins',
    priceDisplay: '£30',
    priceOptions: [
      { duration: '30 mins', priceSingle: 30 }
    ],
    description: 'Focused therapeutic massage targeting upper, mid, and lower back muscles to ease everyday postural strain.',
    benefits: [
      'Relieves Upper & Lower Back Aches',
      'Loosens Tight Scapular Muscles',
      'Restorative Deep Tissue Reset',
      'Invigorating Botanical Balms'
    ],
  },

  // 12. Hot Stone Back Massage
  {
    id: 'hot-stone-back-massage',
    category: 'hot-stone',
    title: 'Hot Stone Back Massage',
    tagline: 'CONCENTRATED THERMAL BACK RELEASE',
    duration: '30 mins',
    priceDisplay: '£40',
    priceOptions: [
      { duration: '30 mins', priceSingle: 40 }
    ],
    description: 'Warmed volcanic basalt stones applied along the spinal meridian to rapidly dissolve back tension and stress.',
    benefits: [
      'Spinal Basalt Stone Placement',
      'Quick Chronic Knot Melting',
      'Deep Soothing Heat Diffusion',
      'Releases Lumbar & Thoracic Tightness'
    ],
  },

  // 13. Shoulder & Neck Massage
  {
    id: 'shoulder-neck-massage',
    category: 'body-massage',
    title: 'Shoulder & Neck Massage',
    tagline: 'DESK STRAIN & CERVICAL TENSION SPECIALIST',
    duration: '30 mins',
    priceDisplay: '£30',
    priceOptions: [
      { duration: '30 mins', priceSingle: 30 }
    ],
    description: 'Specialized focus on neck, trapezius, and shoulder girdle muscles to alleviate tension headaches and desk strain.',
    benefits: [
      'Releases Trapezius & Neck Stiffness',
      'Relieves Tension Headaches',
      'Improves Cervical Mobility',
      'Calming Aromatherapeutic Pressure'
    ],
  },

  // 14. Leg Massage
  {
    id: 'leg-massage',
    category: 'body-massage',
    title: 'Leg Massage',
    tagline: 'LOWER BODY TIRED MUSCLE & LYMPH REVIVAL',
    duration: '30 mins',
    priceDisplay: '£20',
    priceOptions: [
      { duration: '30 mins', priceSingle: 20 }
    ],
    description: 'Revitalizing treatment for calves, thighs, and feet to relieve heavy tired legs, stimulate circulation, and drain fatigue.',
    benefits: [
      'Relieves Heavy & Aching Legs',
      'Boosts Venous Return & Circulation',
      'Soothes Calf & Hamstring Fatigue',
      'Invigorating Peppermint & Eucalyptus Oils'
    ],
  },

  // 15. Indian Head Massage (Add on Only)
  {
    id: 'indian-head-massage-addon',
    category: 'addons',
    title: 'Indian Head Massage (Add-on Only)',
    tagline: 'SCALP, CRANIAL & TEMPLE ACUPRESSURE',
    duration: '15-20 mins',
    priceDisplay: '£15',
    priceOptions: [
      { duration: '15-20 mins', priceSingle: 15 }
    ],
    description: 'Ancient Ayurvedic scalp and cranial pressure ritual releasing mental fog, tension headaches, and scalp tight spots.',
    benefits: [
      'Cranial Point Acupressure',
      'Stimulates Hair Follicles & Scalp Health',
      'Clears Mental Exhaustion',
      'Add-on to Any Facial or Massage'
    ],
    isAddon: true,
  },

  // 16. Body Scrub (Add on Only)
  {
    id: 'body-scrub-addon',
    category: 'addons',
    title: 'Body Scrub (Add-on Only)',
    tagline: 'ORGANIC BOTANICAL CELLULAR POLISH',
    duration: '15-20 mins',
    priceDisplay: '£25',
    priceOptions: [
      { duration: '15-20 mins', priceSingle: 25 }
    ],
    description: 'Natural mineral and botanical exfoliating scrub gently removing dead skin cells before your massage or body ritual.',
    benefits: [
      'Silky Smooth Skin Resurfacing',
      'Removes Dry Cellular Build-up',
      'Prepares Skin for Oil Absorption',
      'Add-on to Any Body Treatment'
    ],
    isAddon: true,
  },

  // 18. 4-Session Facial Series - Buy 3 Get 1 FREE
  {
    id: 'buy-3-get-1-free-facial-series',
    category: 'packages',
    title: '4-Session Facial Series (Buy 3, Get 1 FREE)',
    tagline: 'BUY 3 FACIALS & RECEIVE YOUR 4TH FACIAL FREE',
    duration: '30 min Express / 60 min Full Series (4 Sessions)',
    priceDisplay: 'From £75 (30m Series) / £126 (60m Series) • 4th FREE',
    priceOptions: [
      { duration: '30 min — Express Series (4 Sessions)', priceClinicare: 75, priceSingle: 75 },
      { duration: '60 min — Full Treatment Series (4 Sessions)', priceClinicare: 126, priceSingle: 126 },
    ],
    description: 'Buy 3 facials and receive your 4th facial completely FREE! Pay for 3 sessions and enjoy your 4th session complimentary — powered by CLINICARE Swedish medical cosmeceuticals for long-term progressive skin transformation.',
    benefits: [
      'Buy 3 Facials & Receive 4th Facial Completely FREE',
      '🔬 CLINICARE 30 mins: £75 (Save £25)',
      '🔬 CLINICARE 60 mins: £126 (Save £42)',
      'Tailored with Medical-Grade Low-Molecular Hyaluronic Acid & Peptides'
    ],
    popular: true,
  },

  // 18. Microdermabrasion Facial - Buy 3 Get 1 FREE
  {
    id: 'microdermabrasion-buy-3-get-1-free-package',
    category: 'packages',
    title: 'Microdermabrasion Facial Series (Buy 3, Get 1 FREE)',
    tagline: 'BUY 3 MICRODERMABRASION FACIALS & RECEIVE YOUR 4TH FREE',
    duration: '30 min Express / 60 min Full Series (4 Sessions)',
    priceDisplay: 'From £75 (30m Series) / £126 (60m Series) • 4th FREE',
    priceOptions: [
      { duration: '30 min — Express Series (4 Sessions)', priceClinicare: 75, priceSingle: 75 },
      { duration: '60 min — Full Treatment Series (4 Sessions)', priceClinicare: 126, priceSingle: 126 },
    ],
    description: 'Buy 3 Microdermabrasion Facials and receive your 4th facial completely FREE! Diamond-tip precision buffing removes dull cellular layers, paired with CLINICARE EGF restorative hydration over a 4-treatment course.',
    benefits: [
      'Buy 3 Microdermabrasion Facials & Receive 4th Facial FREE',
      '🔬 CLINICARE 30 mins: £75 (Save £25)',
      '🔬 CLINICARE 60 mins: £126 (Save £42)',
      'Progressively Smooths Acne Scars & Visibly Refines Uneven Texture'
    ],
    popular: true,
  },

  // 19. Bring A Friend - Both Save 15% OFF
  {
    id: 'bring-a-friend-package',
    category: 'packages',
    title: 'Bring A Friend (Both Save 15% OFF)',
    tagline: 'BOOK TOGETHER & BOTH RECEIVE 15% OFF',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'Both Save 15% OFF',
    priceOptions: [
      { label: 'Twin Facial Ritual (Both save 15%)', duration: '30 - 60 mins each', priceSingle: 'From £38' },
      { label: 'Twin Back Massage Ritual (Both save 15%)', duration: '30 mins each', priceSingle: 51 },
      { label: 'Twin Full Body Massage Ritual (Both save 15%)', duration: '60 mins each', priceSingle: 102 },
      { label: 'Twin Hot & Cold PDT Oxygen Facial (30 mins)', duration: '30 mins each', priceSingle: 76 },
      { label: 'Twin Hot & Cold PDT Oxygen Facial (60 mins)', duration: '60 mins each', priceSingle: 115 }
    ],
    description: 'Book together & both receive 15% OFF! Because beautiful skin is even better when shared. Introduce a friend to ELYSIAN BEAUTY SPA and you both save 15% on qualifying treatments.',
    benefits: [
      'Book Together & Both Receive 15% OFF Qualifying Treatments',
      'Because Beautiful Skin Is Even Better When Shared',
      'Valid on Facials, Massages & Holistic Body Therapies',
      'Complimentary Skin Consultation & Herbal Tea for Both'
    ],
    popular: true,
  },

  // 19. Facial + Product Bundle (10% OFF Skincare)
  {
    id: 'facial-product-bundle-package',
    category: 'packages',
    title: 'Facial + Product Bundle',
    tagline: 'BOOK ANY QUALIFYING FACIAL & RECEIVE 10% OFF SKINCARE PRODUCTS',
    duration: '60 - 75 mins',
    priceDisplay: '10% OFF Skincare',
    priceOptions: [
      { label: 'CLINICARE Custom Facial + 10% OFF Products', duration: '60 mins', priceSingle: 60 },
      { label: 'Elysian 4-in-1 Oxygen Glow Facial + 10% OFF Products', duration: '75 mins', priceSingle: 70 }
    ],
    description: 'Book any qualifying CLINICARE facial and receive 10% OFF professional boutique skincare products purchased on the day! Includes product saving perks, complete facial experience, and bespoke skincare consultation.',
    benefits: [
      'Book Any Qualifying Facial and Receive 10% OFF Boutique Skincare',
      'Valid on Professional Skincare Products Purchased on the Day',
      'Your Therapist Will Recommend the Best Products for Your Skin',
      'Complimentary Skin Analysis & Tailored Home Regimen Curation'
    ],
    popular: true,
  },

  // 20. Elysian Signature Glow & Massage Ritual Package
  {
    id: 'elysian-signature-ritual-package',
    category: 'packages',
    title: 'Elysian Signature Glow & Massage Ritual',
    tagline: '4-IN-1 OXYGEN FACIAL + 60 MIN VOLCANIC HOT STONE MASSAGE',
    duration: '120 mins',
    priceDisplay: '£135 (Save £15)',
    priceOptions: [
      { label: '🔬 CLINICARE Cosmeceutical & Hot Stone Ritual', duration: '120 mins', priceSingle: 135 }
    ],
    description: 'Our ultimate luxury sanctuary immersion combining the signature 4-in-1 Oxygen & LED illumination facial with CLINICARE active cosmeceuticals, a full 60-minute volcanic hot stone body massage, and botanical cranial scalp pressure ritual.',
    benefits: [
      'Full Body Heated Basalt Massage',
      '4-in-1 Oxygen & LED Illumination Facial',
      'Indian Head Acupressure Scalp Ritual',
      'Complimentary Post-Ritual Herbal Elixir'
    ],
    popular: true,
  },

  // 18. The Ultimate Radiance & Sculpt Course (3 Sessions)
  {
    id: 'radiance-sculpt-course-package',
    category: 'packages',
    title: 'Radiance & Sculpt Dermal Course (Package of 3)',
    tagline: '3X ADVANCED EMS & RADIO FREQUENCY SESSIONS',
    duration: '3 x 45 mins',
    priceDisplay: '£175 (Save £35)',
    priceOptions: [
      { label: 'Course of 3 Sessions (🔬 CLINICARE)', duration: '3 x 45 mins', priceSingle: 175 }
    ],
    description: 'A transformative 3-session clinical course alternating EMS contour lifting and deep Radio Frequency thermal collagen stimulation with CLINICARE bio-actives to visibly sculpt jawline contours and smooth fine lines.',
    benefits: [
      'Course of 3 Dedicated 45-Min Sessions',
      'Dual EMS Lifting & RF Thermal Collagen Matrix',
      'Visible Jawline & Cheekbone Sculpting',
      'Complimentary Soothing Hydration Sheet Mask'
    ],
    popular: true,
  },

  // 19. Total Sanctuary Tension Reset Package
  {
    id: 'sanctuary-tension-reset-package',
    category: 'packages',
    title: 'Total Sanctuary Tension Reset',
    tagline: 'SWEDISH BACK MASSAGE + HYDRO-FACIAL + INDIAN HEAD RITUAL',
    duration: '90 mins',
    priceDisplay: '£95 (Save £15)',
    priceOptions: [
      { label: 'Complete 90-Minute Sanctuary Reset', duration: '90 mins', priceSingle: 95 }
    ],
    description: 'Carefully curated to rapidly erase desk fatigue and restore dull skin. Combines targeted Swedish spinal tension release, pore-cleansing Hydro-Facial vacuum infusion, and relaxing cranial scalp therapy.',
    benefits: [
      'Targeted Swedish Spinal Decompression',
      'Vortex Hydro-Extraction & Plumping Mist',
      'Ayurvedic Cranial Scalp Point Release',
      'Organic Lavender & Peppermint Balms'
    ],
  },

  // 20. Bridal & Occasion Radiance Package
  {
    id: 'bridal-occasion-glow-package',
    category: 'packages',
    title: 'Bridal & Occasion Head-to-Toe Glow',
    tagline: 'ORGANIC BODY POLISH + MICRODERMABRASION + PDT LED CRYO-LOCK',
    duration: '105 mins',
    priceDisplay: '£110',
    priceOptions: [
      { label: 'Complete 105-Min Event Prep Ritual', duration: '105 mins', priceSingle: 110 }
    ],
    description: 'The definitive pre-event luxury prep: full body botanical mineral polish leaving limbs silky soft, paired with diamond microdermabrasion and cryo-calming LED therapy for immediate camera-ready radiance.',
    benefits: [
      'Full Body Botanical Exfoliating Scrub',
      'Diamond Precision Microdermabrasion',
      'Cryo-Hammer Pore Tightening & PDT LED',
      'Silky Body Butter Infusion & Glass Glow'
    ],
  }
];

export const REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Eleanor Vance',
    service: 'Elysian Personalised Treatment Glow',
    rating: 5,
    date: 'August 2026',
    comment: 'The bespoke multi-technology protocol completely transformed my skin for my sister’s wedding. The CLINICARE hydration cocktail and LED therapy gave me an instant, glass-like radiance!',
    avatarText: 'EV',
  },
  {
    id: '2',
    author: 'Marcus Sterling',
    service: 'Hot Stone Full Body Massage',
    rating: 5,
    date: 'August 2026',
    comment: 'The heated volcanic basalt stones melted weeks of gym and office tension. The tranquil ambiance and warm herbal tea afterwards made it unforgettable.',
    avatarText: 'MS',
  },
  {
    id: '3',
    author: 'Chloe Laurent',
    service: 'Hydro-Facial & Indian Head Massage',
    rating: 5,
    date: 'August 2026',
    comment: 'Adding the Indian head massage to my Hydro-facial was absolute bliss. My pores were thoroughly cleared and my complexion felt plump and glowing for days.',
    avatarText: 'CL',
  },
  {
    id: '4',
    author: 'Sophia Chen',
    service: 'Radio Frequency & EMS Facial',
    rating: 5,
    date: 'July 2026',
    comment: 'Immediate visible cheekbone and jawline definition right off the treatment bed. The therapist explained every technology clearly. Truly five-star service!',
    avatarText: 'SC',
  },
  {
    id: '5',
    author: 'Hannah & Rebecca Miller',
    service: 'Twin Bring A Friend Ritual',
    rating: 5,
    date: 'July 2026',
    comment: 'My best friend and I booked the Twin Back Massage and Facial package. The 15% discount was such a treat, and we both floated out of the spa feeling completely renewed.',
    avatarText: 'HR',
  },
  {
    id: '6',
    author: 'David Pennington',
    service: 'Swedish Back, Neck & Shoulder Massage',
    rating: 5,
    date: 'July 2026',
    comment: 'Outstanding tension release for upper back knots and desk stiffness. The organic body oils smelled sublime and the therapist had exceptional technique.',
    avatarText: 'DP',
  },
  {
    id: '7',
    author: 'Gemma Atherton',
    service: 'Hydro-Facial (🔬 CLINICARE Low-Molecular HA)',
    rating: 5,
    date: 'June 2026',
    comment: 'The CLINICARE cosmeceutical infusion was incredible! My sensitive skin did not flare up at all; instead, it felt deeply nourished, calm, and visibly glowing for days.',
    avatarText: 'GA',
  },
  {
    id: '8',
    author: 'Isabella Rossi',
    service: 'Diamond Polish & Cryo Glow Ritual',
    rating: 5,
    date: 'June 2026',
    comment: 'The full body botanical scrub followed by diamond microdermabrasion and cryo-hammer tightening was pure luxury. My skin was silky soft and completely rejuvenated.',
    avatarText: 'IR',
  },
  {
    id: '9',
    author: 'Charlotte Davies',
    service: 'LED Collagen Rejuvenation Mask',
    rating: 5,
    date: 'May 2026',
    comment: 'Added the multi-wave LED mask to my facial. It visibly reduced redness and calmed my hormonal breakouts. The calming lavender aromatherapy made it so peaceful.',
    avatarText: 'CD',
  },
];

export const FAQS: FaqItem[] = [
  {
    question: 'What skincare formulations are used in treatments and available in your boutique?',
    answer: 'All facial aesthetic treatments exclusively feature 🔬 CLINICARE — Swedish medical-grade cosmeceuticals with low-molecular hyaluronic acid and biomimetic peptide complexes for immediate and long-term skin rejuvenation. In our Sanctuary Boutique Shop, we also stock the full range of fresh handcrafted 🌿 Tropic organic botanical skincare for your daily home regimen.',
  },
  {
    question: 'What should I wear during my massage and hot stone therapy?',
    answer: 'We provide soft plush disposable undergarments, luxury robes, and slippers. Our master therapists maintain modesty draping throughout every moment of your session.',
  },
  {
    question: 'Can I combine facials with massage or add-on treatments?',
    answer: 'Absolutely. You can easily pair treatments such as the Hydro-Facial or EMS Facial with our Indian Head Massage or Body Scrub add-ons for the ultimate head-to-toe ritual.',
  },
  {
    question: 'What is your cancellation and rescheduling policy?',
    answer: 'We kindly request at least 24 hours notice for any cancellations or schedule changes so we may offer the suite to waiting guests.',
  },
];

export const SPA_FAQS = FAQS;
export const SPA_REVIEWS = REVIEWS;

export const THERAPISTS = [
  {
    name: 'Elena Rostova',
    role: 'Lead Aesthetician & Dermal Specialist',
    specialty: 'Hydro-Facial, Radio Frequency & EMS Technology',
  },
  {
    name: 'Amara Sinclair',
    role: 'Senior Somatic Bodywork Therapist',
    specialty: 'Hot Stone Basalt Therapy & Swedish Bodywork',
  },
  {
    name: 'Seraphina Lin',
    role: 'Holistic Facialist & Lymphatic Specialist',
    specialty: 'PDT LED Light, Lymphatic Drainage & Indian Head Rituals',
  },
];

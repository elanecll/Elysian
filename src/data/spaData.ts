import type { Treatment, Review, FaqItem } from '../types.js';
import { FACIAL_BUNDLE_ID, facialBundleOptions } from '../../shared/facialBundle.js';

export const SPA_SERVICES: Treatment[] = [
  // Clinicare Microneedling
  {
    id: 'clinicare-microneedling',
    comingSoon: true,
    category: 'facial',
    title: 'Clinicare Microneedling',
    tagline: 'MICRONEEDLING • CLINICARE EGF MESO VIALS',
    image: '/images/treatments/clinicare-microneedling.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£80',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 80, priceSingle: 80, label: '30–45 min Microneedling Treatment' },
    ],
    description: 'Microneedling with CLINICARE EGF Meso Vials, tailored following a consultation and suitability assessment. Your therapist will explain the procedure and aftercare before treatment.',
    benefits: [
      'Supports Natural Collagen Production',
      'May Improve Uneven Skin Tone & Texture',
      'May Soften the Appearance of Fine Lines & Wrinkles',
      'May Reduce the Appearance of Acne Scars',
      'CLINICARE EGF Meso Vials',
      'Pre-treatment Consultation',
      'Treatment Tailored to Your Skin',
      'Aftercare Guidance'
    ],
    popular: true,
  },

  // 11. CLINICARE Cinderella / Black Tie Facial
  {
    id: 'cliniccare-cinderella-black-tie-facial',
    category: 'facial',
    title: 'CLINICARE Cinderella / Black Tie Facial',
    tagline: 'INSTANT RED CARPET GLOW • CELLULAR HYDRATION • PEEL & EGF MASK',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abb94b6be703c7b305f3ffb.jpeg',
    beforeAfterImage: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abb939660c7466bcf6be8e1.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£30',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 30, priceSingle: 30, label: '30–45 min Cinderella / Black Tie Ritual' },
    ],
    description: 'The ultimate instant red-carpet radiance ritual combining CLINICARE gentle AHA superficial chemical exfoliation with an intensive low-molecular Hyaluronic Acid and biomimetic peptide EGF infusion. Known as the "Cinderella" facial for women and "Black Tie" facial for men, this treatment delivers instant lifting, plumping hydration, and camera-ready luminosity with zero downtime.',
    benefits: [
      'Instant Red-Carpet Lift, Tightening & Glass-Skin Luminosity',
      'Gentle AHA Chemical Resurfacing with Zero Peeling or Downtime',
      'Clinicare High-Potency EGF & Low-Molecular HA Infusion',
      'Restores Natural Elasticity, Plumping Fine Lines & Dehydration',
      'Includes Cleanse, Gentle Peel, EGF Sheet Mask & SPF50 Protection'
    ],
    popular: true,
  },

  // 9. Clinicare Carboxytherapy Face Mask Treatment
  {
    id: 'carboxytherapy-face-mask-treatment',
    category: 'facial',
    title: 'Clinicare Carboxytherapy Face Mask Treatment',
    tagline: 'OXYGENATING BOHR EFFECT • CELLULAR METABOLISM • INSTANT FIRMING',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6ab94e65c13d4373c2c438b1.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£50',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 50, priceSingle: 50, label: '30–45 min Complete Carboxy Ritual' },
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

  // 10. Clinicare Chemical Peeling
  {
    id: 'cliniccare-chemical-peeling',
    category: 'facial',
    title: 'Clinicare Chemical Peeling',
    tagline: 'SUPERFICIAL MEDICAL PEEL • CELLULAR TURNOVER • RADIANCE RENEWAL',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abb98f860c7466bcf6c8e73.jpeg',
    beforeAfterImage: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abb9396be703c7b305f1f19.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£60',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 60, priceSingle: 60, label: '30–45 min Tailored Medical Peel' },
    ],
    description: 'Targeted Swedish superficial chemical peel tailored to your specific skin needs with three medical formulations: Glow / Growth (hyperpigmentation, sun damage & uneven skin), Pure (combination, oily, sensitive or acne-prone skin), and Refresh (skin rejuvenation, ageing, sun damage, fine lines & skin laxity). Formulated with optimal concentrations of Glycolic, Mandelic, Lactic, and Salicylic acids to dissolve dead cells, unclog pores, and stimulate cellular regeneration with zero downtime.',
    benefits: [
      'Glow / Growth: Targets hyperpigmentation, sun damage & uneven skin tone',
      'Pure: Formulated for combination, oily, sensitive & acne-prone skin',
      'Refresh: Skin rejuvenation, ageing defence, fine lines & skin laxity',
      'Gentle AHA/BHA chemical exfoliation with zero downtime or peeling',
      'Includes skin prep, tailored chemical peel, neutralizing soothing mask & SPF50'
    ],
    popular: true,
  },

  // The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy
  {
    id: 'elysian-glow-8-in-1-pdt-led-light-therapy',
    category: 'facial',
    title: 'The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy',
    tagline: '8-IN-1 HOT & COLD THERAPY • NANO-MIST HYDRATION • MULTI-SPECTRUM PDT LED',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6ab95120b4d207ff9dfe763d.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£50',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 50, priceSingle: 50 },
    ],
    description: 'Advanced 8-in-1 facial technology featuring medical-grade PDT LED light therapy, thermal hot and cold pore-calming therapy, and deep nano-sized mist hydration infusion with CLINICARE cosmeceuticals. Complete session includes double cleanse, skin prep, 15–25 minute targeted PDT LED phase, bespoke CLINICARE serum cocktail & finish.',
    benefits: [
      '💡 PDT Light Therapy — Targets acne, ageing, pigmentation & cellular repair',
      '🌫️ Deep Hydration Infusion — Nano-sized mist penetrates deep dermal layers',
      '🎯 Customised Skin Treatment — Tailored wavelength light targets specific concerns',
      '⏱️ 30–45 Min Session (15–25 min dedicated PDT LED phase)'
    ],
    popular: true,
  },

  // 4. RADIO FREQUENCY + EMS Facial
  {
    id: 'radio-frequency-facial',
    category: 'facial',
    title: 'Radio Frequency + EMS Facial',
    tagline: 'TIGHTEN SKIN, BOOST COLLAGEN & SMOOTH LINES • LIFT, TONE, FIRM & CELLULAR ACTIVATION',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6ab94adac13d4373c2c3e9d5.png',
    duration: '45-60 mins',
    priceDisplay: '£60',
    priceOptions: [
      { duration: '45-60 mins — Full Treatment', priceClinicare: 60, priceSingle: 60 },
    ],
    description: 'Targeted thermal radio frequency and electrical muscle stimulation (EMS) paired with CLINICARE active peptide complexes to lift, tone, and sculpt facial contours while heating deep dermis layers to boost collagen synthesis and smooth lines.',
    benefits: [
      'Deep Dermal Thermal Tightening & Collagen Synthesis',
      'EMS Facial Muscle Contour Lifting & Sculpting',
      'Reduces Fine Lines, Wrinkles & Skin Laxity',
      'Firms Jawline, Tones & Activates Cellular Renewal'
    ],
    popular: true,
  },

  // 1. Hydrodermabrasion Facial
  {
    id: 'hydrodemabrasion-facial',
    category: 'facial',
    title: 'Hydrodermabrasion Facial',
    tagline: 'DEEP CLEANSE • HYDRATE • RESURFACE & EXFOLIATE',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abba755cd53dbc0df306c73.jpeg',
    duration: '45-60 mins',
    priceDisplay: '£65',
    priceOptions: [
      { duration: '45-60 mins', priceClinicare: 65, priceSingle: 65 },
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

  {
    id: 'clinicare-dermaplane',
    comingSoon: true,
    category: 'facial',
    title: 'Clinicare Dermaplane',
    tagline: 'CLINICARE SKINCARE • STANDALONE OR ADD-ON TREATMENT',
    image: '/images/treatments/clinicare-dermaplane.jpeg',
    duration: '30-45 mins',
    priceDisplay: '£40',
    priceOptions: [
      { duration: '30-45 mins', priceClinicare: 40, priceSingle: 40, label: '30–45 min Clinicare Dermaplane' },
    ],
    description: 'A dermaplaning facial with CLINICARE skincare, tailored following a consultation and suitability assessment. Book it on its own or add it to a suitable treatment.',
    benefits: [
      'CLINICARE Skincare',
      'Pre-treatment Consultation',
      'Available as a Standalone Treatment or Add-on',
      'Personalised Aftercare Guidance'
    ],
    canBeAddon: true,
  },

  // 5. ULTRASONIC FACIAL
  {
    id: 'ultrasonic-facial',
    category: 'facial',
    title: 'Ultrasonic Facial',
    tagline: 'DEEP NUTRIENT INFUSION & CELLULAR STIMULATION',
    image: '/images/treatments/ultrasonic-facial.jpeg',
    duration: '45-60 mins',
    priceDisplay: '£50',
    priceOptions: [
      { duration: '45-60 mins', priceClinicare: 50, priceSingle: 50 },
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
    image: '/images/treatments/microdermabrasion-facial.jpeg',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £30 (30m Express) / £50 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 30, priceSingle: 30 },
      { duration: '60 min — Full Treatment', priceClinicare: 50, priceSingle: 50 },
    ],
    description: 'Diamond-tip exfoliation buffing away dull superficial layers followed by CLINICARE soothing epidermal hydration to resurface uneven texture and visibly improve acne scarring.',
    benefits: [
      'Precision Skin Resurfacing',
      'Improves Appearance of Scars',
      'Minimizes Enlarged Pores',
      'Enhances Skincare Absorption',
      'Accelerates Cellular Regeneration'
    ],
  },

  // 7. LYMPHATIC DRAINAGE FACIAL
  {
    id: 'lymphatic-drainage-facial',
    category: 'facial',
    title: 'Lymphatic Drainage Facial',
    tagline: 'REDUCE PUFFINESS • DETOXIFY • CIRCULATION',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abb9ca960c7466bcf6d00c8.jpeg',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'From £30 (30m Express) / £50 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 30, priceSingle: 30 },
      { duration: '60 min — Full Treatment', priceClinicare: 50, priceSingle: 50 },
    ],
    description: 'Gentle, specialized rhythmic strokes paired with CLINICARE soothing bio-serums to reduce puffiness, detoxify stagnant lymph fluid, and boost oxygenated circulation.',
    benefits: [
      'Reduces Facial Puffiness',
      'Eliminates Stagnant Toxins',
      'Improves Cellular Circulation',
      'Calms Sensitive & Inflamed Skin'
    ],
  },

  // 12. High Frequency Facial Treatment
  {
    id: 'high-frequency-facial-treatment',
    category: 'facial',
    title: 'High Frequency Facial Treatment',
    tagline: 'ANTI-BACTERIAL OXYGENATION • BLEMISH DEFENCE • COLLAGEN BOOST',
    image: '/images/treatments/high-frequency-facial.jpeg',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: '£35 (30m Express) / £55 (60m Full)',
    priceOptions: [
      { duration: '30 min — Express', priceClinicare: 35, priceSingle: 35 },
      { duration: '60 min — Full Treatment', priceClinicare: 55, priceSingle: 55 },
    ],
    description: 'Advanced electrotherapy utilizing a targeted glass electrode that emits high-frequency alternating electrical currents and generates germicidal ozone (oxygen). This thermal and anti-bacterial action deep cleanses pores, eradicates acne-causing bacteria, calms inflammation, accelerates wound healing, and stimulates blood circulation and collagen production for a clearer, firmer complexion.',
    benefits: [
      'Eradicates stubborn acne-causing bacteria & prevents new breakouts',
      'Generates germicidal ozone to purify & oxygenate congested skin',
      'Calms redness, active inflammation & post-breakout sensitivity',
      'Refines enlarged pores & helps regulate excessive oil production',
      'Stimulates microcirculation, cellular renewal & collagen synthesis',
      'Includes double cleanse, high frequency wand session, calming serum & SPF'
    ],
    popular: true,
  },

  // Hot Stone Full Body Massage
  {
    id: 'hot-stone-full-body-massage',
    category: 'hot-stone',
    title: 'Hot Stone Full Body Massage',
    tagline: 'VOLCANIC BASALT THERMAL GROUNDING',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abacf3df6972e3b5220cc5d.png',
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

  // Hot Stone Back Massage
  {
    id: 'hot-stone-back-massage',
    category: 'hot-stone',
    title: 'Hot Stone Back Massage',
    tagline: 'CONCENTRATED THERMAL BACK RELEASE',
    image: '/images/treatments/hot-stone-back-massage.png',
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

  // Swedish Full Body Massage
  {
    id: 'swedish-full-body-massage',
    category: 'body-massage',
    title: 'Swedish Full Body Massage',
    tagline: 'FULL BODY RELAXATION & TENSION RELEASE',
    image: 'https://assets.cdn.filesafe.space/WEYoHbUCjTA2dAYTZxNr/media/6abacf3d4100b77e52391c2e.png',
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
    image: '/images/treatments/swedish-back-massage.png',
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

  // 13. Shoulder & Neck Massage
  {
    id: 'shoulder-neck-massage',
    category: 'addons',
    title: 'Shoulder & Neck Massage (Add-on Only)',
    tagline: 'DESK STRAIN & CERVICAL TENSION SPECIALIST',
    image: '/images/treatments/swedish-back-massage.png',
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
    isAddon: true,
  },

  // 14. Leg Massage
  {
    id: 'leg-massage',
    category: 'addons',
    title: 'Leg Massage (Add-on Only)',
    tagline: 'LOWER BODY TIRED MUSCLE & LYMPH REVIVAL',
    image: '/images/treatments/leg-massage.jpeg',
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
    isAddon: true,
  },

  // 15. Indian Head Massage (Add on Only)
  {
    id: 'indian-head-massage-addon',
    category: 'addons',
    title: 'Indian Head Massage (Add-on Only)',
    tagline: 'SCALP, CRANIAL & TEMPLE ACUPRESSURE',
    image: '/images/treatments/indian-head-massage.jpeg',
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
    image: '/images/treatments/body-scrub.jpeg',
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

  // 18. Bring A Friend - Both Save 10% OFF
  {
    id: 'bring-a-friend-package',
    category: 'packages',
    title: 'Bring A Friend (Both Save 10% OFF)',
    tagline: 'BOOK TOGETHER & BOTH RECEIVE 10% OFF',
    image: '/images/treatments/bring-a-friend.jpeg',
    duration: '30 min Express / 60 min Full Treatment',
    priceDisplay: 'Both Save 10% OFF',
    priceOptions: [
      { label: 'Twin Facial Ritual (Both save 10%)', duration: '30 - 60 mins each', priceSingle: 'From £54.00' },
      { label: 'Twin Back Massage Ritual (Both save 10%)', duration: '30 mins each', priceSingle: 54 },
      { label: 'Twin Full Body Massage Ritual (Both save 10%)', duration: '60 mins each', priceSingle: 108 },
      { label: 'Twin Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy (both save 10%)', duration: '30-45 mins each', priceSingle: 90 }
    ],
    description: 'Book together & both receive 10% OFF! Because beautiful skin is even better when shared. Introduce a friend to ELYSIAN BEAUTY SPA and you both save 10% on qualifying treatments. Package prices below are the total for both guests, with the discount already included.',
    benefits: [
      'Book Together & Both Receive 10% OFF Qualifying Treatments',
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
    image: '/images/treatments/facial-product-bundle.jpeg',
    tagline: 'BOOK ANY QUALIFYING FACIAL & RECEIVE 10% OFF SKINCARE PRODUCTS',
    duration: 'Varies by selected facial',
    priceDisplay: 'Selected facial + 10% OFF products',
    priceOptions: [],
    description: 'Choose any qualifying CLINICARE facial at its usual price and select your skincare products with 10% OFF. Pay a 50% facial deposit plus the full discounted product price after approval, and collect your products at your appointment.',
    benefits: [
      'Book Any Qualifying Facial and Receive 10% OFF Boutique Skincare',
      '10% OFF Skincare Products Selected with Your Booking',
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
    image: '/images/treatments/elysian-signature-glow-ritual.jpeg',
    tagline: 'The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy + 60 min Volcanic Hot Stone Massage',
    duration: '90 mins',
    priceDisplay: '£130',
    priceOptions: [
      { label: '🔬 CLINICARE Cosmeceutical & Hot Stone Ritual', duration: '90 mins', priceSingle: 130 }
    ],
    description: 'Our ultimate luxury sanctuary immersion combining The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy with CLINICARE active cosmeceuticals and a full 60-minute volcanic hot stone body massage.',
    benefits: [
      'Full Body Heated Basalt Massage',
      'The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy'
    ],
    popular: true,
  },

  // 19. Total Sanctuary Tension Reset Package
  {
    id: 'sanctuary-tension-reset-package',
    category: 'packages',
    title: 'Total Sanctuary Tension Reset',
    image: '/images/treatments/total-sanctuary-tension-reset.jpeg',
    tagline: 'SWEDISH BACK MASSAGE + HYDRO-FACIAL + INDIAN HEAD RITUAL',
    duration: '90 mins',
    priceDisplay: '£120',
    priceOptions: [
      { label: 'Complete 90-Minute Sanctuary Reset', duration: '90 mins', priceSingle: 120 }
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
    image: '/images/treatments/bridal-occasion-glow.jpeg',
    tagline: 'Organic Body Polish + Back Massage + Hydro Facial + Cinderella Facial',
    duration: '90-120 mins',
    priceDisplay: '£150',
    priceOptions: [
      { label: 'Complete 90–120 min Bridal & Occasion Ritual', duration: '90-120 mins', priceSingle: 150 }
    ],
    description: 'Prepare for your special occasion with Organic Body Polish, a Back Massage, a Hydro Facial and a CLINICARE Cinderella Facial, combined in a 90–120 minute ritual.',
    benefits: [
      'Organic Body Polish',
      'Back Massage',
      'Hydro Facial',
      'CLINICARE Cinderella Facial'
    ],
  },
  {
    id: 'elysian-personalise-facial-treatment',
    category: 'facial',
    title: 'Elysian Personalise Facial Treatment',
    image: '/images/treatments/elysian-personalise-facial.jpeg',
    tagline: 'MINIMUM 3 TREATMENTS + LED LIGHT',
    duration: '60-75 mins',
    priceDisplay: '£80',
    priceOptions: [
      { label: '60–75 min Personalise Facial Treatment', duration: '60-75 mins', priceClinicare: 80, priceSingle: 80 }
    ],
    description: 'A personalised facial combining a minimum of three suitable treatments plus LED light. Your therapist will select the treatments with you following a consultation to tailor the experience to your skin.',
    benefits: [
      'Minimum of 3 Tailored Treatments',
      'LED Light Included',
      'Pre-treatment Consultation',
      'Personalised to Your Skin'
    ],
  },

];

const facialProductBundle = SPA_SERVICES.find((service) => service.id === FACIAL_BUNDLE_ID)!;
facialProductBundle.priceOptions = facialBundleOptions(SPA_SERVICES);

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
    service: 'Clinicare Chemical Peeling',
    rating: 5,
    date: 'July 2026',
    comment: 'Outstanding tension release for upper back knots and desk stiffness. The organic body oils smelled sublime and the therapist had exceptional technique.',
    avatarText: 'DP',
  },
  {
    id: '7',
    author: 'Gemma Atherton',
    service: 'Clinicare Cinderella & Black Tie Facial',
    rating: 5,
    date: 'June 2026',
    comment: 'The CLINICARE cosmeceutical infusion was incredible! My sensitive skin did not flare up at all; instead, it felt deeply nourished, calm, and visibly glowing for days.',
    avatarText: 'GA',
  },
  {
    id: '8',
    author: 'Isabella Rossi',
    service: 'Clinicare Carboxytheraphy',
    rating: 5,
    date: 'June 2026',
    comment: 'The full body botanical scrub followed by diamond microdermabrasion and cryo-hammer tightening was pure luxury. My skin was silky soft and completely rejuvenated.',
    avatarText: 'IR',
  },
  {
    id: '9',
    author: 'Charlotte Davies',
    service: 'The Elysian Glow 8-in-1 Hot & Cold PDT LED Light Therapy',
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
    question: 'What is your 50% deposit and cancellation policy?',
    answer: 'A 50% deposit is required to confirm your treatment booking. Once confirmed, the deposit is non-refundable, subject to your statutory cancellation and refund rights. The remaining 50% balance is payable upon arrival on the day of your appointment. If you need to cancel or reschedule, please notify us as soon as possible. You may reschedule at no charge with 24 hours or more notice, subject to availability. Cancellation charges are limited to reasonable costs and losses, taking account of saved costs or replacement bookings. If we cancel and cannot offer an alternative you accept, we refund all payments for services not provided.',
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

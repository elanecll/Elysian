export type PageTab =
  | "home"
  | "treatments"
  | "shop"
  | "basket"
  | "reviews"
  | "location"
  | "terms"
  | "payment";

export interface Product {
  id: string;
  category:
    | "all"
    | "tropic"
    | "clinicare"
    | "daily"
    | "serums"
    | "body"
    | "collections"
    | "masks"
    | "sunscreen"
    | "cleansers"
    | string;
  brandType: "tropic" | "clinicare";
  name: string;
  brand: string;
  range?: string;
  rangeKey?: string;
  colorTheme?: "blue" | "green" | "orange" | "purple";
  colorLabel?: string;
  colorHex?: string;
  volume?: string;
  tagline: string;
  price: string;
  numericPrice: number;
  description: string;
  image: string;
  badges: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TreatmentPriceOption {
  duration: string;
  priceTropic?: number;
  priceClinicare?: number;
  priceSingle?: number | string;
  label?: string;
  facialServiceId?: string;
  facialOptionIndex?: number;
}

export interface Treatment {
  id: string;
  category: "facial" | "body-massage" | "hot-stone" | "packages" | "addons";
  title: string;
  tagline: string;
  duration: string;
  priceDisplay: string;
  priceOptions?: TreatmentPriceOption[];
  description: string;
  benefits: string[];
  popular?: boolean;
  isAddon?: boolean;
  canBeAddon?: boolean;
  image?: string;
  beforeAfterImage?: string;
}

export interface Review {
  id: string;
  author: string;
  service: string;
  rating: number;
  date: string;
  comment: string;
  avatarText: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BookingData {
  serviceId: string;
  serviceTitle: string;
  date: string;
  timeSlot: string;
  therapistPreference: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

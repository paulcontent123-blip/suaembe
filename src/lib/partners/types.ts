export type PublicPartnerType = "hospital" | "insurance" | "equipment" | "recovery" | "service" | "other";

export interface PublicPartnerService {
  id: string;
  partner_id: string;
  name: string;
  service_type: string | null;
  description: string | null;
  price_from: number | null;
  price_to: number | null;
  duration_minutes: number | null;
  active: boolean;
}

export interface PublicPartner {
  id: string;
  name: string;
  partner_type: PublicPartnerType | string;
  category: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  province: string | null;
  address: string | null;
  rating: number | null;
  verified: boolean;
  status: string;
  services: PublicPartnerService[];
}

export interface PublicDoctor {
  id: string;
  full_name: string;
  specialty: string | null;
  hospital: string | null;
  experience_years: number | null;
  bio: string | null;
  avatar_url: string | null;
  rating: number | null;
  consult_count: number;
  is_online: boolean;
  response_hours: number;
  verified: boolean;
}

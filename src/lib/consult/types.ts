export type ConsultStatus = "pending" | "answered" | "closed" | "cancelled";

export interface ConsultRequest {
  id: string;
  user_id: string;
  bs_id: string | null;
  question: string;
  baby_age_months: number | null;
  answer: string | null;
  answered_at: string | null;
  forwarded_at: string | null;
  status: ConsultStatus;
  rating: number | null;
  created_at: string;
  bs_nhi: {
    id: string;
    full_name: string;
    specialty: string | null;
    hospital: string | null;
    avatar_url: string | null;
    response_hours: number;
    verified: boolean;
  } | null;
}

export interface AdminConsultRequest extends ConsultRequest {
  forwarded_by: string | null;
  internal_note: string | null;
  users: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

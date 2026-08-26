export type AppRole = "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  role: AppRole;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
}

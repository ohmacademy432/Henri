export type Baby = {
  id: string;
  name: string;
  birth_time: string | null;
  birth_weight_oz: number | null;
  birth_length_in: number | null;
  birth_head_in: number | null;
  birth_location: string | null;
  birth_notes: string | null;
  owner_user_id: string | null;
  created_at: string;
};

export type Caregiver = {
  id: string;
  baby_id: string;
  user_id: string;
  display_name: string;
  relationship: string | null;
  can_edit: boolean;
  notify_meds: boolean;
  web_push_subscription: PushSubscriptionJSON | null;
  save_to_device_gallery: boolean;
  created_at: string;
};

export type Invitation = {
  id: string;
  baby_id: string;
  email: string;
  relationship: string | null;
  display_name: string | null;
  token: string;
  invited_by: string | null;
  accepted: boolean;
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
};

export type Feed = {
  id: string;
  baby_id: string;
  type: 'breast_left' | 'breast_right' | 'bottle' | 'solid';
  amount_ml: number | null;
  duration_min: number | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  logged_by: string | null;
  created_at: string;
};

export type SleepSession = {
  id: string;
  baby_id: string;
  started_at: string;
  ended_at: string | null;
  quality: string | null;
  location: string | null;
  logged_by: string | null;
  created_at: string;
};

export type Diaper = {
  id: string;
  baby_id: string;
  type: string;
  notes: string | null;
  occurred_at: string;
  logged_by: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  baby_id: string;
  name: string;
  generic_name: string | null;
  dose_amount: number;
  dose_unit: string;
  frequency_hours: number;
  max_per_day: number | null;
  reason: string | null;
  prescribed_by: string | null;
  active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type Dose = {
  id: string;
  medication_id: string;
  given_at: string;
  amount: number | null;
  given_by: string | null;
  notes: string | null;
  created_at: string;
};

export type Memory = {
  id: string;
  baby_id: string;
  occurred_on: string;
  title: string | null;
  body: string | null;
  photo_urls: string[] | null;
  thumbnail_urls: string[] | null;
  audio_url: string | null;
  prompt_id: string | null;
  authored_by: string | null;
  visibility: 'shared' | 'private';
  created_at: string;
};

export type Prompt = {
  id: string;
  baby_id: string;
  question: string;
  age_min_days: number | null;
  age_max_days: number | null;
  custom: boolean;
  created_by: string | null;
  delivered_at: string | null;
  answered_memory_id: string | null;
  created_at: string;
};

export type Vaccination = {
  id: string;
  baby_id: string;
  vaccine_name: string;
  given_at: string | null;
  brand: string | null;
  lot_number: string | null;
  reaction_notes: string | null;
  provider: string | null;
  due_at: string | null;
  created_at: string;
};

export type Illness = {
  id: string;
  baby_id: string;
  name: string;
  symptoms: string | null;
  started_at: string;
  resolved_at: string | null;
  highest_temp_f: number | null;
  notes: string | null;
  doctor_notified: boolean;
  created_at: string;
};

export type GrowthMeasurement = {
  id: string;
  baby_id: string;
  weight_lb: number | null;
  length_in: number | null;
  head_circ_in: number | null;
  measured_at: string;
  source: string | null;
  created_at: string;
};

export type AudioCapsule = {
  id: string;
  baby_id: string;
  title: string;
  audio_url: string;
  duration_sec: number | null;
  captured_at: string;
  captured_by: string | null;
  description: string | null;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  baby_id: string;
  name: string;
  relationship: string;
  generation: number | null;
  side: 'maternal' | 'paternal' | 'chosen' | null;
  story: string | null;
  photo_url: string | null;
  birth_year: number | null;
  death_year: number | null;
  created_at: string;
};

export type Milestone = {
  id: string;
  baby_id: string;
  category: string | null;
  name: string;
  achieved_on: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

export type Reminder = {
  id: string;
  baby_id: string;
  medication_id: string | null;
  kind: string;
  fire_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

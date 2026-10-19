export type TripStatus = 'planning' | 'upcoming' | 'ongoing' | 'completed';

export type ActivityCategory =
  | 'sightseeing'
  | 'food'
  | 'adventure'
  | 'relaxation'
  | 'shopping'
  | 'cultural'
  | 'other';

export interface Trip {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  cover_image: string | null;
  budget: number | null;
  notes: string;
  status: TripStatus;
  created_at: string;
}

export interface Activity {
  id: string;
  trip_id: string;
  title: string;
  date: string | null;
  start_time: string | null;
  location: string | null;
  category: ActivityCategory;
  cost: number | null;
  notes: string;
  completed: boolean;
  created_at: string;
}

export interface SavedDestination {
  id: string;
  user_id: string;
  name: string;
  country: string;
  image_url: string | null;
  description: string;
  visited: boolean;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  tags: string[];
  bestTime: string;
  avgBudget: string;
}

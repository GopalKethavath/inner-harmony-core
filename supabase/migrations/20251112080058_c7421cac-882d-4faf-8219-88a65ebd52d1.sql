-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create moods table for mood tracking
CREATE TABLE public.moods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mood_level integer CHECK (mood_level >= 1 AND mood_level <= 5) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moods"
  ON public.moods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moods"
  ON public.moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create meditations table
CREATE TABLE public.meditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL,
  audio_url text,
  category text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meditations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view meditations"
  ON public.meditations FOR SELECT
  USING (true);

-- Create therapists table
CREATE TABLE public.therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialization text NOT NULL,
  bio text,
  avatar_url text,
  email text NOT NULL,
  available_slots jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view therapists"
  ON public.therapists FOR SELECT
  USING (true);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE CASCADE NOT NULL,
  booking_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  jitsi_room_code text NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create symptom_checks table for AI checker history
CREATE TABLE public.symptom_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  symptoms text NOT NULL,
  ai_response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.symptom_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own symptom checks"
  ON public.symptom_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptom checks"
  ON public.symptom_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
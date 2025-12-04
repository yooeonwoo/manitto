-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rounds table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'closed')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(round_id, name)
);

-- Missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Profiles table (Links Supabase Auth to a Participant in a Round)
-- Note: This assumes a user is tied to a specific round context or we might need a many-to-many if users participate in multiple rounds over time.
-- Based on PRD: "profiles table: id (FK auth.users), round_id, participant_id"
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE SET NULL,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- The user who received this assignment
    source_participant_id UUID NOT NULL REFERENCES participants(id), -- The participant identity of the user
    target_participant_id UUID NOT NULL REFERENCES participants(id), -- The target (Manitto)
    mission_id UUID NOT NULL REFERENCES missions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(round_id, user_id),
    UNIQUE(round_id, target_participant_id), -- A person can be a target only once per round
    UNIQUE(round_id, mission_id) -- A mission can be assigned only once per round
);

-- RLS Policies (Basic setup, can be refined)
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone for now (or authenticated users)
CREATE POLICY "Allow read access for all users" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON participants FOR SELECT USING (true);
CREATE POLICY "Allow read access for all users" ON missions FOR SELECT USING (true);

-- Profiles: Users can see their own profile, maybe others too?
CREATE POLICY "Users can see own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Assignments: Users can only see their own assignment
CREATE POLICY "Users can see own assignment" ON assignments FOR SELECT USING (auth.uid() = user_id);

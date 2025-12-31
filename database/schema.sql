-- Core tables for campus tour registration

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  registered INT NOT NULL DEFAULT 0,
  checked_in INT NOT NULL DEFAULT 0,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  canceled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  checked_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, tour_id)
);

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY CHECK (id = 1),
  max_tours_per_student INT NOT NULL DEFAULT 2,
  filling_fast_threshold REAL NOT NULL DEFAULT 0.25,
  announcement TEXT NOT NULL DEFAULT ''
);

INSERT INTO settings (id, max_tours_per_student, filling_fast_threshold, announcement)
VALUES (1, 2, 0.25, 'Next tour leaves from Booth A')
ON CONFLICT (id) DO NOTHING;

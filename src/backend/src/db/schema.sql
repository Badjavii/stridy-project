-- ─── STRIDY DATABASE SCHEMA ──────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_key   VARCHAR(16)  UNIQUE NOT NULL,
  username     VARCHAR(50)  UNIQUE NOT NULL,
  created_at   TIMESTAMP    DEFAULT NOW(),
  last_login   TIMESTAMP    DEFAULT NOW()
);

-- Instituciones
CREATE TABLE IF NOT EXISTS institutions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  program    VARCHAR(150),
  color      VARCHAR(7)   DEFAULT '#7c6ef5',
  created_at TIMESTAMP    DEFAULT NOW()
);

-- Materias
CREATE TABLE IF NOT EXISTS subjects (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  color          VARCHAR(7)   DEFAULT '#7c6ef5',
  credits        INT          DEFAULT 3,
  passing_grade  DECIMAL(4,2) DEFAULT 3.0,
  notes          TEXT         DEFAULT '',
  created_at     TIMESTAMP    DEFAULT NOW()
);

-- Notas de evaluaciones
CREATE TABLE IF NOT EXISTS grades (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  score      DECIMAL(4,2) NOT NULL,
  weight     DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP    DEFAULT NOW()
);

-- Notas pendientes
CREATE TABLE IF NOT EXISTS pending_grades (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  weight     DECIMAL(5,2) NOT NULL
);

-- Eventos
CREATE TABLE IF NOT EXISTS events (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id     UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title          VARCHAR(200) NOT NULL,
  date           DATE         NOT NULL,
  type           VARCHAR(20)  DEFAULT 'class',
  created_at     TIMESTAMP    DEFAULT NOW()
);

-- Horario
CREATE TABLE IF NOT EXISTS schedule_slots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
  day_of_week INT          NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time  TIME         NOT NULL,
  end_time    TIME         NOT NULL
);

-- Amistades
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(20)  DEFAULT 'pending',
  created_at   TIMESTAMP    DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

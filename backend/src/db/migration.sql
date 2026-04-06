-- Run this in the Supabase SQL Editor to set up your tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FOOD SERVICE
-- ============================================
CREATE TABLE food_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  calories   NUMERIC DEFAULT 0,
  protein    NUMERIC DEFAULT 0,
  carbs      NUMERIC DEFAULT 0,
  fat        NUMERIC DEFAULT 0,
  sodium     NUMERIC DEFAULT 0,
  sugar      NUMERIC DEFAULT 0,
  grams      NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE food_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  servings     NUMERIC NOT NULL DEFAULT 1,
  logged_at    DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weight_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight     NUMERIC NOT NULL,
  logged_at  DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, logged_at)
);

CREATE TABLE goals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  calories   NUMERIC DEFAULT 0,
  protein    NUMERIC DEFAULT 0,
  carbs      NUMERIC DEFAULT 0,
  fat        NUMERIC DEFAULT 0,
  weight     NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RECIPES
-- ============================================
CREATE TABLE recipes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE recipe_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_item_id UUID NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  servings     NUMERIC NOT NULL DEFAULT 1
);

-- ============================================
-- WORKOUT SERVICE
-- ============================================
CREATE TABLE workout_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      VARCHAR(7) NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_type_id UUID NOT NULL REFERENCES workout_types(id) ON DELETE CASCADE,
  logged_at       DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PREMIUM WHITELIST
-- ============================================
CREATE TABLE premium_users (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES (primary query pattern: user + date)
-- ============================================
CREATE INDEX idx_food_logs_user_date    ON food_logs(user_id, logged_at);
CREATE INDEX idx_weight_logs_user_date  ON weight_logs(user_id, logged_at);
CREATE INDEX idx_workout_logs_user_date ON workout_logs(user_id, logged_at);
CREATE INDEX idx_food_items_user        ON food_items(user_id);
CREATE INDEX idx_recipes_user           ON recipes(user_id);
CREATE INDEX idx_recipe_items_recipe    ON recipe_items(recipe_id);
CREATE INDEX idx_workout_types_user     ON workout_types(user_id);

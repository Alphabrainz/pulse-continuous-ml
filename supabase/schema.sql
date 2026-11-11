-- =========================================================================
-- CONTINUOUS LEARNING EDGE ML STACK: SUPABASE POSTGRESQL SCHEMA
-- Execute this script directly in the Supabase SQL Editor.
-- =========================================================================

-- 1. Table: telemetry_logs
-- Stores features, predictions, and ground-truth labels sent from edge devices.
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    device_id TEXT NOT NULL,
    features JSONB NOT NULL,
    true_label TEXT,
    predicted_label TEXT,
    model_version TEXT DEFAULT 'initial',
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Fast lookup indexes for pipeline retraining and device filtering
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_processed ON public.telemetry_logs(processed);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_true_label ON public.telemetry_logs(true_label) WHERE true_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_device_id ON public.telemetry_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_created_at ON public.telemetry_logs(created_at);

-- 2. Table: model_registry
-- Tracks active production models, commit hashes from Hugging Face, and evaluation metrics.
CREATE TABLE IF NOT EXISTS public.model_registry (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    version TEXT NOT NULL,
    commit_hash TEXT,
    repo_id TEXT NOT NULL,
    filename TEXT NOT NULL DEFAULT 'model.joblib',
    accuracy DOUBLE PRECISION,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_registry_active ON public.model_registry(is_active);

-- 3. Row-Level Security (RLS) Configuration
-- Enable RLS for database safety
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_registry ENABLE ROW LEVEL SECURITY;

-- Allow public / anon client access for device logging and reads (or restrict with service_role key)
DROP POLICY IF EXISTS "Allow anon insert telemetry" ON public.telemetry_logs;
CREATE POLICY "Allow anon insert telemetry" ON public.telemetry_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read telemetry" ON public.telemetry_logs;
CREATE POLICY "Allow anon read telemetry" ON public.telemetry_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon update telemetry" ON public.telemetry_logs;
CREATE POLICY "Allow anon update telemetry" ON public.telemetry_logs
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anon read model registry" ON public.model_registry;
CREATE POLICY "Allow anon read model registry" ON public.model_registry
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anon write model registry" ON public.model_registry;
CREATE POLICY "Allow anon write model registry" ON public.model_registry
    FOR ALL USING (true);


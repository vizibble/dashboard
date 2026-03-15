-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  user_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SETTINGS
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  alert_emails TEXT[] DEFAULT '{}',
  history_mode VARCHAR(20) DEFAULT 'instant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEVICES
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  device_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEVICE INFO
CREATE TABLE device_info (
  id SERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SENSOR READINGS
CREATE TABLE sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALERTS
CREATE TABLE alerts (
  id BIGSERIAL PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  parameter VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Rules
CREATE TABLE alert_rules (
  id BIGSERIAL PRIMARY KEY,
  rule_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  parameter VARCHAR(100) NOT NULL,
  condition VARCHAR(10) NOT NULL CHECK (condition IN ('gt', 'lt', 'gte', 'lte', 'eq')),
  threshold NUMERIC NOT NULL,
  label VARCHAR(200),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices of a user
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Latest readings per device
CREATE INDEX idx_sensor_device_time ON sensor_readings(device_id, recorded_at DESC);

-- Alerts per device
CREATE INDEX idx_alerts_device_time ON alerts(device_id, recorded_at DESC);

-- Active rules per device
CREATE INDEX idx_alert_rules_device ON alert_rules(device_id)
WHERE
  enabled = TRUE;

-- JSONB search
CREATE INDEX idx_sensor_payload ON sensor_readings USING GIN (payload jsonb_path_ops);
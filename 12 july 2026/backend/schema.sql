-- USERS
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SETTINGS
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  history_mode VARCHAR(20) DEFAULT 'instant',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER ALERT EMAILS
CREATE TABLE user_alert_emails (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- DEVICES
CREATE TABLE devices (
  device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
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

-- ALERT RULES
CREATE TABLE alert_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  parameter VARCHAR(100) NOT NULL,
  condition VARCHAR(10) NOT NULL CHECK (condition IN ('gt', 'lt', 'gte', 'lte', 'eq')),
  threshold NUMERIC NOT NULL,
  label VARCHAR(200),
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- REPORT TEMPLATES
CREATE TABLE report_templates (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  template JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
-- Devices of a user
CREATE INDEX idx_devices_user_id ON devices(user_id);

-- Latest readings per device
CREATE INDEX idx_sensor_device_time ON sensor_readings(device_id, recorded_at DESC);

-- Alerts per device
CREATE INDEX idx_alerts_device_time ON alerts(device_id, recorded_at DESC);

-- Alerts by parameter
CREATE INDEX idx_alerts_parameter ON alerts(parameter);

-- Active rules per device
CREATE INDEX idx_alert_rules_device ON alert_rules(device_id) WHERE enabled = TRUE;

-- JSONB search
CREATE INDEX idx_sensor_payload ON sensor_readings USING GIN (payload jsonb_path_ops);
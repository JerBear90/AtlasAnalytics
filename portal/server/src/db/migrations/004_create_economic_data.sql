CREATE TABLE economic_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingestion_id UUID NOT NULL REFERENCES csv_ingestions(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  indicator_type VARCHAR(100) NOT NULL,
  quarter VARCHAR(10) NOT NULL,
  observation_date DATE NOT NULL,
  value DECIMAL(20, 6) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_economic_data_ingestion ON economic_data(ingestion_id);
CREATE INDEX idx_economic_data_country ON economic_data(country_code);
CREATE INDEX idx_economic_data_indicator ON economic_data(indicator_type);
CREATE INDEX idx_economic_data_quarter ON economic_data(quarter);
CREATE INDEX idx_economic_data_observation_date ON economic_data(observation_date);
CREATE INDEX idx_economic_data_country_quarter ON economic_data(country_code, quarter);

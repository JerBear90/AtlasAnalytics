CREATE TABLE csv_ingestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(512) NOT NULL,
  uploader_id UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  file_path VARCHAR(1024)
);

CREATE INDEX idx_csv_ingestions_uploader ON csv_ingestions(uploader_id);
CREATE INDEX idx_csv_ingestions_uploaded_at ON csv_ingestions(uploaded_at DESC);

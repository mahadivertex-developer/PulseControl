-- Migration: Add buyers table
-- Run this script once against your database to add the buyers table.

CREATE TABLE IF NOT EXISTS buyers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  UNIQUE (company_id, code)
);

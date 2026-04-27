-- BulwarkX PostgreSQL Schema
-- Run: psql $DATABASE_URL -f schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE escrow_status AS ENUM (
  'created', 'funded', 'released', 'refunded', 'disputed', 'cancelled'
);

CREATE TYPE event_type AS ENUM (
  'escrow_created', 'escrow_funded', 'escrow_released', 
  'escrow_refunded', 'escrow_disputed', 'escrow_cancelled'
);

CREATE TYPE chain_type AS ENUM ('evm', 'solana', 'tron');

-- Escrows table
CREATE TABLE escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_external_id VARCHAR(255) UNIQUE,
  order_id VARCHAR(255) NOT NULL,
  chain_type chain_type NOT NULL DEFAULT 'evm',
  chain_id INTEGER NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  payer_address VARCHAR(255) NOT NULL,
  payee_address VARCHAR(255) NOT NULL,
  arbiter_address VARCHAR(255) NOT NULL,
  token_address VARCHAR(255),
  amount_native VARCHAR(66),
  amount_token VARCHAR(66),
  status escrow_status NOT NULL DEFAULT 'created',
  callback_url TEXT,
  auto_release_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  funded_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  created_block_number BIGINT,
  funded_block_number BIGINT,
  released_block_number BIGINT,
  refunded_block_number BIGINT,
  tx_hash_created VARCHAR(255),
  tx_hash_funded VARCHAR(255),
  tx_hash_released VARCHAR(255),
  tx_hash_refunded VARCHAR(255),
  INDEX idx_escrows_order_id (order_id),
  INDEX idx_escrows_status (status),
  INDEX idx_escrows_payer (payer_address),
  INDEX idx_escrows_payee (payee_address),
  INDEX idx_escrows_created_at (created_at DESC)
);

-- Events table (for indexing and replay)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID REFERENCES escrows(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  chain_id INTEGER NOT NULL,
  contract_address VARCHAR(255) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL,
  block_number BIGINT NOT NULL,
  block_hash VARCHAR(255) NOT NULL,
  log_index INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(chain_id, tx_hash, log_index)
);

CREATE INDEX idx_events_escrow ON events(escrow_id);
CREATE INDEX idx_events_block ON events(chain_id, block_number);
CREATE INDEX idx_events_unprocessed ON events(processed_at) WHERE processed_at IS NULL;

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  event_type event_type NOT NULL,
  secret_hash VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER NOT NULL DEFAULT 0
);

-- Webhook deliveries table (idempotency)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  UNIQUE(webhook_id, event_id, attempt)
);

CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(next_retry_at) 
  WHERE next_retry_at IS NOT NULL;

-- Chain head tracking (for reorg detection)
CREATE TABLE chain_heads (
  chain_id INTEGER PRIMARY KEY,
  block_number BIGINT NOT NULL,
  block_hash VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency keys
CREATE TABLE idempotency_keys (
  key VARCHAR(255) PRIMARY KEY,
  response_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- FILE: /srv/blackroad-api/db/migrations/0006_agents_location.sql
ALTER TABLE agents ADD COLUMN location TEXT NOT NULL DEFAULT 'local';

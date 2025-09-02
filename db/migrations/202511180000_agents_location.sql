-- FILE: /srv/blackroad-api/db/migrations/202511180000_agents_location.sql
ALTER TABLE agents ADD COLUMN location TEXT NOT NULL DEFAULT 'cloud';

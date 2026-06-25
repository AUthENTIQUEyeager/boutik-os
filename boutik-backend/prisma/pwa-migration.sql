-- BoutiK — Migration PWA Stats
-- Ajouter les tables de tracking d'installation PWA

-- Table des installations
CREATE TABLE IF NOT EXISTS "pwa_installs" (
  "id"          SERIAL PRIMARY KEY,
  "platform"    VARCHAR(20) NOT NULL DEFAULT 'unknown',
  "installedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "userAgent"   TEXT DEFAULT ''
);

-- Table des visites
CREATE TABLE IF NOT EXISTS "pwa_visits" (
  "id"          SERIAL PRIMARY KEY,
  "platform"    VARCHAR(20) NOT NULL DEFAULT 'unknown',
  "isInstalled" BOOLEAN NOT NULL DEFAULT false,
  "visitedAt"   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_pwa_installs_platform ON "pwa_installs"("platform");
CREATE INDEX IF NOT EXISTS idx_pwa_visits_platform ON "pwa_visits"("platform");
CREATE INDEX IF NOT EXISTS idx_pwa_visits_installed ON "pwa_visits"("isInstalled");

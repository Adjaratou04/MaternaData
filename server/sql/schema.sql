-- =====================================================================
-- Materna Data : schéma PostgreSQL
-- Toutes les données chargées par seed.js sont FICTIVES.
-- =====================================================================

DROP TABLE IF EXISTS journal_acces, notifications, consentements, verifications_sms,
  comptes_patientes, consultations_enfant, vaccins, mesures_enfant, enfants,
  rendez_vous, examens, consultations, patientes, utilisateurs, etablissements CASCADE;
DROP SEQUENCE IF EXISTS seq_ids;

CREATE SEQUENCE seq_ids START 100;

-- Établissement (clinique privée cliente)
CREATE TABLE etablissements (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  ville       TEXT NOT NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comptes du personnel de la clinique
CREATE TABLE utilisateurs (
  id                TEXT PRIMARY KEY,
  etablissement_id  TEXT NOT NULL REFERENCES etablissements(id),
  nom               TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN ('medecin', 'sagefemme', 'admin', 'externe')),
  fonction          TEXT NOT NULL,
  initiales         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  actif             BOOLEAN NOT NULL DEFAULT true,   -- false = compte non accrédité
  cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dossier médical de la patiente (tenu par la clinique)
CREATE TABLE patientes (
  id                TEXT PRIMARY KEY,
  etablissement_id  TEXT NOT NULL REFERENCES etablissements(id),
  nom               TEXT NOT NULL,
  age               INTEGER NOT NULL CHECK (age BETWEEN 12 AND 60),
  ddr               DATE,                              -- date des dernières règles
  postnatal         BOOLEAN NOT NULL DEFAULT false,
  telephone         TEXT NOT NULL,
  adresse           TEXT NOT NULL DEFAULT '',
  profession        TEXT NOT NULL DEFAULT '',
  urgence_nom       TEXT NOT NULL DEFAULT '',
  urgence_lien      TEXT NOT NULL DEFAULT '',
  urgence_tel       TEXT NOT NULL DEFAULT '',
  code_liaison      TEXT NOT NULL UNIQUE,              -- remis à la patiente pour relier son application
  groupe            TEXT NOT NULL DEFAULT 'À déterminer',
  gestite           INTEGER NOT NULL DEFAULT 1,
  parite            INTEGER NOT NULL DEFAULT 0,
  cesariennes       INTEGER NOT NULL DEFAULT 0,
  allergies         TEXT NOT NULL DEFAULT 'À renseigner',
  antecedents_med   TEXT NOT NULL DEFAULT 'À renseigner',
  antecedents_chir  TEXT NOT NULL DEFAULT 'À renseigner',
  maternite_prevue  TEXT NOT NULL DEFAULT 'Clinique Sutura (fictive)',
  projet_naissance  TEXT NOT NULL DEFAULT 'À définir avec votre soignant',
  cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consultations (
  id          TEXT PRIMARY KEY,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  type        TEXT NOT NULL,
  par         TEXT NOT NULL,
  ta_sys      INTEGER,
  ta_dia      INTEGER,
  poids       NUMERIC(5,1),
  hu          NUMERIC(4,1),                            -- hauteur utérine (cm)
  bdcf        INTEGER,                                 -- bruits du cœur fœtal
  bandelette  TEXT,
  notes       TEXT NOT NULL DEFAULT '',
  conduite    TEXT NOT NULL DEFAULT '',
  saisi_par   TEXT REFERENCES utilisateurs(id),
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON consultations (patiente_id, date);

CREATE TABLE examens (
  id          TEXT PRIMARY KEY,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Échographie', 'Biologie')),
  titre       TEXT NOT NULL,
  resume      TEXT NOT NULL DEFAULT '',
  valeurs     JSONB NOT NULL DEFAULT '[]',              -- [[libellé, valeur], ...]
  statut      TEXT NOT NULL DEFAULT 'resultat' CHECK (statut IN ('resultat', 'prescrit', 'a-planifier')),
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON examens (patiente_id, date);

CREATE TABLE rendez_vous (
  id          TEXT PRIMARY KEY,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  heure       TEXT NOT NULL,
  motif       TEXT NOT NULL,
  statut      TEXT NOT NULL CHECK (statut IN ('confirme', 'a-confirmer', 'honore', 'annule')),
  avec        TEXT NOT NULL,
  lieu        TEXT NOT NULL,
  rappel      TEXT,
  preparer    TEXT,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON rendez_vous (date);

-- Carnet de l'enfant
CREATE TABLE enfants (
  id          TEXT PRIMARY KEY,
  mere_id     TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  prenom      TEXT NOT NULL,
  nom         TEXT NOT NULL,
  sexe        TEXT NOT NULL CHECK (sexe IN ('F', 'M')),
  naissance   DATE NOT NULL,
  terme       TEXT NOT NULL,
  poids_naissance  TEXT NOT NULL,
  taille_naissance TEXT NOT NULL,
  lieu        TEXT NOT NULL
);
CREATE TABLE mesures_enfant (
  id        SERIAL PRIMARY KEY,
  enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
  jours     INTEGER NOT NULL,
  poids     NUMERIC(4,2) NOT NULL,
  taille    NUMERIC(4,1) NOT NULL
);
CREATE TABLE vaccins (
  id        SERIAL PRIMARY KEY,
  enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
  age       TEXT NOT NULL,
  vaccins   TEXT NOT NULL,
  date      DATE NOT NULL,
  statut    TEXT NOT NULL CHECK (statut IN ('fait', 'prochain', 'a-venir'))
);
CREATE TABLE consultations_enfant (
  id        SERIAL PRIMARY KEY,
  enfant_id TEXT NOT NULL REFERENCES enfants(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  type      TEXT NOT NULL,
  par       TEXT NOT NULL,
  notes     TEXT NOT NULL DEFAULT ''
);

-- Compte de l'application patiente. Un compte seul n'ouvre AUCUN dossier :
-- patiente_id n'est renseigné qu'après code de liaison + SMS + consentement.
CREATE TABLE comptes_patientes (
  id                TEXT PRIMARY KEY,
  nom               TEXT NOT NULL,
  telephone         TEXT NOT NULL,
  email             TEXT UNIQUE,
  mot_de_passe_hash TEXT NOT NULL,
  patiente_id       TEXT UNIQUE REFERENCES patientes(id) ON DELETE SET NULL,
  lie_le            TIMESTAMPTZ,
  essais_code       INTEGER NOT NULL DEFAULT 0,
  cree_le           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON comptes_patientes (telephone);

-- Codes SMS à usage unique (stockés sous forme d'empreinte, jamais en clair)
CREATE TABLE verifications_sms (
  id          SERIAL PRIMARY KEY,
  compte_id   TEXT NOT NULL REFERENCES comptes_patientes(id) ON DELETE CASCADE,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  expire_le   TIMESTAMPTZ NOT NULL,
  essais      INTEGER NOT NULL DEFAULT 0,
  valide      BOOLEAN NOT NULL DEFAULT false,
  fournisseur TEXT NOT NULL,
  cree_le     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE consentements (
  id          SERIAL PRIMARY KEY,
  compte_id   TEXT NOT NULL REFERENCES comptes_patientes(id) ON DELETE CASCADE,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  soins       BOOLEAN NOT NULL,
  recherche   BOOLEAN NOT NULL DEFAULT false,
  donne_le    TIMESTAMPTZ NOT NULL DEFAULT now(),
  retire_le   TIMESTAMPTZ
);

CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  patiente_id TEXT NOT NULL REFERENCES patientes(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('rdv', 'examen', 'carnet', 'important')),
  titre       TEXT NOT NULL,
  texte       TEXT NOT NULL,
  date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  lue         BOOLEAN NOT NULL DEFAULT false
);

-- Journal des accès : chaque lecture ou modification d'un dossier est tracée, y compris les refus.
CREATE TABLE journal_acces (
  id          BIGSERIAL PRIMARY KEY,
  date        TIMESTAMPTZ NOT NULL DEFAULT now(),
  utilisateur TEXT NOT NULL,
  role        TEXT NOT NULL,
  action      TEXT NOT NULL,
  dossier     TEXT NOT NULL DEFAULT '—',
  resultat    TEXT NOT NULL CHECK (resultat IN ('ok', 'refuse')),
  ip          TEXT
);
CREATE INDEX ON journal_acces (date DESC);
CREATE INDEX ON journal_acces (dossier);

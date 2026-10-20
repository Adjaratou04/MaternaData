# Materna Data

Suivi de la grossesse et de l’enfant, partagé entre la patiente et sa clinique.
Projet académique (Master 2 Big Data et Data Strategy). **Toutes les données sont fictives.**

- **Front-end** : React 18 + TypeScript (Vite)
- **Back-end** : Node.js 20+ (Express)
- **Base de données** : PostgreSQL 16
- **SMS de vérification** : Twilio ou API SMS Orange (mode démonstration si aucune clé n’est fournie)
- **Hébergement proposé** : Render (application) + Neon (base PostgreSQL)

---

## 1. Organisation du code

```
materna-app/
├── client/               Interface React (application patiente mobile + logiciel des soignants)
│   └── src/data/         Accès à l'API (api.ts, store.ts, patiente.ts)
├── server/               API Node.js
│   ├── sql/schema.sql    Schéma de la base PostgreSQL (15 tables)
│   ├── src/index.js      Serveur Express (API + interface compilée)
│   ├── src/auth.js       Sessions, rôles, journal des accès
│   ├── src/sms.js        Envoi des SMS (Twilio, Orange, démo)
│   ├── src/seed.js       Données fictives de démonstration
│   └── src/routes/       auth, pro (clinique), patiente, inscription
├── render.yaml           Déploiement Render
├── docker-compose.yml    PostgreSQL local (facultatif)
└── .env.example          Variables d'environnement
```

## 2. Comptes de démonstration (mot de passe : `Demo2026!`)

| Compte | Rôle | Ce qu’il peut faire |
|---|---|---|
| mariama.sow@demo.sn | Patiente (carnet déjà relié) | Voir son carnet, ses rendez-vous, ses notifications, l’historique des accès |
| a.diop@sutura.exemple.sn | Médecin | Lire et compléter tous les dossiers |
| a.sarr@sutura.exemple.sn | Sage-femme | Lire et compléter tous les dossiers |
| f.mbaye@sutura.exemple.sn | Médecin | Idem |
| c.ndiaye@sutura.exemple.sn | Administration | Comptes et journal, **aucun contenu médical** (refus côté serveur) |
| externe@exemple.sn | Non accrédité | Connexion refusée et enregistrée dans le journal |

**Nouvelle patiente** : « Créer mon compte » sur la page de connexion, puis code de liaison
`MATERNA-DKR-9042` (dossier fictif d’Aïssatou Ba), code SMS, consentement.

## 3. Sécurité mise en œuvre

- Mots de passe chiffrés (bcrypt) ; session signée (JWT) dans un cookie `HttpOnly`, `SameSite`, `Secure` en production.
- Rôles contrôlés **par le serveur** : l’administration et les comptes externes reçoivent un refus (403) sur tout contenu médical, et chaque refus est journalisé.
- Un compte patiente seul n’ouvre aucun dossier : il faut le **code de liaison**, puis un **code SMS** envoyé au numéro enregistré **dans le dossier de la clinique** (pas celui saisi par l’utilisatrice), puis le **consentement**.
- Codes SMS à usage unique, stockés sous forme d’empreinte, valables 10 minutes, 5 essais maximum, renvoi limité à 1 par minute.
- Limitation du nombre de tentatives de connexion et d’inscription.
- Journal des accès : connexions, lectures de dossier, saisies, refus, liaisons, consentements.
- La patiente peut retirer son consentement depuis son profil : le carnet n’est plus accessible depuis l’application.

## 4. Lancer le projet sur un ordinateur

Prérequis : Node.js 20.12 ou plus récent, et PostgreSQL (installé, ou via Docker).

```bash
# 1. Base de données (si vous utilisez Docker)
docker compose up -d

# 2. Configuration
cp .env.example server/.env        # puis ajustez DATABASE_URL si besoin

# 3. Installation et création des tables + données fictives
npm install --prefix server
npm install --prefix client
npm run db:init

# 4. Démarrage (deux terminaux)
npm run dev:serveur                # API sur http://localhost:3000
npm run dev:client                 # interface sur http://localhost:5173
```

Version « production » sur l’ordinateur : `npm run build` puis `npm start`, et ouvrir http://localhost:3000.

Tests du module SMS : `npm test --prefix server`.

## 5. Mettre l’application en ligne (Neon + Render)

Comptez environ 20 minutes. Ces services proposent des offres gratuites ; vérifiez leurs conditions au moment de l’inscription.

### Étape 1 : déposer le code sur GitHub
1. Créez un compte sur https://github.com puis un dépôt **privé** nommé `materna-data`.
2. Déposez-y le contenu du dossier `materna-app` (bouton « uploading an existing file », ou `git push`).
   Ne déposez jamais de fichier `.env` contenant des clés.

### Étape 2 : créer la base PostgreSQL sur Neon
1. Créez un compte sur https://neon.tech et un projet nommé `materna-data` (région Europe, la plus proche de Dakar).
2. Dans **Connection details**, copiez l’adresse de connexion. Elle ressemble à :
   `postgresql://utilisateur:motdepasse@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. Rien d’autre à faire : les tables et les données fictives sont créées automatiquement au premier démarrage de l’application.

### Étape 3 : déployer l’application sur Render
1. Créez un compte sur https://render.com et reliez-le à GitHub.
2. Cliquez sur **New → Blueprint**, choisissez le dépôt `materna-data` : Render lit le fichier `render.yaml`.
3. Renseignez les variables demandées :
   - `DATABASE_URL` : l’adresse copiée sur Neon ;
   - les clés Twilio (étape 4), ou laissez `SMS_FOURNISSEUR=demo` pour commencer.
4. Cliquez sur **Apply**. Après la construction (quelques minutes), l’application est disponible à une adresse du type `https://materna-data.onrender.com`.
5. Vérification : `https://materna-data.onrender.com/api/sante` doit afficher `"ok": true`.

> Sur l’offre gratuite de Render, le service se met en veille après une période sans visite : la première ouverture peut prendre près d’une minute. Ouvrez l’application quelques minutes avant une démonstration.

### Étape 4 : activer le vrai SMS avec Twilio
1. Créez un compte sur https://www.twilio.com (un crédit d’essai est offert).
2. Dans la console : récupérez **Account SID** et **Auth Token**, puis obtenez un numéro Twilio (**Phone Numbers → Buy a number**, ou le numéro d’essai proposé).
3. **Compte d’essai** : Twilio n’envoie qu’aux numéros que vous avez vérifiés. Ajoutez vos téléphones dans **Phone Numbers → Verified Caller IDs**. Les messages commencent par une mention « Sent from your Twilio trial account ».
4. Vérifiez dans **Messaging → Settings → Geo permissions** que le Sénégal (+221) est autorisé.
5. Sur Render (**Environment**), renseignez :
   `SMS_FOURNISSEUR=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (numéro Twilio au format +1…).
6. Pour la démonstration, le SMS part vers le numéro **enregistré dans le dossier** de la patiente. Deux possibilités :
   - créer depuis l’espace soignant un nouveau dossier avec votre vrai numéro, puis s’inscrire avec son code de liaison ;
   - ou définir `TELEPHONE_DEMO=+221XXXXXXXXX` puis réinitialiser la démonstration (menu du profil soignant) : le dossier de Mariama Sow prend votre numéro.

**Alternative Orange (Sénégal)** : créez une application sur https://developer.orange.com avec l’API SMS, puis renseignez
`SMS_FOURNISSEUR=orange`, `ORANGE_CLIENT_ID`, `ORANGE_CLIENT_SECRET`, `ORANGE_SENDER` (ex. `tel:+2210000`).

### En cas de problème
| Symptôme | Cause probable |
|---|---|
| `/api/sante` affiche « indisponible » | `DATABASE_URL` incorrecte ou base Neon en pause : vérifiez l’adresse sur Neon |
| « L’envoi du SMS a échoué » | Clés Twilio erronées, numéro non vérifié (compte d’essai) ou Sénégal non autorisé dans Geo permissions. Les détails apparaissent dans les journaux (**Logs**) de Render |
| Déconnexion à chaque rechargement | `NODE_ENV=production` impose HTTPS : utilisez l’adresse `https://` de Render |

## 6. API (résumé)

| Méthode | Route | Accès | Rôle |
|---|---|---|---|
| POST | /api/auth/connexion | public | Connexion (e-mail ou téléphone) |
| POST | /api/auth/deconnexion | connecté | Fermeture de session |
| GET | /api/auth/moi | public | Session en cours |
| GET | /api/etat | personnel | Données de la clinique (sans contenu médical pour l’administration) |
| GET | /api/patientes/:id | soignant | Lecture d’un dossier (journalisée) |
| POST | /api/patientes | soignant | Création d’un dossier et de son code de liaison |
| POST | /api/consultations | soignant | Saisie d’une consultation (+ notification à la patiente) |
| POST | /api/rdv | soignant | Programmation d’un rendez-vous |
| POST | /api/rdv/:id/confirmer | personnel | Confirmation d’un rendez-vous |
| POST | /api/journal | personnel | Trace d’une action d’interface |
| POST | /api/inscription/compte | public | Création du compte patiente |
| POST | /api/inscription/code | compte patiente | Vérification du code de liaison et envoi du SMS |
| POST | /api/inscription/sms/verifier | compte patiente | Vérification du code SMS |
| POST | /api/inscription/sms/renvoyer | compte patiente | Nouvel envoi (1 par minute) |
| POST | /api/inscription/consentement | compte patiente | Consentement et liaison du carnet |
| GET | /api/moi/carnet | patiente reliée | Carnet complet de la patiente (journalisé) |
| POST | /api/moi/consentement/retirer | patiente reliée | Retrait du consentement |
| GET | /api/sante | public | État du serveur et de la base |

## 7. Limites assumées

- Le module d’aide à la décision reste une **simulation** clairement signalée (pas de modèle validé cliniquement).
- L’assistant conversationnel répond à partir de contenus préparés ; aucun service d’IA externe n’est appelé.
- `DEMO_MODE=true` active la réinitialisation et le changement rapide de profil : à désactiver (`false`) hors démonstration.

// Charge server/.env s'il existe (développement local). Chez l'hébergeur, les variables sont définies dans son interface.
import { fileURLToPath } from 'node:url';
try { process.loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url))); } catch { /* pas de fichier .env : rien à faire */ }

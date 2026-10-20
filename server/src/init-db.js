// Crée (ou recrée) les tables puis charge les données fictives.  Usage : npm run db:init
import './env.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';
import { remplir } from './seed.js';

const schema = readFileSync(fileURLToPath(new URL('../sql/schema.sql', import.meta.url)), 'utf8');
await pool.query(schema);
console.log('Tables créées.');
await remplir();
console.log('Données fictives chargées.');
await pool.end();

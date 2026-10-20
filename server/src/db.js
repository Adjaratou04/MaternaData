// Connexion à PostgreSQL. DATABASE_URL vient de l'environnement (voir .env.example).
import pg from 'pg';

// Les colonnes DATE sont renvoyées telles quelles ('AAAA-MM-JJ') pour éviter tout décalage de fuseau horaire.
pg.types.setTypeParser(1082, (v) => v);
// NUMERIC -> nombre JavaScript
pg.types.setTypeParser(1700, (v) => (v === null ? null : Number(v)));

const url = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/materna';
const ssl = /sslmode=require|neon\.tech|render\.com/.test(url) || process.env.PGSSL === 'true'
  ? { rejectUnauthorized: false }
  : false;

export const pool = new pg.Pool({ connectionString: url, ssl, max: 10 });

export const q = (texte, valeurs) => pool.query(texte, valeurs);
export const un = async (texte, valeurs) => (await pool.query(texte, valeurs)).rows[0] ?? null;
export const tous = async (texte, valeurs) => (await pool.query(texte, valeurs)).rows;

/** Identifiant lisible (ex. C105, R106) tiré d'une séquence commune. */
export const nouvelId = async (prefixe) => `${prefixe}${(await un("SELECT nextval('seq_ids') AS n")).n}`;

/** Exécute une fonction dans une transaction. */
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await fn(client);
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

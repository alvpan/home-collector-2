import { NextApiRequest, NextApiResponse } from 'next';
import pkg from 'pg';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT name FROM City');
      const cities = result.rows.map(row => row.name);
      res.status(200).json({ cities });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Error fetching cities', details: error.message });
  }
}

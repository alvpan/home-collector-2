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
  const { action, city, area } = req.query;

  if (!action || !city || !area) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const actionCode = action === 'Buy' ? 2 : 1;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM priceEntry WHERE action = $1 AND city = $2 AND area = $3',
      [actionCode, city, area]
    );
    client.release();
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error querying the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

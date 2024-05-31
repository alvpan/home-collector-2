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
  const { city } = req.query;

  if (!city) {
    res.status(400).json({ error: 'City is required' });
    return;
  }

  try {
    const client = await pool.connect();

    const cityQuery = `SELECT id FROM "City" WHERE name = $1`;
    const cityResult = await client.query(cityQuery, [city]);

    if (cityResult.rows.length === 0) {
      res.status(404).json({ error: 'City not found' });
      return;
    }

    const cityId = cityResult.rows[0].id;

    const areasQuery = `SELECT name FROM "Area" WHERE city = $1`;
    const areasResult = await client.query(areasQuery, [cityId]);

    const areas = areasResult.rows.map(row => row.name);

    res.status(200).json({ areas });

    client.release();
  } catch (error) {
    console.error('Error fetching areas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

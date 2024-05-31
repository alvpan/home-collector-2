import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgres://default:1SVvFXplu2hT@ep-dawn-lab-a4lkz8oy.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT name FROM City');
    const cities = result.rows.map(row => row.name);
    client.release();
    res.status(200).json({ cities });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cities' });
  }
}

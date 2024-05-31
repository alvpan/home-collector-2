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

  const priceType = action === 'Buy' ? 2 : 1;

  try {
    const client = await pool.connect();

    const query = `
      SELECT pe.surface, pe.price
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      WHERE pe.price_type = $1 AND c.name = $2 AND a.name = $3
      AND pe.entry_date = (
        SELECT MAX(entry_date)
        FROM "PriceEntry" pe_sub
        JOIN "Area" a_sub ON pe_sub.area = a_sub.id
        JOIN "City" c_sub ON a_sub.city = c_sub.id
        WHERE pe_sub.price_type = $1 AND c_sub.name = $2 AND a_sub.name = $3
      )
    `;

    const result = await client.query(query, [priceType, city, area]);
    client.release();

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error querying the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

// Environment variables (ensure these are set in your Vercel environment)
const { POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE, POSTGRES_PORT } = process.env;

const client = new Client({
  host: POSTGRES_HOST,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  port: POSTGRES_PORT ? parseInt(POSTGRES_PORT) : 5432,
});

export default async (req: VercelRequest, res: VercelResponse) => {
  const { cityName, areaName } = req.query;

  if (!cityName) {
    res.status(400).json({ error: 'City name is required' });
    return;
  }

  try {
    await client.connect();

    let query = `
      SELECT pe.*
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      WHERE c.name = $1
    `;
    const values = [cityName];

    if (areaName) {
      query += ' AND a.name = $2';
      values.push(areaName);
    }

    query += `
      AND pe.entry_date = (
        SELECT MAX(entry_date)
        FROM "PriceEntry"
        JOIN "Area" ON "PriceEntry".area = "Area".id
        JOIN "City" ON "Area".city = "City".id
        WHERE "City".name = $1
      `;
    if (areaName) {
      query += ' AND "Area".name = $2';
    }
    query += ')';

    const result = await client.query(query, values);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client.end();
  }
};

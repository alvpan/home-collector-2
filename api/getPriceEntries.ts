// api/getListings.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { city, area } = req.query;

  if (!city || !area) {
    res.status(400).json({ error: 'City and Area are required' });
    return;
  }

  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    const query = `
      SELECT pe.*
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      WHERE c.name = $1 AND a.name = $2
      ORDER BY pe.entry_date DESC
      LIMIT 1
    `;

    const values = [city, area];
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No listings found' });
    } else {
      res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await client.end();
  }
}

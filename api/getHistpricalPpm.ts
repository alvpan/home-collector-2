import { NextApiRequest, NextApiResponse } from 'next';
import pkg from 'pg';
import { format } from 'date-fns';

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
  const { action, city, area, startDate, endDate } = req.query;

  if (!action || !city || !area || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const priceType = action === 'Buy' ? 2 : action === 'Rent' ? 1 : null;
  if (priceType === null) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const country = 'Greece';
  const province = 'No Province';

  try {
    const client = await pool.connect();

    const query = `
      SELECT pe.entry_date, pe.price, pe.surface
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      JOIN "Province" p ON c.province = p.id
      JOIN "Country" co ON p.country = co.id
      WHERE pe.price_type = $1 AND c.name = $2 AND a.name = $3
      AND co.name = $4 AND p.name = $5
      AND pe.entry_date BETWEEN $6 AND $7
      ORDER BY pe.entry_date ASC
    `;

    const result = await client.query(query, [priceType, city, area, country, province, startDate, endDate]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for the specified parameters' });
    }

    const formattedResult = result.rows.map(row => ({
      ...row,
      entry_date: format(new Date(row.entry_date), 'yyyy-MM-dd')
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error('Error querying the database:', error);

    // Type assertion for the error
    if (error instanceof Error) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error', details: 'Unknown error' });
    }
  }
}

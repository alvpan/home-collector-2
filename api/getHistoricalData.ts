import { NextApiRequest, NextApiResponse } from 'next';
import pkg from 'pg';
import { format, subDays, subMonths, subYears } from 'date-fns';

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
  const { action, city, area, surface, timeframe } = req.query;

  if (!action || !city || !area || !surface || !timeframe) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const priceType = action === 'Buy' ? 2 : 1;
  const surfaceValue = parseInt(surface as string, 10);

  let startDate: Date;
  const now = new Date();

  switch (timeframe) {
    case 'last week':
      startDate = subDays(now, 7);
      break;
    case 'last month':
      startDate = subMonths(now, 1);
      break;
    case 'last 6 months':
      startDate = subMonths(now, 6);
      break;
    case 'last year':
      startDate = subYears(now, 1);
      break;
    case 'ever':
      startDate = new Date(0);
      break;
    default:
      return res.status(400).json({ error: 'Invalid timeframe' });
  }

  const formattedStartDate = format(startDate, 'yyyy-MM-dd');

  try {
    const client = await pool.connect();

    const query = `
      SELECT pe.surface, pe.price, pe.entry_date
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      WHERE pe.price_type = $1 AND c.name = $2 AND a.name = $3
      AND pe.surface = $4 AND pe.entry_date >= $5
      ORDER BY pe.entry_date ASC
    `;

    const result = await client.query(query, [priceType, city, area, surfaceValue, formattedStartDate]);
    client.release();

    const formattedResult = result.rows.map(row => ({
      ...row,
      entry_date: format(new Date(row.entry_date), 'yyyy-MM-dd')
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error('Error querying the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

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

type Aggregation = {
  [key: string]: {
    totalSurface: number;
    totalPrice: number;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, city, area, startDate, endDate } = req.query;

  if (!action || !city || !area || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const priceType = action === 'Buy' ? 2 : 1;

  try {
    const formattedStartDate = format(new Date(startDate as string), 'yyyy-MM-dd');
    const formattedEndDate = format(new Date(endDate as string), 'yyyy-MM-dd');
    const client = await pool.connect();

    const query = `
      SELECT pe.surface, pe.price, pe.entry_date
      FROM "PriceEntry" pe
      JOIN "Area" a ON pe.area = a.id
      JOIN "City" c ON a.city = c.id
      WHERE pe.price_type = $1 AND c.name = $2 AND a.name = $3
      AND pe.entry_date >= $4 AND pe.entry_date <= $5
      ORDER BY pe.entry_date ASC
    `;

    const result = await client.query(query, [priceType, city, area, formattedStartDate, formattedEndDate]);
    client.release();

    const aggregation: Aggregation = result.rows.reduce((acc: Aggregation, row: { surface: number, price: number, entry_date: string }) => {
      const date = format(new Date(row.entry_date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { totalSurface: 0, totalPrice: 0 };
      }
      acc[date].totalSurface += row.surface;
      acc[date].totalPrice += row.price;
      return acc;
    }, {});

    const pricePerSqmByDate = Object.entries(aggregation).map(([date, { totalSurface, totalPrice }]) => ({
      date,
      pricePerSqm: totalPrice / totalSurface
    }));

    res.status(200).json(pricePerSqmByDate);
  } catch (error) {
    console.error('Error querying the database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

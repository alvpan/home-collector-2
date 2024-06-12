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

  const formattedStartDate = format(new Date(startDate as string), 'yyyy-MM-dd');
  const formattedEndDate = format(new Date(endDate as string), 'yyyy-MM-dd');

  const country = 'Greece';
  const province = 'No Province';

  try {
    const client = await pool.connect();

    const countryCheck = await client.query('SELECT id FROM "Country" WHERE name = $1', [country]);
    if (countryCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: `Country '${country}' not found` });
    }
    const countryId = countryCheck.rows[0].id;

    const provinceCheck = await client.query('SELECT id FROM "Province" WHERE name = $1 AND country = $2', [province, countryId]);
    if (provinceCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: `Province '${province}' not found in country '${country}'` });
    }
    const provinceId = provinceCheck.rows[0].id;

    const cityCheck = await client.query('SELECT id FROM "City" WHERE name = $1 AND province = $2', [city, provinceId]);
    if (cityCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: `City '${city}' not found in province '${province}'` });
    }
    const cityId = cityCheck.rows[0].id;

    const areaCheck = await client.query('SELECT id FROM "Area" WHERE name = $1 AND city = $2', [area, cityId]);
    if (areaCheck.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: `Area '${area}' not found in city '${city}'` });
    }
    const areaId = areaCheck.rows[0].id;

    const query = `
      SELECT pe.surface, pe.price, pe.entry_date
      FROM "PriceEntry" pe
      WHERE pe.price_type = $1
        AND pe.area = $2
        AND pe.entry_date BETWEEN $3 AND $4
      ORDER BY pe.entry_date ASC
    `;

    const result = await client.query(query, [priceType, areaId, formattedStartDate, formattedEndDate]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data found for the specified parameters' });
    }

    const formattedResult = result.rows.map(row => ({
      surface: row.surface,
      price: row.price,
      entry_date: format(new Date(row.entry_date), 'yyyy-MM-dd')
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    console.error('Error querying the database:', error);

    if (error instanceof Error) {
      res.status(500).json({ error: 'Internal Server Error', details: error.message, stack: error.stack });
    } else {
      res.status(500).json({ error: 'Internal Server Error', details: 'Unknown error' });
    }
  }
}

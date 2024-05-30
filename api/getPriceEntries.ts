import { IncomingMessage, ServerResponse } from 'http';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  POSTGRES_HOST,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DATABASE,
  POSTGRES_PORT,
} = process.env;

const client = new Client({
  host: POSTGRES_HOST,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DATABASE,
  port: POSTGRES_PORT ? parseInt(POSTGRES_PORT) : 5432,
});

const handler = async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const cityName = url.searchParams.get('cityName');
  const areaName = url.searchParams.get('areaName');

  if (!cityName) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'City name is required' }));
    return;
  }

  try {
    await client.connect();
    console.log('Database connected successfully');

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

    console.log('Executing query:', query, values);
    const result = await client.query(query, values);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result.rows));
  } catch (error) {
    console.error('Database query error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error' }));
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
};

export default handler;

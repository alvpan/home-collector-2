import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { data } = req.body;
  if (!Array.isArray(data)) return res.status(400).json({ error: 'Invalid data format' });

  const formattedData = data.map(d => `${d.date}, ${d.pricePerSqm}`).join('\n');

  const prompt = `
You are a real estate market analyst. Below is a time series (YYYY-MM-DD) of housing price per square meter data (in euros):

${formattedData}

Describe the trend between the first and last date. Focus only on what is visible in the data. Do not guess or explain causes. Avoid speculation.
Summarize the change clearly in 2–3 sentences.
`;

  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5", // or gpt-3.5-turbo if budget-sensitive
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    })
  });

  const json = await gptResponse.json();
  const summary = json.choices?.[0]?.message?.content ?? 'No summary available.';

  res.status(200).json({ summary });
}

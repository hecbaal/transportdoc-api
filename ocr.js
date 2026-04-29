export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: image }
            },
            {
              type: 'text',
              text: `Analiza este albarán de transporte y extrae EXACTAMENTE estos campos en formato JSON:
{
  "numeroPedido": "solo las 6 últimas cifras del número de pedido",
  "nombreOrigen": "nombre del punto de origen (ej: BADALONA)",
  "direccionOrigen": "dirección completa de origen",
  "direccionDestino": "dirección completa de destino",
  "pesoKg": número_en_kg_como_float,
  "bultos": número_entero
}
Si el albarán es de Obramat, el nombre de origen estará en DATOS DE ORIGEN -> Nombre.
Responde SOLO con el JSON, sin texto adicional ni backticks.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const parsed = JSON.parse(text.trim());

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

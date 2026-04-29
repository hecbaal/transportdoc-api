export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;

    console.log('Image received, length:', image ? image.length : 'null');

    if (!image) return res.status(400).json({ success: false, error: 'No image received' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
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
              text: `Analiza este albarán y devuelve SOLO este JSON sin nada más:
{"numeroPedido":"6 ultimas cifras","nombreOrigen":"nombre origen","direccionOrigen":"direccion origen","direccionDestino":"direccion destino","pesoKg":0,"bultos":0}`
            }
          ]
        }]
      })
    });

    console.log('Anthropic status:', response.status);
    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data).substring(0, 300));

    if (data.error) return res.status(500).json({ success: false, error: data.error.message });

    const text = data.content.map(i => i.text || '').join('');
    const parsed = JSON.parse(text.trim());

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

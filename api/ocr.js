export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: 'No image' });

    // Truncate image to max 1MB base64
    const maxLen = 1_000_000;
    const trimmed = image.length > maxLen ? image.substring(0, maxLen) : image;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: 'image/jpeg', data: trimmed } },
              { text: 'Analiza este albaran de transporte y devuelve SOLO este JSON sin texto adicional ni backticks:\n{"numeroPedido":"6 ultimas cifras","nombreOrigen":"nombre origen","direccionOrigen":"direccion origen completa","direccionDestino":"direccion destino completa","pesoKg":0,"bultos":0}' }
            ]
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();
    if (data.error) return res.status(500).json({ success: false, error: data.error.message });

    const text = data.candidates[0].content.parts[0].text.trim().replace(/```json|```/g, '');
    const parsed = JSON.parse(text);

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

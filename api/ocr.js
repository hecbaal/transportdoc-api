export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: 'No image' });
    console.log('Image length:', image.length);
    const prompt = 'Analiza este albaran y devuelve SOLO este JSON sin backticks: {"numeroPedido":"6 ultimas cifras","nombreOrigen":"nombre origen","direccionOrigen":"direccion origen","direccionDestino":"direccion destino","pesoKg":0,"bultos":0}';
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: image } }, { text: prompt }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 500 }
      })
    });
    const data = await response.json();
    console.log('Gemini:', JSON.stringify(data).substring(0, 300));
    if (data.error) return res.status(500).json({ success: false, error: data.error.message });
    const text = data.candidates[0].content.parts[0].text.trim().replace(/```json|```/g, '');
    const parsed = JSON.parse(text);
    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

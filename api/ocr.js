export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ success: false, error: 'No image received' });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image
                }
              },
              {
                text: `Analiza este albarán de transporte y devuelve SOLO este JSON sin texto adicional ni backticks:
{"numeroPedido":"6 ultimas cifras del numero de pedido","nombreOrigen":"nombre del punto de origen","direccionOrigen":"direccion completa de origen","direccionDestino":"direccion completa de destino","pesoKg":0,"bultos":0}`
              }
            ]
          }],
          generationConfig: {

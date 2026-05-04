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

    // Step 1: Extract text with Google Cloud Vision
    const visionRes = await fetch(
      'https://vision.googleapis.com/v1/images:annotate?key=' + process.env.VISION_API_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: image },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
          }]
        })
      }
    );

    const visionData = await visionRes.json();
    console.log('Vision status:', visionRes.status);

    if (visionData.error) return res.status(500).json({ success: false, error: visionData.error.message });

    const fullText = visionData.responses[0]?.fullTextAnnotation?.text || '';
    console.log('Extracted text length:', fullText.length);
    console.log('Text preview:', fullText.substring(0, 300));

    // Step 2: Parse fields from extracted text
    const parsed = parseAlbaranText(fullText);
    console.log('Parsed:', JSON.stringify(parsed));

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

function parseAlbaranText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // Número de pedido - buscar patrón numérico largo
  let numeroPedido = '';
  const pedidoMatch = text.match(/N[uú]mero?\s*(?:de\s*)?[Pp]edido[:\s]+(\d+)/i) ||
                      text.match(/N[º°]\s*[Pp]edido[:\s]+(\d+)/i) ||
                      text.match(/Pedido[:\s]+(\d{6,})/i);
  if (pedidoMatch) numeroPedido = pedidoMatch[1].slice(-6);

  // Nombre origen (Obramat)
  let nombreOrigen = '';
  const origenMatch = text.match(/DATOS DE ORIGEN[\s\S]*?Nombre[:\s]+([^\n]+)/i);
  if (origenMatch) nombreOrigen = origenMatch[1].trim();

  // Dirección origen
  let direccionOrigen = '';
  const dirOrigenMatch = text.match(/DATOS DE ORIGEN[\s\S]*?Direcci[oó]n[:\s]+([^\n]+)/i);
  if (dirOrigenMatch) direccionOrigen = dirOrigenMatch[1].trim();

  // Dirección destino
  let direccionDestino = '';
  const dirDestinoMatch = text.match(/DATOS DEL DESTINO[\s\S]*?Direcci[oó]n[:\s]+([^\n]+)/i) ||
                          text.match(/direcci[oó]n[:\s]+([^\n]+)[^\n]*\n[^\n]*barcelona/i);
  if (dirDestinoMatch) direccionDestino = dirDestinoMatch[1].trim();

  // Peso
  let pesoKg = 0;
  const pesoMatch = text.match(/[Pp]eso[:\s]+([0-9]+[.,][0-9]+)\s*KG/i) ||
                    text.match(/([0-9]+[.,][0-9]+)\s*KG/i);
  if (pesoMatch) pesoKg = parseFloat(pesoMatch[1].replace(',', '.'));

  // Bultos
  let bultos = 0;
  const bultosMatch = text.match(/[Bb]ultos[:\s]+(\d+)/i) ||
                      text.match(/N[º°]\s*[Bb]ultos[:\s]+(\d+)/i);
  if (bultosMatch) bultos = parseInt(bultosMatch[1]);

  return { numeroPedido, nombreOrigen, direccionOrigen, direccionDestino, pesoKg, bultos };
}

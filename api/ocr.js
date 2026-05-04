export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'No text' });

    console.log('Text received, length:', text.length);
    console.log('Text preview:', text.substring(0, 500));

    const parsed = parseAlbaranText(text);
    console.log('Parsed:', JSON.stringify(parsed));

    return res.status(200).json({ success: true, data: parsed });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

function parseAlbaranText(text) {
  let numeroPedido = '';
  const pedidoMatch = text.match(/N[uú]mero?\s*(?:de\s*)?[Pp]edido[:\s]+(\d+)/i) ||
                      text.match(/N[º°]\s*[Pp]edido[:\s]+(\d+)/i) ||
                      text.match(/Pedido[:\s]+(\d{6,})/i);
  if (pedidoMatch) numeroPedido = pedidoMatch[1].slice(-6);

  let nombreOrigen = '';
  const origenMatch = text.match(/DATOS DE ORIGEN[\s\S]*?Nombre[:\s]+([^\n]+)/i);
  if (origenMatch) nombreOrigen = origenMatch[1].trim();

  let direccionOrigen = '';
  const dirOrigenMatch = text.match(/DATOS DE ORIGEN[\s\S]*?Direcci[oó]n[:\s]+([^\n]+)/i);
  if (dirOrigenMatch) direccionOrigen = dirOrigenMatch[1].trim();

  let direccionDestino = '';
  const dirDestinoMatch = text.match(/DATOS DEL DESTINO[\s\S]*?Direcci[oó]n[:\s]+([^\n]+)/i);
  if (dirDestinoMatch) direccionDestino = dirDestinoMatch[1].trim();

  let pesoKg = 0;
  const pesoMatch = text.match(/[Pp]eso[:\s]+([0-9]+[.,][0-9]+)\s*KG/i) ||
                    text.match(/([0-9]+[.,][0-9]+)\s*KG/i);
  if (pesoMatch) pesoKg = parseFloat(pesoMatch[1].replace(',', '.'));

  let bultos = 0;
  const bultosMatch = text.match(/N[º°]\s*(?:de\s*)?[Bb]ultos[:\s]+(\d+)/i) ||
                      text.match(/[Bb]ultos[:\s]+(\d+)/i);
  if (bultosMatch) bultos = parseInt(bultosMatch[1]);

  return { numeroPedido, nombreOrigen, direccionOrigen, direccionDestino, pesoKg, bultos };
}

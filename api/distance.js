export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { origen, destino } = req.body;

  try {
    // Geocodificar origen
    const geoOrigen = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origen)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TransportDoc/1.0' } }
    );
    const dataOrigen = await geoOrigen.json();
    if (!dataOrigen.length) return res.status(400).json({ error: 'Origen no encontrado' });

    // Geocodificar destino
    const geoDestino = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destino)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'TransportDoc/1.0' } }
    );
    const dataDestino = await geoDestino.json();
    if (!dataDestino.length) return res.status(400).json({ error: 'Destino no encontrado' });

    const lon1 = dataOrigen[0].lon, lat1 = dataOrigen[0].lat;
    const lon2 = dataDestino[0].lon, lat2 = dataDestino[0].lat;

    // Calcular ruta con OSRM
    const osrm = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`
    );
    const osrmData = await osrm.json();
    const distanciaKm = Math.round(osrmData.routes[0].distance / 1000);

    return res.status(200).json({ success: true, km: distanciaKm });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

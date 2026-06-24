const SightengineClient = require('sightengine');

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Hakuna picha" });

    // Initialize SDK
    const client = new SightengineClient(process.env.SIGHTENGINE_USER, process.env.SIGHTENGINE_SECRET);

    // Convert Base64 to Buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Scan
    // Tumia 'faces' badala ya 'face' ili kuepuka error 9100
    const output = await client.check(['nudity-2.1', 'weapon-1.0', 'gore-2.0', 'faces'])
      .set_bytes(buffer)
      .output('json');

    return res.status(200).json({ success: true, ai: output });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

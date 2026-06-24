export default async function handler(req, res) {
  // CORS Setup
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });

  try {
    const { image, text } = req.body || {};

    // 1. Text Scan Mock
    if (text) {
      const score = Math.random();
      return res.status(200).json({
        success: true,
        type: "text",
        ai: { label: score > 0.7 ? "safe" : "risky", confidence: Number(score.toFixed(2)) }
      });
    }

    // 2. Image Scan (Sightengine GenAI)
    if (image) {
      const formData = new FormData();
      formData.append("api_user", process.env.SIGHTENGINE_USER);
      formData.append("api_secret", process.env.SIGHTENGINE_SECRET);
      formData.append("models", "genai");
      formData.append("media", image);

      const response = await fetch("https://api.sightengine.com/1.0/check.json", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.status === "failure") {
        return res.status(400).json({ 
          success: false, 
          error: data.error?.message || "Scan failed" 
        });
      }

      return res.status(200).json({
        success: true,
        type: "image",
        ai: {
          status: "success",
          ai_generated: data.type === "ai" ? 1 : (data.ai_generated || 0),
          confidence: data.confidence || null,
          raw: data
        }
      });
    }

    return res.status(400).json({ success: false, message: "No input provided" });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
}

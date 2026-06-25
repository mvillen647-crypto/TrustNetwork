export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "POST only"
    });
  }

  try {
    const { image, text } = req.body || {};

    // =========================
    // DEBUG ENV
    // =========================
    const debug = {
      hasUser: !!process.env.SIGHTENGINE_USER,
      hasSecret: !!process.env.SIGHTENGINE_SECRET
    };

    // =========================
    // TEXT TEST
    // =========================
    if (text) {
      return res.status(200).json({
        success: true,
        debug,
        ai: {
          status: "success",
          label: "safe",
          confidence: 0.95,
          toxicity: 0.05
        }
      });
    }

    // =========================
    // IMAGE REQUIRED
    // =========================
    if (!image) {
      return res.status(400).json({
        success: false,
        debug,
        error: "No image received"
      });
    }

    const formData = new URLSearchParams();

    formData.append(
      "api_user",
      process.env.SIGHTENGINE_USER || ""
    );

    formData.append(
      "api_secret",
      process.env.SIGHTENGINE_SECRET || ""
    );

    formData.append(
      "models",
      "genai"
    );

    formData.append(
      "media",
      image
    );

    const response = await fetch(
      "https://api.sightengine.com/1.0/check.json",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();

    // =========================
    // RETURN EVERYTHING
    // =========================
    return res.status(200).json({
      success: response.ok,
      debug: {
        ...debug,
        imageLength: image.length,
        imagePreview: image.substring(0, 50)
      },
      sightengine: data
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });

  }
}

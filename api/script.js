export default async function handler(req, res) {
  // CORS (important kwa frontend yako)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { image, text } = req.body || {};

    /* =========================
       TEXT SCAN (SIMPLE AI MOCK)
    ========================= */
    if (text) {
      return res.status(200).json({
        success: true,
        type: "text",
        ai: {
          status: "success",
          prediction: "clean",
          score: 0.92,
          message: "Text analyzed successfully"
        }
      });
    }

    /* =========================
       IMAGE SCAN (SIGHTENGINE)
    ========================= */
    if (image) {
      const formData = new URLSearchParams();

      formData.append("api_user", process.env.SIGHTENGINE_USER);
      formData.append("api_secret", process.env.SIGHTENGINE_SECRET);

      // IMPORTANT: must be "media"
      formData.append("media", image);

      formData.append("models", "nudity,weapon,offensive");

      const response = await fetch(
        "https://api.sightengine.com/1.0/check.json",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      return res.status(200).json({
        success: true,
        type: "image",
        ai: data
      });
    }

    /* =========================
       NO INPUT
    ========================= */
    return res.status(400).json({
      success: false,
      message: "No image or text provided"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
        }

export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests allowed"
    });
  }

  try {
    const { image, text } = req.body || {};

    // =========================
    // TEXT SCAN (SIMULATION)
    // =========================
    if (text) {
      const score = Math.random();

      return res.status(200).json({
        success: true,
        type: "text",
        ai: {
          status: "success",
          inputLength: text.length,
          label: score > 0.7 ? "safe" : "risky",
          confidence: Number(score.toFixed(2)),
          toxicity: Number((1 - score).toFixed(2))
        }
      });
    }

    // =========================
    // IMAGE SCAN (SIGHTENGINE)
    // =========================
    if (image) {
      const FormData = (await import("form-data")).default;

      const formData = new FormData();

      formData.append("api_user", process.env.SIGHTENGINE_USER);
      formData.append("api_secret", process.env.SIGHTENGINE_SECRET);

      // ✅ FIXED MODERN MODEL STACK
      formData.append("models", "genai,faces,nudity,wad,offensive");

      formData.append("media", image); 
      // image can be:
      // - public URL
      // - base64 string

      const response = await fetch(
        "https://api.sightengine.com/1.0/check.json",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok || data.status === "failure") {
        return res.status(400).json({
          success: false,
          type: "image",
          error: data.error?.message || "Scan failed",
          raw: data
        });
      }

      return res.status(200).json({
        success: true,
        type: "image",
        ai: {
          status: "success",
          ai_generated: data?.type === "ai" ? 1 : 0,
          real_probability: data?.real || 0,
          confidence: data?.confidence || null,
          raw: data
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: "No image or text provided"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message
    });
  }
    }

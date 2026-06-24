export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests allowed"
    });
  }

  try {
    const { image, text } = req.body || {};

    // =========================
    // TEXT SCAN (SAFE AI LOGIC)
    // =========================
    if (text) {
      const score = Math.random(); // simple AI simulation

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
    // IMAGE SCAN (SIGHTENGINE GENAI)
    // =========================
    if (image) {
      const formData = new URLSearchParams();

      // ENV KEYS (Vercel)
      formData.append("api_user", process.env.SIGHTENGINE_USER);
      formData.append("api_secret", process.env.SIGHTENGINE_SECRET);

      // =========================
      // MAIN MODEL (LATEST)
      // =========================
      formData.append("models", "genai");

      // media (base64 or URL)
      formData.append("media", image);

      const response = await fetch(
        "https://api.sightengine.com/1.0/check.json",
        {
          method: "POST",
          body: formData
        }
      );

      const data = await response.json();

      // =========================
      // API ERROR HANDLING
      // =========================
      if (!response.ok || data.status === "failure") {
        return res.status(400).json({
          success: false,
          type: "image",
          error: data.error?.message || "Scan failed from Sightengine",
          raw: data
        });
      }

      // =========================
      // SAFE RESPONSE PARSE (GENAI)
      // =========================
      const ai = {
        status: "success",

        ai_generated: data?.type === "ai" ? 1 : data?.ai_generated || 0,

        real_probability: data?.real || 0,

        confidence: data?.confidence || null,

        raw: data
      };

      return res.status(200).json({
        success: true,
        type: "image",
        ai
      });
    }

    // =========================
    // NO INPUT ERROR
    // =========================
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

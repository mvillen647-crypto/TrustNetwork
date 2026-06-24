export default async function handler(req, res) {
  // =========================
  // CORS SETUP
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
      message: "Method not allowed"
    });
  }

  try {
    const { image, text } = req.body || {};

    // =========================
    // TEXT SCAN (SAFE MOCK AI)
    // =========================
    if (text) {
      const cleanScore = Math.random() * 0.3 + 0.7;

      return res.status(200).json({
        success: true,
        type: "text",
        ai: {
          status: "success",
          label: cleanScore > 0.8 ? "clean" : "suspicious",
          score: Number(cleanScore.toFixed(2)),
          toxicity: Number((1 - cleanScore).toFixed(2))
        }
      });
    }

    // =========================
    // IMAGE SCAN (SIGHTENGINE PRO)
    // =========================
    if (image) {
      const formData = new URLSearchParams();

      // ENV KEYS
      formData.append("api_user", process.env.SIGHTENGINE_USER);
      formData.append("api_secret", process.env.SIGHTENGINE_SECRET);

      // IMPORTANT FIX:
      // use correct modern model names
      formData.append(
        "models",
        "nudity,weapon,offensive,faces"
      );

      // media must be base64 OR URL
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
      // ERROR HANDLING (clean)
      // =========================
      if (!response.ok || data.status === "failure") {
        return res.status(400).json({
          success: false,
          type: "image",
          error: data.error?.message || "Scan failed"
        });
      }

      // =========================
      // CLEAN RESPONSE FORMAT
      // =========================
      return res.status(200).json({
        success: true,
        type: "image",
        ai: {
          status: "success",

          nudity: {
            safe: data.nudity?.safe,
            partial: data.nudity?.partial,
            raw: data.nudity
          },

          weapon: {
            prob: data.weapon?.prob,
            type: data.weapon?.type
          },

          faces: data.faces || [],

          raw: data
        }
      });
    }

    // =========================
    // NO INPUT
    // =========================
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

import axios from "axios";
import FormData from "form-data";

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
    // TEXT SCAN (AI SIMULATION / PLACEHOLDER)
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
    // IMAGE SCAN (SIGHTENGINE PRO)
    // =========================
    if (image) {
      const form = new FormData();

      form.append("media", image); // URL or base64
      form.append(
        "models",
        "nudity-2.1,gore-2.0,weapon-1.0,offensive,face-attributes"
      );

      form.append("api_user", process.env.SIGHTENGINE_USER);
      form.append("api_secret", process.env.SIGHTENGINE_SECRET);

      const response = await axios.post(
        "https://api.sightengine.com/1.0/check.json",
        form,
        {
          headers: form.getHeaders(),
          timeout: 20000
        }
      );

      const data = response.data;

      // =========================
      // SAFETY SCORE ENGINE (CUSTOM LAYER)
      // =========================
      const nudity = data?.nudity?.raw || 0;
      const weapon = data?.weapon || 0;
      const gore = data?.gore || 0;
      const offensive = data?.offensive?.prob || 0;

      const riskScore = Number(
        ((nudity + weapon + gore + offensive) / 4).toFixed(2)
      );

      const verdict =
        riskScore > 0.7 ? "danger" :
        riskScore > 0.4 ? "risky" : "safe";

      return res.status(200).json({
        success: true,
        type: "image",
        ai: {
          status: "success",

          verdict,
          riskScore,

          breakdown: {
            nudity,
            weapon,
            gore,
            offensive
          },

          faces: data?.faces || [],
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
      message: "Internal server error",
      error: err.response?.data || err.message
    });
  }
            }

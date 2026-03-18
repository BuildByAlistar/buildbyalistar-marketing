require("dotenv").config();

const functions = require("firebase-functions");
const express = require("express");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "buildbyalistar123";
const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN || functions.config().whatsapp?.token;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/", async (req, res) => {
  try {
    console.log("Webhook triggered");
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || !message.from || message.type !== "text") {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body || "";

    console.log("Message from:", from);
    console.log("Text:", text);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are BuildByAlistar AI assistant for WhatsApp. Reply briefly, clearly, and helpfully. The business helps with AI automation, WhatsApp bots, websites, and custom AI tools. Try to guide the user toward booking or asking for their requirement. Keep replies under 120 words."
        },
        {
          role: "user",
          content: text
        }
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Thanks for messaging us. How can we help you today?";

    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: reply }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    return res.sendStatus(500);
  }
});

exports.whatsappWebhook = functions.https.onRequest(app);
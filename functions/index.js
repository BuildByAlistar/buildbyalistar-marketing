const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");
const cors = require("cors")({ origin: true });

const openAiApiKey = defineSecret("OPENAI_API_KEY");
const verifyToken = defineSecret("VERIFY_TOKEN");
const whatsappToken = defineSecret("WHATSAPP_TOKEN");
const phoneNumberId = defineSecret("PHONE_NUMBER_ID");

const getSecretValue = (secret, envName) => process.env[envName] || secret.value();

const handleChatRequest = async (req, res) => {
  return cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const userMessage = req.body?.message;

    if (!userMessage || typeof userMessage !== "string") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const openai = new OpenAI({
        apiKey: getSecretValue(openAiApiKey, "OPENAI_API_KEY"),
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant for Build By Alistar helping visitors learn about AI automation, chatbots, and WhatsApp automation services.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      res.json({
        reply: completion.choices?.[0]?.message?.content ?? "",
      });
    } catch (error) {
      console.error("Chat function error:", error);
      res.status(500).json({ error: "AI error" });
    }
  });
};

const handleWhatsAppVerification = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const tokenValue = getSecretValue(verifyToken, "VERIFY_TOKEN");

  if (mode === "subscribe" && token === tokenValue) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

const handleWhatsAppMessage = async (req, res) => {
  try {
    console.log("WhatsApp webhook triggered");
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message || !message.from || message.type !== "text") {
      res.sendStatus(200);
      return;
    }

    const incomingText = message.text?.body?.trim() || "";

    if (!incomingText) {
      res.sendStatus(200);
      return;
    }

    const openai = new OpenAI({
      apiKey: getSecretValue(openAiApiKey, "OPENAI_API_KEY"),
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are BuildByAlistar AI assistant for WhatsApp. Reply briefly, clearly, and helpfully. The business helps with AI automation, WhatsApp bots, websites, and custom AI tools. Try to guide the user toward booking or asking for their requirement. Keep replies under 120 words.",
        },
        {
          role: "user",
          content: incomingText,
        },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Thanks for messaging us. How can we help you today?";

    const graphResponse = await fetch(
      `https://graph.facebook.com/v18.0/${getSecretValue(phoneNumberId, "PHONE_NUMBER_ID")}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getSecretValue(whatsappToken, "WHATSAPP_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.from,
          text: { body: reply },
        }),
      },
    );

    if (!graphResponse.ok) {
      const errorBody = await graphResponse.text();
      console.error("WhatsApp send error:", errorBody);
      res.sendStatus(500);
      return;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    res.sendStatus(500);
  }
};

exports.api = onRequest(
  {
    secrets: [openAiApiKey, verifyToken, whatsappToken, phoneNumberId],
  },
  async (req, res) => {
    const normalizedPath = req.path.endsWith("/") && req.path !== "/"
      ? req.path.slice(0, -1)
      : req.path;

    if (normalizedPath === "/chat") {
      await handleChatRequest(req, res);
      return;
    }

    if (normalizedPath === "/whatsapp") {
      if (req.method === "GET") {
        handleWhatsAppVerification(req, res);
        return;
      }

      if (req.method === "POST") {
        await handleWhatsAppMessage(req, res);
        return;
      }

      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    res.status(404).json({ error: "Not found" });
  },
);

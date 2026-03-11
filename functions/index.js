const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const OpenAI = require("openai");
const cors = require("cors")({ origin: true });

const openAiApiKey = defineSecret("OPENAI_API_KEY");

exports.api = onRequest({ secrets: [openAiApiKey] }, (req, res) => {
  return cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    if (req.path !== "/chat") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const userMessage = req.body?.message;

    if (!userMessage || typeof userMessage !== "string") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    try {
      const openai = new OpenAI({ apiKey: openAiApiKey.value() });

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
});

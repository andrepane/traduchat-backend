const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Pega aquí tus claves VAPID generadas con "npx web-push generate-vapid-keys"
const VAPID_PUBLIC_KEY = "BJCEflnRPGc5M3lmxTHOY-5ApfvZkMkbH2TbIHxLDDjcYrW2e6GYl0gnFHTHfgp7jTfhoKMXwbA6vbB1ERMwGpI";
const VAPID_PRIVATE_KEY = "t86nOTTzFlHbQ2WaFRdPZLu1W7tC6lV9epXUOzhjgFI";

webpush.setVapidDetails(
  "mailto:tuemail@dominio.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// En memoria: en producción usa una base de datos
const subscriptions = {}; // { roomCode: [subscription, ...] }

app.post("/subscribe", (req, res) => {
  const { subscription, roomCode } = req.body;
  if (!subscriptions[roomCode]) subscriptions[roomCode] = [];
  // Evita duplicados
  if (!subscriptions[roomCode].some(sub => sub.endpoint === subscription.endpoint)) {
    subscriptions[roomCode].push(subscription);
  }
  res.status(201).json({ ok: true });
});

app.post("/notify", async (req, res) => {
  const { roomCode, title, body } = req.body;
  const subs = subscriptions[roomCode] || [];
  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png"
  });

  let success = 0;
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, payload);
      success++;
    } catch (err) {
      // Si falla, elimina la suscripción inválida
      subscriptions[roomCode] = subscriptions[roomCode].filter(s => s.endpoint !== sub.endpoint);
    }
  }
  res.json({ sent: success, total: subs.length });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Push server running on port", PORT));
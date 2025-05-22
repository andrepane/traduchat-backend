const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Inicializa Firebase Admin con tu cuenta de servicio
const serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://traduchat-47658-default-rtdb.europe-west1.firebasedatabase.app"
});

// Enviar notificación a todos los tokens FCM de una sala
app.post("/notify", async (req, res) => {
  const { roomCode, title, body } = req.body;
  try {
    // 1. Lee los usuarios de la sala
const usersSnapshot = await admin.database().ref(`rooms/${roomCode}/users`).once("value");
const usersData = usersSnapshot.val() || {};
const users = Object.keys(usersData);

// 2. Lee los tokens FCM de esos usuarios
const tokensSnapshot = await admin.database().ref("fcmTokens").once("value");
const tokensData = tokensSnapshot.val() || {};
const tokens = users
  .map(user => tokensData[user]?.token)
  .filter(token => !!token);

    // 3. Lee los tokens FCM de esos usuarios
    const tokensSnapshot = await admin.database().ref("fcmTokens").once("value");
    const tokensData = tokensSnapshot.val() || {};
    const tokens = users
      .map(user => tokensData[user]?.token)
      .filter(token => !!token);

    if (tokens.length === 0) return res.json({ sent: 0, total: 0 });

    // 4. Envía la notificación a todos los tokens
    const message = {
      notification: { title, body },
      tokens: tokens
    };
    const response = await admin.messaging().sendMulticast(message);
    res.json({ sent: response.successCount, total: tokens.length });
  } catch (err) {
    console.error("Error enviando notificaciones:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Push server running on port ${PORT}`);
});

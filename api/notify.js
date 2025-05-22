// /api/notify.js
import admin from 'firebase-admin';
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


// Inicializar Firebase solo una vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://traduchat-47658-default-rtdb.europe-west1.firebasedatabase.app',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Método no permitido");

  const { roomCode, title, body } = req.body;

  try {
    const usersSnapshot = await admin.database().ref(`roomUsers/${roomCode}`).once('value');
    const usersData = usersSnapshot.val() || {};
    const users = Object.keys(usersData);

    const tokensSnapshot = await admin.database().ref('fcmTokens').once('value');
    const tokensData = tokensSnapshot.val() || {};
    const tokens = users
      .map(user => tokensData[user]?.token)
      .filter(token => !!token);

    if (tokens.length === 0) {
      return res.json({ sent: 0, total: 0, message: 'No hay tokens válidos' });
    }

    const response = await admin.messaging().sendMulticast({
      notification: { title, body },
      tokens,
    });

    res.json({
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    });
  } catch (err) {
    console.error("❌ Error enviando notificación:", err);
    res.status(500).json({ error: err.message });
  }
}


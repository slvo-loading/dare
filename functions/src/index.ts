import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

exports.checkDailySubmissions = functions.pubsub
  .schedule("0 0 * * *") // Midnight UTC = 8PM EST or 9PM EDT
  .timeZone("America/New_York") // Adjust to your timezone
  .onRun(async () => {
    const db = admin.firestore();
    const battlesSnapshot = await db.collection("games").get();

    for (const doc of battlesSnapshot.docs) {
      const battle = doc.data();
      const battleId = doc.id;

      if (battle.status !== "active") continue;

      const today = new Date().toISOString().slice(0, 10); // "2025-08-05"

      const player1Dare = battle?.player1_dare;
      const player1Last = player1Dare?.[player1Dare.length - 1]?.date;
      const player2Dare = battle?.player2_dare;
      const player1Last = player2Dare?.[player2Dare.length - 1]?.date;
      const player1Missed = !player1Last || player1Last < today;
      const player2Missed = !player2Last || player2Last < today;

      // Only one player can miss
      if (player1Missed && !player2Missed) {
        await db.collection("battles").doc(battleId).update({
          status: "completed",
          winner: battle.player2,
          ended_at: admin.firestore.Timestamp.now(),
        });
      } else if (player2Missed && !player1Missed) {
        await db.collection("battles").doc(battleId).update({
          status: "completed",
          winner: battle.player1,
          ended_at: admin.firestore.Timestamp.now(),
        });
      }
    }

    return null;
  });

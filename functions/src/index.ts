import * as admin from "firebase-admin";
import {logger} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";

admin.initializeApp();

export const checkDailySubmissions = onSchedule(
  {
    schedule: "0 0 * * *",
    timeZone: "America/New_York",
    region: "us-central1",
  },
  async (event) => {
    logger.log("Running nightly submission check", event);
    const db = admin.firestore();
    const battlesSnapshot = await db.collection("games").get();

    logger.info(`Checking ${battlesSnapshot.size}
      games for missed submissions...`);

    for (const doc of battlesSnapshot.docs) {
      const battle = doc.data();
      const battleId = doc.id;

      if (battle.status !== "active") continue;

      const now = new Date();
      const gameStart = new Date(battle.start_date);
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const fullDayPassed = now.getTime() - gameStart.getTime() > oneDayInMs;

      if (!fullDayPassed) continue;

      const yesterday = new Date(Date.now() - oneDayInMs)
        .toISOString().slice(0, 10);

      const player1Last = battle.player1_last_submissions ?
        battle.player1_last_submissions.toDate().toISOString().slice(0, 10) :
        null;

      const player2Last = battle.player2_last_submissions ?
        battle.player2_last_submissions.toDate().toISOString().slice(0, 10) :
        null;

      const player1Missed = !player1Last || player1Last < yesterday;
      const player2Missed = !player2Last || player2Last < yesterday;

      logger.info(`Game ID: ${battleId}`);
      logger.info(`  - Player 1 Last: ${player1Last}, 
        Missed: ${player1Missed}`);
      logger.info(`  - Player 2 Last: ${player2Last}, 
        Missed: ${player2Missed}`);

      let winner: string | null = null;

      if (player1Missed && !player2Missed) {
        winner = battle.player2;
      } else if (player2Missed && !player1Missed) {
        winner = battle.player1;
      } else if (player1Missed && player2Missed) {
        winner = "none";
      } else {
        continue;
      }

      if (winner !== null) {
        await db.collection("games").doc(battleId).update({
          status: "completed",
          winner: winner,
          ended_at: admin.firestore.Timestamp.now(),
        });
      }
    }

    return;
  }
);

// exports.checkDailySubmissions = functions.pubsub
//   .schedule("0 0 * * *")
//   .timeZone("America/New_York")
//   .onRun(async () => {
//     const db = admin.firestore();
//     const battlesSnapshot = await db.collection("games").get();

//     logger.info(`Checking ${battlesSnapshot.size}
//       games for missed submissions...`);

//     for (const doc of battlesSnapshot.docs) {
//       const battle = doc.data();
//       const battleId = doc.id;

//       if (battle.status !== "active") continue;

//       const now = new Date();
//       const gameStart = new Date(battle.start_date);
//       const oneDayInMs = 24 * 60 * 60 * 1000;
//       const fullDayPassed = now.getTime() - gameStart.getTime() > oneDayInMs;

//       if (!fullDayPassed) continue;

//       const yesterday = new Date(Date.now() - oneDayInMs)
//         .toISOString().slice(0, 10);

//       const player1Last = battle.player1_last_submissions ?
//         battle.player1_last_submissions.toDate().toISOString().slice(0, 10) :
//         null;

//       const player2Last = battle.player2_last_submissions ?
//         battle.player2_last_submissions.toDate().toISOString().slice(0, 10) :
//         null;

//       const player1Missed = !player1Last || player1Last < yesterday;
//       const player2Missed = !player2Last || player2Last < yesterday;

//       logger.info(`Game ID: ${battleId}`);
//       logger.info(`  - Player 1 Last: ${player1Last},
//         Missed: ${player1Missed}`);
//       logger.info(`  - Player 2 Last: ${player2Last},
//         Missed: ${player2Missed}`);


//       let winner: string | null = null;

//       if (player1Missed && !player2Missed) {
//         winner = battle.player2;
//       } else if (player2Missed && !player1Missed) {
//         winner = battle.player1;
//       } else if (player1Missed && player2Missed) {
//         winner = "none";
//       } else {
//         continue;
//       }

//       if (winner !== null) {
//         await db.collection("games").doc(battleId).update({
//           status: "completed",
//           winner: winner,
//           ended_at: admin.firestore.Timestamp.now(),
//         });
//       }
//     }

//     return null;
//   });

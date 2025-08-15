import * as admin from "firebase-admin";
import {logger} from "firebase-functions";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {Timestamp} from "firebase-admin/firestore";


admin.initializeApp();

export const checkDailySubmissions = onSchedule(
  {
    // schedule: "0 0 * * *", reactivate before launch!!
    schedule: "0 0 28 2 *",
    timeZone: "America/New_York",
    region: "us-central1",
  },
  async (event) => {
    logger.log("1 - starting function", event);
    const db = admin.firestore();
    const battlesSnapshot = await db.collection("games").get();
    logger.info("2 - battlesSnapshot:", battlesSnapshot.docs.length);

    for (const doc of battlesSnapshot.docs) {
      const battle = doc.data();
      const battleId = doc.id;
      logger.info("4: starting check:", battleId);

      if (battle.status !== "active") {
        logger.info("5 - battle not active, skipping:", battleId);
        continue;
      } else {
        logger.info("5 - battle active, checking:", battleId);
      }

      const now = new Date();
      logger.info("Current time:", now.toISOString());
      const gameStart = battle.start_date.toDate();
      logger.info("Game start time:", gameStart.toISOString());
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const fullDayPassed = now.getTime() - gameStart.getTime() > oneDayInMs;

      if (!fullDayPassed) {
        logger.info("6 - not a full day passed, skipping battle:", battleId);
        continue;
      } else {
        logger.info("6 - full day passed, checking submissions:", battleId);
      }

      const yesterday = new Date(Date.now() - oneDayInMs)
        .toISOString().slice(0, 10);

      const player1Last = battle.player1_last_submission ?
        battle.player1_last_submission.toDate().toISOString().slice(0, 10) :
        null;
      const player2Last = battle.player2_last_submission ?
        battle.player2_last_submission.toDate().toISOString().slice(0, 10) :
        null;

      const player1Missed = !player1Last || player1Last < yesterday;
      const player2Missed = !player2Last || player2Last < yesterday;

      logger.info("7 - Player 1 missed:", player1Missed);
      logger.info("7 - Player 2 missed:", player2Missed);

      let winner: string | null = null;

      if (player1Missed && !player2Missed) {
        logger.info("8 - Player 1 missed submission, Player 2 wins");
        winner = battle.player2_id;
      } else if (player2Missed && !player1Missed) {
        logger.info("8 - Player 2 missed submission, Player 1 wins");
        winner = battle.player1_id;
      } else if (player1Missed && player2Missed) {
        logger.info("8 - Both players missed submission, no winner");
        winner = "none";
      } else {
        logger.info("8 - Both players submitted, game continues");
        continue;
      }

      if (winner !== null) {
        await db.collection("games").doc(battleId).update({
          status: "completed",
          player1_status: null,
          player2_status: null,
          winner: winner,
          ended_at: Timestamp.now(),
        });
      }
    }

    logger.info("9 - Finished checking");

    return;
  }
);

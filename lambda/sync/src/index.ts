/*
  https://developers.google.com/sheets/api/quickstart/js
  https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function

  https://console.cloud.google.com/cloudscheduler?project=nmemonica-5b353
*/
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
// import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";
// The Firebase Admin SDK to access the Firebase Realtime Database.
import * as admin from "firebase-admin";
import { sheets_sync_phrases as phrases } from "./sheets_sync_phrases";
import { sheets_sync_opposites as opposites } from "./sheets_sync_opposites";
import { sheets_sync_vocabulary as vocabulary } from "./sheets_sync_vocabulary";
import { sheets_sync_kanji as kanji } from "./sheets_sync_kanji";

admin.initializeApp();

const PROJECT_REGION = "us-east1";

export const sheets_sync_phrases = functions
  .region(PROJECT_REGION)
  .https.onRequest(phrases);

export const sheets_sync_opposites = functions
  .region(PROJECT_REGION)
  .https.onRequest(opposites);

// export const sheets_sync_vocabulary = onRequest({maxInstances:5, region:[PROJECT_REGION]},vocabulary)
export const sheets_sync_vocabulary = functions
  .region(PROJECT_REGION)
  .https.onRequest(vocabulary);

export const sheets_sync_kanji = functions
  .region(PROJECT_REGION)
  .https.onRequest(kanji);

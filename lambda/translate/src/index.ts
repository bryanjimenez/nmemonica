// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
// import { onRequest } from "firebase-functions/v2/https";
import * as functions from "firebase-functions";

// The Firebase Admin SDK to access the Firebase Realtime Database.
import * as admin from "firebase-admin";
admin.initializeApp();

import { g_translate_romaji as romaji} from "./g_translate_romaji";
import { g_translate_pronounce  as pronounce} from "./g_translate_pronounce";
const PROJECT_REGION = "us-east1";


export const g_translate_romaji = functions
  .region(PROJECT_REGION)
  .https.onRequest(romaji);

export const g_translate_pronounce = functions
  .region(PROJECT_REGION)
  .https.onRequest(pronounce);

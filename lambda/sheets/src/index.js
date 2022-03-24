/*

  https://developers.google.com/sheets/api/quickstart/js
  https://stackoverflow.com/questions/44448029/how-to-use-google-sheets-api-while-inside-a-google-cloud-function

  https://console.cloud.google.com/cloudscheduler?project=nmemonica-5b353
*/

"use strict";
import "regenerator-runtime/runtime";
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
import { default as functions } from "firebase-functions";

// The Firebase Admin SDK to access the Firebase Realtime Database.
import { default as admin } from "firebase-admin";
admin.initializeApp();

import { sheets_sync_phrases } from "./sheets_sync_phrases";
import { sheets_sync_particles } from "./sheets_sync_particles";
import { sheets_sync_opposites } from "./sheets_sync_opposites";
import { sheets_sync_vocabulary } from "./sheets_sync_vocabulary";
import { g_translate_romaji } from "./g_translate_romaji";
import { g_translate_pronounce } from "./g_translate_pronounce";
import { sheets_sync_kanji } from "./sheets_sync_kanji";
const PROJECT_REGION = "us-east1";

exports.sheets_sync_phrases = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_phrases);

exports.sheets_sync_particles = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_particles);

exports.sheets_sync_opposites = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_opposites);

exports.sheets_sync_vocabulary = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_vocabulary);

exports.g_translate_romaji = functions
  .region(PROJECT_REGION)
  .https.onRequest(g_translate_romaji);

exports.g_translate_pronounce = functions
  .region(PROJECT_REGION)
  .https.onRequest(g_translate_pronounce);

exports.sheets_sync_kanji = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_kanji);

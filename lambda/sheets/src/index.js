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

import { sheets_sync_verbs } from "./sheets_sync_verbs";
import { sheets_sync_phrases } from "./sheets_sync_phrases";
import { sheets_sync_particles } from "./sheets_sync_particles";
const PROJECT_REGION = "us-east1";

exports.sheets_sync_verbs = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_verbs);

exports.sheets_sync_phrases = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_phrases);

exports.sheets_sync_particles = functions
  .region(PROJECT_REGION)
  .https.onRequest(sheets_sync_particles);

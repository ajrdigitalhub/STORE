const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const { app } = require("./server");
const functions = require('firebase-functions');

// Increase timeout or memory if needed for your large app
// Export as a Cloud Function
exports.api = functions.https.onRequest(app);



const functions = require("firebase-functions");
const app = require("./app");

exports.api2 = functions.https.onRequest(app);

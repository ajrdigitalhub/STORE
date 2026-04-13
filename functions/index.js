const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const { app } = require("./server");

// Increase timeout or memory if needed for your large app
setGlobalOptions({
    maxInstances: 10,
    region: "us-central1" // Ensure this matches your project region
});

exports.api = onRequest(app);

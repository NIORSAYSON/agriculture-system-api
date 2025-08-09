// firebase.js
const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json"); // put correct path

let serviceAccount;
if (process.env.SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
} else {
  serviceAccount = require("./serviceAccountKey.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

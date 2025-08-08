const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectToMongoDB = require("./database/mongoose");
const indexRoutes = require("./routes");
// const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3004;

const corsObj = {
  origin: true,
  credentials: true,
};

app.use(cors(corsObj));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     saveUninitialized: false,
//     resave: false,
//     store: MongoStore.create({
//       mongoUrl: "mongodb://localhost/pos-system-api",
//     }),
//   })
// );

app.use(bodyParser.json());

connectToMongoDB();
indexRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

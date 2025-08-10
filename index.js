const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectToMongoDB = require("./database/mongoose");
const indexRoutes = require("./routes");
// const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const moment = require("moment");
const momentTimezone = require("moment-timezone");

const DB = require("./models");

const app = express();
const PORT = process.env.PORT || 3004;

const corsObj = {
  origin: true,
  credentials: true,
};

app.use(cors(corsObj));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
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

// connectToMongoDB();
// indexRoutes(app);

DB.mongoose
  .connect(DB.url, {
    useNewUrlParser: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    console.log(process.env.MONGO_URL);

    indexRoutes(app);

    const currentDate = moment();
    const timezone = momentTimezone.tz.guess();
    app.listen(PORT, () => {
      console.log(`\nNODE_ENV: ${process.env.NODE_ENV}`);
      console.log(`TZ: ${process.env.TZ} \n`);
      console.log(`Agriculture System listening on port ${PORT}`);
      console.log(`Current Date: ${currentDate.format("YYYY-MM-DD HH:mm:ss")} ${timezone} \n`);
    });
  })

  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

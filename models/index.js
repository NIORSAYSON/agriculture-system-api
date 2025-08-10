require("dotenv").config();

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const DB = {};
DB.mongoose = mongoose;
DB.url = process.env.MONGO_URL;

DB.user = require("./User")(mongoose);
DB.blacklist = require("./Blacklist")(mongoose);

module.exports = DB;

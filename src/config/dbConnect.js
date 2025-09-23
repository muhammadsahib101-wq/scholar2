const mongoose = require("mongoose");

require("dotenv").config();

const DB = process.env.DATABASE_ATLAS.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

function connectToDb() {
  mongoose
    .connect(DB)
    .then(() => console.log("Database is connected"))
    .catch((error) => {
      console.error(
        "Some error occured in connecting the database",
        error.message
      );
      process.exit(1);
    });
}

module.exports = connectToDb;

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User Name is Required..."],
      minLength: [3, "User name must be 3 letter or more than 3 letter"],
    },
    email: {
      type: String,
      required: [true, "email is required..."],
      unique: true,
      match: [/\S+@\S+\.\S+/, "email format is invalid"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [6, "password must be 6 digits or more than 6 digits"],
    },
    role: { type: String, enum: ["admin", ""], default: "" },
    phone: {
      type: String,
      match: [/^\d{10}$/, "phone code must be 10 digits"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Users", userSchema);

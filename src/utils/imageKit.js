const Imagekit = require("imagekit");

require("dotenv").config();

const imagekit = new Imagekit({
  publicKey: process.env.PUBLIC_API_KEY,
  privateKey: process.env.PRIVATE_API_KEY,
  urlEndpoint: process.env.URL_END_POINT,
});

module.exports = imagekit;

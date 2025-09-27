// server.js
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectToDb = require("./src/config/dbConnect");

// Routes
const userRoutes = require("./src/routes/userRoute");
const categoryRoutes = require("./src/routes/categoryRoute");
const schemeRoutes = require("./src/routes/schemeRoute");
const stateRoutes = require("./src/routes/stateRoute");
const discussionRoutes = require("./src/routes/discussionRoute");
const replyRoutes = require("./src/routes/replyRoute");

dotenv.config();

const app = express();

// -------------------- Middlewares -------------------- //

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress JSON responses only (skip images/files)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) return false; // skip if header set
      return compression.filter(req, res);
    },
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (protect against abuse)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per window
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// -------------------- Routes -------------------- //
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", schemeRoutes);
app.use("/api", stateRoutes);
app.use("/api", discussionRoutes);
app.use("/api", replyRoutes);

// -------------------- DB Connect -------------------- //
connectToDb();

// -------------------- Server -------------------- //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

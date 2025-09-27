const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");

dotenv.config();

const connectToDb = require("./src/config/dbConnect");

const userRoutes = require("./src/routes/userRoute");
const replyRoutes = require("./src/routes/replyRoute");
const stateRoutes = require("./src/routes/stateRoute");
const schemeRoutes = require("./src/routes/schemeRoute");
const categoryRoutes = require("./src/routes/categoryRoute");
const discussionRoutes = require("./src/routes/discussionRoute");

// express middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors middleware
app.use(cors());

// routes middlewares for users
app.use("/api", userRoutes);

// routes middlewares for categories
app.use("/api", categoryRoutes);

// routes middlewares for schemes
app.use("/api", schemeRoutes);

// routes middlewares for states
app.use("/api", stateRoutes);

// routes middlewares for discussion
app.use("/api", discussionRoutes);

// routes middlewares for reply
app.use("/api", replyRoutes);

connectToDb();

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

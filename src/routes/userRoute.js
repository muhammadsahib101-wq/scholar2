const express = require("express");
const router = express.Router();

const {
  createNewUser,
  loginUser,
  protectedUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");

// rote for creating new user
router.post("/admin/registerUser", createNewUser);

// route for login existed user
router.post("/admin/loginUser", loginUser);

// route for protected user
router.get("/admin/protectedUser", authMiddleware, protectedUser);

// route for getting all user
router.get("/admin/allUsers", getUsers);

// route for updating the user by id
router.get("/admin/fetchUser/:_id", authMiddleware, getUser);

// route for fetching the user by id
router.put("/admin/updateUser/:_id", authMiddleware, updateUser);

// route for deleting the user
router.delete("/admin/deleteUser/:_id", deleteUser);

module.exports = router;

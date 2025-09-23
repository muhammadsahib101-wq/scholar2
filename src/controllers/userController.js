const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const Users = require("../models/userSchema");

function createNewUser(request, response) {
  const { name, email, password, role, phone } = request.body;
  if (!name || !email || !password) {
    return response.status(400).json({
      success: false,
      message: "Name, email, and password are required",
    });
  }
  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return Promise.reject({
          status: 400,
          message: "User already exists with this email",
        });
      }
      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      const newUser = new Users({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
      });

      return newUser.save();
    })
    .then((savedUser) => {
      return response.status(201).send({
        success: true,
        message: "New User created successfully",
        createdUser: savedUser,
      });
    })
    .catch((error) => {
      const statusCode = error.status || 500;
      return response.status(statusCode).send({
        success: false,
        message: error.message || "New User is not created successfully",
      });
    });
}

function loginUser(request, response) {
  const { email, password } = request.body;
  let foundUser;
  Users.findOne({ email })
    .then((existingUser) => {
      if (!existingUser) {
        return Promise.reject({
          status: 401,
          message: "User with given email does not exist",
        });
      }
      foundUser = existingUser;
      return bcrypt.compare(password, foundUser.password);
    })
    .then((isMatch) => {
      if (!isMatch) {
        return Promise.reject({
          status: 401,
          message: "Invalid password",
        });
      }
      token = jwt.sign(
        { id: foundUser._id, role: foundUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      console.log(token);
      return response.status(200).send({
        success: true,
        token,
        message: "User logged in successfully",
        user: foundUser,
      });
    })
    .catch((error) => {
      const statusCode = error.status || 500;
      response.status(statusCode).send({
        success: false,
        message: error.message || "User not logged in successfully",
      });
    });
}

function protectedUser(request, response) {
  const userId = request.user.id;
  Users.findById(userId)
    .select("-password")
    .then((existingUser) => {
      if (!existingUser) {
        return response.status(400).json({
          success: false,
          message: "User with given id is not exists",
        });
      }
      return response.status(200).send({
        success: true,
        message: "User Authenticated successfully",
        data: existingUser,
      });
    })
    .catch((error) => {
      console.error(error);
      return response
        .status(500)
        .send({ success: false, message: "Authentication failed", error });
    });
}

function getUsers(request, response) {
  Users.find({})
    .then((allUsers) => {
      return response.status(200).send({
        success: true,
        length: allUsers.length,
        message: "All users fetched successfully",
        data: allUsers,
      });
    })
    .catch((error) => {
      console.error(error);
      return response.status(400).send({
        success: false,
        message: "Some error occured while fetching data",
        error,
      });
    });
}

function getUser(request, response) {
  const { _id } = request.params;
  Users.findById(_id)
    .then((fetchUser) => {
      if (!fetchUser) {
        return response.status(400).json({
          success: false,
          message: "User with given id is not exists",
        });
      }
      return response.status(200).send({
        success: true,
        message: "User fetched successfully",
        data: fetchUser,
      });
    })
    .catch((error) => {
      console.error(error);
      return response.status(500).send({
        success: false,
        message: "Error while fetching the user",
        error,
      });
    });
}

function updateUser(request, response) {
  const { _id } = request.params;
  const updatedData = request.body;
  Users.findByIdAndUpdate(_id, updatedData, { new: true, runValidators: true })
    .select("-password")
    .then((updatedUser) => {
      if (!updatedUser) {
        return response
          .status(400)
          .send({ success: false, message: "There is no user to update" });
      }
      return response.status(200).send({
        success: true,
        message: "User updated sucessfully...",
        data: updatedUser,
      });
    })
    .catch((error) => {
      console.error(error);
      return response
        .status(500)
        .send({ success: false, message: "Error while updating user", error });
    });
}

function deleteUser(request, response) {
  const { _id } = request.params;
  Users.findById(_id)
    .then((user) => {
      if (!user) {
        return Promise.reject({
          status: 400,
          message: "There is no user to delete",
        });
      }
      return Users.findByIdAndDelete(_id);
    })
    .then((deletedUser) => {
      return response.status(200).send({
        success: true,
        message: "User deleted successfully",
        data: deletedUser,
      });
    })
    .catch((error) => {
      const statusCode = error.status || 500;
      return response.status(statusCode).send({
        success: false,
        message: error.message || "Error while deleting the user",
        error,
      });
    });
}

module.exports = {
  createNewUser,
  loginUser,
  protectedUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};

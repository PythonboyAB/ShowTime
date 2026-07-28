import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret_here";
const TOKEN_EXPIRES_IN = "24h";

const emailIsValid = (e) => /\S+@\S+\.\S+/.test(String(e || ""));
const extractCleanPhone = (p) => String(p || "").replace(/\D/g, "");
const mkToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { fullname, username, email, phone, birthDate, password } =
      req.body || {};

    if (!fullname || !username || !email || !phone || !birthDate || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (fullname.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters",
      });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters",
      });
    }

    if (!emailIsValid(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    const cleanedPhone = extractCleanPhone(phone);
    if (cleanedPhone.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const parsedBirth = new Date(birthDate);
    if (Number.isNaN(parsedBirth.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid birth date",
      });
    }

    const existingByEmail = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingByUsername = await User.findOne({
      username: username.trim().toLowerCase(),
    });

    if (existingByUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullname: fullname.trim(),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      phone,
      birthDate: parsedBirth,
      password: hashedPassword,
    });

    const token = mkToken({ id: newUser._id });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyValue || {})[0];
      return res.status(400).json({
        success: false,
        message: `${dupKey} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    const token = mkToken({ id: user._id });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

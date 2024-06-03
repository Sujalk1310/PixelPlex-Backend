const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Checks whether the user exists in the database or not
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Username does not exist." });

        // Password validation check
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ message: "Invalid username or password." });

        const iat = Math.floor(Date.now() / 1000);

        // Generate jwt token
        const token = jwt.sign({ userId: user.uid, iat: iat }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ token, message: "Logged In Successfully!", uid: user.uid, id: user._id });

    } catch (error) {
        res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already exists." });

        // Generate a fresh salt
        const salt = await bcrypt.genSalt(10);

        // Generate the Hash Password
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = new User({
            uid: uuidv4(),
            username,
            password: hashedPassword,
        });

        // Saving to database
        await user.save();

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
});

module.exports = router;
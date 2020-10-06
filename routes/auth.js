const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerValidation, loginValidation } = require('../validation');

router.post('/register', async (req,res) => {
    // Validate User Data
    const { error } = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Checking if the user is already in the database
    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist) return res.status(400).send('Email already exist');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    try {
        const savedUser = await user.save();
        res.send({user: user._id});
    } catch (err) {
        res.status(400).send(err);
    }
});

// Generate token
const generateToken = (user) => jwt.sign({ _id: user }, process.env.TOKEN_SECRET, { expiresIn: '30s' });

// Generate token from refresh token
router.post('/token', (req, res) => {
    const refreshToken = req.header('refresh-token');
    if(!refreshToken) return res.status(401).send('Access Denied');
    try {
        const verified = jwt.verify(refreshToken, process.env.TOKEN_SECRET);
        const token = generateToken(verified._id);
        res.json({token});
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login
router.post('/login', async (req, res) => {
    // Validate User Data
    const { error } = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Checking if the email exists
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email is not found');

    //  Checking if the password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // Assign token and create and assign refresh token
    const token = generateToken(user._id);
    const refreshToken = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET, { expiresIn: '1d' });
    res.header('auth-token', token).json({token: token, refreshToken: refreshToken});
});

module.exports = router;
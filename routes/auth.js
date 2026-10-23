const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const isProduction = process.env.NODE_ENV === 'production';

// POST /api/auth/login -> authenticate user with email and password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    if (!password) return res.status(400).json({ success: false, message: 'Password required' });

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify password matches the stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const payload = { id: user._id, email: user.email, isAdmin: false };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie for convenience
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: isProduction
    });

    res.json({ success: true, message: 'Logged in', token, user: payload, redirectUrl: '/homepage.html' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

router.post('/logout', (req, res) => {
  req.session?.destroy(() => {
    res.json({
      success: true,
      redirectUrl: '/combo.html'
    });
  });
});


// API ROUTES - AUTHENTICATION
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup attempt:', { email: req.body.email, fullName: req.body.fullName });
    
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      console.log('Signup failed: Missing fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (password.length < 6) {
      console.log('Signup failed: Password too short');
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (existingUser) {
      console.log('Signup failed: Email already exists:', email);
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword
    });

    await newUser.save();
    
    console.log('✅ User created:', email);

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, fullName: newUser.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: isProduction
    });

    res.json({ 
      success: true, 
      message: 'Account created successfully',
      redirectUrl: '/'
    });

  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again.' 
    });
  }
});


// GET /api/auth/ping -> simple authenticated check
router.get('/ping', (req, res) => res.json({ success: true, message: 'Auth service alive' }));

module.exports = router;

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_TTL = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      // Generic message would be safer against enumeration, but the spec asks
      // for clear feedback in this app; a 409 is returned explicitly.
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    return res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // passwordHash is `select: false`, so opt it back in for the comparison.
    const user = await User.findOne({ email }).select('+passwordHash');
    const valid = user && (await user.comparePassword(password));
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({ token: signToken(user), user });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, me };

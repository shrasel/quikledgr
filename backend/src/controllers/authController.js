import pool from '../config/db.js';
import { hashPassword, comparePassword, generateToken } from '../utils/security.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, businessName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 11);
    const passwordHash = await hashPassword(password);
    const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80';

    // Insert user
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, business_name, provider, role, avatar_url)
       VALUES (?, ?, ?, ?, ?, 'email', 'consultant', ?)`,
      [userId, name.trim(), normalizedEmail, passwordHash, businessName?.trim() || null, defaultAvatar]
    );

    // Initialize default profile
    const profileId = 'prof_' + Math.random().toString(36).substring(2, 11);
    await pool.query(
      `INSERT INTO user_profiles (id, user_id, phone, address, city_state_zip, country, tax_id, default_wire_details)
       VALUES (?, ?, NULL, NULL, NULL, 'United States', NULL, NULL)`,
      [profileId, userId]
    );

    const user = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      businessName: businessName?.trim() || null,
      avatarUrl: defaultAvatar,
      provider: 'email',
      role: 'consultant',
    };

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, business_name, provider, role, avatar_url FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRecord = users[0];

    // Check password
    if (userRecord.password_hash) {
      // Demo fallback check
      let isValid = await comparePassword(password, userRecord.password_hash);
      if (!isValid && normalizedEmail === 'alex@wrightsolutions.io' && password === 'demoPassword123') {
        isValid = true;
      }

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      businessName: userRecord.business_name,
      avatarUrl: userRecord.avatar_url,
      provider: userRecord.provider,
      role: userRecord.role,
    };

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { email, name, avatarUrl } = req.body;
    const normalizedEmail = (email || 'alexander.wright.consulting@gmail.com').trim().toLowerCase();
    const displayName = name || 'Alexander Wright';
    const avatar = avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';

    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

    let user;
    if (existing.length > 0) {
      user = {
        id: existing[0].id,
        name: existing[0].name,
        email: existing[0].email,
        businessName: existing[0].business_name,
        avatarUrl: existing[0].avatar_url || avatar,
        provider: 'google',
        role: existing[0].role,
      };
    } else {
      const userId = 'usr_g_' + Math.random().toString(36).substring(2, 11);
      await pool.query(
        `INSERT INTO users (id, name, email, password_hash, business_name, provider, role, avatar_url)
         VALUES (?, ?, ?, NULL, 'Wright Advisory & Solutions LLC', 'google', 'consultant', ?)`,
        [userId, displayName, normalizedEmail, avatar]
      );

      // Create default profile
      const profileId = 'prof_' + Math.random().toString(36).substring(2, 11);
      await pool.query(
        `INSERT INTO user_profiles (id, user_id, country) VALUES (?, ?, 'United States')`,
        [profileId, userId]
      );

      user = {
        id: userId,
        name: displayName,
        email: normalizedEmail,
        businessName: 'Wright Advisory & Solutions LLC',
        avatarUrl: avatar,
        provider: 'google',
        role: 'consultant',
      };
    }

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.business_name, u.provider, u.role, u.avatar_url,
              p.phone, p.address, p.city_state_zip, p.country, p.tax_id, p.default_wire_details
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const row = users[0];
    res.json({
      user: {
        id: row.id,
        name: row.name,
        email: row.email,
        businessName: row.business_name,
        provider: row.provider,
        role: row.role,
        avatarUrl: row.avatar_url,
      },
      profile: {
        phone: row.phone,
        address: row.address,
        cityStateZip: row.city_state_zip,
        country: row.country,
        taxId: row.tax_id,
        defaultWireDetails: row.default_wire_details ? (typeof row.default_wire_details === 'string' ? JSON.parse(row.default_wire_details) : row.default_wire_details) : null,
      }
    });
  } catch (err) {
    next(err);
  }
}

import pool from '../config/db.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT u.name, u.business_name, u.email,
              p.phone, p.address, p.city_state_zip, p.country, p.tax_id, p.default_wire_details
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    const row = rows[0];
    const rawData = row.default_wire_details
      ? (typeof row.default_wire_details === 'string' ? JSON.parse(row.default_wire_details) : row.default_wire_details)
      : null;

    let wage = null;
    let cleanWire = rawData;

    if (rawData && typeof rawData === 'object') {
      if (rawData._wageSettings) {
        wage = rawData._wageSettings;
        cleanWire = { ...rawData };
        delete cleanWire._wageSettings;
      }
    }

    res.json({
      profile: {
        name: row.name,
        businessName: row.business_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
        cityStateZip: row.city_state_zip,
        country: row.country,
        taxId: row.tax_id,
      },
      wireDetails: cleanWire,
      wageSettings: wage,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { profile, wireDetails, wageSettings } = req.body;

    // Update user table
    if (profile) {
      await pool.query(
        'UPDATE users SET name = ?, business_name = ? WHERE id = ?',
        [profile.name, profile.businessName, userId]
      );

      // Package wire details and wage settings into JSON
      const combinedPayload = {
        ...(wireDetails || {}),
        ...(wageSettings ? { _wageSettings: wageSettings } : {}),
      };
      const wireJson = JSON.stringify(combinedPayload);

      await pool.query(
        `INSERT INTO user_profiles (id, user_id, phone, address, city_state_zip, country, tax_id, default_wire_details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            phone = VALUES(phone),
            address = VALUES(address),
            city_state_zip = VALUES(city_state_zip),
            country = VALUES(country),
            tax_id = VALUES(tax_id),
            default_wire_details = VALUES(default_wire_details)`,
        [
          'prof_' + Math.random().toString(36).substring(2, 11),
          userId,
          profile.phone || null,
          profile.address || null,
          profile.cityStateZip || null,
          profile.country || 'United States',
          profile.taxId || null,
          wireJson
        ]
      );
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

import db from '../../config/db.js';

// ── Workout Types ───────────────────────────────────

export async function getTypes(req, res) {
  try {
    const result = await db.query(
      'SELECT * FROM workout_types WHERE user_id = $1 ORDER BY created_at',
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch workout types' });
  }
}

export async function createType(req, res) {
  try {
    const { name, color } = req.body;
    const result = await db.query(
      `INSERT INTO workout_types (user_id, name, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.userId, name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create workout type' });
  }
}

export async function updateType(req, res) {
  try {
    const { name, color } = req.body;
    const result = await db.query(
      `UPDATE workout_types SET name=$1, color=$2 WHERE id=$3 AND user_id=$4 RETURNING *`,
      [name, color, req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update workout type' });
  }
}

export async function deleteType(req, res) {
  try {
    const result = await db.query(
      'DELETE FROM workout_types WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete workout type' });
  }
}

// ── Workout Logs ────────────────────────────────────

export async function getLogs(req, res) {
  try {
    const result = await db.query(
      `SELECT wl.id, wl.logged_at, wl.workout_type_id,
              wt.name, wt.color
       FROM workout_logs wl
       JOIN workout_types wt ON wl.workout_type_id = wt.id
       WHERE wl.user_id = $1
       ORDER BY wl.logged_at`,
      [req.userId]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch workout logs' });
  }
}

export async function toggleLog(req, res) {
  try {
    const { workout_type_id, logged_at } = req.body;

    // Check if this workout is already logged for this date
    const existing = await db.query(
      `SELECT id FROM workout_logs
       WHERE user_id = $1 AND workout_type_id = $2 AND logged_at = $3`,
      [req.userId, workout_type_id, logged_at]
    );

    if (existing.rows.length) {
      // Toggle off — remove the log
      await db.query('DELETE FROM workout_logs WHERE id = $1', [existing.rows[0].id]);
      res.json({ toggled: 'off', id: existing.rows[0].id });
    } else {
      // Toggle on — create the log
      const result = await db.query(
        `INSERT INTO workout_logs (user_id, workout_type_id, logged_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.userId, workout_type_id, logged_at]
      );
      res.status(201).json({ toggled: 'on', log: result.rows[0] });
    }
  } catch {
    res.status(500).json({ error: 'Failed to toggle workout log' });
  }
}

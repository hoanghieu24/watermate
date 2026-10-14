import { Router, Request, Response } from 'express';
import { dbQuery, dbGet, dbRun } from '../db/database.js';

export const waterLogsRouter = Router();

// GET /api/water-logs
waterLogsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { local_date } = req.query;
    let rows;

    if (req.userId) {
      if (local_date && typeof local_date === 'string') {
        rows = await dbQuery(`
          SELECT * FROM water_logs
          WHERE local_date = ? AND user_id = ?
          ORDER BY created_at DESC
        `, [local_date, req.userId]);
      } else {
        rows = await dbQuery(`
          SELECT * FROM water_logs
          WHERE user_id = ?
          ORDER BY created_at DESC
        `, [req.userId]);
      }
    } else {
      // Local / default mode
      if (local_date && typeof local_date === 'string') {
        rows = await dbQuery(`
          SELECT * FROM water_logs
          WHERE local_date = ? AND (user_id IS NULL OR user_id = '')
          ORDER BY created_at DESC
        `, [local_date]);
      } else {
        rows = await dbQuery(`
          SELECT * FROM water_logs
          WHERE (user_id IS NULL OR user_id = '')
          ORDER BY created_at DESC
        `);
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching water logs:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy lịch sử' });
  }
});

// POST /api/water-logs
waterLogsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { id, amount_ml, sip_equivalent, source, created_at, local_date } = req.body;

    const parsedAmount = Number(amount_ml);
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Lượng nước phải là số dương lớn hơn 0' });
    }

    const logId = id || `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = created_at || new Date().toISOString();
    const dateStr = local_date || nowIso.substring(0, 10);
    const parsedSips = Number(sip_equivalent) || Number((parsedAmount / 50).toFixed(1));
    const validSource = source || 'custom';
    const userId = req.userId || null;

    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [logId, Math.round(parsedAmount), parsedSips, validSource, nowIso, dateStr, userId]);

    const created = await dbGet('SELECT * FROM water_logs WHERE id = ?', [logId]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating water log:', err);
    res.status(500).json({ error: 'Không thể lưu bản ghi lượng nước' });
  }
});

// PUT /api/water-logs/:id
waterLogsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount_ml, sip_ml } = req.body;

    const parsedAmount = Number(amount_ml);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Lượng nước phải là số dương lớn hơn 0' });
    }

    const sipUnit = Number(sip_ml) || 50;
    const newSips = Number((parsedAmount / sipUnit).toFixed(1));

    let result;
    if (req.userId) {
      result = await dbRun(`
        UPDATE water_logs
        SET amount_ml = ?, sip_equivalent = ?
        WHERE id = ? AND (user_id = ? OR user_id IS NULL)
      `, [Math.round(parsedAmount), newSips, id, req.userId]);
    } else {
      result = await dbRun(`
        UPDATE water_logs
        SET amount_ml = ?, sip_equivalent = ?
        WHERE id = ?
      `, [Math.round(parsedAmount), newSips, id]);
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    }

    const updated = await dbGet('SELECT * FROM water_logs WHERE id = ?', [id]);
    res.json(updated);
  } catch (err) {
    console.error('Error updating water log:', err);
    res.status(500).json({ error: 'Không thể cập nhật bản ghi' });
  }
});

// DELETE /api/water-logs/clear-day?local_date=YYYY-MM-DD
waterLogsRouter.delete('/clear-day', async (req: Request, res: Response) => {
  try {
    const { local_date } = req.query;
    if (req.userId) {
      if (local_date && typeof local_date === 'string') {
        await dbRun('DELETE FROM water_logs WHERE local_date = ? AND user_id = ?', [local_date, req.userId]);
      } else {
        await dbRun('DELETE FROM water_logs WHERE user_id = ?', [req.userId]);
      }
    } else {
      if (local_date && typeof local_date === 'string') {
        await dbRun('DELETE FROM water_logs WHERE local_date = ? AND (user_id IS NULL OR user_id = "")', [local_date]);
      } else {
        await dbRun('DELETE FROM water_logs WHERE (user_id IS NULL OR user_id = "")');
      }
    }
    res.json({ success: true, message: 'Đã xóa tất cả bản ghi' });
  } catch (err) {
    console.error('Error clearing water logs:', err);
    res.status(500).json({ error: 'Không thể xóa dữ liệu' });
  }
});

// DELETE /api/water-logs/:id
waterLogsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let result;
    if (req.userId) {
      result = await dbRun('DELETE FROM water_logs WHERE id = ? AND (user_id = ? OR user_id IS NULL)', [id, req.userId]);
    } else {
      result = await dbRun('DELETE FROM water_logs WHERE id = ?', [id]);
    }

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi cần xóa' });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting water log:', err);
    res.status(500).json({ error: 'Không thể xóa bản ghi' });
  }
});

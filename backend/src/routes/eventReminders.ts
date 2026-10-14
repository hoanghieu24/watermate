import { Router, Request, Response } from 'express';
import { dbQuery, dbGet, dbRun } from '../db/database.js';
import { isPostgres } from '../db/dbAdapter.js';

export const eventRemindersRouter = Router();

export interface DbEventReminder {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  remind_days: string;
  is_completed: number | boolean;
  created_at: string;
  last_notified_date?: string | null;
  user_id?: string | null;
}

// GET /api/event-reminders
eventRemindersRouter.get('/', async (req: Request, res: Response) => {
  try {
    let rows: DbEventReminder[];
    if (req.userId) {
      rows = await dbQuery<DbEventReminder>(`
        SELECT * FROM event_reminders
        WHERE user_id = ?
        ORDER BY event_date ASC, event_time ASC
      `, [req.userId]);
    } else {
      rows = await dbQuery<DbEventReminder>(`
        SELECT * FROM event_reminders
        WHERE (user_id IS NULL OR user_id = '')
        ORDER BY event_date ASC, event_time ASC
      `);
    }

    const formatted = rows.map((r) => ({
      ...r,
      is_completed: Boolean(r.is_completed),
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching event reminders:', err);
    res.status(500).json({ error: 'Không thể tải danh sách sự kiện' });
  }
});

// POST /api/event-reminders
eventRemindersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, event_date, event_time, remind_days } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Tên sự kiện không được để trống' });
    }

    if (!event_date || typeof event_date !== 'string') {
      return res.status(400).json({ error: 'Ngày diễn ra không hợp lệ' });
    }

    const id = `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const cleanTime = event_time && typeof event_time === 'string' ? event_time.trim() : '09:00';
    const cleanRemindDays = remind_days && typeof remind_days === 'string' ? remind_days.trim() : '3,2,1,0';
    const cleanDesc = description && typeof description === 'string' ? description.trim() : '';
    const userId = req.userId || null;

    const isCompletedVal = isPostgres ? false : 0;

    await dbRun(`
      INSERT INTO event_reminders (id, title, description, event_date, event_time, remind_days, is_completed, created_at, last_notified_date, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)
    `, [id, title.trim(), cleanDesc, event_date.trim(), cleanTime, cleanRemindDays, isCompletedVal, nowIso, userId]);

    const created = await dbGet<DbEventReminder>('SELECT * FROM event_reminders WHERE id = ?', [id]);
    res.status(201).json({
      ...created,
      is_completed: Boolean(created?.is_completed),
    });
  } catch (err) {
    console.error('Error creating event reminder:', err);
    res.status(500).json({ error: 'Không thể tạo lịch nhắc sự kiện' });
  }
});

// PUT /api/event-reminders/:id
eventRemindersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, remind_days, is_completed } = req.body;

    const existing = await dbGet<DbEventReminder>('SELECT * FROM event_reminders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }

    const newTitle = title !== undefined ? String(title).trim() : existing.title;
    const newDesc = description !== undefined ? String(description).trim() : (existing.description || '');
    const newDate = event_date !== undefined ? String(event_date).trim() : existing.event_date;
    const newTime = event_time !== undefined ? String(event_time).trim() : existing.event_time;
    const newRemindDays = remind_days !== undefined ? String(remind_days).trim() : existing.remind_days;
    const newCompleted = is_completed !== undefined ? (isPostgres ? Boolean(is_completed) : (is_completed ? 1 : 0)) : existing.is_completed;

    await dbRun(`
      UPDATE event_reminders
      SET title = ?, description = ?, event_date = ?, event_time = ?, remind_days = ?, is_completed = ?
      WHERE id = ?
    `, [newTitle, newDesc, newDate, newTime, newRemindDays, newCompleted, id]);

    const updated = await dbGet<DbEventReminder>('SELECT * FROM event_reminders WHERE id = ?', [id]);
    res.json({
      ...updated,
      is_completed: Boolean(updated?.is_completed),
    });
  } catch (err) {
    console.error('Error updating event reminder:', err);
    res.status(500).json({ error: 'Không thể cập nhật sự kiện' });
  }
});

// PATCH /api/event-reminders/:id/toggle
eventRemindersRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const autoDelete = req.query.auto_delete === 'true' || req.body?.auto_delete === true;

    const existing = await dbGet<DbEventReminder>('SELECT * FROM event_reminders WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }

    const nextState = !Boolean(existing.is_completed);

    // If auto_delete is on and user completed the event, automatically delete it!
    if (nextState && autoDelete) {
      await dbRun('DELETE FROM event_reminders WHERE id = ?', [id]);
      return res.json({ success: true, id, is_completed: true, deleted: true });
    }

    const newCompleted = isPostgres ? nextState : (nextState ? 1 : 0);
    await dbRun('UPDATE event_reminders SET is_completed = ? WHERE id = ?', [newCompleted, id]);

    res.json({ success: true, id, is_completed: nextState, deleted: false });
  } catch (err) {
    console.error('Error toggling event reminder status:', err);
    res.status(500).json({ error: 'Không thể đổi trạng thái sự kiện' });
  }
});

// DELETE /api/event-reminders/:id
eventRemindersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await dbRun('DELETE FROM event_reminders WHERE id = ?', [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện để xóa' });
    }
    res.json({ success: true, id });
  } catch (err) {
    console.error('Error deleting event reminder:', err);
    res.status(500).json({ error: 'Không thể xóa sự kiện' });
  }
});

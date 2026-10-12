import { Router, Request, Response } from 'express';
import { VAPID_PUBLIC_KEY } from '../config/vapid.js';
import { saveSubscription, sendNotificationToAll } from '../services/pushService.js';
import { dbGet, dbQuery } from '../db/database.js';

export const pushRouter = Router();

// GET /api/push/vapid-key
pushRouter.get('/vapid-key', (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
pushRouter.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Subscription không hợp lệ' });
    }

    const subId = await saveSubscription(subscription);
    res.status(201).json({ success: true, id: subId });
  } catch (err) {
    console.error('Error saving subscription:', err);
    res.status(500).json({ error: 'Không thể lưu subscription' });
  }
});

// POST /api/push/test
pushRouter.post('/test', async (_req: Request, res: Response) => {
  try {
    const activeCount = await dbGet<{ count: number | string }>('SELECT COUNT(*) as count FROM push_subscriptions WHERE is_active = 1');
    const countNumber = Number(activeCount?.count || 0);

    if (countNumber === 0) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có thiết bị nào đăng ký nhận Web Push. Hãy bấm nút "Kích hoạt Web Push" trên iPhone trước!'
      });
    }

    const payload = {
      title: 'WaterMate - Thông báo thử nghiệm! 💧',
      body: 'Tuyệt vời! Web Push trên thiết bị của bạn đã hoạt động bình thường kể cả khi đóng ứng dụng.',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: '/',
    };

    const result = await sendNotificationToAll(payload);
    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      total: result.total,
    });
  } catch (err) {
    console.error('Error sending test push:', err);
    res.status(500).json({ error: 'Lỗi máy chủ khi gửi thông báo thử nghiệm' });
  }
});

// GET /api/push/logs
pushRouter.get('/logs', async (_req: Request, res: Response) => {
  try {
    const logs = await dbQuery(`
      SELECT * FROM notification_logs
      ORDER BY id DESC
      LIMIT 50
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching notification logs:', err);
    res.status(500).json({ error: 'Không thể lấy nhật ký thông báo' });
  }
});

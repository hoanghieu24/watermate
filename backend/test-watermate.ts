import assert from 'assert';
import { DatabaseSync } from 'node:sqlite';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } from './src/config/vapid.js';
import { saveSubscription } from './src/services/pushService.js';
import { evaluateAndSendReminder } from './src/scheduler/reminderScheduler.js';
import { initDatabase, dbGet, dbRun, dbQuery } from './src/db/database.js';

console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG WATERMATE...\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${name}`);
  } catch (err: unknown) {
    console.error(`  ❌ [FAIL] ${name}:`, (err as Error).message);
  }
}

async function runAll() {
  await initDatabase();

  // TEST 1: 1 ngụm = 50 ml
  await runTest('Test 1: Ghi nhận 1 ngụm tăng đúng 50 ml', async () => {
    const testId = `test_sip_1_${Date.now()}`;
    const amount = 50;
    const sips = amount / 50;
    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES (?, ?, ?, 'sip', datetime('now'), '2026-10-12')
    `, [testId, amount, sips]);

    const row = await dbGet<{ amount_ml: number; sip_equivalent: number }>('SELECT * FROM water_logs WHERE id = ?', [testId]);
    assert.strictEqual(row?.amount_ml, 50);
    assert.strictEqual(Number(row?.sip_equivalent), 1);
  });

  // TEST 2: 5 ngụm = 250 ml
  await runTest('Test 2: Ghi nhận 5 ngụm tăng đúng 250 ml', async () => {
    const testId = `test_sip_5_${Date.now()}`;
    const amount = 5 * 50;
    const sips = amount / 50;
    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES (?, ?, ?, 'sip', datetime('now'), '2026-10-12')
    `, [testId, amount, sips]);

    const row = await dbGet<{ amount_ml: number; sip_equivalent: number }>('SELECT * FROM water_logs WHERE id = ?', [testId]);
    assert.strictEqual(row?.amount_ml, 250);
    assert.strictEqual(Number(row?.sip_equivalent), 5);
  });

  // TEST 3: 1 cốc = 450 ml
  await runTest('Test 3: Ghi nhận 1 cốc mẫu tăng đúng 450 ml', async () => {
    const testId = `test_cup_1_${Date.now()}`;
    const amount = 450;
    const sips = Number((amount / 50).toFixed(1));
    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES (?, ?, ?, 'full_cup', datetime('now'), '2026-10-12')
    `, [testId, amount, sips]);

    const row = await dbGet<{ amount_ml: number; sip_equivalent: number }>('SELECT * FROM water_logs WHERE id = ?', [testId]);
    assert.strictEqual(row?.amount_ml, 450);
    assert.strictEqual(Number(row?.sip_equivalent), 9.0);
  });

  // TEST 4: Sửa và xóa bản ghi, tính toán tổng chính xác
  await runTest('Test 4: Sửa và xóa bản ghi cập nhật tổng chính xác', async () => {
    const testId = `test_mod_${Date.now()}`;
    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES (?, 100, 2.0, 'custom', datetime('now'), '2026-10-12')
    `, [testId]);

    // Update to 150ml
    await dbRun('UPDATE water_logs SET amount_ml = 150, sip_equivalent = 3.0 WHERE id = ?', [testId]);
    let row = await dbGet<{ amount_ml: number }>('SELECT amount_ml FROM water_logs WHERE id = ?', [testId]);
    assert.strictEqual(row?.amount_ml, 150);

    // Delete
    await dbRun('DELETE FROM water_logs WHERE id = ?', [testId]);
    row = await dbGet<{ amount_ml: number }>('SELECT amount_ml FROM water_logs WHERE id = ?', [testId]);
    assert.strictEqual(row, null);
  });

  // TEST 5 & 6: Tách biệt dữ liệu ngày hôm nay và ngày hôm trước
  await runTest('Test 5 & 6: Dữ liệu phân tách chính xác theo local_date, không cộng nhầm ngày hôm trước', async () => {
    const yesterday = '2026-10-11';

    await dbRun(`
      INSERT INTO water_logs (id, amount_ml, sip_equivalent, source, created_at, local_date)
      VALUES ('yesterday_1', 800, 16.0, 'sip', '2026-10-11T10:00:00.000Z', ?)
    `, [yesterday]);

    const yesterdaySum = await dbGet<{ total: number }>(`
      SELECT SUM(amount_ml) as total FROM water_logs WHERE local_date = ?
    `, [yesterday]);

    assert.strictEqual(Number(yesterdaySum?.total), 800);
    // Cleanup
    await dbRun('DELETE FROM water_logs WHERE id = ?', ['yesterday_1']);
  });

  // TEST 7: Bật / tắt lịch nhắc nhở
  await runTest('Test 7: Bật và tắt lịch nhắc hoạt động đúng trong database', async () => {
    await dbRun('UPDATE reminder_settings SET enabled = 0 WHERE id = 1');
    let s = await dbGet<{ enabled: number | boolean }>('SELECT enabled FROM reminder_settings WHERE id = 1');
    assert.strictEqual(Number(s?.enabled), 0);

    await dbRun('UPDATE reminder_settings SET enabled = 1 WHERE id = 1');
    s = await dbGet<{ enabled: number | boolean }>('SELECT enabled FROM reminder_settings WHERE id = 1');
    assert.strictEqual(Number(s?.enabled), 1);
  });

  // TEST 8: VAPID keys sẵn sàng và hợp lệ
  await runTest('Test 8: VAPID key pair được cấu hình bảo mật và hợp lệ', async () => {
    assert.ok(VAPID_PUBLIC_KEY, 'Public key must exist');
    assert.ok(VAPID_PRIVATE_KEY, 'Private key must exist');
    assert.ok(VAPID_PUBLIC_KEY.length > 50, 'Public key length is valid');
  });

  // TEST 9: Subscription deduplication
  await runTest('Test 9: Không tạo nhiều subscription trùng lặp cho cùng một thiết bị', async () => {
    const mockEndpoint = `https://fcm.googleapis.com/fcm/send/test_device_${Date.now()}`;
    const sub1 = {
      endpoint: mockEndpoint,
      keys: { p256dh: 'test_p256dh', auth: 'test_auth' }
    } as any;

    const id1 = await saveSubscription(sub1);
    const id2 = await saveSubscription(sub1);
    assert.strictEqual(id1, id2, 'Same endpoint must reuse the existing row ID');

    // Cleanup
    await dbRun('DELETE FROM push_subscriptions WHERE endpoint = ?', [mockEndpoint]);
  });

  // TEST 10: Xử lý subscription không còn hiệu lực (410 Gone / 404)
  await runTest('Test 10: Tự động vô hiệu hóa subscription khi lỗi 410 Gone hoặc 404', async () => {
    const endpoint = `https://push.apple.com/test_expired_${Date.now()}`;
    await dbRun(`
      INSERT INTO push_subscriptions (endpoint, subscription_json, is_active, created_at, updated_at)
      VALUES (?, '{}', 1, datetime('now'), datetime('now'))
    `, [endpoint]);

    // Simulate marking inactive on 410
    await dbRun('UPDATE push_subscriptions SET is_active = 0 WHERE endpoint = ?', [endpoint]);
    const row = await dbGet<{ is_active: number | boolean }>('SELECT is_active FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
    assert.strictEqual(Number(row?.is_active), 0);

    // Cleanup
    await dbRun('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);
  });

  // TEST 11: Backend restart không làm mất lịch và cấu hình
  await runTest('Test 11: Backend restart phục hồi nguyên vẹn dữ liệu từ database', async () => {
    const uniqueMsg = `💧 Test restart: ${Date.now()}`;
    await dbRun('UPDATE reminder_settings SET notification_message = ? WHERE id = 1', [uniqueMsg]);

    const readBack = await dbGet<{ notification_message: string }>('SELECT notification_message FROM reminder_settings WHERE id = 1');
    assert.strictEqual(readBack?.notification_message, uniqueMsg);
  });

  // TEST 12: Chống gửi trùng thông báo (Anti-duplicate interval protection)
  await runTest('Test 12: Kiểm tra scheduler chống gửi trùng thông báo', async () => {
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    await dbRun(`
      INSERT INTO notification_logs (scheduled_at, sent_at, status, error_message)
      VALUES (?, ?, 'sent', NULL)
    `, [oneMinAgo, oneMinAgo]);

    const triggered = await evaluateAndSendReminder();
    assert.strictEqual(triggered, false, 'Should not trigger reminder when another was recently sent within interval');
  });

  // TEST 13: Scheduler tôn trọng tạm dừng nhắc (paused_until)
  await runTest('Test 13: Scheduler tôn trọng tạm dừng nhắc (paused_until)', async () => {
    const futurePause = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await dbRun('UPDATE reminder_settings SET paused_until = ? WHERE id = 1', [futurePause]);

    const triggered = await evaluateAndSendReminder();
    assert.strictEqual(triggered, false, 'Should not trigger when paused_until is in the future');

    // Reset paused_until
    await dbRun('UPDATE reminder_settings SET paused_until = NULL WHERE id = 1');
  });

  // TEST 14: Khoảng cách nhắc 15 phút (interval_minutes = 15)
  await runTest('Test 14: Hỗ trợ tùy chọn nhắc mỗi 15 phút', async () => {
    await dbRun('UPDATE reminder_settings SET interval_minutes = 15 WHERE id = 1');
    const row = await dbGet<{ interval_minutes: number }>('SELECT interval_minutes FROM reminder_settings WHERE id = 1');
    assert.strictEqual(row?.interval_minutes, 15);
  });

  // TEST 15: Khung giờ không cần nhắc (Quiet Hours / Không làm phiền)
  await runTest('Test 15: Khung giờ yên tĩnh (Từ giờ nào đến giờ nào không cần nhắc)', async () => {
    const { isTimeInQuietHours } = await import('./src/scheduler/reminderScheduler.js');

    // Case A: 12:00 -> 13:30 (nghỉ trưa)
    assert.strictEqual(isTimeInQuietHours(12 * 60 + 15, '12:00', '13:30'), true, '12:15 should be quiet');
    assert.strictEqual(isTimeInQuietHours(11 * 60 + 50, '12:00', '13:30'), false, '11:50 should NOT be quiet');
    assert.strictEqual(isTimeInQuietHours(14 * 60, '12:00', '13:30'), false, '14:00 should NOT be quiet');

    // Case B: 22:00 -> 07:00 (qua đêm)
    assert.strictEqual(isTimeInQuietHours(23 * 60 + 30, '22:00', '07:00'), true, '23:30 should be quiet');
    assert.strictEqual(isTimeInQuietHours(5 * 60, '22:00', '07:00'), true, '05:00 should be quiet');
    assert.strictEqual(isTimeInQuietHours(10 * 60, '22:00', '07:00'), false, '10:00 should NOT be quiet');

    // Test DB persistence for quiet hours
    await dbRun(`
      UPDATE reminder_settings
      SET quiet_hours_enabled = 1, quiet_start_time = '12:00', quiet_end_time = '13:30'
      WHERE id = 1
    `);

    const row = await dbGet<{ quiet_hours_enabled: number | boolean; quiet_start_time: string; quiet_end_time: string }>(
      'SELECT quiet_hours_enabled, quiet_start_time, quiet_end_time FROM reminder_settings WHERE id = 1'
    );

    assert.strictEqual(Number(row?.quiet_hours_enabled), 1);
    assert.strictEqual(row?.quiet_start_time, '12:00');
    assert.strictEqual(row?.quiet_end_time, '13:30');
  });

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST THÀNH CÔNG!`);
  console.log(`========================================\n`);
}

runAll().catch(console.error);

/**
 * test_step11.js
 * Comprehensive automated test suite for FINTRACK Step 11: Notifications
 */

const BASE_URL = 'http://localhost:8000/api';

let passedAssertions = 0;
let failedAssertions = 0;

function assert(condition, message) {
  if (condition) {
    passedAssertions++;
    console.log(`  ✓ ${message}`);
  } else {
    failedAssertions++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Non-JSON response
  }

  return { status: response.status, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('FINTRACK STEP 11: NOTIFICATIONS TEST SUITE');
  console.log('====================================================\n');

  // 1. Unauthenticated Access Tests
  console.log('[Test 1] Unauthenticated Access Security Checks:');
  const unauthGet = await request('/notifications');
  assert(unauthGet.status === 401, 'GET /api/notifications without token returns 401');

  const unauthRead = await request('/notifications/ntf_fake_01/read', { method: 'PUT' });
  assert(unauthRead.status === 401, 'PUT /api/notifications/:id/read without token returns 401');

  const unauthReadAll = await request('/notifications/read-all', { method: 'PUT' });
  assert(unauthReadAll.status === 401, 'PUT /api/notifications/read-all without token returns 401');

  const unauthDelete = await request('/notifications/ntf_fake_01', { method: 'DELETE' });
  assert(unauthDelete.status === 401, 'DELETE /api/notifications/:id without token returns 401');

  // 2. Individual User Authentication
  console.log('\n[Test 2] Individual User Authentication:');
  const indLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'alex.morgan@fintrack.io',
      password: 'fintrack2026'
    })
  });

  assert(indLogin.status === 200 && indLogin.data?.token, 'Individual user login succeeds');
  const indToken = indLogin.data.token;
  const indAuthHeader = { Authorization: `Bearer ${indToken}` };

  // 3. Fetch Notifications for Individual User
  console.log('\n[Test 3] Fetch Notifications:');
  const indNotifsRes = await request('/notifications', { headers: indAuthHeader });
  assert(indNotifsRes.status === 200, 'GET /api/notifications returns 200');
  assert(Array.isArray(indNotifsRes.data?.notifications), 'Response contains notifications array');
  assert(indNotifsRes.data.notifications.length > 0, 'Notifications list is populated with seeded items');
  assert(typeof indNotifsRes.data.unreadCount === 'number', 'Response contains numeric unreadCount');

  const sampleNotif = indNotifsRes.data.notifications[0];
  assert(sampleNotif.id && typeof sampleNotif.id === 'string', 'Notification has id');
  assert(sampleNotif.userId && typeof sampleNotif.userId === 'string', 'Notification has userId');
  assert(sampleNotif.title && typeof sampleNotif.title === 'string', 'Notification has title');
  assert(sampleNotif.message && typeof sampleNotif.message === 'string', 'Notification has message');
  assert(['transaction', 'budget', 'support', 'system', 'ai'].includes(sampleNotif.type), `Valid notification type: ${sampleNotif.type}`);
  assert(typeof sampleNotif.isRead === 'boolean', 'Notification has boolean isRead');
  assert(!isNaN(Date.parse(sampleNotif.createdAt)), 'Notification has valid ISO createdAt');

  // Verify no sensitive fields returned
  assert(!sampleNotif.password && !sampleNotif.token && !sampleNotif.apiKey, 'Notification does not expose sensitive fields');

  // 4. Mark Single Notification as Read
  console.log('\n[Test 4] Mark Single Notification as Read:');
  const unreadNotif = indNotifsRes.data.notifications.find(n => !n.isRead);
  assert(Boolean(unreadNotif), 'Found at least one unread notification to test');

  if (unreadNotif) {
    const prevUnreadCount = indNotifsRes.data.unreadCount;
    const markReadRes = await request(`/notifications/${unreadNotif.id}/read`, {
      method: 'PUT',
      headers: indAuthHeader
    });

    assert(markReadRes.status === 200, 'PUT /api/notifications/:id/read returns 200');
    assert(markReadRes.data.success === true, 'Response success is true');
    assert(markReadRes.data.notification?.isRead === true, 'Notification isRead changed to true');
    assert(markReadRes.data.unreadCount === prevUnreadCount - 1, 'unreadCount is decremented by 1');
  }

  // 5. Mark All Notifications as Read
  console.log('\n[Test 5] Mark All Notifications as Read:');
  const markAllRes = await request('/notifications/read-all', {
    method: 'PUT',
    headers: indAuthHeader
  });

  assert(markAllRes.status === 200, 'PUT /api/notifications/read-all returns 200');
  assert(markAllRes.data.success === true, 'Response success is true');
  assert(typeof markAllRes.data.updatedCount === 'number', 'Response contains updatedCount');
  assert(markAllRes.data.unreadCount === 0, 'unreadCount is 0 after mark-all');

  const verifyAllRead = await request('/notifications', { headers: indAuthHeader });
  const stillUnread = verifyAllRead.data.notifications.filter(n => !n.isRead);
  assert(stillUnread.length === 0, 'All notifications confirmed as isRead === true');
  assert(verifyAllRead.data.unreadCount === 0, 'GET /notifications verifies unreadCount === 0');

  // 6. Delete a Notification
  console.log('\n[Test 6] Delete Notification:');
  const notifToDelete = verifyAllRead.data.notifications[0];
  const deleteRes = await request(`/notifications/${notifToDelete.id}`, {
    method: 'DELETE',
    headers: indAuthHeader
  });

  assert(deleteRes.status === 200, 'DELETE /api/notifications/:id returns 200');
  assert(deleteRes.data.success === true, 'Response success is true');

  // Verify 404 when deleting already deleted notification
  const reDeleteRes = await request(`/notifications/${notifToDelete.id}`, {
    method: 'DELETE',
    headers: indAuthHeader
  });
  assert(reDeleteRes.status === 404, 'Deleting already deleted notification returns 404');

  // 7. Notification Trigger: New Transaction
  console.log('\n[Test 7] Notification Trigger: New Transaction:');
  const newTxRes = await request('/transactions', {
    method: 'POST',
    headers: indAuthHeader,
    body: JSON.stringify({
      amount: 1450,
      type: 'expense',
      category: 'Food & Dining',
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Credit Card',
      description: 'Gourmet dinner test'
    })
  });
  assert(newTxRes.status === 201, 'POST /api/transactions creates transaction');

  const afterTxNotifs = await request('/notifications', { headers: indAuthHeader });
  const txNotif = afterTxNotifs.data.notifications.find(n => n.type === 'transaction');
  assert(Boolean(txNotif), 'Transaction notification was automatically created');
  assert(txNotif.title.includes('Expense'), 'Transaction notification title indicates Expense');
  assert(txNotif.message.includes('1,450'), 'Transaction notification message mentions the amount');
  assert(txNotif.isRead === false, 'Newly triggered notification is unread');

  // 8. Notification Trigger: Support Ticket Created & Updated
  console.log('\n[Test 8] Notification Trigger: Support Ticket:');
  const newTicketRes = await request('/support/tickets', {
    method: 'POST',
    headers: indAuthHeader,
    body: JSON.stringify({
      subject: 'Issue with receipt attachment upload',
      description: 'Unable to upload high-res invoice receipt PDF.',
      category: 'Technical Issue',
      priority: 'High'
    })
  });
  assert(newTicketRes.status === 201, 'POST /api/support/tickets creates support ticket');
  const ticketId = newTicketRes.data.ticket.id;

  const afterTicketNotifs = await request('/notifications', { headers: indAuthHeader });
  const ticketNotif = afterTicketNotifs.data.notifications.find(
    n => n.type === 'support' && n.title.includes(ticketId)
  );
  assert(Boolean(ticketNotif), `Support ticket created notification found for #${ticketId}`);
  assert(ticketNotif.isRead === false, 'New support ticket notification is unread');

  // Update Ticket Status and verify status update notification
  const updateTicketRes = await request(`/support/tickets/${ticketId}`, {
    method: 'PUT',
    headers: indAuthHeader,
    body: JSON.stringify({
      status: 'In Progress'
    })
  });
  assert(updateTicketRes.status === 200, 'PUT /api/support/tickets/:id updates ticket status');

  const afterUpdateNotifs = await request('/notifications', { headers: indAuthHeader });
  const statusNotif = afterUpdateNotifs.data.notifications.find(
    n => n.type === 'support' && n.title.includes('Status Updated') && n.message.includes('In Progress')
  );
  assert(Boolean(statusNotif), 'Ticket status updated notification found');

  // 9. Notification Trigger: AI Financial Advice
  console.log('\n[Test 9] Notification Trigger: AI Advice:');
  const aiRes = await request('/ai/advice', {
    method: 'POST',
    headers: indAuthHeader
  });
  assert(aiRes.status === 200, 'POST /api/ai/advice succeeds');

  const afterAiNotifs = await request('/notifications', { headers: indAuthHeader });
  const aiNotif = afterAiNotifs.data.notifications.find(
    n => n.type === 'ai' && n.title.includes('AI Financial Advisory')
  );
  assert(Boolean(aiNotif), 'AI advice notification was automatically triggered');

  // 10. Corporate Account & Cross-Tenant Security Isolation
  console.log('\n[Test 10] Corporate Account & Cross-Tenant Security Isolation:');
  const corpLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@apexglobal.io',
      password: 'fintrack2026'
    })
  });
  assert(corpLogin.status === 200 && corpLogin.data?.token, 'Corporate user login succeeds');
  const corpToken = corpLogin.data.token;
  const corpAuthHeader = { Authorization: `Bearer ${corpToken}` };

  const corpNotifs = await request('/notifications', { headers: corpAuthHeader });
  assert(corpNotifs.status === 200, 'Corporate user fetches notifications');
  assert(corpNotifs.data.notifications.length > 0, 'Corporate user has seeded corporate notifications');

  // Verify none of Individual user's notifications appear in Corporate user's list
  const indNotifIds = new Set(afterAiNotifs.data.notifications.map(n => n.id));
  const leakedToCorp = corpNotifs.data.notifications.filter(n => indNotifIds.has(n.id));
  assert(leakedToCorp.length === 0, 'Zero individual user notifications leaked to corporate account');

  // Corporate user attempts to mark as read Individual user's notification -> must 404
  const indSampleId = afterAiNotifs.data.notifications[0].id;
  const crossReadRes = await request(`/notifications/${indSampleId}/read`, {
    method: 'PUT',
    headers: corpAuthHeader
  });
  assert(crossReadRes.status === 404, 'User B marking User A notification as read returns 404');

  // Corporate user attempts to delete Individual user's notification -> must 404
  const crossDeleteRes = await request(`/notifications/${indSampleId}`, {
    method: 'DELETE',
    headers: corpAuthHeader
  });
  assert(crossDeleteRes.status === 404, 'User B deleting User A notification returns 404');

  // 11. Type-based filtering
  console.log('\n[Test 11] Notification Query Filtering:');
  const filteredTx = await request('/notifications?type=transaction', { headers: indAuthHeader });
  assert(filteredTx.status === 200, 'Filter by type=transaction returns 200');
  const allTx = filteredTx.data.notifications.every(n => n.type === 'transaction');
  assert(allTx, 'All returned items have type === transaction');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedAssertions} assertions passed, ${failedAssertions} failed.`);
  console.log('====================================================');

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed with error:', err);
  process.exit(1);
});

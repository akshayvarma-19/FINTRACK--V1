/**
 * test_step12_e2e.js
 * Comprehensive End-to-End System Integration Test Suite for FINTRACK (Step 12)
 * Tests all 19 lifecycle stages across Individual and Corporate user personas.
 */

const BASE_URL = 'http://localhost:8000/api';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
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

async function runE2ETests() {
  console.log('================================================================');
  console.log('🚀 FINTRACK STEP 12: FULL SYSTEM END-TO-END INTEGRATION TEST');
  console.log('================================================================\n');

  const uniqueSuffix = Date.now().toString(36);
  const indEmail = `alex_${uniqueSuffix}@fintrack.io`;
  const corpEmail = `corp_${uniqueSuffix}@apexglobal.io`;
  const testPassword = 'Password123!';

  // Stage 1: System Health Verification
  console.log('[Stage 1] System Health Verification:');
  const healthRes = await request('/health');
  assert(healthRes.status === 200, 'GET /api/health returned HTTP 200');
  assert(healthRes.data?.success === true, 'Health check indicates API is healthy');
  assert(Boolean(healthRes.data?.timestamp), 'Health check includes server timestamp');

  // Stage 2: Register New Individual Account
  console.log('\n[Stage 2] Register Individual Account:');
  const regIndRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Alex Morgan Test',
      email: indEmail,
      password: testPassword,
      accountType: 'individual'
    })
  });
  assert(regIndRes.status === 201, 'POST /api/auth/register returned HTTP 201');
  assert(regIndRes.data?.success === true, 'Registration succeeded with success: true');
  assert(Boolean(regIndRes.data?.token), 'Registration issued JWT bearer token');
  assert(regIndRes.data?.user?.accountType === 'individual', 'User accountType is individual');

  const indToken = regIndRes.data.token;
  const indUserId = regIndRes.data.user.id;
  const indHeaders = { Authorization: `Bearer ${indToken}` };

  // Stage 3: Session & Identity Verification (/api/auth/me)
  console.log('\n[Stage 3] Session & Identity Verification:');
  const meRes = await request('/auth/me', { headers: indHeaders });
  assert(meRes.status === 200, 'GET /api/auth/me returned HTTP 200');
  assert(meRes.data?.user?.id === indUserId, 'Identity matches registered user ID');
  assert(meRes.data?.user?.email === indEmail, 'Identity matches registered email');

  // Stage 4: User Profile Read & Update
  console.log('\n[Stage 4] User Profile Read & Update:');
  const getProfileRes = await request('/users/profile', { headers: indHeaders });
  assert(getProfileRes.status === 200, 'GET /api/users/profile returned HTTP 200');

  const updateProfileRes = await request('/users/profile', {
    method: 'PUT',
    headers: indHeaders,
    body: JSON.stringify({
      name: 'Alex Morgan Verified',
      phone: '+91 98765 43210'
    })
  });
  assert(updateProfileRes.status === 200, 'PUT /api/users/profile returned HTTP 200');
  assert(updateProfileRes.data?.profile?.name === 'Alex Morgan Verified', 'Profile name successfully updated');
  assert(updateProfileRes.data?.profile?.phone === '+91 98765 43210', 'Profile phone successfully updated');

  // Stage 5: Record Income Transaction
  console.log('\n[Stage 5] Record Income Transaction:');
  const today = new Date().toISOString().slice(0, 10);
  const incomeRes = await request('/transactions', {
    method: 'POST',
    headers: indHeaders,
    body: JSON.stringify({
      amount: 95000,
      type: 'income',
      category: 'Salary',
      date: today,
      paymentMethod: 'Bank Transfer',
      description: 'Monthly tech consulting salary'
    })
  });
  assert(incomeRes.status === 201, 'POST /api/transactions (income) returned HTTP 201');
  assert(incomeRes.data?.transaction?.amount === 95000, 'Income amount recorded accurately');

  // Stage 6: Record Expense Transaction
  console.log('\n[Stage 6] Record Expense Transaction:');
  const expenseRes = await request('/transactions', {
    method: 'POST',
    headers: indHeaders,
    body: JSON.stringify({
      amount: 4200,
      type: 'expense',
      category: 'Food & Dining',
      date: today,
      paymentMethod: 'Credit Card',
      description: 'Weekly team dinners'
    })
  });
  assert(expenseRes.status === 201, 'POST /api/transactions (expense) returned HTTP 201');
  assert(expenseRes.data?.transaction?.amount === 4200, 'Expense amount recorded accurately');

  // Stage 7: Dashboard Summary Integration
  console.log('\n[Stage 7] Dashboard Summary Integration:');
  const dashRes = await request('/dashboard/summary', { headers: indHeaders });
  assert(dashRes.status === 200, 'GET /api/dashboard/summary returned HTTP 200');
  assert(dashRes.data?.totalIncome === 95000, 'Dashboard totalIncome dynamically reflects recorded income (₹95,000)');
  assert(dashRes.data?.totalExpenses === 4200, 'Dashboard totalExpenses dynamically reflects recorded expense (₹4,200)');
  assert(dashRes.data?.remainingBalance === 90800, 'Dashboard remainingBalance equals ₹90,800');
  assert(dashRes.data?.savingsRate > 90, 'Dashboard savingsRate calculated dynamically');

  // Stage 8: Analytics Integration
  console.log('\n[Stage 8] Analytics Integration:');
  const analyticsRes = await request('/analytics?period=6M', { headers: indHeaders });
  assert(analyticsRes.status === 200, 'GET /api/analytics returned HTTP 200');
  assert(analyticsRes.data?.metrics?.totalIncome === 95000, 'Analytics totalIncome matches transaction telemetry');
  assert(analyticsRes.data?.metrics?.totalExpense === 4200, 'Analytics totalExpense matches transaction telemetry');
  assert(Array.isArray(analyticsRes.data?.categoryBreakdown), 'Analytics provides category breakdown array');
  assert(analyticsRes.data.categoryBreakdown.some(c => c.category === 'Food & Dining'), 'Category breakdown includes Food & Dining');

  // Stage 9: Budget Creation
  console.log('\n[Stage 9] Budget Creation:');
  const currentPeriod = today.slice(0, 7);
  const createBudgetRes = await request('/budgets', {
    method: 'POST',
    headers: indHeaders,
    body: JSON.stringify({
      category: 'Food & Dining',
      amount: 5000,
      period: currentPeriod
    })
  });
  assert(createBudgetRes.status === 201, 'POST /api/budgets returned HTTP 201');
  const budgetId = createBudgetRes.data.budget.id;

  // Verify budget reflects the existing ₹4,200 spending (84% utilization)
  const getBudgetsRes = await request(`/budgets?period=${currentPeriod}`, { headers: indHeaders });
  assert(getBudgetsRes.status === 200, 'GET /api/budgets returned HTTP 200');
  const foodBudget = getBudgetsRes.data.budgets.find(b => b.category === 'Food & Dining');
  assert(Boolean(foodBudget), 'Created budget found in budgets list');
  assert(foodBudget.spent === 4200, 'Budget spent dynamically computed from transactions (₹4,200)');
  assert(foodBudget.remaining === 800, 'Budget remaining is ₹800');
  assert(foodBudget.percentage === 84, 'Budget percentage is 84%');

  // Stage 10: Budget Threshold Trigger (Exceeding Budget)
  console.log('\n[Stage 10] Budget Threshold Trigger (Exceeding Budget):');
  const exceedExpenseRes = await request('/transactions', {
    method: 'POST',
    headers: indHeaders,
    body: JSON.stringify({
      amount: 1500,
      type: 'expense',
      category: 'Food & Dining',
      date: today,
      paymentMethod: 'UPI / Wallet',
      description: 'Additional dinner exceeding budget limit'
    })
  });
  assert(exceedExpenseRes.status === 201, 'Expense transaction exceeding budget created successfully');

  // Stage 11: AI Advisor Advice Generation
  console.log('\n[Stage 11] AI Advisor Advice Flow:');
  const aiRes = await request('/ai/advice', {
    method: 'POST',
    headers: indHeaders
  });
  assert(aiRes.status === 200, 'POST /api/ai/advice returned HTTP 200');
  assert(Boolean(aiRes.data?.data?.summary), 'AI advice contains summary');
  assert(Array.isArray(aiRes.data?.data?.spendingInsights), 'AI advice contains spendingInsights');
  assert(Array.isArray(aiRes.data?.data?.savingsSuggestions), 'AI advice contains savingsSuggestions');
  assert(Array.isArray(aiRes.data?.data?.budgetSuggestions), 'AI advice contains budgetSuggestions');
  assert(Array.isArray(aiRes.data?.data?.actionItems), 'AI advice contains actionItems');

  // Stage 12: Support Ticket Lifecycle
  console.log('\n[Stage 12] Support Ticket Lifecycle:');
  const ticketRes = await request('/support/tickets', {
    method: 'POST',
    headers: indHeaders,
    body: JSON.stringify({
      subject: 'Inquiry regarding annual tax deduction report',
      description: 'Need clarification on automated Section 80C tax classification for investment expenses.',
      category: 'Transaction',
      priority: 'Medium'
    })
  });
  assert(ticketRes.status === 201, 'POST /api/support/tickets returned HTTP 201');
  const ticketId = ticketRes.data.ticket.id;

  const updateTicketRes = await request(`/support/tickets/${ticketId}`, {
    method: 'PUT',
    headers: indHeaders,
    body: JSON.stringify({
      status: 'In Progress'
    })
  });
  assert(updateTicketRes.status === 200, 'PUT /api/support/tickets/:id updated status to In Progress');

  // Stage 13: In-App Notifications Lifecycle & Trigger Verification
  console.log('\n[Stage 13] Notifications Lifecycle & Verification:');
  const notifsRes = await request('/notifications', { headers: indHeaders });
  assert(notifsRes.status === 200, 'GET /api/notifications returned HTTP 200');
  assert(notifsRes.data.notifications.length > 0, 'Notifications list contains events');

  // Verify triggers occurred
  const hasTxNotif = notifsRes.data.notifications.some(n => n.type === 'transaction');
  assert(hasTxNotif, 'Automatic transaction notification exists');

  const hasBudgetNotif = notifsRes.data.notifications.some(n => n.type === 'budget');
  assert(hasBudgetNotif, 'Automatic budget threshold notification exists');

  const hasSupportNotif = notifsRes.data.notifications.some(n => n.type === 'support');
  assert(hasSupportNotif, 'Automatic support ticket notification exists');

  const hasAiNotif = notifsRes.data.notifications.some(n => n.type === 'ai');
  assert(hasAiNotif, 'Automatic AI advice notification exists');

  // Mark all notifications read
  const markAllRes = await request('/notifications/read-all', {
    method: 'PUT',
    headers: indHeaders
  });
  assert(markAllRes.status === 200, 'PUT /api/notifications/read-all returned HTTP 200');
  assert(markAllRes.data.unreadCount === 0, 'Unread notification count reset to 0');

  // Stage 14: Register Corporate Account
  console.log('\n[Stage 14] Register Corporate Account:');
  const regCorpRes = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Apex Global Admin',
      email: corpEmail,
      password: testPassword,
      accountType: 'corporate'
    })
  });
  assert(regCorpRes.status === 201, 'POST /api/auth/register (corporate) returned HTTP 201');
  const corpToken = regCorpRes.data.token;
  const corpUserId = regCorpRes.data.user.id;
  const corpHeaders = { Authorization: `Bearer ${corpToken}` };

  // Stage 15: Corporate Operations Flow
  console.log('\n[Stage 15] Corporate Operations Flow:');
  const corpIncomeRes = await request('/transactions', {
    method: 'POST',
    headers: corpHeaders,
    body: JSON.stringify({
      amount: 450000,
      type: 'income',
      category: 'Invoicing & Clients',
      date: today,
      paymentMethod: 'Wire Transfer',
      description: 'Enterprise Cloud Retainer Q3'
    })
  });
  assert(corpIncomeRes.status === 201, 'Corporate revenue recorded (₹4,50,000)');

  const corpExpenseRes = await request('/transactions', {
    method: 'POST',
    headers: corpHeaders,
    body: JSON.stringify({
      amount: 52000,
      type: 'expense',
      category: 'Software & Subscriptions',
      date: today,
      paymentMethod: 'Corporate Card',
      description: 'Enterprise SaaS infrastructure'
    })
  });
  assert(corpExpenseRes.status === 201, 'Corporate expense recorded (₹52,000)');

  const corpDashRes = await request('/dashboard/summary', { headers: corpHeaders });
  assert(corpDashRes.data.totalIncome === 450000, 'Corporate dashboard totalIncome is ₹4,50,000');
  assert(corpDashRes.data.totalExpenses === 52000, 'Corporate dashboard totalExpenses is ₹52,000');

  // Stage 16: Multi-Tenant & Cross-User Security Isolation
  console.log('\n[Stage 16] Multi-Tenant & Cross-User Security Isolation:');

  // Corporate user attempts to view Individual user's ticket -> must be 404
  const crossTicketRes = await request(`/support/tickets/${ticketId}`, { headers: corpHeaders });
  assert(crossTicketRes.status === 404, 'User B cannot access User A ticket (returns HTTP 404)');

  // Corporate user attempts to view Individual user's budget -> must be 404
  const crossBudgetRes = await request(`/budgets/${budgetId}`, { headers: corpHeaders });
  assert(crossBudgetRes.status === 404, 'User B cannot access User A budget (returns HTTP 404)');

  // Corporate user fetching transactions sees only their own
  const corpTxList = await request('/transactions', { headers: corpHeaders });
  const indTxIdSet = new Set([incomeRes.data.transaction.id, expenseRes.data.transaction.id]);
  const leakedTx = corpTxList.data.transactions.filter(t => indTxIdSet.has(t.id));
  assert(leakedTx.length === 0, 'Zero individual user transactions leaked to corporate user');

  // Stage 17: Security & Data Hygiene
  console.log('\n[Stage 17] Sensitive Data Hygiene Verification:');
  const jsonString = JSON.stringify({
    profile: getProfileRes.data,
    transactions: corpTxList.data,
    dashboard: dashRes.data,
    notifications: notifsRes.data
  });
  assert(!jsonString.includes('passwordHash'), 'No passwordHash in any responses');
  assert(!jsonString.includes('JWT_SECRET'), 'No JWT secret key in any responses');
  assert(!jsonString.includes('gsk_'), 'No Groq API key leaked in client responses');

  // Stage 18: Unauthenticated Access Protection
  console.log('\n[Stage 18] Unauthenticated Protection:');
  const unauthMe = await request('/auth/me');
  assert(unauthMe.status === 401, 'GET /api/auth/me rejects without token (401)');
  const unauthTx = await request('/transactions');
  assert(unauthTx.status === 401, 'GET /api/transactions rejects without token (401)');
  const unauthDash = await request('/dashboard/summary');
  assert(unauthDash.status === 401, 'GET /api/dashboard/summary rejects without token (401)');
  const unauthBudgets = await request('/budgets');
  assert(unauthBudgets.status === 401, 'GET /api/budgets rejects without token (401)');
  const unauthAi = await request('/ai/advice', { method: 'POST' });
  assert(unauthAi.status === 401, 'POST /api/ai/advice rejects without token (401)');
  const unauthSupport = await request('/support/tickets');
  assert(unauthSupport.status === 401, 'GET /api/support/tickets rejects without token (401)');
  const unauthNotifs = await request('/notifications');
  assert(unauthNotifs.status === 401, 'GET /api/notifications rejects without token (401)');

  // Stage 19: Re-login & Data Persistence
  console.log('\n[Stage 19] Re-login & Data Persistence:');
  const reLoginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: indEmail,
      password: testPassword
    })
  });
  assert(reLoginRes.status === 200, 'Re-login with registered Individual account succeeds');
  const reLoginHeaders = { Authorization: `Bearer ${reLoginRes.data.token}` };

  const reLoginDash = await request('/dashboard/summary', { headers: reLoginHeaders });
  assert(reLoginDash.data.totalIncome === 95000, 'Data persists after re-login (Income: ₹95,000)');
  assert(reLoginDash.data.totalExpenses === 5700, 'Data persists after re-login (Expense: ₹5,700)');

  console.log('\n================================================================');
  console.log(`E2E TEST SUMMARY: ${passed} assertions passed, ${failed} failed.`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch(err => {
  console.error('E2E Test execution failed:', err);
  process.exit(1);
});

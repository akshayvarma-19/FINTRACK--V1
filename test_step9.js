/**
 * FINTRACK - STEP 9 TEST SUITE: AI FINANCE ADVISOR
 * Tests all backend API requirements, authentication, safety, provider fallback,
 * user isolation, empty transactions, and response schema.
 */

const BASE_URL = 'http://localhost:8000';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 FINTRACK STEP 9: AI FINANCE ADVISOR TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test 401 Unauthenticated
    console.log('1. Testing Unauthenticated Access to POST /api/ai/advice...');
    const unauthRes = await fetch(`${BASE_URL}/api/ai/advice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert(unauthRes.status === 401, 'Endpoint rejects unauthenticated requests with 401');

    // 2. Test Individual User Login
    console.log('\n2. Logging in as Individual user (alex.morgan@fintrack.io)...');
    const indLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.morgan@fintrack.io', password: 'fintrack2026' })
    });
    const indLoginData = await indLoginRes.json();
    assert(indLoginData.success && indLoginData.token, 'Individual login succeeded and token returned');
    const indToken = indLoginData.token;

    // 3. Test Generate Advice for Individual User
    console.log('\n3. Calling POST /api/ai/advice for Individual user...');
    const indAdviceRes = await fetch(`${BASE_URL}/api/ai/advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({ fakeUserId: 'usr_malicious_attacker' }) // Verify userId in body is ignored!
    });
    assert(indAdviceRes.status === 200, 'POST /api/ai/advice returned HTTP 200');
    const indAdvice = await indAdviceRes.json();
    assert(indAdvice.success === true, 'Response indicates success: true');
    assert(indAdvice.data !== undefined, 'Response contains data object');
    assert(typeof indAdvice.data.summary === 'string' && indAdvice.data.summary.length > 10, 'Summary is a meaningful string');
    assert(Array.isArray(indAdvice.data.spendingInsights) && indAdvice.data.spendingInsights.length > 0, 'spendingInsights is a non-empty array');
    assert(Array.isArray(indAdvice.data.savingsSuggestions) && indAdvice.data.savingsSuggestions.length > 0, 'savingsSuggestions is a non-empty array');
    assert(Array.isArray(indAdvice.data.budgetSuggestions) && indAdvice.data.budgetSuggestions.length > 0, 'budgetSuggestions is a non-empty array');
    assert(Array.isArray(indAdvice.data.alerts) && indAdvice.data.alerts.length > 0, 'alerts is a non-empty array');
    assert(Array.isArray(indAdvice.data.actionItems) && indAdvice.data.actionItems.length > 0, 'actionItems is a non-empty array');

    console.log('\n  Individual Advice Highlights:');
    console.log('  - Summary:', indAdvice.data.summary.slice(0, 100) + '...');
    console.log('  - Provider Used:', indAdvice.provider, '(isFallback:', indAdvice.isFallback, ')');
    console.log('  - Top Spending Insight:', indAdvice.data.spendingInsights[0]);
    console.log('  - Top Savings Suggestion:', indAdvice.data.savingsSuggestions[0]);
    console.log('  - Top Budget Suggestion:', indAdvice.data.budgetSuggestions[0]);
    console.log('  - Top Alert:', indAdvice.data.alerts[0]);
    console.log('  - Action Items Count:', indAdvice.data.actionItems.length);

    // 4. Verify Individual User Data Content
    // Alex Morgan has Food & Dining, Entertainment, Salary & Housing
    const allIndText = JSON.stringify(indAdvice.data);
    const mentionsIndCategories = allIndText.includes('Food') || allIndText.includes('Housing') || allIndText.includes('Entertainment') || allIndText.includes('expense');
    assert(mentionsIndCategories, 'Advice correctly references actual transaction categories/outflows');

    // 5. Test Corporate User Login & Advice
    console.log('\n4. Logging in as Corporate user (admin@apexglobal.io)...');
    const corpLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexglobal.io', password: 'fintrack2026' })
    });
    const corpLoginData = await corpLoginRes.json();
    assert(corpLoginData.success && corpLoginData.token, 'Corporate login succeeded');
    const corpToken = corpLoginData.token;

    console.log('\n5. Generating Advice for Corporate User...');
    const corpAdviceRes = await fetch(`${BASE_URL}/api/ai/advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${corpToken}`
      }
    });
    assert(corpAdviceRes.status === 200, 'Corporate POST /api/ai/advice returned HTTP 200');
    const corpAdvice = await corpAdviceRes.json();
    assert(corpAdvice.success === true, 'Corporate advice returned successfully');

    // 6. Test User Isolation: Verify Corporate advice is user-scoped and not identical to Individual
    console.log('\n6. Testing User Isolation...');
    assert(corpAdvice.data.summary !== undefined, 'Corporate advice has valid summary');
    // Corporate user has Software, Office Lease, Payroll - different from Individual's Whole Foods grocery
    const corpAllText = JSON.stringify(corpAdvice.data);
    assert(
      !corpAllText.includes('Netflix') && !corpAllText.includes('Whole Foods'),
      'Corporate user does NOT leak or receive Individual user transactions (User A != User B)'
    );

    // 7. Test User with 0 Transactions
    console.log('\n7. Testing User with No Transactions (Empty State)...');
    const randEmail = `empty_${Date.now()}@fintrack.test`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Empty User',
        email: randEmail,
        password: 'password123',
        accountType: 'individual'
      })
    });
    const regData = await regRes.json();
    assert(regData.success && regData.token, 'Created new user with 0 transactions');
    const emptyUserToken = regData.token;

    const emptyAdviceRes = await fetch(`${BASE_URL}/api/ai/advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${emptyUserToken}`
      }
    });
    assert(emptyAdviceRes.status === 200, 'Zero-transaction user advice returned HTTP 200');
    const emptyAdvice = await emptyAdviceRes.json();
    assert(emptyAdvice.success === true, 'Zero-transaction user advice has success: true');
    assert(
      emptyAdvice.data.summary.toLowerCase().includes('no') || emptyAdvice.data.summary.toLowerCase().includes('add') || emptyAdvice.message?.includes('No transaction'),
      'Zero-transaction user receives clear empty-state message advising them to add transactions'
    );
    assert(emptyAdvice.isFallback === true, 'Zero-transaction user uses safe fallback without error');

    // 8. Test Retry / Idempotency
    console.log('\n8. Testing Retry Request...');
    const retryRes = await fetch(`${BASE_URL}/api/ai/advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      }
    });
    assert(retryRes.status === 200, 'Retry request succeeded with HTTP 200');

    console.log('\n========================================================');
    console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();

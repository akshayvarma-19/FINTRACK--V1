/**
 * FINTRACK - STEP 10 TEST SUITE: SUPPORT / TICKETS
 * Tests all backend API requirements, authentication, validation,
 * user isolation, status updates, search/filter, and CRUD operations.
 */

const BASE_URL = 'http://localhost:8000';

async function runTests() {
  console.log('========================================================');
  console.log('🧪 FINTRACK STEP 10: SUPPORT / TICKETS TEST SUITE');
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
    // 1. Unauthenticated checks
    console.log('1. Testing Unauthenticated Access...');
    const unauthGet = await fetch(`${BASE_URL}/api/support/tickets`);
    assert(unauthGet.status === 401, 'GET /api/support/tickets rejects without token (HTTP 401)');

    const unauthPost = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: 'Test', description: 'Test ticket', category: 'Other', priority: 'Low' })
    });
    assert(unauthPost.status === 401, 'POST /api/support/tickets rejects without token (HTTP 401)');

    // 2. Login as Individual user
    console.log('\n2. Authenticating as Individual User (alex.morgan@fintrack.io)...');
    const indLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.morgan@fintrack.io', password: 'fintrack2026' })
    });
    const indLogin = await indLoginRes.json();
    assert(indLogin.success && indLogin.token, 'Individual user logged in successfully');
    const indToken = indLogin.token;

    // 3. List Tickets for Individual user
    console.log('\n3. Listing Tickets for Individual User...');
    const listRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      headers: { Authorization: `Bearer ${indToken}` }
    });
    assert(listRes.status === 200, 'GET /api/support/tickets returned HTTP 200');
    const listData = await listRes.json();
    assert(listData.success === true, 'Response has success: true');
    assert(Array.isArray(listData.tickets), 'Response contains tickets array');
    assert(listData.tickets.length >= 2, 'Initial pre-seeded tickets exist for Individual user');

    const firstTicket = listData.tickets[0];
    assert(typeof firstTicket.id === 'string', 'Ticket has id');
    assert(firstTicket.userId === indLogin.user.id, 'Ticket belongs strictly to authenticated user');
    assert(typeof firstTicket.subject === 'string', 'Ticket has subject');
    assert(typeof firstTicket.description === 'string', 'Ticket has description');
    assert(['Account', 'Transaction', 'Dashboard', 'Payment', 'Technical Issue', 'Other'].includes(firstTicket.category), 'Ticket has valid category');
    assert(['Low', 'Medium', 'High'].includes(firstTicket.priority), 'Ticket has valid priority');
    assert(['Open', 'In Progress', 'Resolved', 'Closed'].includes(firstTicket.status), 'Ticket has valid status');
    assert(typeof firstTicket.createdAt === 'string', 'Ticket has createdAt ISO timestamp');
    assert(typeof firstTicket.updatedAt === 'string', 'Ticket has updatedAt ISO timestamp');

    // 4. Create a Support Ticket
    console.log('\n4. Creating New Support Ticket (POST /api/support/tickets)...');
    const createRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({
        subject: 'CSV bank statement formatting inquiry',
        description: 'Encountered an issue with standard date formats when uploading transaction CSVs from HDFC Bank.',
        category: 'Transaction',
        priority: 'High',
        userId: 'usr_malicious_override' // Security test: verify this is ignored
      })
    });
    assert(createRes.status === 201, 'POST /api/support/tickets returned HTTP 201');
    const createData = await createRes.json();
    assert(createData.success === true, 'Ticket created with success: true');
    const createdTicket = createData.ticket;
    assert(createdTicket.userId === indLogin.user.id, 'Backend assigns userId from token, ignoring malicious body override');
    assert(createdTicket.status === 'Open', 'New ticket status is automatically set to "Open"');
    assert(createdTicket.priority === 'High', 'Priority correctly set to "High"');
    assert(createdTicket.category === 'Transaction', 'Category correctly set to "Transaction"');
    assert(createdTicket.createdAt && createdTicket.updatedAt, 'Timestamps properly initialized');

    // 5. Retrieve Ticket By ID
    console.log('\n5. Retrieving Ticket by ID (GET /api/support/tickets/:id)...');
    const getRes = await fetch(`${BASE_URL}/api/support/tickets/${createdTicket.id}`, {
      headers: { Authorization: `Bearer ${indToken}` }
    });
    assert(getRes.status === 200, 'GET /api/support/tickets/:id returned HTTP 200');
    const getData = await getRes.json();
    assert(getData.success === true && getData.ticket.id === createdTicket.id, 'Fetched ticket matches created ticket ID');

    // 6. Update Ticket
    console.log('\n6. Updating Ticket (PUT /api/support/tickets/:id)...');
    const updateRes = await fetch(`${BASE_URL}/api/support/tickets/${createdTicket.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({
        subject: 'CSV bank statement formatting inquiry [UPDATED]',
        description: 'Issue resolved after formatting the dates to YYYY-MM-DD. Requesting ticket closure.',
        status: 'Closed',
        priority: 'Low'
      })
    });
    assert(updateRes.status === 200, 'PUT /api/support/tickets/:id returned HTTP 200');
    const updateData = await updateRes.json();
    assert(updateData.success === true, 'Ticket updated with success: true');
    assert(updateData.ticket.subject.includes('[UPDATED]'), 'Subject updated');
    assert(updateData.ticket.status === 'Closed', 'Status updated to Closed');
    assert(updateData.ticket.priority === 'Low', 'Priority updated to Low');
    assert(updateData.ticket.updatedAt !== createdTicket.createdAt, 'updatedAt timestamp refreshed');

    // 7. Validation Error Handling
    console.log('\n7. Testing Backend Validation Rules...');
    const invalidCatRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({
        subject: 'Valid Subject',
        description: 'Valid Description here',
        category: 'InvalidCategory123',
        priority: 'Low'
      })
    });
    assert(invalidCatRes.status === 400, 'Rejects invalid category with HTTP 400');

    const invalidPrioRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({
        subject: 'Valid Subject',
        description: 'Valid Description here',
        category: 'Other',
        priority: 'ExtremeUrgent'
      })
    });
    assert(invalidPrioRes.status === 400, 'Rejects invalid priority with HTTP 400');

    const shortSubRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${indToken}`
      },
      body: JSON.stringify({
        subject: 'Hi',
        description: 'Valid Description here',
        category: 'Other',
        priority: 'Low'
      })
    });
    assert(shortSubRes.status === 400, 'Rejects short subject (<3 chars) with HTTP 400');

    // 8. User Isolation Tests (Corporate User vs Individual User)
    console.log('\n8. Testing User Isolation with Corporate User (admin@apexglobal.io)...');
    const corpLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexglobal.io', password: 'fintrack2026' })
    });
    const corpLogin = await corpLoginRes.json();
    assert(corpLogin.success && corpLogin.token, 'Corporate user logged in successfully');
    const corpToken = corpLogin.token;

    // Corporate user attempts to view Individual user's ticket
    const crossGetRes = await fetch(`${BASE_URL}/api/support/tickets/${createdTicket.id}`, {
      headers: { Authorization: `Bearer ${corpToken}` }
    });
    assert(crossGetRes.status === 404, 'User B cannot view User A ticket: GET returns HTTP 404');

    // Corporate user attempts to update Individual user's ticket
    const crossPutRes = await fetch(`${BASE_URL}/api/support/tickets/${createdTicket.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${corpToken}`
      },
      body: JSON.stringify({ subject: 'Malicious Hijack' })
    });
    assert(crossPutRes.status === 404, 'User B cannot modify User A ticket: PUT returns HTTP 404');

    // Corporate user lists own tickets
    const corpListRes = await fetch(`${BASE_URL}/api/support/tickets`, {
      headers: { Authorization: `Bearer ${corpToken}` }
    });
    const corpListData = await corpListRes.json();
    assert(corpListData.success === true, 'Corporate user lists own tickets');
    const corpAllMine = corpListData.tickets.every((t) => t.userId === corpLogin.user.id);
    assert(corpAllMine, 'All returned tickets belong exclusively to the Corporate user');

    // 9. Query Filter Tests
    console.log('\n9. Testing Query Filtering on GET /api/support/tickets...');
    const filterStatusRes = await fetch(`${BASE_URL}/api/support/tickets?status=Open`, {
      headers: { Authorization: `Bearer ${indToken}` }
    });
    const filterStatusData = await filterStatusRes.json();
    const allOpen = filterStatusData.tickets.every((t) => t.status === 'Open');
    assert(allOpen, 'Status filter correctly returns only "Open" tickets');

    const searchRes = await fetch(`${BASE_URL}/api/support/tickets?search=CSV`, {
      headers: { Authorization: `Bearer ${indToken}` }
    });
    const searchData = await searchRes.json();
    assert(searchData.tickets.length >= 1, 'Search query correctly finds matching tickets');

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

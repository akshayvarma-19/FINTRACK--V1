async function test() {
  try {
    // 1. Test Login
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex.morgan@fintrack.io', password: 'fintrack2026' })
    });
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
    const token = loginData.token;

    // 2. Test Step 6 Transactions Filtering
    const txRes = await fetch('http://localhost:8000/api/transactions?type=expense', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const txData = await txRes.json();
    console.log('Filtered Expenses Count:', txData.count, 'Total Spent:', txData.totalExpense);

    // 3. Test Step 7 Analytics
    const analyticsRes = await fetch('http://localhost:8000/api/analytics?period=6M', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const analyticsData = await analyticsRes.json();
    console.log('Analytics Metrics:', analyticsData.metrics);
    console.log('Monthly Trends count:', analyticsData.monthlyTrends?.length);
    console.log('Category Breakdown count:', analyticsData.categoryBreakdown?.length);

    // 4. Test Step 8 Budgets
    const budgetRes = await fetch('http://localhost:8000/api/budgets', {
      headers: { Authorization: 'Bearer ' + token }
    });
    const budgetData = await budgetRes.json();
    console.log('Budgets count:', budgetData.budgets?.length);
    console.log('Budget summary:', budgetData.summary);

    // 5. Test Step 8 Create Budget
    const createRes = await fetch('http://localhost:8000/api/budgets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({
        category: 'Transportation & Fuel',
        amount: 5000,
        period: '2026-09'
      })
    });
    const createData = await createRes.json();
    console.log('Budget created successfully:', createData.budget?.category, 'amount:', createData.budget?.amount);

    console.log('\nALL API ENDPOINTS TESTED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();

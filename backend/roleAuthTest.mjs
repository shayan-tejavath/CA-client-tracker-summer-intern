const base = 'http://localhost:5000';
const users = [
  { email: 'admin@test.com', password: 'admin123', role: 'SuperAdmin' },
  { email: 'partner@test.com', password: 'partner123', role: 'Partner' },
  { email: 'manager@test.com', password: 'manager123', role: 'Manager' },
  { email: 'employee@test.com', password: 'employee123', role: 'Employee' },
  { email: 'client@test.com', password: 'client123', role: 'Client' },
];
const endpoints = [
  { path: '/api/auth/profile', name: 'Profile' },
  { path: '/api/dashboard/summary', name: 'DashboardSummary' },
  { path: '/api/clients', name: 'ClientsList' },
  { path: '/api/services', name: 'ServicesList' },
  { path: '/api/tasks', name: 'TasksList' },
  { path: '/api/documents', name: 'DocumentsList' },
  { path: '/api/admin/overview', name: 'AdminOverview' },
  { path: '/api/auth/superadmin', name: 'SuperAdminRoute' },
];

const run = async () => {
  for (const user of users) {
    console.log(`\n=== Testing role: ${user.role} (${user.email}) ===`);
    const loginResp = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const loginText = await loginResp.text();
    console.log('Login:', loginResp.status, loginText);
    if (loginResp.status !== 200) continue;
    const token = JSON.parse(loginText).token;
    for (const endpoint of endpoints) {
      const resp = await fetch(`${base}${endpoint.path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await resp.text();
      const snippet = text.length > 180 ? text.slice(0, 180) + '...' : text;
      console.log(`${endpoint.name}: ${resp.status} ${snippet}`);
    }
  }
};

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

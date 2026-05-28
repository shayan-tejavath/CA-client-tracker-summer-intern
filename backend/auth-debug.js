/**
 * Authentication Debug Test
 * Run with: node auth-debug.js
 * Uses global fetch available in Node 18+
 */

const API_URL = "http://localhost:5000/api";

async function test() {
  console.log("\n=== QwikCA Auth Debug Test ===\n");

  // Test 1: Login
  console.log("1. Testing login...");
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin2@test.com", password: "password123" }),
  });

  const loginData = await loginRes.json();
  console.log("Status:", loginRes.status);
  console.log("Response:", loginData);

  if (!loginRes.ok) {
    console.error("\n❌ Login failed. Create a test user first:");
    console.log("Register endpoint: POST /api/auth/register");
    console.log('Body: { "name": "Admin", "email": "admin@test.com", "password": "password123", "role": "SuperAdmin" }');
    return;
  }

  const { token, role } = loginData;
  console.log(`\n✓ Login successful`);
  console.log(`  Role: ${role}`);
  console.log(`  Token: ${token.substring(0, 20)}...`);

  // Test 2: Access Protected Route with Token
  console.log("\n2. Testing protected route (GET /auth/profile)...");
  const profileRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const profileData = await profileRes.json();
  console.log("Status:", profileRes.status);
  console.log("Response:", profileData);

  if (!profileRes.ok) {
    console.error("\n❌ Protected route access failed");
    return;
  }

  console.log("\n✓ Protected route accessible");

  // Test 3: Role-Based Access - SuperAdmin Route
  console.log("\n3. Testing role-based access (GET /admin/overview)...");
  const adminRes = await fetch(`${API_URL}/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const adminData = await adminRes.json();
  console.log("Status:", adminRes.status);
  console.log("Response:", adminData);

  if (!adminRes.ok) {
    console.error("\n❌ Admin access failed");
    if (adminRes.status === 403) {
      console.error("   User role:", role);
      console.error("   Required role: SuperAdmin");
    }
    return;
  }

  console.log("\n✓ Admin route accessible");

  // Test 4: Access Without Token
  console.log("\n4. Testing protected route without token...");
  const noTokenRes = await fetch(`${API_URL}/auth/profile`);

  const noTokenData = await noTokenRes.json();
  console.log("Status:", noTokenRes.status);
  console.log("Response:", noTokenData);

  if (noTokenRes.status === 401) {
    console.log("\n✓ Correctly rejected unauthorized request");
  } else {
    console.error("\n❌ Should have rejected request without token");
  }

  // Test 5: Access with Invalid Token
  console.log("\n5. Testing with invalid token...");
  const invalidRes = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: "Bearer invalid_token_123" },
  });

  const invalidData = await invalidRes.json();
  console.log("Status:", invalidRes.status);
  console.log("Response:", invalidData);

  if (invalidRes.status === 401) {
    console.log("\n✓ Correctly rejected invalid token");
  } else {
    console.error("\n❌ Should have rejected invalid token");
  }

  console.log("\n=== Test Complete ===\n");
}

test().catch(console.error);

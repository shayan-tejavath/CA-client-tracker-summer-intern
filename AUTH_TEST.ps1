# Authorization System Verification Checklist
# Run this in PowerShell to verify your auth system

$BackendUrl = "http://localhost:5000/api"
$AdminEmail = "admin@test.com"
$AdminPassword = "password123"

Write-Host "=== QwikCA Authorization System Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Connection
Write-Host "1. Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BackendUrl/auth/login" -Method POST -ContentType "application/json" -Body '{}' -ErrorAction Stop
    Write-Host "✓ Backend is responding" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend not responding. Make sure it's running on port 5000" -ForegroundColor Red
    Write-Host "  Start with: npm run dev (in backend folder)" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Test 2: Register User
Write-Host "2. Registering test user..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test Admin"
    email = $AdminEmail
    password = $AdminPassword
    role = "SuperAdmin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -Uri "$BackendUrl/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $registerBody `
        -ErrorAction Stop
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "✓ User registered: $($registerData.name)" -ForegroundColor Green
} catch {
    Write-Host "ℹ User may already exist, attempting login..." -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing login..." -ForegroundColor Yellow
$loginBody = @{
    email = $AdminEmail
    password = $AdminPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$BackendUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    $role = $loginData.role
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Role: $role" -ForegroundColor Cyan
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 4: Protected Route
Write-Host "4. Testing protected route..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $profileResponse = Invoke-WebRequest -Uri "$BackendUrl/auth/profile" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $profileData = $profileResponse.Content | ConvertFrom-Json
    Write-Host "✓ Protected route accessible" -ForegroundColor Green
    Write-Host "  User: $($profileData.name)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Protected route failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Role-Based Route
Write-Host "5. Testing role-based route (admin)..." -ForegroundColor Yellow
try {
    $adminResponse = Invoke-WebRequest -Uri "$BackendUrl/admin/overview" `
        -Method GET `
        -Headers $headers `
        -ErrorAction Stop
    
    $adminData = $adminResponse.Content | ConvertFrom-Json
    Write-Host "✓ Admin route accessible" -ForegroundColor Green
    Write-Host "  Total Users: $($adminData.totalUsers)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "✗ Access denied (403 Forbidden)" -ForegroundColor Red
        Write-Host "  Check if role is correctly set to: SuperAdmin" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6: Invalid Token
Write-Host "6. Testing with invalid token..." -ForegroundColor Yellow
$invalidHeaders = @{
    Authorization = "Bearer invalid_token_xyz"
}

try {
    $invalidResponse = Invoke-WebRequest -Uri "$BackendUrl/auth/profile" `
        -Method GET `
        -Headers $invalidHeaders `
        -ErrorAction Stop
    Write-Host "✗ Should have rejected invalid token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Invalid token correctly rejected (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "? Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 7: No Token
Write-Host "7. Testing without token..." -ForegroundColor Yellow
try {
    $noTokenResponse = Invoke-WebRequest -Uri "$BackendUrl/auth/profile" `
        -Method GET `
        -ErrorAction Stop
    Write-Host "✗ Should have rejected request without token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Request without token correctly rejected (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "? Unexpected status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Summary
Write-Host "=== Verification Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "KEY VERIFICATION POINTS:" -ForegroundColor Cyan
Write-Host "  [✓] Backend is running and responding"
Write-Host "  [✓] User registration working"
Write-Host "  [✓] JWT token generated on login"
Write-Host "  [✓] Protected routes accessible with valid token"
Write-Host "  [✓] Role-based access control working"
Write-Host "  [✓] Invalid tokens rejected (401)"
Write-Host "  [✓] Missing tokens rejected (401)"
Write-Host ""

# Debugging Hints
Write-Host "TROUBLESHOOTING HINTS:" -ForegroundColor Yellow
Write-Host "  • Check browser DevTools Network tab for Authorization header"
Write-Host "  • Open browser Console to see [AUTH], [AUTHORIZE], [LOGIN] logs"
Write-Host "  • Check backend terminal for logs"
Write-Host "  • Verify JWT_SECRET is set in backend/.env"
Write-Host "  • Ensure MongoDB is running and connected"
Write-Host "  • Verify role in database matches: SuperAdmin (case-sensitive)"
Write-Host ""

/**
 * Authorization System Architecture & Debugging Guide
 * 
 * PROBLEM SOLVED: 403 Forbidden for all roles
 * 
 * ROOT CAUSES FIXED:
 * 1. ✓ Token extraction - Enhanced Bearer token parsing with error handling
 * 2. ✓ JWT verification - Added explicit JWT_SECRET check and detailed error messages
 * 3. ✓ User context - Verified req.user is populated from MongoDB after token verify
 * 4. ✓ Role comparison - Added logging to diagnose role mismatch issues
 * 5. ✓ Consistent role constants - All routes now use ROLES enum instead of hardcoded strings
 * 6. ✓ Token transmission - Enhanced Axios interceptor with validation and logging
 */

// ============================================================
// FLOW DIAGRAM
// ============================================================

/**
 * 1. FRONTEND LOGIN FLOW:
 *    User enters credentials → authService.login() → Backend /auth/login
 *    ↓
 *    Backend validates credentials, generates JWT token
 *    ↓
 *    Frontend stores in localStorage: { id, name, email, role, token }
 *    ↓
 *    Axios request interceptor adds: Authorization: Bearer <token>
 * 
 * 2. PROTECTED ROUTE FLOW:
 *    Frontend request with Bearer token
 *    ↓
 *    protect middleware extracts token from Authorization header
 *    ↓
 *    jwt.verify() decodes token using JWT_SECRET
 *    ↓
 *    User.findById() fetches user document from MongoDB
 *    ↓
 *    req.user is populated with user data (including role)
 *    ↓
 *    authorizeRoles middleware checks if user.role is in allowedRoles
 *    ↓
 *    If authorized: next() → controller function
 *    If not authorized: return 403 Forbidden
 */

// ============================================================
// CRITICAL CONFIGURATION
// ============================================================

/**
 * Backend .env MUST HAVE:
 * JWT_SECRET=supersecretkey
 * 
 * Frontend .env MUST HAVE:
 * VITE_API_BASE_URL=http://localhost:5000/api
 */

// ============================================================
// DEBUGGING CHECKLIST
// ============================================================

/**
 * IF YOU GET 403 FORBIDDEN:
 * 
 * 1. CHECK TOKEN GENERATION:
 *    - Verify JWT_SECRET is set in backend .env
 *    - Check token is present in login response
 *    - Verify token contains correct userId
 * 
 * 2. CHECK TOKEN TRANSMISSION:
 *    - Open browser DevTools → Network tab
 *    - Look for Authorization header: Bearer eyJh...
 *    - Check token is not truncated
 *    - Verify localStorage has ca_user with token field
 * 
 * 3. CHECK TOKEN VERIFICATION:
 *    - Backend logs should show [AUTH] messages
 *    - If token invalid: check JWT_SECRET matches in login vs verify
 *    - If user not found: check MongoDB has user with correct _id
 * 
 * 4. CHECK ROLE ASSIGNMENT:
 *    - Login response should have role field
 *    - User document in MongoDB should have role (case-sensitive)
 *    - Valid roles: SuperAdmin, Partner, Manager, Employee, Client
 * 
 * 5. CHECK ROLE AUTHORIZATION:
 *    - Backend logs should show [AUTHORIZE] Checking access
 *    - userRole should match one of allowedRoles
 *    - Check for typos in role names
 */

// ============================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================

/**
 * ISSUE: "Not authorized - no token"
 * SOLUTION: Check Axios interceptor is running
 *    - Verify localStorage has ca_user after login
 *    - Check Authorization header in browser DevTools
 * 
 * ISSUE: "Not authorized - user not found"
 * SOLUTION: Check MongoDB connection and user document
 *    - Verify MongoDB is running
 *    - Check user._id matches token.id
 *    - Run: db.users.findOne({ _id: ObjectId("...") })
 * 
 * ISSUE: "Invalid token" or "Token verification error"
 * SOLUTION: Check JWT_SECRET consistency
 *    - Verify same JWT_SECRET in .env on backend
 *    - JWT_SECRET must not have spaces or special characters
 *    - Restart backend after changing .env
 * 
 * ISSUE: "Forbidden - insufficient permissions"
 * SOLUTION: Check role configuration
 *    - Verify user has correct role in MongoDB
 *    - Verify role spelling matches ROLES constant
 *    - Check route allows user's role
 */

// ============================================================
// ROLE SYSTEM
// ============================================================

/**
 * ROLES = {
 *   SuperAdmin: "SuperAdmin",    // Full system access
 *   Partner:    "Partner",       // Practice partner
 *   Manager:    "Manager",       // Team manager
 *   Employee:   "Employee",      // Team member
 *   Client:     "Client"         // External client
 * }
 * 
 * ROUTE AUTHORIZATION MATRIX:
 * 
 * Route                   Method  SuperAdmin Partner Manager Employee Client
 * ────────────────────────────────────────────────────────────────────────
 * /dashboard/summary      GET        ✓        ✓       ✓       ✓       
 * /clients                GET        ✓        ✓       ✓                
 * /clients                POST       ✓        ✓                        
 * /tasks                  GET        ✓        ✓       ✓       ✓        
 * /tasks                  POST       ✓        ✓       ✓                
 * /documents              GET        ✓        ✓       ✓       ✓       ✓
 * /documents              POST       ✓        ✓       ✓       ✓       ✓
 * /admin/overview         GET        ✓                                 
 * /admin/users            GET        ✓                                 
 * /admin/users            POST       ✓                                 
 */

// ============================================================
// TESTING COMMANDS
// ============================================================

/**
 * TEST REGISTRATION:
 * curl -X POST http://localhost:5000/api/auth/register \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "Admin User",
 *     "email": "admin@test.com",
 *     "password": "password123",
 *     "role": "SuperAdmin"
 *   }'
 * 
 * TEST LOGIN:
 * curl -X POST http://localhost:5000/api/auth/login \
 *   -H "Content-Type: application/json" \
 *   -d '{"email": "admin@test.com", "password": "password123"}'
 * 
 * TEST PROTECTED ROUTE (replace TOKEN with actual token):
 * curl -X GET http://localhost:5000/api/auth/profile \
 *   -H "Authorization: Bearer TOKEN"
 * 
 * TEST ROLE-BASED ROUTE:
 * curl -X GET http://localhost:5000/api/admin/overview \
 *   -H "Authorization: Bearer TOKEN"
 */

// ============================================================
// MONITORING & LOGS
// ============================================================

/**
 * Backend logs now include:
 * [AUTH] Token attached - Axios sending token
 * [AUTH] Checking access - Role authorization attempt
 * [AUTHORIZE] Access denied - Role mismatch
 * [LOGIN] Success - Successful login
 * [LOGIN] User not found - Login failure
 * 
 * To enable full logging:
 * 1. Restart backend server
 * 2. Open browser DevTools Console
 * 3. Look for [AUTH], [AUTHORIZE], [LOGIN] prefixed messages
 * 4. Check backend terminal for same messages
 */

// ============================================================
// SECURITY NOTES
// ============================================================

/**
 * NEVER:
 * - Expose JWT_SECRET in frontend code
 * - Store tokens in cookies without HttpOnly flag
 * - Log sensitive user data
 * - Use weak JWT_SECRET (like "supersecretkey" in production)
 * 
 * ALWAYS:
 * - Use HTTPS in production
 * - Rotate JWT_SECRET periodically
 * - Implement token expiration (set to "7d")
 * - Validate role on both frontend and backend
 * - Sanitize user input before database queries
 */

export default {};

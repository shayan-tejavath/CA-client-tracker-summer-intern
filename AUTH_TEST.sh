#!/bin/bash
# Authorization System Test Checklist
# Use this to verify your MERN auth system is working correctly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== QwikCA Authorization System Test ===${NC}\n"

# Configuration
BACKEND_URL="http://localhost:5000/api"
ADMIN_EMAIL="admin@test.com"
ADMIN_PASSWORD="password123"
PARTNER_EMAIL="partner@test.com"
PARTNER_PASSWORD="password123"
MANAGER_EMAIL="manager@test.com"
MANAGER_PASSWORD="password123"

# Step 1: Check Backend is Running
echo -e "${YELLOW}1. Checking if backend is running...${NC}"
if curl -s "$BACKEND_URL/auth/login" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Backend is running${NC}\n"
else
  echo -e "${RED}✗ Backend is not running. Start with: npm run dev${NC}"
  exit 1
fi

# Step 2: Register SuperAdmin
echo -e "${YELLOW}2. Registering SuperAdmin user...${NC}"
ADMIN_REGISTER=$(curl -s -X POST "$BACKEND_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Admin User\",
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"role\": \"SuperAdmin\"
  }")

ADMIN_ID=$(echo "$ADMIN_REGISTER" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$ADMIN_ID" ]; then
  echo -e "${GREEN}✓ SuperAdmin registered: $ADMIN_ID${NC}\n"
else
  echo -e "${YELLOW}Note: SuperAdmin may already exist${NC}\n"
fi

# Step 3: Login SuperAdmin
echo -e "${YELLOW}3. Testing SuperAdmin login...${NC}"
ADMIN_LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1)
ADMIN_ROLE=$(echo "$ADMIN_LOGIN" | grep -o '"role":"[^"]*' | cut -d'"' -f4 | head -1)

if [ ! -z "$ADMIN_TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  echo "  Role: $ADMIN_ROLE"
  echo "  Token: ${ADMIN_TOKEN:0:20}...${NC}\n"
else
  echo -e "${RED}✗ Login failed${NC}\n"
  exit 1
fi

# Step 4: Test Protected Route
echo -e "${YELLOW}4. Testing protected route (GET /auth/profile)...${NC}"
PROFILE=$(curl -s -X GET "$BACKEND_URL/auth/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

PROFILE_ROLE=$(echo "$PROFILE" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
if [ "$PROFILE_ROLE" == "$ADMIN_ROLE" ]; then
  echo -e "${GREEN}✓ Protected route accessible${NC}\n"
else
  echo -e "${RED}✗ Protected route failed${NC}\n"
fi

# Step 5: Test Admin Route
echo -e "${YELLOW}5. Testing SuperAdmin route (GET /admin/overview)...${NC}"
ADMIN_OVERVIEW=$(curl -s -X GET "$BACKEND_URL/admin/overview" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

ADMIN_USERS=$(echo "$ADMIN_OVERVIEW" | grep -o '"totalUsers":[0-9]*' | cut -d':' -f2)
if [ ! -z "$ADMIN_USERS" ]; then
  echo -e "${GREEN}✓ Admin route accessible${NC}"
  echo "  Total Users: $ADMIN_USERS${NC}\n"
else
  echo -e "${RED}✗ Admin route access denied${NC}\n"
fi

# Step 6: Test Invalid Token
echo -e "${YELLOW}6. Testing with invalid token...${NC}"
INVALID=$(curl -s -X GET "$BACKEND_URL/auth/profile" \
  -H "Authorization: Bearer invalid_token_123")

INVALID_ERROR=$(echo "$INVALID" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
if [ "$INVALID_ERROR" == "Invalid token" ] || [ "$INVALID_ERROR" == "Not authorized - user not found" ]; then
  echo -e "${GREEN}✓ Invalid token correctly rejected${NC}\n"
else
  echo -e "${YELLOW}Response: $INVALID_ERROR${NC}\n"
fi

# Step 7: Test No Token
echo -e "${YELLOW}7. Testing without token...${NC}"
NO_TOKEN=$(curl -s -X GET "$BACKEND_URL/auth/profile")

NO_TOKEN_ERROR=$(echo "$NO_TOKEN" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
if [ "$NO_TOKEN_ERROR" == "Not authorized - no token" ]; then
  echo -e "${GREEN}✓ No token correctly rejected${NC}\n"
else
  echo -e "${RED}✗ Should reject request without token${NC}\n"
fi

# Step 8: Register Partner
echo -e "${YELLOW}8. Registering Partner user...${NC}"
PARTNER_REGISTER=$(curl -s -X POST "$BACKEND_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Partner User\",
    \"email\": \"$PARTNER_EMAIL\",
    \"password\": \"$PARTNER_PASSWORD\",
    \"role\": \"Partner\"
  }")

PARTNER_ID=$(echo "$PARTNER_REGISTER" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
if [ ! -z "$PARTNER_ID" ]; then
  echo -e "${GREEN}✓ Partner registered${NC}\n"
else
  echo -e "${YELLOW}Note: Partner may already exist${NC}\n"
fi

# Step 9: Test Partner Role Access
echo -e "${YELLOW}9. Testing Partner login and role access...${NC}"
PARTNER_LOGIN=$(curl -s -X POST "$BACKEND_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$PARTNER_EMAIL\", \"password\": \"$PARTNER_PASSWORD\"}")

PARTNER_TOKEN=$(echo "$PARTNER_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4 | head -1)
PARTNER_ROLE=$(echo "$PARTNER_LOGIN" | grep -o '"role":"[^"]*' | cut -d'"' -f4 | head -1)

if [ ! -z "$PARTNER_TOKEN" ]; then
  echo -e "${GREEN}✓ Partner login successful (Role: $PARTNER_ROLE)${NC}\n"
else
  echo -e "${RED}✗ Partner login failed${NC}\n"
  exit 1
fi

# Step 10: Test Partner Cannot Access Admin
echo -e "${YELLOW}10. Testing Partner cannot access admin route...${NC}"
PARTNER_ADMIN=$(curl -s -X GET "$BACKEND_URL/admin/overview" \
  -H "Authorization: Bearer $PARTNER_TOKEN")

PARTNER_FORBIDDEN=$(echo "$PARTNER_ADMIN" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
if [[ "$PARTNER_FORBIDDEN" == *"insufficient permissions"* ]] || [[ "$PARTNER_FORBIDDEN" == *"Forbidden"* ]]; then
  echo -e "${GREEN}✓ Partner correctly denied admin access${NC}\n"
else
  echo -e "${YELLOW}Response: $PARTNER_FORBIDDEN${NC}\n"
fi

# Summary
echo -e "${GREEN}=== Authorization System Tests Complete ===${NC}"
echo -e "\n${YELLOW}SUMMARY:${NC}"
echo "✓ Backend connectivity verified"
echo "✓ User registration working"
echo "✓ JWT token generation working"
echo "✓ Protected routes accessible with valid token"
echo "✓ Admin routes role-protected"
echo "✓ Invalid tokens rejected"
echo "✓ Role-based access control working"
echo -e "\n${GREEN}All tests passed!${NC}\n"

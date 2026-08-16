#!/usr/bin/env python3
"""Backend API Testing for SIPRO Construction Progress Engine v2 (Phase 31)

Tests all backend endpoints including:
- Authentication
- Build templates
- Build schedules
- Build items (with new filters: status=todo|open)
- Build summary and monitoring
- Portal progress
- Regression tests for existing endpoints
"""
import sys
import requests
from datetime import datetime

# Use public endpoint from frontend/.env
BASE_URL = "https://project-mutu.preview.emergentagent.com/api"
PASSWORD = "Sipro#2026"

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tokens = {}
        
    def test(self, name, condition, detail=""):
        """Run a single test assertion"""
        if condition:
            self.passed += 1
            print(f"  ✓ PASS: {name}")
            if detail:
                print(f"         {detail}")
        else:
            self.failed += 1
            print(f"  ✗ FAIL: {name}")
            if detail:
                print(f"         {detail}")
        return condition
    
    def login(self, email):
        """Login and store token"""
        try:
            r = requests.post(f"{BASE_URL}/auth/login", 
                            json={"email": email, "password": PASSWORD}, 
                            timeout=30)
            if r.status_code == 200:
                self.tokens[email] = r.json()["access_token"]
                return True
            else:
                print(f"  Login failed for {email}: {r.status_code} - {r.text[:100]}")
                return False
        except Exception as e:
            print(f"  Login error for {email}: {str(e)}")
            return False
    
    def headers(self, email):
        """Get auth headers for user"""
        return {"Authorization": f"Bearer {self.tokens.get(email, '')}"}
    
    def get(self, path, email, params=None):
        """GET request"""
        try:
            return requests.get(f"{BASE_URL}{path}", 
                              headers=self.headers(email),
                              params=params or {},
                              timeout=30)
        except Exception as e:
            print(f"  GET {path} error: {str(e)}")
            return None
    
    def post(self, path, email, data=None):
        """POST request"""
        try:
            return requests.post(f"{BASE_URL}{path}",
                               headers=self.headers(email),
                               json=data or {},
                               timeout=30)
        except Exception as e:
            print(f"  POST {path} error: {str(e)}")
            return None
    
    def summary(self):
        """Print test summary"""
        total = self.passed + self.failed
        print("\n" + "="*60)
        print(f"TEST SUMMARY: {self.passed}/{total} passed")
        if self.failed > 0:
            print(f"FAILED: {self.failed} tests")
            return 1
        else:
            print("ALL TESTS PASSED ✓")
            return 0


def main():
    runner = TestRunner()
    
    print("="*60)
    print("SIPRO CONSTRUCTION PROGRESS ENGINE v2 - BACKEND TESTS")
    print("="*60)
    
    # ========== AUTHENTICATION ==========
    print("\n[1] AUTHENTICATION")
    runner.test("Login pm@sipro.co.id", runner.login("pm@sipro.co.id"))
    runner.test("Login site@sipro.co.id", runner.login("site@sipro.co.id"))
    runner.test("Login owner@sipro.co.id", runner.login("owner@sipro.co.id"))
    runner.test("Login sales@sipro.co.id", runner.login("sales@sipro.co.id"))
    
    if not runner.tokens.get("pm@sipro.co.id"):
        print("\n✗ Cannot proceed without PM login")
        return 1
    
    # ========== HEALTH CHECK ==========
    print("\n[2] HEALTH CHECK")
    r = runner.get("/health", "pm@sipro.co.id")
    runner.test("GET /api/health returns 200", r and r.status_code == 200,
                f"Status: {r.status_code if r else 'N/A'}")
    
    # ========== BUILD TEMPLATES ==========
    print("\n[3] BUILD TEMPLATES")
    r = runner.get("/build/templates", "pm@sipro.co.id")
    runner.test("GET /api/build/templates returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        templates = r.json().get("data", [])
        runner.test("Templates list is not empty", len(templates) > 0,
                   f"Found {len(templates)} templates")
        
        # Check for default templates
        codes = [t.get("code") for t in templates]
        runner.test("RUMAH-9W template exists", "RUMAH-9W" in codes)
        runner.test("RUKO-14W template exists", "RUKO-14W" in codes)
        
        # Check template details
        rumah = next((t for t in templates if t.get("code") == "RUMAH-9W"), None)
        if rumah:
            runner.test("RUMAH-9W has 20 steps", rumah.get("steps_count") == 20,
                       f"Steps: {rumah.get('steps_count')}")
            runner.test("RUMAH-9W has 60 days", rumah.get("total_days") == 60,
                       f"Days: {rumah.get('total_days')}")
            runner.test("RUMAH-9W has 100% weight", 
                       abs(rumah.get("total_weight", 0) - 100) < 1,
                       f"Weight: {rumah.get('total_weight')}%")
            
            # Get full template details
            template_id = rumah.get("id")
            r2 = runner.get(f"/build/templates/{template_id}", "pm@sipro.co.id")
            runner.test(f"GET /api/build/templates/{template_id} returns 200",
                       r2 and r2.status_code == 200)
    
    # ========== BUILD SCHEDULES ==========
    print("\n[4] BUILD SCHEDULES")
    r = runner.get("/build/schedules", "pm@sipro.co.id", {"limit": 10})
    runner.test("GET /api/build/schedules returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        data = r.json()
        schedules = data.get("data", [])
        summary = data.get("summary", {})
        can = data.get("can", {})
        
        runner.test("Schedules list returned", isinstance(schedules, list),
                   f"Found {len(schedules)} schedules")
        runner.test("Summary data included", bool(summary),
                   f"Keys: {list(summary.keys())[:5]}")
        runner.test("Permissions (can) included", bool(can),
                   f"Can: {can}")
        
        # Check PM permissions
        runner.test("PM can submit", can.get("submit") == True)
        runner.test("PM can verify", can.get("verify") == True)
        runner.test("PM can override", can.get("override") == True)
        runner.test("PM can configure", can.get("configure") == True)
    
    # ========== BUILD SUMMARY ==========
    print("\n[5] BUILD SUMMARY")
    r = runner.get("/build/summary", "pm@sipro.co.id")
    runner.test("GET /api/build/summary returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        summary = r.json().get("data", {})
        required_keys = [
            "units_total", "scheduled", "unscheduled", "avg_progress", 
            "avg_planned", "awaiting_verification", "rework", "late_items",
            "blocked_items", "overrides", "at_risk"
        ]
        
        for key in required_keys:
            runner.test(f"Summary has '{key}' key", key in summary,
                       f"Value: {summary.get(key)}")
    
    # ========== BUILD ITEMS (NEW FILTERS) ==========
    print("\n[6] BUILD ITEMS - NEW FILTERS (status=todo|open)")
    
    # Get all items
    r_all = runner.get("/build/items", "pm@sipro.co.id", {"limit": 100})
    runner.test("GET /api/build/items (all) returns 200", 
               r_all and r_all.status_code == 200)
    
    # Get todo items
    r_todo = runner.get("/build/items", "pm@sipro.co.id", 
                       {"status": "todo", "limit": 100})
    runner.test("GET /api/build/items?status=todo returns 200",
               r_todo and r_todo.status_code == 200)
    
    # Get open items
    r_open = runner.get("/build/items", "pm@sipro.co.id",
                       {"status": "open", "limit": 100})
    runner.test("GET /api/build/items?status=open returns 200",
               r_open and r_open.status_code == 200)
    
    if r_all and r_todo and r_open:
        total_all = r_all.json().get("total", 0)
        total_todo = r_todo.json().get("total", 0)
        total_open = r_open.json().get("total", 0)
        
        runner.test("Filter relationship: todo <= open <= all",
                   total_todo <= total_open <= total_all,
                   f"todo={total_todo}, open={total_open}, all={total_all}")
        
        # Check todo items only have correct statuses
        todo_items = r_todo.json().get("data", [])
        if todo_items:
            valid_statuses = ["ready", "in_progress", "rework"]
            all_valid = all(item.get("status") in valid_statuses 
                          for item in todo_items)
            runner.test("status=todo only returns ready/in_progress/rework",
                       all_valid,
                       f"Sample statuses: {[i.get('status') for i in todo_items[:3]]}")
    
    # Test mine=true filter
    if runner.tokens.get("site@sipro.co.id"):
        r_mine = runner.get("/build/items", "site@sipro.co.id",
                          {"mine": "true", "status": "todo", "limit": 100})
        runner.test("GET /api/build/items?mine=true returns 200",
                   r_mine and r_mine.status_code == 200)
        
        if r_mine and r_mine.status_code == 200:
            mine_items = r_mine.json().get("data", [])
            if mine_items:
                all_mine = all(item.get("assigned_to") == "site@sipro.co.id"
                             for item in mine_items)
                runner.test("mine=true only returns user's items", all_mine,
                           f"Sample: {mine_items[0].get('assigned_to') if mine_items else 'N/A'}")
    
    # ========== BUILD DELAYS ==========
    print("\n[7] BUILD DELAYS")
    r = runner.get("/build/delays", "pm@sipro.co.id")
    runner.test("GET /api/build/delays returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        delays = r.json().get("data", {})
        runner.test("Delays report has structure", bool(delays),
                   f"Keys: {list(delays.keys())}")
    
    # ========== BUILD UNSCHEDULED ==========
    print("\n[8] BUILD UNSCHEDULED UNITS")
    r = runner.get("/build/unscheduled", "pm@sipro.co.id")
    runner.test("GET /api/build/unscheduled returns 200", 
               r and r.status_code == 200)
    
    if r and r.status_code == 200:
        unscheduled = r.json().get("data", [])
        runner.test("Unscheduled units list returned", isinstance(unscheduled, list),
                   f"Found {len(unscheduled)} unscheduled units")
    
    # ========== BUILD TICK ==========
    print("\n[9] BUILD TICK (MONITORING)")
    r = runner.post("/build/tick", "pm@sipro.co.id")
    runner.test("POST /api/build/tick returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        tick_data = r.json().get("data", {})
        runner.test("Tick returns monitoring data", bool(tick_data),
                   f"Gates opened: {tick_data.get('gates_opened', 0)}, "
                   f"Reminders: {tick_data.get('reminders', 0)}, "
                   f"Escalations: {tick_data.get('escalations', 0)}")
    
    # ========== UNIT SCHEDULE DETAILS ==========
    print("\n[10] UNIT SCHEDULE DETAILS")
    # Get a unit with schedule (A-01 mentioned in requirements)
    r = runner.get("/build/schedules", "pm@sipro.co.id", {"limit": 1})
    if r and r.status_code == 200:
        schedules = r.json().get("data", [])
        if schedules:
            unit_id = schedules[0].get("unit_id")
            r2 = runner.get(f"/build/unit/{unit_id}", "pm@sipro.co.id")
            runner.test(f"GET /api/build/unit/{unit_id} returns 200",
                       r2 and r2.status_code == 200)
            
            if r2 and r2.status_code == 200:
                bundle = r2.json()
                runner.test("Unit bundle has schedule data", 
                           bundle.get("data") is not None)
                runner.test("Unit bundle has items", 
                           len(bundle.get("items", [])) > 0,
                           f"Items: {len(bundle.get('items', []))}")
                runner.test("Unit bundle has weeks grouping",
                           len(bundle.get("weeks", [])) > 0,
                           f"Weeks: {len(bundle.get('weeks', []))}")
                runner.test("Unit bundle has timeline",
                           bundle.get("timeline") is not None)
                runner.test("Unit bundle has permissions",
                           bundle.get("can") is not None)
    
    # ========== RBAC TESTS ==========
    print("\n[11] RBAC - SITE ENGINEER PERMISSIONS")
    if runner.tokens.get("site@sipro.co.id"):
        r = runner.get("/build/schedules", "site@sipro.co.id", {"limit": 1})
        if r and r.status_code == 200:
            can = r.json().get("can", {})
            runner.test("Site engineer can submit", can.get("submit") == True)
            runner.test("Site engineer CANNOT verify", can.get("verify") == False)
            runner.test("Site engineer CANNOT override", can.get("override") == False)
            runner.test("Site engineer CANNOT configure", can.get("configure") == False)
    
    print("\n[12] RBAC - SALES ACCESS DENIED")
    if runner.tokens.get("sales@sipro.co.id"):
        r = runner.get("/construction", "sales@sipro.co.id")
        runner.test("Sales user denied access to construction",
                   r and r.status_code in [403, 404],
                   f"Status: {r.status_code if r else 'N/A'}")
    
    # ========== REGRESSION TESTS ==========
    print("\n[13] REGRESSION - EXISTING ENDPOINTS")
    
    # Work Hub
    r = runner.get("/work/home", "pm@sipro.co.id")
    runner.test("GET /api/work/home returns 200", r and r.status_code == 200)
    
    # Inspections
    r = runner.get("/inspections", "pm@sipro.co.id", {"limit": 10})
    runner.test("GET /api/inspections returns 200", r and r.status_code == 200)
    
    # Projects
    r = runner.get("/projects", "pm@sipro.co.id")
    runner.test("GET /api/projects returns 200", r and r.status_code == 200)
    
    if r and r.status_code == 200:
        projects = r.json().get("data", [])
        if projects:
            project_id = projects[0].get("id")
            
            # Construction phases
            r2 = runner.get(f"/construction/project/{project_id}/phases", "pm@sipro.co.id")
            runner.test(f"GET /api/construction/project/{project_id}/phases returns 200",
                       r2 and r2.status_code == 200)
    
    # ========== PORTAL TESTS ==========
    print("\n[14] PORTAL - BUYER PROGRESS")
    
    # Portal login with OTP (correct paths: /portal/auth/request-otp and /portal/auth/verify-otp)
    try:
        # Request OTP
        r1 = requests.post(f"{BASE_URL}/portal/auth/request-otp",
                          json={"identifier": "+628121111111"},
                          timeout=30)
        runner.test("Portal OTP request returns 200", 
                   r1.status_code == 200,
                   f"Status: {r1.status_code}")
        
        if r1.status_code == 200:
            # Verify OTP
            r2 = requests.post(f"{BASE_URL}/portal/auth/verify-otp",
                             json={"identifier": "+628121111111", "otp": "000000"},
                             timeout=30)
            runner.test("Portal OTP verification returns 200",
                       r2.status_code == 200,
                       f"Status: {r2.status_code}")
            
            if r2.status_code == 200:
                portal_token = r2.json().get("access_token")
                portal_headers = {"Authorization": f"Bearer {portal_token}"}
                
                # Get progress
                r3 = requests.get(f"{BASE_URL}/portal/progress",
                                headers=portal_headers,
                                timeout=30)
                runner.test("GET /api/portal/progress returns 200",
                           r3.status_code == 200)
                
                if r3.status_code == 200:
                    progress = r3.json().get("data", {})
                    build = progress.get("build", {})
                    
                    runner.test("Portal progress has build data",
                               bool(build),
                               f"Progress: {build.get('progress')}%")
                    runner.test("Portal progress has milestones",
                               "milestones" in build,
                               f"Milestones: {len(build.get('milestones', []))}")
    except Exception as e:
        print(f"  Portal test error: {str(e)}")
    
    # ========== FINAL SUMMARY ==========
    return runner.summary()


if __name__ == "__main__":
    sys.exit(main())

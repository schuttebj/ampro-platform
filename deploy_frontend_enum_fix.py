#!/usr/bin/env python3
"""
Deploy Frontend PrintJobStatus Enum Fix

This script commits and pushes the frontend fixes for PrintJobStatus enum handling.

Usage:
    python deploy_frontend_enum_fix.py
"""

import subprocess
import sys
import os

def run_command(cmd, description):
    """Run a command and show output"""
    print(f"\n{description}...")
    print(f"Running: {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} successful")
            if result.stdout.strip():
                print(f"Output: {result.stdout.strip()}")
        else:
            print(f"❌ {description} failed")
            print(f"Error: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"❌ Error running command: {e}")
        return False
    
    return True

def main():
    """Deploy the frontend PrintJobStatus enum fixes"""
    
    print("=" * 70)
    print("🚀 AMPRO CORE FRONTEND - PrintJobStatus Enum Fix Deployment")
    print("=" * 70)
    
    # Git operations
    commands = [
        ("git add .", "Adding frontend enum fix files"),
        ("git commit -m \"Fix: Frontend PrintJobStatus enum handling (lowercase to uppercase)\"", "Committing changes"),
        ("git push origin main", "Pushing to GitHub")
    ]
    
    success = True
    for cmd, desc in commands:
        if not run_command(cmd, desc):
            success = False
            break
    
    if success:
        print("\n✅ All Git operations completed successfully!")
        
        print("\n" + "="*70)
        print("📋 FRONTEND DEPLOYMENT SUMMARY")
        print("="*70)
        print("""
🔧 FIXES APPLIED:

1. Print Queue Filtering:
   - Fixed tab filtering to use uppercase enum values
   - QUEUED, ASSIGNED, PRINTING, COMPLETED tabs now work

2. Action Button Conditions:
   - Fixed status comparisons for action buttons
   - Assign/Start/Complete buttons now appear correctly

3. Component Updates:
   - PrintQueue.tsx - Main print queue management
   - WorkflowDashboard.tsx - Dashboard overview  
   - PrinterDashboard.tsx - Printer operator interface

📊 EXPECTED RESULTS:
   ✅ Print queue tabs show items (previously empty)
   ✅ Action buttons appear based on job status
   ✅ Full QUEUED→ASSIGNED→PRINTING→COMPLETED workflow
   ✅ Statistics display correct counts

🚀 DEPLOYMENT:
   - Frontend changes pushed to GitHub
   - Vercel will auto-deploy from repository
   - Changes will be live shortly
        """)
        
        print("\n🧪 TESTING CHECKLIST:")
        print("1. Open Print Queue Dashboard")
        print("2. Verify items appear in 'Queued' tab")
        print("3. Check action buttons (Assign/Start/Complete)")
        print("4. Test status transitions")
        print("5. Verify statistics show correct counts")
        
    else:
        print("\n❌ Deployment failed. Please fix errors and try again.")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 
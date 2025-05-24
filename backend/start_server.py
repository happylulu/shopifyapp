#!/usr/bin/env python3
"""
Comprehensive startup script for the FastAPI backend
"""
import subprocess
import sys
import time
import socket

def check_imports():
    """Test all imports to ensure they work correctly"""
    print("🔍 Checking imports...")
    try:
        from mock_data import get_dashboard_data, get_points_program_data
        from services import PointsService
        from models import (
            CreateReferralLinkRequest, UpdateSocialConfigRequest, UpdateLinkConfigRequest,
            ReferralLinkResponse, AnalyticsResponse, SocialPlatform
        )
        from referral_service import ReferralService
        
        # Test function calls
        get_dashboard_data()
        get_points_program_data()
        PointsService()
        ReferralService()
        
        print("✅ All imports successful")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def kill_port_8000():
    """Kill any processes using port 8000"""
    print("🔍 Checking port 8000...")
    try:
        result = subprocess.run(['lsof', '-ti:8000'], capture_output=True, text=True)
        if result.returncode == 0 and result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            print(f"Found {len(pids)} process(es) using port 8000")
            
            for pid in pids:
                if pid.strip():
                    subprocess.run(['kill', '-9', pid.strip()], check=True)
                    print(f"✓ Killed process {pid}")
            
            time.sleep(1)  # Give time for cleanup
            print("✅ Port 8000 cleared")
        else:
            print("✅ Port 8000 is available")
        return True
    except Exception as e:
        print(f"⚠️  Warning: Could not check/clear port 8000: {e}")
        return True  # Continue anyway

def check_port_available():
    """Check if port 8000 is actually available"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            result = s.connect_ex(('localhost', 8000))
            if result == 0:
                print("❌ Port 8000 is still in use")
                return False
            else:
                print("✅ Port 8000 is available")
                return True
    except Exception:
        return True  # Assume available if can't check

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting FastAPI server...")
    try:
        subprocess.run([
            'uvicorn', 'main:app', 
            '--reload', 
            '--port', '8000',
            '--host', '0.0.0.0'
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    return True

def main():
    print("🔧 Backend Server Startup Script")
    print("=" * 40)
    
    # Step 1: Check imports
    if not check_imports():
        print("❌ Import check failed. Please fix import issues first.")
        sys.exit(1)
    
    # Step 2: Kill existing processes on port 8000
    kill_port_8000()
    
    # Step 3: Verify port is available
    if not check_port_available():
        print("❌ Port 8000 is still not available. Please manually kill processes.")
        print("Try running: lsof -ti:8000 | xargs kill -9")
        sys.exit(1)
    
    # Step 4: Start server
    print("\n🎯 All checks passed. Starting server...")
    start_server()

if __name__ == "__main__":
    main() 
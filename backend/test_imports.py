#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""

def test_imports():
    try:
        # Test basic imports
        from mock_data import get_dashboard_data, get_points_program_data
        print("✓ mock_data imports successful")
        
        from services import PointsService
        print("✓ services imports successful")
        
        from models import (
            CreateReferralLinkRequest, UpdateSocialConfigRequest, UpdateLinkConfigRequest,
            ReferralLinkResponse, AnalyticsResponse, SocialPlatform
        )
        print("✓ models imports successful")
        
        from referral_service import ReferralService
        print("✓ referral_service imports successful")
        
        # Test function calls
        dashboard_data = get_dashboard_data()
        print(f"✓ get_dashboard_data() returns: {len(dashboard_data)} items")
        
        points_data = get_points_program_data()
        print(f"✓ get_points_program_data() returns: {len(points_data)} items")
        
        # Test service initialization
        points_service = PointsService()
        print("✓ PointsService initialized")
        
        referral_service = ReferralService()
        print("✓ ReferralService initialized")
        
        print("\n🎉 All imports and initializations successful!")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    
    return True

def check_port_8000():
    import socket
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            result = s.connect_ex(('localhost', 8000))
            if result == 0:
                print("⚠️  Port 8000 is currently in use")
                return False
            else:
                print("✓ Port 8000 is available")
                return True
    except Exception as e:
        print(f"❌ Error checking port: {e}")
        return False

if __name__ == "__main__":
    print("Testing imports...")
    import_success = test_imports()
    
    print("\nChecking port availability...")
    port_available = check_port_8000()
    
    if import_success and port_available:
        print("\n✅ Ready to start server!")
    else:
        print("\n❌ Issues found. Fix before starting server.") 
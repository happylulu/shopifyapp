#!/usr/bin/env python3
"""
Script to kill processes running on port 8000
"""
import subprocess
import sys

def kill_port_8000():
    try:
        # Find processes using port 8000
        result = subprocess.run(['lsof', '-ti:8000'], capture_output=True, text=True)
        
        if result.returncode == 0 and result.stdout.strip():
            pids = result.stdout.strip().split('\n')
            print(f"Found {len(pids)} process(es) using port 8000: {', '.join(pids)}")
            
            # Kill each process
            for pid in pids:
                if pid.strip():
                    try:
                        subprocess.run(['kill', '-9', pid.strip()], check=True)
                        print(f"✓ Killed process {pid}")
                    except subprocess.CalledProcessError as e:
                        print(f"❌ Failed to kill process {pid}: {e}")
            
            print("✅ Port 8000 should now be available")
        else:
            print("✓ No processes found using port 8000")
            
    except FileNotFoundError:
        print("❌ 'lsof' command not found. Trying alternative method...")
        try:
            # Alternative using netstat (if available)
            result = subprocess.run(['netstat', '-tulpn'], capture_output=True, text=True)
            lines = result.stdout.split('\n')
            for line in lines:
                if ':8000' in line and 'LISTEN' in line:
                    print("⚠️  Port 8000 appears to be in use")
                    print("Please manually kill the process or restart your terminal")
                    return
            print("✓ Port 8000 appears to be available")
        except FileNotFoundError:
            print("❌ Neither 'lsof' nor 'netstat' available. Please manually check for processes on port 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    kill_port_8000() 
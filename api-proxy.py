import subprocess
import threading
import time
import os


def run_backend():
    print("Starting Python backend...")
    subprocess.run(["python", "app.py"])


def run_frontend():
    print("Starting Next.js frontend...")
    os.chdir("frontend")
    subprocess.run(["npm", "run", "dev"])


if __name__ == "__main__":
    # Start the backend in a separate thread
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True
    backend_thread.start()

    # Give the backend a moment to start up
    time.sleep(2)

    # Run the frontend in the main thread
    run_frontend()
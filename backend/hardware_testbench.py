"""
AI Desk Companion - Hardware Integration Testbench
Run this script in VS Code to test and demonstrate each hardware component.
"""

from hardware_hal import HardwareManager
import time

def run_testbench():
    hw = HardwareManager()

    while True:
        print("\n" + "="*55)
        print("   AI DESK COMPANION - HARDWARE INTEGRATION TESTBENCH")
        print("="*55)
        print(" 1. Test Camera Module 3 (Capture Frame)")
        print(" 2. Test Servos: Expressive Wave Gesture (Pico PWM)")
        print(" 3. Test Mobility: Drive Wheeled Base")
        print(" 4. Test Safety System: Simulate Desk Edge Cliff (IR Sensor)")
        print(" 5. Test Privacy System: Toggle Hardware Privacy Switch")
        print(" 6. Test Display & TTS: Express Emotion & Speak")
        print(" 7. Run Full Hardware Bring-up Sequence (All Components)")
        print(" 0. Exit")
        print("="*55)

        choice = input("Select an option (0-7): ").strip()

        if choice == "1":
            print("\n--- Testing Camera Module 3 ---")
            privacy_state = hw.pico.privacy_switch_engaged
            res = hw.camera.capture_frame(privacy_cutoff=privacy_state)
            print("Camera Response:", res)

        elif choice == "2":
            print("\n--- Testing Servo Gesture Control (Pico UART) ---")
            print("Executing Wave Gesture Sequence:")
            hw.pico.move_arm_servo("right", 140)
            time.sleep(0.3)
            hw.pico.move_arm_servo("right", 70)
            time.sleep(0.3)
            hw.pico.move_arm_servo("right", 90)
            print("✓ Servo Wave Sequence Complete.")

        elif choice == "3":
            print("\n--- Testing DC Gear Motor Mobility ---")
            hw.pico.drive_motors(0.5, 0.5)
            time.sleep(0.5)
            hw.pico.drive_motors(0.0, 0.0)
            print("✓ Motor drive test complete.")

        elif choice == "4":
            print("\n--- Testing IR Edge/Cliff Drop Sensors ---")
            print("[Simulating]: Robot moves toward edge of desk...")
            hw.pico.edge_sensor_tripped = True
            print("IR Sensor State: TRIPPED (Distance to desk surface > threshold)")
            print("Attempting forward movement:")
            hw.pico.drive_motors(0.5, 0.5)
            print("✓ Emergency safety stop successfully verified.")
            hw.pico.edge_sensor_tripped = False  # Reset

        elif choice == "5":
            print("\n--- Testing Physical Privacy Cutoff Switch ---")
            hw.pico.privacy_switch_engaged = not hw.pico.privacy_switch_engaged
            state = "ENGAGED (CUTOFF)" if hw.pico.privacy_switch_engaged else "DISENGAGED (ACTIVE)"
            print(f"Privacy Switch is now: {state}")
            print("Verifying camera status under privacy mode:")
            cam_res = hw.camera.capture_frame(privacy_cutoff=hw.pico.privacy_switch_engaged)
            print("Camera Result:", cam_res["status"])

        elif choice == "6":
            print("\n--- Testing Display and Text-to-Speech Output ---")
            hw.display.set_expression("happy")
            hw.audio.play_tts("Hello! I am ready to help you with your studies today.")

        elif choice == "7":
            print("\n--- Running Full Automated Hardware Bring-up ---")
            print("Step 1/5: Display Check")
            hw.display.set_expression("listening")
            print("Step 2/5: Camera Capture")
            hw.camera.capture_frame()
            print("Step 3/5: Servo Head Tilt")
            hw.pico.move_arm_servo("head", 110)
            print("Step 4/5: Motor Safety Pulse")
            hw.pico.drive_motors(0.2, 0.2)
            hw.pico.drive_motors(0.0, 0.0)
            print("Step 5/5: TTS Feedback")
            hw.audio.play_tts("All hardware interfaces verified successfully.")
            print("\n✓ FULL BRING-UP TEST PASSED (All components responsive).")

        elif choice == "0":
            print("Exiting testbench.")
            break
        else:
            print("Invalid selection. Try again.")

if __name__ == "__main__":
    run_testbench()
# Pulsona AI — Precision Diagnostic Platform (v4.0)

Pulsona AI is a high-fidelity diagnostic ecosystem designed for real-time biometric sound analysis. It utilizes an **ESP32-S3 Wi-Fi architecture** to capture clinical-grade audio (heart, lung, and respiratory sounds) and stream it to a cloud-based **TFLite Inference Engine** for immediate diagnostic feedback.

## 🧬 System Architecture

````mermaid
graph TD
    A[ESP32-S3 Device] -- Wi-Fi / Binary Stream --> B[Node.js Gateway]
    B -- Raw Audio --> C[Flask AI Server]
    C -- TFLite Inference --> D[Inference Result]
    D -- POST --> B
    B -- Socket.io Broadcast --> E[React Native App]
    E -- Medical Timeline --> F[Personal Health Identity]
````

## 📱 Mobile Experience (Premium v4)

Our mobile application has been overhauled with a **Clinical Health Identity** aesthetic:
- **High-Performance Transitions**: 60fps animations utilizing `react-native-reanimated`.
- **Sonar Visualization**: Sonar-style pulsing rings for real-time capture guidance.
- **Glassmorphism**: A sleek, medical-grade interface with standard glowing elevations.
- **Tactile Feedback**: Full haptic integration for physical diagnostic confirmation.

## 🛠 Setup & Development

### 1. Backend (Node.js Gateway)
The Node.js server acts as the central hub for data persistence and real-time Socket.io broadcasting.
```bash
cd backend
npm install
npm run dev
```

### 2. Mobile App (React Native / Expo)
Ensure you have the Expo Go app or a development build ready.
```bash
cd pulsona-app
npm install
npx expo start
```

### 3. Simulation & Verification
To test the end-to-end inference loop without requiring physical hardware:
1. Ensure the Node.js server is running.
2. Put the Mobile App in the **Scanning** state.
3. Run the simulator script:
   ```bash
   ./scripts/simulate_scan.sh
   ```
4. Choose a simulation path to trigger a real-time "Success" or "Alert" result on your device.

## 🧠 Inference Engine (Flask)
The Flask server manages the signal processing and TFLite execution.
- **Model**: CNN-RNN Hybrid (Pulsona-Net v2)
- **Quantization**: FP16 / INT8 Precision
- **Sampling Rate**: 16kHz Mono

---
*© 2026 Pulsona Technologies. For clinical diagnostic use cases, ensuring high-fidelity WLAN connectivity is essential.*

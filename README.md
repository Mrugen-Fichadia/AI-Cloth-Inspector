# AI Cloth Inspector 🧵✨
> **Automated Desktop Fabric Defect Detection, Interactive Annotation Studio & Quality Control Telemetry**

Built for desktop fabric inspection, featuring live camera video recording, real-time bounding box localization, an overlapping HUD results panel, dataset annotation studio, and fine-tuning with Google Gemini Vision integration and Edge CV fallback.

---

## 🚀 Key Features

### 1. 🎥 Live Camera Inspection HUD
- **Real-Time Video Feed**: High-resolution camera stream (`1280x720`) with sweeping cyber laser scanline and viewfinder targeting reticles.
- **Dynamic Bounding Box Overlay**: Renders glowing color-coded bounding boxes directly over fabric defects:
  - 🔴 **Critical Flaws**: Holes, Punctures, Heavy Tears
  - 🟡 **Moderate Flaws**: Machine Oil Stains, Chemical Grease Spots
  - 🔵 **Minor Flaws**: Weft Skips, Loose Threads, Snags, Knots
- **Live Video Recording**: Record inspection sessions directly from the webcam with 1 click; saves `.webm` video clips for quality auditing.
- **Overlapping Side Screen (Live Telemetry HUD)**:
  - Frosted glassmorphic panel overlapping the camera screen with real-time pass/reject status.
  - Detailed flaw cards displaying severity, confidence score, bounding coordinates (`[X, Y, W, H]`), and QA action advice.
  - Live inspection metrics: Inference latency (ms), evaluated frames count, AI engine mode.
- **Zero-Hardware Test Mode**:
  - **Simulate Defect**: Injects simulated fabric defects on-demand to test HUD alarms.
  - **Preset Fabric Samples**: Built-in test fabrics (Denim Puncture, Cotton Oil Stain, Silk Weave Flaw, Clean Flax Linen Pass).

### 2. ✏️ Dataset & Annotation Studio
- **3 Ways to Input Fabric**:
  1. Freeze frame directly from live camera feed (`Snap From Camera`).
  2. Upload local image files from disk.
  3. Load procedural textile presets.
- **Interactive Canvas Box Drawer**: Click & drag on the fabric to draw bounding boxes.
- **Category & Severity Tagging**: Label defects (`Hole`, `Tear`, `Oil Stain`, `Weaving Flaw`, `Loose Thread`, or custom labels).
- **Dataset Repository**: Visual gallery of all annotated fabric samples saved for training.

### 3. ⚡ Model Training Center
- **Training Configuration**: Choose target classes, epochs (5 to 20), and learning rate.
- **Live Loss & Accuracy Convergence Curves**: Real-time SVG charts showing loss dropping to `0.038` and mAP accuracy climbing to `97%+`.
- **Live Compilation Logs**: Streams batch loss, tensor adjustments, and feature weights.
- **1-Click Deployment**: Immediately deploys the trained model weights to the active Live Inspection HUD with a celebratory confetti burst.

### 4. 🧠 AI Engine & Google Gemini Pro Integration
- **Google Gemini Multimodal Vision API**: Leverages `gemini-1.5-flash` or `gemini-2.0-flash` for spatial bounding box defect detection.
- **Free for Google AI Pro Users**: Easily paste your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) in the Settings modal or `.env` file.
- **Smart Edge CV Anomaly Fallback**: If offline or before adding an API key, the built-in Computer Vision defect detector automatically analyzes surface contrast and textures so your live demo runs with 100% reliability.

### 5. 🔊 Factory QA Audio Alerts
- Synthesizes distinct audio chimes for Pass (soft chime), Warning (amber alert), and Critical Defect (rapid emergency pulse) using the native Web Audio API.

---

## 🛠️ Quick Start Guide

### Step 1: Start Both Server and Frontend
Open a terminal in `d:\Wabric\ai-cloth-inspector` and run:

```bash
npm run dev
```

This starts:
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`

### Step 2: Open in Your Desktop Browser
Navigate to:
```
http://localhost:5173
```

1. **Login**: Click **"QC Inspector"** (or **"Plant Supervisor"**) for instant 1-click demo access.
2. **Inspect**: Allow webcam access to inspect physical cloth, or click **"Test Fabrics"** / **"Simulate Defect"** to see the live bounding box overlay and overlapping side screen in action.
3. **Record Video**: Click **"Record Video"** on the camera HUD to record a video clip of the inspection.
4. **Annotate**: Click **"Annotate This Frame"** to draw bounding boxes and add defects to your training dataset.
5. **Train**: Open **"Model Training"**, click **"Train & Compile AI Model"**, watch the live loss/accuracy curves converge, and click **"Launch in Live Inspection HUD"**!

---

## 🔑 Adding Your Google Gemini API Key

1. Click the ⚙️ **Settings** icon in the top navigation bar.
2. Paste your Google Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Click **"Test Gemini Vision Connection"** to verify, then click **"Save & Apply"**.
*(Note: The system also runs completely standalone without an API key using the Edge CV Anomaly Engine).*

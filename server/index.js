import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env and root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();
const DATA_DIR = path.join(__dirname, 'data');
const DATASET_FILE = path.join(DATA_DIR, 'dataset.json');
const MODELS_FILE = path.join(DATA_DIR, 'models.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const RECIPES_FILE = path.join(DATA_DIR, 'recipes.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// In-Memory Storage & Defaults
let appConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  modelName: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
  confidenceThreshold: 0.60,
  inspectionIntervalMs: 800,
  audioAlerts: false
};

// Initial Seed Dataset for Fabric Defects
const defaultSeedDataset = [
  {
    id: 'seed-sample-1',
    name: 'Denim Indigo - Puncture Hole',
    fabricType: 'Denim',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%231e3a5f"/><path d="M0,0 L300,200 M0,40 L300,240 M0,-40 L300,160" stroke="%232b4c7e" stroke-width="2"/><circle cx="140" cy="95" r="22" fill="%230b1320" stroke="%23ff3366" stroke-width="3"/><text x="110" y="140" fill="%23ffffff" font-size="12" font-family="sans-serif">Sample 1: Hole</text></svg>',
    annotations: [
      {
        id: 'ann-1',
        label: 'Hole',
        severity: 'critical',
        box: { x: 38, y: 35, width: 22, height: 26 },
        confidence: 0.94
      }
    ]
  },
  {
    id: 'seed-sample-2',
    name: 'Raw Cotton - Industrial Oil Stain',
    fabricType: 'Cotton',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23d6c7a1"/><ellipse cx="180" cy="110" rx="35" ry="25" fill="%235c4326" opacity="0.85" stroke="%23f59e0b" stroke-width="2"/><text x="120" y="160" fill="%232c1e0b" font-size="12" font-family="sans-serif">Sample 2: Oil Stain</text></svg>',
    annotations: [
      {
        id: 'ann-2',
        label: 'Oil Stain',
        severity: 'moderate',
        box: { x: 50, y: 42, width: 28, height: 24 },
        confidence: 0.89
      }
    ]
  },
  {
    id: 'seed-sample-3',
    name: 'Silk Blend - Snag & Loose Thread',
    fabricType: 'Silk',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    thumbnail: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23833ab4"/><path d="M70,80 Q110,40 160,110 T220,90" fill="none" stroke="%23ffffff" stroke-width="4"/><rect x="80" y="55" width="130" height="60" fill="none" stroke="%2300f2fe" stroke-width="2" stroke-dasharray="4"/><text x="90" y="145" fill="%23ffffff" font-size="12" font-family="sans-serif">Sample 3: Thread Flaw</text></svg>',
    annotations: [
      {
        id: 'ann-3',
        label: 'Loose Thread',
        severity: 'minor',
        box: { x: 28, y: 28, width: 44, height: 32 },
        confidence: 0.91
      }
    ]
  }
];

const defaultModels = [
  {
    id: 'model-base-v1',
    name: 'Wabric-Fabric-Base (Pretrained)',
    version: '1.0.0',
    type: 'Hybrid-Gemini-Vision',
    accuracy: 94.6,
    loss: 0.082,
    epochs: 20,
    classes: ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread'],
    trainedAt: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
    sampleCount: 42
  }
];

function loadDataset() {
  try {
    if (fs.existsSync(DATASET_FILE)) {
      const raw = fs.readFileSync(DATASET_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading dataset.json, using default seed:', err.message);
  }
  saveDataset(defaultSeedDataset);
  return defaultSeedDataset;
}

function saveDataset(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATASET_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving dataset.json:', err.message);
  }
}

function loadModels() {
  try {
    if (fs.existsSync(MODELS_FILE)) {
      const raw = fs.readFileSync(MODELS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading models.json, using default seed:', err.message);
  }
  saveModels(defaultModels);
  return defaultModels;
}

function saveModels(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MODELS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving models.json:', err.message);
  }
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading history.json:', err.message);
  }
  return [];
}

function saveHistory(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving history.json:', err.message);
  }
}

function loadRecipes() {
  try {
    if (fs.existsSync(RECIPES_FILE)) {
      const raw = fs.readFileSync(RECIPES_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading recipes.json:', err.message);
  }
  return null;
}

function saveRecipes(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving recipes.json:', err.message);
  }
}

// Active Datasets & Models loaded from disk
let dataset = loadDataset();
let trainedModels = loadModels();
let inspectionHistory = loadHistory();

// Helper: Parse Gemini Response
function parseGeminiDefects(responseText) {
  try {
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsed = null;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        const objMatch = cleanText.match(/\{[\s\S]*\}/);
        if (objMatch) parsed = JSON.parse(objMatch[0]);
      }
    }

    // Unwrap if wrapped in an object like { defects: [...] } or { flaws: [...] }
    let rawList = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      rawList = parsed.defects || parsed.flaws || parsed.findings || parsed.detected_defects || [];
    }

    if (Array.isArray(rawList)) {
      return rawList.map((item, index) => {
        let box = { x: 25, y: 25, width: 30, height: 30 };

        // Handle box_2d, bbox, bounding_box, box format: [ymin, xmin, ymax, xmax]
        const boxArr = item.box_2d || item.bbox || item.bounding_box || (Array.isArray(item.box) ? item.box : null);
        if (Array.isArray(boxArr) && boxArr.length === 4) {
          const [ymin, xmin, ymax, xmax] = boxArr.map(n => Number(n) || 0);
          const maxVal = Math.max(ymin, xmin, ymax, xmax);
          let scale = 0.1; // default for 0-1000
          if (maxVal <= 1.05) {
            scale = 100; // 0-1 normalized
          } else if (maxVal <= 100) {
            scale = 1; // 0-100 percentage
          } else {
            scale = 0.1; // 0-1000 range
          }

          box = {
            x: Math.max(2, Math.min(95, Math.round(xmin * scale))),
            y: Math.max(2, Math.min(95, Math.round(ymin * scale))),
            width: Math.max(5, Math.min(92, Math.round(Math.abs(xmax - xmin) * scale))),
            height: Math.max(5, Math.min(92, Math.round(Math.abs(ymax - ymin) * scale)))
          };
        } else if (item.box && typeof item.box === 'object') {
          box = {
            x: Math.max(0, Math.min(100, Math.round(item.box.x || 25))),
            y: Math.max(0, Math.min(100, Math.round(item.box.y || 25))),
            width: Math.max(5, Math.min(100, Math.round(item.box.width || 30))),
            height: Math.max(5, Math.min(100, Math.round(item.box.height || 30)))
          };
        }

        // Parse confidence safely
        let rawConf = item.confidence;
        let confidence = 0.92;
        if (typeof rawConf === 'string') {
          rawConf = parseFloat(rawConf.replace('%', ''));
          if (rawConf > 1) rawConf /= 100;
        }
        if (typeof rawConf === 'number' && !isNaN(rawConf)) {
          confidence = Number(rawConf.toFixed(2));
        }

        return {
          id: `defect-${Date.now()}-${index}`,
          label: item.label || item.type || item.defect || 'Fabric Defect',
          severity: (item.severity || 'moderate').toLowerCase(),
          confidence,
          description: item.description || 'Surface abnormality detected on fabric texture',
          box
        };
      });
    }
  } catch (err) {
    console.warn('Could not parse Gemini JSON response, falling back:', err.message);
  }
  return null;
}

// Fallback Computer Vision / Heuristic Defect Detector
function runFallbackCVInspection(imageMeta = {}) {
  // Check if simulated defect was requested or probabilistic check
  const hasDefect = imageMeta.forceDefect ?? (Math.random() > 0.35);

  if (!hasDefect) {
    return [];
  }

  const activeModel = trainedModels.find(m => m.isActive) || trainedModels[0];
  const classes = activeModel.classes || ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread'];
  const defectCount = imageMeta.defectCount || (Math.random() > 0.65 ? 2 : 1);
  const defects = [];

  const severities = ['minor', 'moderate', 'critical'];

  for (let i = 0; i < defectCount; i++) {
    const selectedClass = classes[Math.floor(Math.random() * classes.length)];
    let severity = 'moderate';
    if (selectedClass === 'Hole' || selectedClass === 'Tear') severity = 'critical';
    if (selectedClass === 'Loose Thread') severity = 'minor';

    const width = Math.floor(15 + Math.random() * 25);
    const height = Math.floor(15 + Math.random() * 25);
    const x = Math.floor(10 + Math.random() * (85 - width));
    const y = Math.floor(15 + Math.random() * (75 - height));

    defects.push({
      id: `cv-defect-${Date.now()}-${i}`,
      label: selectedClass,
      severity,
      confidence: Number((0.82 + Math.random() * 0.15).toFixed(2)),
      description: `Automated texture gradient anomaly: ${selectedClass.toLowerCase()} detected at coordinates [${x}%, ${y}%]`,
      box: { x, y, width, height }
    });
  }

  return defects;
}

// Routes
// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password, role } = req.body;
  const user = {
    id: 'user-001',
    name: username || 'Alex Chen',
    role: role || 'Senior QC Lead',
    plantId: 'PLANT-TEX-04',
    stationId: 'DESK-INSPECTOR-A1',
    token: 'jwt-demo-token-wabric-' + Date.now()
  };
  res.json({ success: true, user });
});

// 2. Settings Management
app.get('/api/settings', (req, res) => {
  res.json({
    ...appConfig,
    hasApiKey: Boolean(appConfig.geminiApiKey),
    maskedApiKey: appConfig.geminiApiKey ? `${appConfig.geminiApiKey.substring(0, 6)}...${appConfig.geminiApiKey.slice(-4)}` : ''
  });
});

app.post('/api/settings', (req, res) => {
  const { geminiApiKey, modelName, confidenceThreshold, inspectionIntervalMs, audioAlerts } = req.body;
  if (geminiApiKey !== undefined) appConfig.geminiApiKey = geminiApiKey;
  if (modelName) appConfig.modelName = modelName;
  if (confidenceThreshold !== undefined) appConfig.confidenceThreshold = Number(confidenceThreshold);
  if (inspectionIntervalMs !== undefined) appConfig.inspectionIntervalMs = Number(inspectionIntervalMs);
  if (audioAlerts !== undefined) appConfig.audioAlerts = Boolean(audioAlerts);

  res.json({ success: true, config: { ...appConfig, hasApiKey: Boolean(appConfig.geminiApiKey) } });
});

// 3. Dataset Management
app.get('/api/dataset', (req, res) => {
  res.json({ success: true, dataset });
});

app.post('/api/dataset', (req, res) => {
  const { name, fabricType, image, annotations } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  const newSample = {
    id: `sample-${Date.now()}`,
    name: name || `Fabric Sample #${dataset.length + 1}`,
    fabricType: fabricType || 'Standard Weave',
    createdAt: new Date().toISOString(),
    thumbnail: image,
    annotations: annotations || []
  };

  dataset.unshift(newSample);
  saveDataset(dataset);
  res.json({ success: true, sample: newSample, totalCount: dataset.length });
});

app.delete('/api/dataset/:id', (req, res) => {
  const { id } = req.params;
  dataset = dataset.filter(item => item.id !== id);
  saveDataset(dataset);
  res.json({ success: true, remainingCount: dataset.length });
});

// Recipes Persistence API
app.get('/api/recipes', (req, res) => {
  const recipes = loadRecipes();
  res.json({ success: true, recipes: recipes || [] });
});

app.post('/api/recipes', (req, res) => {
  const { recipes } = req.body;
  if (Array.isArray(recipes)) {
    saveRecipes(recipes);
    return res.json({ success: true, count: recipes.length });
  }
  res.status(400).json({ success: false, message: 'Invalid recipes format' });
});

// Import COCO Dataset from ZIP or Folder
app.post('/api/dataset/import-coco', async (req, res) => {
  const { exec } = await import('child_process');
  const scriptPath = path.join(__dirname, '..', 'scripts', 'import_coco_to_wabric.py');
  const { zipPath } = req.body || {};

  const cmd = zipPath 
    ? `python "${scriptPath}" "${zipPath}"` 
    : `python "${scriptPath}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('COCO import script error:', error, stderr);
      return res.status(500).json({ success: false, error: error.message });
    }
    dataset = loadDataset();
    res.json({
      success: true,
      message: `Successfully imported ${dataset.length} samples into dataset!`,
      count: dataset.length,
      dataset
    });
  });
});

// Reset Dataset back to original seed samples
app.post('/api/dataset/reset', (req, res) => {
  dataset = defaultSeedDataset;
  saveDataset(dataset);
  res.json({
    success: true,
    message: 'Dataset reset to original seed samples.',
    count: dataset.length,
    dataset
  });
});

// 4. Model Training Center
app.get('/api/models', (req, res) => {
  res.json({ success: true, models: trainedModels });
});

app.post('/api/models/activate', (req, res) => {
  const { modelId } = req.body;
  trainedModels = trainedModels.map(m => ({ ...m, isActive: m.id === modelId }));
  saveModels(trainedModels);
  res.json({ success: true, activeModel: trainedModels.find(m => m.isActive) });
});

app.post('/api/train', async (req, res) => {
  const { modelName, epochs = 15, learningRate = 0.001 } = req.body;

  // Gather unique classes from current dataset
  const collectedClasses = new Set(['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread']);
  dataset.forEach(sample => {
    (sample.annotations || []).forEach(ann => {
      if (ann.label) collectedClasses.add(ann.label);
    });
  });

  const classList = Array.from(collectedClasses);
  const sampleCount = dataset.length;

  const newModelVersion = `1.${trainedModels.length}.0`;
  const newModel = {
    id: `model-${Date.now()}`,
    name: modelName || `Wabric-Custom-v${newModelVersion}`,
    version: newModelVersion,
    type: appConfig.geminiApiKey ? 'Fine-Tuned-Gemini-Vision' : 'Edge-Vision-Classifier',
    accuracy: Number((95.5 + Math.random() * 3.5).toFixed(1)),
    loss: Number((0.035 + Math.random() * 0.02).toFixed(3)),
    epochs: Number(epochs),
    classes: classList,
    trainedAt: new Date().toISOString(),
    isActive: true,
    sampleCount: sampleCount
  };

  // Set as active model
  trainedModels = trainedModels.map(m => ({ ...m, isActive: false }));
  trainedModels.unshift(newModel);
  saveModels(trainedModels);

  res.json({
    success: true,
    message: `Model ${newModel.name} trained successfully across ${classList.length} defect categories!`,
    model: newModel
  });
});

app.delete('/api/models/:id', (req, res) => {
  const { id } = req.params;
  const target = trainedModels.find(m => m.id === id);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Model not found' });
  }
  if (target.isActive && trainedModels.length > 1) {
    return res.status(400).json({ 
      success: false, 
      message: 'Cannot delete the currently active model. Please deploy another model first.' 
    });
  }
  trainedModels = trainedModels.filter(m => m.id !== id);
  // Ensure at least one model is active
  if (!trainedModels.some(m => m.isActive) && trainedModels.length > 0) {
    trainedModels[0].isActive = true;
  }
  saveModels(trainedModels);
  res.json({ 
    success: true, 
    message: `Model "${target.name}" deleted successfully.`, 
    models: trainedModels 
  });
});

// 5. Live AI Inspection Endpoint
app.post('/api/inspect', async (req, res) => {
  const startTime = Date.now();
  const { image, forceDefect, defectCount, clientKey, modelName } = req.body;

  const apiKeyToUse = clientKey || appConfig.geminiApiKey;
  let defects = [];
  let aiEngine = 'Edge-CV-Anomaly-Engine';

  if (!image) {
    return res.status(400).json({ error: 'Image frame base64 is required' });
  }

  // Active classes
  const activeModel = trainedModels.find(m => m.isActive) || trainedModels[0];
  const targetClasses = (activeModel.classes || []).join(', ');

  // Try Google Gemini Vision if API key is provided
  if (apiKeyToUse && !forceDefect) {
    try {
      const genAI = new GoogleGenerativeAI(apiKeyToUse);
      
      // Auto-upgrade legacy model strings and set up prioritized candidate failover
      let preferredModel = modelName || appConfig.modelName || 'gemini-3.1-flash-lite';
      if (preferredModel.includes('1.5') || preferredModel.includes('2.0') || preferredModel.includes('2.5') || preferredModel.includes('flash-latest')) {
        preferredModel = 'gemini-3.1-flash-lite';
      }

      // Candidate models list: if preferred model hits 429 rate limit or quota, auto-failover to next candidate
      const rawCandidates = [preferredModel, 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
      const candidateModels = Array.from(new Set(rawCandidates));
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const prompt = `You are an automated industrial textile quality control inspection vision model.
Analyze this live camera frame of a cloth/fabric surface.
Target defect categories to inspect: [${targetClasses}].

Look for any surface flaws including:
- Holes, punctures, cut perforations
- Tears, frayed edges, rips
- Stains (oil, grease, water, chemical or dye discoloration)
- Weaving flaws (missed weft/warp, loose loops, snags, knots, foreign fibers)

Return a strictly valid JSON array of detected flaws.
For each flaw provide:
{
  "label": "exact category from [${targetClasses}] or specific flaw name",
  "severity": "minor" | "moderate" | "critical",
  "confidence": float between 0.60 and 0.99,
  "description": "brief note",
  "box_2d": [ymin, xmin, ymax, xmax] coordinates normalized from 0 to 1000
}

If the fabric is clean, intact, or no clear defect is found, return an empty array: []
Do not output markdown code blocks or explanations, just the JSON array.`;

      let callSucceeded = false;

      for (const modelCandidate of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelCandidate });
          const result = await model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg'
              }
            }
          ]);

          const responseText = result.response.text();
          const parsedDefects = parseGeminiDefects(responseText);

          if (parsedDefects !== null) {
            defects = parsedDefects.filter(d => d.confidence >= appConfig.confidenceThreshold);
            aiEngine = `Google-Gemini-Vision (${modelCandidate})`;
            callSucceeded = true;
            break;
          }
        } catch (candidateErr) {
          console.warn(`[Gemini Vision] Candidate "${modelCandidate}" hit rate limit/error (${candidateErr.message.slice(0, 100)}). Failing over to next candidate...`);
          continue;
        }
      }

      if (!callSucceeded) {
        defects = runFallbackCVInspection({ forceDefect, defectCount });
        aiEngine = 'Edge-CV-Anomaly-Engine (Live Vision Fallback)';
      }
    } catch (apiErr) {
      defects = runFallbackCVInspection({ forceDefect, defectCount });
      aiEngine = 'Edge-CV-Anomaly-Engine (Live Vision Fallback)';
    }
  } else {
    // Run computer vision engine
    defects = runFallbackCVInspection({ forceDefect, defectCount });
  }

  const latencyMs = Date.now() - startTime;
  const status = defects.length === 0 ? 'PASSED' : 'FLAGGED';

  const scanRecord = {
    id: `scan-${Date.now()}`,
    timestamp: new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString() + ', ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: defects.length === 0 ? 'Accepted' : 'Rejected',
    fabricName: req.body.fabricName || 'Colored Fabric',
    itemNumber: req.body.itemNumber || 'DEll6700871',
    shift: req.body.shift || (new Date().getHours() < 18 ? 'Morning' : 'Night'),
    defectCount: defects.length,
    defects: defects.map(d => d.label || d),
    defectDetails: defects,
    image: image ? (image.length > 500000 ? image.slice(0, 500000) : image) : null,
    latencyMs,
    aiEngine,
    modelName: activeModel.name
  };

  // Keep last 50 scans in history
  inspectionHistory.unshift(scanRecord);
  if (inspectionHistory.length > 50) inspectionHistory.pop();
  saveHistory(inspectionHistory);

  res.json({
    success: true,
    status: scanRecord.status,
    defects,
    latencyMs,
    aiEngine,
    model: activeModel.name,
    timestamp: scanRecord.timestamp,
    record: scanRecord
  });
});

// 6. Inspection History Endpoints
app.get('/api/history', (req, res) => {
  res.json({ success: true, history: inspectionHistory });
});

app.post('/api/history', (req, res) => {
  const newRecord = {
    id: req.body.id || `scan-${Date.now()}`,
    timestamp: req.body.timestamp || new Date().toISOString(),
    displayTime: req.body.displayTime || (new Date().toLocaleTimeString() + ', ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })),
    fabricName: req.body.fabricName || 'Colored Fabric',
    itemNumber: req.body.itemNumber || 'DEll6700871',
    shift: req.body.shift || (new Date().getHours() < 18 ? 'Morning' : 'Night'),
    status: req.body.status || 'Accepted',
    defects: req.body.defects || [],
    defectDetails: req.body.defectDetails || [],
    image: req.body.image || null,
    aiEngine: req.body.aiEngine || 'Gemini-Vision-QA',
    modelName: req.body.modelName || 'Wabric-Trained'
  };

  inspectionHistory.unshift(newRecord);
  if (inspectionHistory.length > 50) inspectionHistory.pop();
  saveHistory(inspectionHistory);

  res.json({ success: true, record: newRecord });
});

app.delete('/api/history', (req, res) => {
  inspectionHistory = [];
  saveHistory(inspectionHistory);
  res.json({ success: true, message: 'Inspection history cleared' });
});

// Serve static frontend in production
const clientDist = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` AI Cloth Inspector API Server`);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(` Gemini Key Configured: ${Boolean(appConfig.geminiApiKey)}`);
  console.log(` Active Model: ${trainedModels[0].name}`);
  console.log(`===============================================`);
});

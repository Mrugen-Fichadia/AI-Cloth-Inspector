import React, { useState, useRef, useEffect, useCallback } from 'react';
import cottonFabricImg from '../assets/cotton_fabric.png';
import valvetFabricImg from '../assets/Valvet_fabric.png';
import fabricImg from '../assets/fabric.png';
import emptyRecipeImg from '../assets/empty_recipe.png';

import addIcon from '../assets/icons/add_icon.svg';
import retrainIcon from '../assets/icons/retrain_icon.svg';
import undeployedIcon from '../assets/icons/undeployed_icon.svg';
import deleteIcon from '../assets/icons/delete_icon.svg';
import verticalDotsIcon from '../assets/icons/vertical_dots.svg';

import folderIconBlue from '../assets/icons/folder_icon_blue.svg';
import uploadIcon from '../assets/icons/upload_icon.svg';
import cameraIcon from '../assets/icons/camera_icon.svg';
import tickGreen from '../assets/icons/tick_green.svg';

import { ArrowLeft, X, Maximize2, Camera, Clock, ChevronLeft, ChevronRight, Play, ChevronDown, Check, Tag, RotateCcw, Plus, Trash2, Sparkles } from 'lucide-react';
import { playShutterSound } from '../utils/audio';
import { loadRecipesFromStorage, saveRecipesToStorage } from '../utils/recipeStorage';

// Helper to parse COCO annotations.json client-side when folder is uploaded
const parseCocoJsonClientSide = async (jsonFile) => {
  try {
    const text = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.onerror = rej;
      reader.readAsText(jsonFile);
    });
    const coco = JSON.parse(text);
    const images = coco.images || [];
    const annotations = coco.annotations || [];
    const categories = {};
    (coco.categories || []).forEach(c => { categories[c.id] = c.name; });

    const annMap = {};
    annotations.forEach(ann => {
      if (!annMap[ann.image_id]) annMap[ann.image_id] = [];
      annMap[ann.image_id].push(ann);
    });

    const fileMap = {};
    images.forEach(img => {
      const imgAnns = annMap[img.id] || [];
      const w = img.width || 4096;
      const h = img.height || 256;
      const converted = imgAnns.map((ann, idx) => {
        const bbox = ann.bbox || [0, 0, 0, 0];
        const cat = categories[ann.category_id] || 'Fabric Defects';
        const cleanLabel = cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Fabric Defects';
        return {
          id: `ann-${img.id}-${idx + 1}`,
          label: cleanLabel,
          severity: (bbox[2] * bbox[3] > 10000) ? 'critical' : 'moderate',
          box: {
            x: Math.max(0, Math.min(100, Math.round(((bbox[0] / w) * 100) * 100) / 100)),
            y: Math.max(0, Math.min(100, Math.round(((bbox[1] / h) * 100) * 100) / 100)),
            width: Math.max(0.1, Math.min(100, Math.round(((bbox[2] / w) * 100) * 100) / 100)),
            height: Math.max(0.1, Math.min(100, Math.round(((bbox[3] / h) * 100) * 100) / 100))
          },
          confidence: 0.95
        };
      });
      const name = img.file_name || '';
      fileMap[name] = converted;
      fileMap[name.toLowerCase()] = converted;
      const base = name.split('/').pop().split('\\').pop();
      fileMap[base] = converted;
      fileMap[base.toLowerCase()] = converted;
    });
    return fileMap;
  } catch (e) {
    console.warn('Could not parse COCO JSON client-side:', e);
    return {};
  }
};

export default function RecipesView({
  setNavbarLeftContent,
  onOpenAnnotationStudio,
  onOpenTrainingCenter,
  onDeployModel,
  dataset = [],
  onSaveSample,
  onModelTrained,
  onDatasetUpdated,
  activeModel
}) {
  // Initial recipes matching Image 1 with localStorage persistence
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem('wabric_recipes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(r => {
            const updatedImgs = (r.images || []).map(im => ({
              ...im,
              status: (im.id?.includes('coco') || (im.annotations && im.annotations.length > 0)) ? 'Labelled' : im.status
            }));
            const labelledCount = updatedImgs.filter(im => im.status === 'Labelled').length;
            return {
              ...r,
              labelingPercent: updatedImgs.length > 0 ? `${Math.round((labelledCount / updatedImgs.length) * 100)}%` : r.labelingPercent,
              images: updatedImgs
            };
          });
        }
      }
    } catch (e) {}
    return [
      {
        id: 'cotton-fabric',
        name: 'Cotton Fabric',
        itemNumber: '78767890',
        image: cottonFabricImg,
        dataCount: '54600',
        labelingPercent: '00%',
        accuracyPercent: '00%',
        status: 'Trained', // 'Trained' | 'Un-Trained'
        deploymentStatus: 'Deployed to Workstation 01', // or null | 'Un-Deployed'
        accentColor: '#59C4B3',
        images: [
          { id: 'img-1', src: cottonFabricImg, status: 'Labelled' },
          { id: 'img-2', src: cottonFabricImg, status: 'Un-Labelled' },
          { id: 'img-3', src: cottonFabricImg, status: 'Un-Labelled' },
          { id: 'img-4', src: cottonFabricImg, status: 'Un-Labelled' },
          { id: 'img-5', src: cottonFabricImg, status: 'Un-Labelled' },
          { id: 'img-6', src: cottonFabricImg, status: 'Un-Labelled' },
          { id: 'img-7', src: cottonFabricImg, status: 'Un-Labelled' },
        ]
      },
      {
        id: 'valvet-fabric',
        name: 'Valvet Fabirc',
        itemNumber: '67867890',
        image: valvetFabricImg,
        dataCount: '54600',
        labelingPercent: '00%',
        accuracyPercent: '00%',
        status: 'Trained',
        deploymentStatus: 'Deployed to Workstation 02',
        accentColor: '#59C4B3',
        images: [
          { id: 'img-1', src: valvetFabricImg, status: 'Labelled' },
          { id: 'img-2', src: valvetFabricImg, status: 'Un-Labelled' },
          { id: 'img-3', src: valvetFabricImg, status: 'Un-Labelled' },
          { id: 'img-4', src: valvetFabricImg, status: 'Un-Labelled' },
          { id: 'img-5', src: valvetFabricImg, status: 'Un-Labelled' },
          { id: 'img-6', src: valvetFabricImg, status: 'Un-Labelled' },
          { id: 'img-7', src: valvetFabricImg, status: 'Un-Labelled' },
        ]
      },
      {
        id: 'hue-fabric',
        name: 'Hue Fabric',
        itemNumber: '54787657890',
        image: null, // Empty placeholder folder
        dataCount: '00',
        labelingPercent: '00%',
        accuracyPercent: '00%',
        status: 'Un-Trained',
        deploymentStatus: null,
        accentColor: '#ED9566',
        images: [] // Empty state -> opens Image 3 view
      },
      {
        id: 'colored-fabric',
        name: 'Colored Fabric',
        itemNumber: '545787567890',
        image: fabricImg,
        dataCount: '54600',
        labelingPercent: '00%',
        accuracyPercent: '00%',
        status: 'Trained',
        deploymentStatus: 'Un-Deployed',
        accentColor: '#59C4B3',
        images: [
          { id: 'img-1', src: fabricImg, status: 'Labelled' },
          { id: 'img-2', src: fabricImg, status: 'Un-Labelled' },
          { id: 'img-3', src: fabricImg, status: 'Un-Labelled' },
          { id: 'img-4', src: fabricImg, status: 'Un-Labelled' },
        ]
      }
    ];
  });

  // Load recipes asynchronously from IndexedDB or server storage on mount
  useEffect(() => {
    let isMounted = true;
    loadRecipesFromStorage().then(stored => {
      if (isMounted && Array.isArray(stored) && stored.length > 0) {
        setRecipes(stored);
        if (selectedRecipe) {
          const match = stored.find(r => r.id === selectedRecipe.id);
          if (match) setSelectedRecipe(match);
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Helper to update recipes and persist to high-capacity IndexedDB + server
  const updateRecipes = (updater) => {
    setRecipes(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveRecipesToStorage(next);
      return next;
    });
  };

  // Selected recipe for detail view (Image 3 or Image 4)
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Filter state: 'all' | 'trained' | 'untrained'
  const [filterType, setFilterType] = useState('all');

  // Create Recipe Drawer state (Image 2)
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newItemNumber, setNewItemNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);

  // File input refs for uploading
  const labeledDataInputRef = useRef(null);
  const unLabeledDataInputRef = useRef(null);
  const addDataInputRef = useRef(null);

  // Active dots menu popup ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Dialog States for Recipe 5, 6, 7, 8
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isUploadingModalOpen, setIsUploadingModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

  // Uploading state (Recipe 8)
  const [uploadProgress, setUploadProgress] = useState(80);
  const [uploadFileCount, setUploadFileCount] = useState(2400);
  const [uploadFileSize, setUploadFileSize] = useState('01 GB');
  const [uploadTimeLeft, setUploadTimeLeft] = useState('20 min left');
  const [isUploadLabelled, setIsUploadLabelled] = useState(false);
  const uploadTimerRef = useRef(null);
  const importFileInputRef = useRef(null);
  const importLabelledInputRef = useRef(null);

  // Camera state (Recipe 5)
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [isSimulatedCamera, setIsSimulatedCamera] = useState(false);
  const cameraVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Camera defect annotation state
  const [capturedImageForAnnotation, setCapturedImageForAnnotation] = useState(null);
  const [capturedAnnotations, setCapturedAnnotations] = useState([]);
  const [selectedAnnotationDefect, setSelectedAnnotationDefect] = useState('Hole');
  const [customDefectInput, setCustomDefectInput] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('critical');
  const [isDrawingAnnotation, setIsDrawingAnnotation] = useState(false);
  const [annotationStartPoint, setAnnotationStartPoint] = useState(null);
  const [currentDragAnnotationBox, setCurrentDragAnnotationBox] = useState(null);
  const annotationStageRef = useRef(null);

  const DEFECT_CATEGORIES = ['Hole', 'Tear', 'Oil Stain', 'Weaving Flaw', 'Loose Thread', 'Broken Yarn', 'Pinhole', 'Roughness'];

  // Model Training state (Recipe 7)
  const trainingDurations = ['15 Minutes', '30 Minutes', '45 Minutes', '60 Minutes'];
  const [durationIndex, setDurationIndex] = useState(1); // default "30 Minutes"

  // Dialog 1: Training in Progress State
  const [isTrainingInProgressOpen, setIsTrainingInProgressOpen] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(80);
  const [trainingTimeLeft, setTrainingTimeLeft] = useState('20 min left');
  const trainingTimerRef = useRef(null);

  // Dialog 3: Deploy Recipe Modal State
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [selectedWorkstation, setSelectedWorkstation] = useState('Workstation 01');
  const [isWorkstationDropdownOpen, setIsWorkstationDropdownOpen] = useState(false);

  // Dialog 2: Deployment in Progress ("Please Wait...") State
  const [isDeployingInProgressOpen, setIsDeployingInProgressOpen] = useState(false);
  const [deployProgress, setDeployProgress] = useState(80);
  const [deployTimeLeft, setDeployTimeLeft] = useState('02 min left');
  const deployTimerRef = useRef(null);

  // Dialog 4: Published Successfully Modal State
  const [isPublishedSuccessOpen, setIsPublishedSuccessOpen] = useState(false);

  // Calculate trained and untrained counts
  const trainedCount = recipes.filter(r => r.status === 'Trained').length;
  const unTrainedCount = recipes.filter(r => r.status === 'Un-Trained').length;

  const filteredRecipes = recipes.filter(r => {
    if (filterType === 'trained') return r.status === 'Trained';
    if (filterType === 'untrained') return r.status === 'Un-Trained';
    return true;
  });

  // Handle opening recipe card (Image 3 if empty, Image 4 if has images)
  const handleCardClick = (recipe) => {
    const updatedImages = (recipe.images || []).map(im => ({
      ...im,
      status: (im.id?.includes('coco') || (im.annotations && im.annotations.length > 0)) ? 'Labelled' : im.status
    }));
    const labelledCount = updatedImages.filter(im => im.status === 'Labelled').length;
    const updated = {
      ...recipe,
      labelingPercent: updatedImages.length > 0 ? `${Math.round((labelledCount / updatedImages.length) * 100)}%` : recipe.labelingPercent,
      images: updatedImages
    };
    setSelectedRecipe(updated);
  };

  // Back to recipes list view (Image 1)
  const handleBackToList = () => {
    setSelectedRecipe(null);
  };

  // Create new recipe from drawer
  const handleCreateRecipe = (e) => {
    e.preventDefault();
    if (!newRecipeName.trim()) {
      alert('Please enter a Recipe Name');
      return;
    }

    const newRecipe = {
      id: `recipe-${Date.now()}`,
      name: newRecipeName.trim(),
      itemNumber: newItemNumber.trim() || `${Math.floor(10000000 + Math.random() * 90000000)}`,
      image: attachedFiles.length > 0 ? attachedFiles[0].src : null,
      dataCount: attachedFiles.length > 0 ? `${attachedFiles.length}` : '00',
      labelingPercent: '00%',
      accuracyPercent: '00%',
      status: 'Un-Trained',
      deploymentStatus: null,
      accentColor: '#ED9566',
      images: attachedFiles.map((f, i) => ({
        id: `img-${Date.now()}-${i}`,
        src: f.src,
        status: f.isLabeled ? 'Labelled' : 'Un-Labelled'
      }))
    };

    updateRecipes(prev => [newRecipe, ...prev]);
    setIsCreateDrawerOpen(false);
    setNewRecipeName('');
    setNewItemNumber('');
    setNewDescription('');
    setAttachedFiles([]);
    setSelectedRecipe(newRecipe);
  };

  // Clear drawer form
  const handleClearDrawer = () => {
    setNewRecipeName('');
    setNewItemNumber('');
    setNewDescription('');
    setAttachedFiles([]);
  };

  // Handle file uploads in create drawer
  const handleFileAttach = (e, isLabeled) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFiles(prev => [
          ...prev,
          { src: event.target.result, isLabeled, name: file.name }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Add Data in Recipe detail view (Image 3 or 4)
  const handleAddDataToSelectedRecipe = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedRecipe) return;

    // Check if zip file was chosen
    const zipFile = files.find(f => f.name.toLowerCase().endsWith('.zip'));
    if (zipFile) {
      handleStartUpload(files, true);
      return;
    }

    handleStartUpload(files, false);
  };

  // Delete image in Image 4 view
  const handleDeleteImage = (imgId, e) => {
    e.stopPropagation();
    if (!selectedRecipe) return;

    updateRecipes(prev => prev.map(r => {
      if (r.id === selectedRecipe.id) {
        const updatedImages = r.images.filter(img => img.id !== imgId);
        const labelledCount = updatedImages.filter(im => im.status === 'Labelled').length;
        const updated = {
          ...r,
          image: updatedImages.length > 0 ? updatedImages[0].src : null,
          dataCount: updatedImages.length > 0 ? `${updatedImages.length * 100}` : '00',
          labelingPercent: updatedImages.length > 0 ? `${Math.round((labelledCount / updatedImages.length) * 100)}%` : '00%',
          images: updatedImages
        };
        setSelectedRecipe(updated);
        return updated;
      }
      return r;
    }));
  };

  // Open Annotation Studio for an image
  const handleOpenAnnotation = (imageSrc, annotations, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onOpenAnnotationStudio) {
      onOpenAnnotationStudio(imageSrc, annotations);
    }
  };

  // Callback ref to connect stream directly as soon as the video element mounts
  const handleSetCameraVideo = useCallback((videoEl) => {
    cameraVideoRef.current = videoEl;
    if (videoEl && mediaStreamRef.current) {
      videoEl.srcObject = mediaStreamRef.current;
      videoEl.play().catch(e => console.debug('Camera video play error:', e));
    }
  }, []);

  // Camera methods (Recipe 5)
  const startCamera = async () => {
    try {
      setIsCameraStreaming(true);
      setIsSimulatedCamera(false);
      let stream = null;

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
            audio: false
          });
        } catch (err1) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: { ideal: 1280 }, height: { ideal: 720 } },
              audio: false
            });
          } catch (err2) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }
      }

      if (stream) {
        mediaStreamRef.current = stream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(e => console.debug('Video play error:', e));
        }
        setIsSimulatedCamera(false);
      } else {
        throw new Error('No physical webcam stream available');
      }
    } catch (err) {
      console.warn('Physical camera unavailable, running simulated factory inspection viewfinder:', err);
      setIsSimulatedCamera(true);
      setIsCameraStreaming(true);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setIsCameraStreaming(false);
    setIsSimulatedCamera(false);
  };

  // Automatically start camera whenever camera modal is opened, stop when closed
  useEffect(() => {
    if (isCameraModalOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraModalOpen]);

  const closeCameraModal = () => {
    stopCamera();
    setCapturedImageForAnnotation(null);
    setCapturedAnnotations([]);
    setIsDrawingAnnotation(false);
    setCurrentDragAnnotationBox(null);
    setIsCameraModalOpen(false);
  };

  const handleCaptureImage = () => {
    playShutterSound();
    let capturedSrc = null;

    if (isCameraStreaming && cameraVideoRef.current && !isSimulatedCamera) {
      try {
        const video = cameraVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        capturedSrc = canvas.toDataURL('image/jpeg', 0.92);
      } catch (e) {
        capturedSrc = selectedRecipe?.image || cottonFabricImg;
      }
    } else {
      capturedSrc = selectedRecipe?.image || cottonFabricImg;
    }

    // Freeze camera and enter Defect Annotation Mode right in the dialog!
    stopCamera();
    setCapturedImageForAnnotation(capturedSrc);
    setCapturedAnnotations([]);
  };

  const getAnnotationCoords = (e) => {
    if (!annotationStageRef.current) return { x: 0, y: 0 };
    const rect = annotationStageRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const percentX = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (clientY / rect.height) * 100));
    return { x: percentX, y: percentY };
  };

  const handleStartDraw = (e) => {
    e.preventDefault();
    const coords = getAnnotationCoords(e);
    setIsDrawingAnnotation(true);
    setAnnotationStartPoint(coords);
    setCurrentDragAnnotationBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMoveDraw = (e) => {
    if (!isDrawingAnnotation || !annotationStartPoint) return;
    const coords = getAnnotationCoords(e);
    const x = Math.min(annotationStartPoint.x, coords.x);
    const y = Math.min(annotationStartPoint.y, coords.y);
    const width = Math.abs(coords.x - annotationStartPoint.x);
    const height = Math.abs(coords.y - annotationStartPoint.y);
    setCurrentDragAnnotationBox({ x, y, width, height });
  };

  const handleEndDraw = () => {
    if (!isDrawingAnnotation || !currentDragAnnotationBox) return;
    setIsDrawingAnnotation(false);
    if (currentDragAnnotationBox.width > 2 && currentDragAnnotationBox.height > 2) {
      const newAnn = {
        id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        label: selectedAnnotationDefect === 'Custom' ? (customDefectInput || 'Custom Defect') : selectedAnnotationDefect,
        severity: selectedSeverity,
        box: {
          x: Math.round(currentDragAnnotationBox.x),
          y: Math.round(currentDragAnnotationBox.y),
          width: Math.round(currentDragAnnotationBox.width),
          height: Math.round(currentDragAnnotationBox.height)
        }
      };
      setCapturedAnnotations(prev => [...prev, newAnn]);
    }
    setCurrentDragAnnotationBox(null);
    setAnnotationStartPoint(null);
  };

  const handleSaveCapturedAnnotation = () => {
    if (!capturedImageForAnnotation) return;

    const sampleName = `${selectedRecipe?.name || 'Fabric'} - Camera Defect #${Date.now().toString().slice(-4)}`;
    const newSample = {
      id: `sample-${Date.now()}`,
      name: sampleName,
      fabricType: selectedRecipe?.name || 'Cotton Fabric',
      image: capturedImageForAnnotation,
      annotations: capturedAnnotations,
      createdAt: new Date().toISOString()
    };

    // 1. Add to recipe images
    const newImg = {
      id: `img-annotated-${Date.now()}`,
      src: capturedImageForAnnotation,
      status: capturedAnnotations.length > 0 ? 'Labelled' : 'Un-Labelled',
      annotations: capturedAnnotations,
      defectTypes: capturedAnnotations.map(a => a.label)
    };

    if (selectedRecipe) {
      const updatedImages = [newImg, ...selectedRecipe.images];
      const updated = {
        ...selectedRecipe,
        image: selectedRecipe.image || capturedImageForAnnotation,
        dataCount: `${updatedImages.length * 100}`,
        images: updatedImages
      };
      setSelectedRecipe(updated);
      setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
    } else if (recipes.length > 0) {
      const first = recipes[0];
      const updatedImages = [newImg, ...first.images];
      const updated = {
        ...first,
        image: first.image || capturedImageForAnnotation,
        dataCount: `${updatedImages.length * 100}`,
        images: updatedImages
      };
      setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }

    // 2. Save sample to Dataset (backend & state)
    if (onSaveSample) {
      onSaveSample(newSample);
    } else {
      fetch('/api/dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSample)
      }).catch(err => console.debug('Offline dataset save:', err));
    }

    // 3. Close Camera modal & trigger Model Training Dialog
    closeCameraModal();
    setIsTrainingModalOpen(true);
  };

  const handleRetakePhoto = () => {
    setCapturedImageForAnnotation(null);
    setCapturedAnnotations([]);
    setIsDrawingAnnotation(false);
    setCurrentDragAnnotationBox(null);
    startCamera();
  };

  // Upload methods (Recipe 8)
  const handleStartUpload = (files, isLabelled) => {
    setIsImportModalOpen(false);
    setIsUploadingModalOpen(true);
    setIsUploadLabelled(isLabelled);
    setUploadProgress(15);
    setUploadFileCount(files?.length > 1 ? files.length : 2400);
    setUploadFileSize(files?.length > 1 ? `${(files.length * 0.4).toFixed(1)} MB` : '01 GB');
    setUploadTimeLeft('20 min left');

    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);

    let current = 15;
    uploadTimerRef.current = setInterval(() => {
      current += 20;
      if (current >= 80 && current < 95) {
        setUploadTimeLeft('5 min left');
      }
      if (current >= 100) {
        clearInterval(uploadTimerRef.current);
        setUploadProgress(100);
        setUploadTimeLeft('Complete');

        setTimeout(() => {
          completeUpload(files, isLabelled);
        }, 400);
      } else {
        setUploadProgress(current);
      }
    }, 220);
  };

  const handleCancelUpload = () => {
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    setIsUploadingModalOpen(false);
    setUploadProgress(0);
  };

  const completeUpload = async (files, isLabelled) => {
    setIsUploadingModalOpen(false);

    const fileList = files ? Array.from(files) : [];
    const zipFile = fileList.find(f => f.name.toLowerCase().endsWith('.zip'));

    // Check if user uploaded a ZIP file (like train.zip or Fabric Defect Inspection through AI.coco.zip)
    if (zipFile) {
      try {
        // Trigger server COCO ZIP unpack & import to dataset.json
        const res = await fetch('/api/dataset/import-coco', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zipPath: (zipFile.name.includes('\\') || zipFile.name.includes('/')) ? zipFile.name : undefined
          })
        });
        const data = await res.json();
        if (data.success && data.dataset) {
          if (onDatasetUpdated) onDatasetUpdated(data.dataset);

          // Extract all COCO images from dataset to populate recipe
          const cocoSamples = data.dataset.filter(s => String(s.id).startsWith('coco-'));
          const newImgs = cocoSamples.map((s, idx) => {
            const hasAnnotations = s.annotations && s.annotations.length > 0;
            return {
              id: `img-${s.id}-${idx}`,
              src: s.thumbnail,
              // Any sample with annotations MUST be marked 'Labelled'
              status: hasAnnotations ? 'Labelled' : (isLabelled ? 'Labelled' : 'Un-Labelled'),
              name: s.name,
              annotations: s.annotations || []
            };
          });

          const target = selectedRecipe || recipes[0];
          if (target) {
            const updatedImages = [...(target.images || []), ...newImgs];
            const labelledCount = updatedImages.filter(im => im.status === 'Labelled').length;
            const updated = {
              ...target,
              image: target.image || (newImgs[0]?.src || null),
              dataCount: `${updatedImages.length}`,
              labelingPercent: `${Math.round((labelledCount / updatedImages.length) * 100)}%`,
              images: updatedImages
            };
            setSelectedRecipe(updated);
            updateRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
          }

          if (isLabelled || newImgs.some(im => im.status === 'Labelled')) {
            setIsTrainingModalOpen(true);
          }
          return;
        }
      } catch (err) {
        console.error('Error importing COCO zip in recipe:', err);
      }
    }

    // Check if a COCO JSON annotation file is among the uploaded files (e.g. from an unzipped folder)
    const jsonFile = fileList.find(f => f.name.toLowerCase().endsWith('.json'));
    let cocoAnnMap = {};
    if (jsonFile) {
      cocoAnnMap = await parseCocoJsonClientSide(jsonFile);
    }

    // Filter image files
    const imageFiles = fileList.filter(f => 
      !f.name.toLowerCase().endsWith('.json') && 
      !f.name.toLowerCase().endsWith('.zip') && 
      !f.name.toLowerCase().endsWith('.txt')
    );

    let newImgs = [];
    if (imageFiles.length > 0) {
      newImgs = await Promise.all(
        imageFiles.map((file, i) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const fileName = file.name;
            const baseName = fileName.split('/').pop().split('\\').pop();
            const matchedAnns = cocoAnnMap[fileName] || cocoAnnMap[fileName.toLowerCase()] || cocoAnnMap[baseName] || cocoAnnMap[baseName.toLowerCase()] || [];
            const hasAnns = matchedAnns.length > 0;
            resolve({
              id: `img-up-${Date.now()}-${i}`,
              src: event.target.result,
              // If annotations exist, status is ALWAYS 'Labelled'!
              status: hasAnns ? 'Labelled' : (isLabelled ? 'Labelled' : 'Un-Labelled'),
              name: file.name,
              annotations: matchedAnns
            });
          };
          reader.onerror = () => {
            resolve({
              id: `img-up-${Date.now()}-${i}`,
              src: i % 2 === 0 ? valvetFabricImg : fabricImg,
              status: isLabelled ? 'Labelled' : 'Un-Labelled'
            });
          };
          reader.readAsDataURL(file);
        }))
      );
    } else {
      newImgs = Array.from({ length: 4 }).map((_, i) => ({
        id: `img-up-${Date.now()}-${i}`,
        src: i % 2 === 0 ? valvetFabricImg : fabricImg,
        status: isLabelled ? 'Labelled' : 'Un-Labelled'
      }));
    }

    const target = selectedRecipe || recipes[0];
    if (target) {
      const updatedImages = [...(target.images || []), ...newImgs];
      const labelledCount = updatedImages.filter(im => im.status === 'Labelled').length;
      const updated = {
        ...target,
        image: target.image || newImgs[0]?.src,
        dataCount: `${updatedImages.length}`,
        labelingPercent: `${Math.round((labelledCount / updatedImages.length) * 100)}%`,
        images: updatedImages
      };
      setSelectedRecipe(updated);
      updateRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
    }

    if (isLabelled || newImgs.some(im => im.status === 'Labelled')) {
      setIsTrainingModalOpen(true);
    }
  };

  const handlePrevDuration = () => {
    setDurationIndex(prev => (prev > 0 ? prev - 1 : trainingDurations.length - 1));
  };

  const handleNextDuration = () => {
    setDurationIndex(prev => (prev < trainingDurations.length - 1 ? prev + 1 : 0));
  };

  const handleExecuteTraining = () => {
    if (!selectedRecipe) return;

    // Close Model Training configuration modal
    setIsTrainingModalOpen(false);

    // Open Training in Progress modal (Dialog 1)
    setIsTrainingInProgressOpen(true);
    setTrainingProgress(15);
    setTrainingTimeLeft('20 min left');

    if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);

    // Trigger backend model training across all dataset samples & classes
    fetch('/api/train', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelName: `Wabric-${(selectedRecipe.name || 'Fabric').replace(/\s+/g, '-')}-v1.${Date.now().toString().slice(-4)}`,
        epochs: 15
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.model && onModelTrained) {
        onModelTrained(data.model);
      }
    })
    .catch(err => console.debug('Offline training fallback:', err));

    let current = 15;
    trainingTimerRef.current = setInterval(() => {
      current += 15;
      if (current >= 80 && current < 95) {
        setTrainingTimeLeft('10 min left');
      }
      if (current >= 100) {
        clearInterval(trainingTimerRef.current);
        setTrainingProgress(100);
        setTrainingTimeLeft('Complete');

        setTimeout(() => {
          setIsTrainingInProgressOpen(false);

          // Update recipe to Trained state
          const updated = {
            ...selectedRecipe,
            status: 'Trained',
            dataCount: `${selectedRecipe.images.length || 104}`,
            labelingPercent: '100%',
            accuracyPercent: '98.8%',
            accentColor: '#59C4B3'
          };
          setSelectedRecipe(updated);
          updateRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
        }, 500);
      } else {
        setTrainingProgress(current);
      }
    }, 300);
  };

  const handleCancelTraining = () => {
    if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
    setIsTrainingInProgressOpen(false);
    setTrainingProgress(0);
  };

  const handleExecuteDeploy = () => {
    const ws = selectedWorkstation || 'Workstation 01';
    setSelectedWorkstation(ws);
    setIsDeployModalOpen(false);
    setIsWorkstationDropdownOpen(false);

    // Open "Please Wait... Deployment in Progress" dialog (Dialog 2)
    setIsDeployingInProgressOpen(true);
    setDeployProgress(20);
    setDeployTimeLeft('02 min left');

    if (deployTimerRef.current) clearInterval(deployTimerRef.current);

    let current = 20;
    deployTimerRef.current = setInterval(() => {
      current += 20;
      if (current >= 80 && current < 95) {
        setDeployTimeLeft('01 min left');
      }
      if (current >= 100) {
        clearInterval(deployTimerRef.current);
        setDeployProgress(100);
        setDeployTimeLeft('Complete');

        setTimeout(() => {
          setIsDeployingInProgressOpen(false);

          // Update recipe deployment badge
          if (selectedRecipe) {
            const updated = {
              ...selectedRecipe,
              deploymentStatus: `Deployed to ${ws}`
            };
            setSelectedRecipe(updated);
            setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
          }

          // Open Published Successfully dialog (Dialog 4)
          setIsPublishedSuccessOpen(true);
        }, 500);
      } else {
        setDeployProgress(current);
      }
    }, 300);
  };

  const handleCancelDeployment = () => {
    if (deployTimerRef.current) clearInterval(deployTimerRef.current);
    setIsDeployingInProgressOpen(false);
    setDeployProgress(0);
  };

  // Cleanup timers and media on unmount
  useEffect(() => {
    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
      if (trainingTimerRef.current) clearInterval(trainingTimerRef.current);
      if (deployTimerRef.current) clearInterval(deployTimerRef.current);
      stopCamera();
    };
  }, []);

  // Synchronize top line navbar items with TopNavbar
  useEffect(() => {
    if (!setNavbarLeftContent) return;

    if (selectedRecipe) {
      const labelledCount = selectedRecipe.images.filter(i => i.status === 'Labelled').length;
      const unLabelledCount = selectedRecipe.images.filter(i => i.status === 'Un-Labelled').length;

      setNavbarLeftContent(
        <div className="recipe-detail-title-group">
          <button className="recipe-back-btn" onClick={handleBackToList} title="Back to All Recipes">
            <ArrowLeft size={20} />
          </button>
          <h1 className="recipes-main-heading">
            Images ({selectedRecipe.images.length.toString().padStart(2, '0')})
          </h1>

          {/* Legend Filter Indicator */}
          <div className="recipe-header-legends">
            <div className="recipe-legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#D7D38C' }}></span>
              <span className="recipe-filter-label">Labelled</span>
              <span className="recipe-filter-count">({labelledCount.toString().padStart(2, '0')})</span>
            </div>
            <div className="recipe-legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#4F9BFF' }}></span>
              <span className="recipe-filter-label">Un-Labelled</span>
              <span className="recipe-filter-count">({unLabelledCount.toString().padStart(2, '0')})</span>
            </div>
          </div>
        </div>
      );
    } else {
      setNavbarLeftContent(
        <div className="recipes-header-left-group">
          <h1 className="recipes-main-heading">
            All Recipes ({recipes.length.toString().padStart(2, '0')})
          </h1>

          {/* Legend 1: Dot #59C4B3 - "Trained (00)" */}
          <div
            className={`recipe-legend-item clickable ${filterType === 'trained' ? 'active' : ''}`}
            onClick={() => setFilterType(prev => prev === 'trained' ? 'all' : 'trained')}
          >
            <span className="legend-dot" style={{ backgroundColor: '#59C4B3' }}></span>
            <span className="recipe-filter-label">Trained</span>
            <span className="recipe-filter-count">({trainedCount.toString().padStart(2, '0')})</span>
          </div>

          {/* Legend 2: Dot #ED9566 - "Un-Trained (00)" */}
          <div
            className={`recipe-legend-item clickable ${filterType === 'untrained' ? 'active' : ''}`}
            onClick={() => setFilterType(prev => prev === 'untrained' ? 'all' : 'untrained')}
          >
            <span className="legend-dot" style={{ backgroundColor: '#ED9566' }}></span>
            <span className="recipe-filter-label">Un-Trained</span>
            <span className="recipe-filter-count">({unTrainedCount.toString().padStart(2, '0')})</span>
          </div>
        </div>
      );
    }

    return () => {
      setNavbarLeftContent(null);
    };
  }, [selectedRecipe, recipes, filterType, trainedCount, unTrainedCount, setNavbarLeftContent]);

  // =========================================================================
  // VIEW RENDER: Unified Root
  // =========================================================================
  const hasImages = selectedRecipe?.images && selectedRecipe.images.length > 0;

  return (
    <div className="recipes-view-root">
      {selectedRecipe ? (
        <>
          {/* Action Buttons Row brought to the LEFT */}
          <div className="recipe-detail-actions-row">
            {/* Add Data Button */}
            <button
              className="recipe-action-btn"
              onClick={() => setIsImportModalOpen(true)}
            >
              Add Data
              <img src={addIcon} alt="Add" className="recipe-btn-svg" />
            </button>

            {/* Train / Retrain Button */}
            <button
              className="recipe-action-btn"
              onClick={() => setIsTrainingModalOpen(true)}
            >
              {hasImages ? 'Retrain' : 'Train Model'}
              <img src={retrainIcon} alt="Retrain" className="recipe-btn-svg" />
            </button>

            {/* Deploy / Undeployed Button */}
            <button
              className="recipe-action-btn"
              onClick={() => setIsDeployModalOpen(true)}
            >
              Undeployed
              <img src={undeployedIcon} alt="Deploy" className="recipe-btn-svg" />
            </button>
          </div>

          {/* =====================================================================
              IMAGE 3: EMPTY RECIPE VIEW
             ===================================================================== */}
          {!hasImages ? (
            <div className="recipe-empty-container">
              <div className="recipe-empty-illustration-box">
                <img
                  src={emptyRecipeImg}
                  alt="Empty Recipe"
                  className="recipe-empty-folder-img"
                />
              </div>
              <p className="recipe-empty-caption-text">
                Collect data and manage your image library
              </p>
            </div>
          ) : (
            /* ===================================================================
                IMAGE 4: FILLED RECIPE VIEW (Grid of Fabric Thumbnails)
               =================================================================== */
            <div className="recipe-images-grid-container">
              {selectedRecipe.images.map((img) => (
                <div key={img.id} className="recipe-image-tile-card">
                  <img
                    src={img.src}
                    alt="Fabric Sample"
                    className="recipe-tile-fabric-img"
                  />

                  {/* Status Badge (Top-Left) */}
                  <span
                    className={`recipe-tile-badge ${
                      img.status === 'Labelled' ? 'badge-labelled' : 'badge-unlabelled'
                    }`}
                  >
                    {img.status}
                  </span>

                  {/* Delete Button (Top-Right) */}
                  <button
                    className="recipe-tile-delete-btn"
                    onClick={(e) => handleDeleteImage(img.id, e)}
                    title="Delete image"
                  >
                    <img src={deleteIcon} alt="Delete" className="recipe-delete-icon-img" />
                  </button>

                  {/* Center Hover Label Button */}
                  <div className="recipe-tile-overlay-hover">
                    <button
                      className="recipe-center-label-pill"
                      onClick={(e) => handleOpenAnnotation(img.src, img.annotations, e)}
                    >
                      Label
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Action Row: Create Button (123 x 40, "Create" is medium 16) */}
          <div className="recipes-action-bar-row">
            <button
              className="recipe-create-btn-123x40"
              onClick={() => setIsCreateDrawerOpen(true)}
            >
              Create
              <img src={addIcon} alt="Add" className="recipe-add-icon-svg" />
            </button>
          </div>

      {/* =====================================================================
          CARDS GRID (Exact 380 x 395 per Image 1)
         ===================================================================== */}
      <div className="recipes-cards-grid-row">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="recipe-item-card"
            onClick={() => handleCardClick(recipe)}
          >
            {/* Top Thumbnail Image */}
            <div className="recipe-card-thumb-area">
              {recipe.image ? (
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="recipe-card-fabric-img"
                />
              ) : (
                /* Empty placeholder box with folder */
                <div className="recipe-card-empty-placeholder">
                  <div className="placeholder-folder-icon-box">
                    <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
                      <rect width="34" height="28" rx="6" fill="#0A0A0A" />
                      <line x1="10" y1="14" x2="24" y2="14" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Content Area */}
            <div className="recipe-card-body-section">
              {/* Left Accent Stripe */}
              <div
                className="recipe-left-accent-stripe"
                style={{ backgroundColor: recipe.accentColor }}
              ></div>

              <div className="recipe-card-text-col">
                {/* Recipe Name ("Cotton Fabric" is Semibold 18) */}
                <h3 className="recipe-card-name-title">{recipe.name}</h3>

                {/* Item Number ("Item: 78767890" medium 13, #747474) */}
                <div className="recipe-card-item-subtitle">
                  Item: {recipe.itemNumber}
                </div>

                {/* 3-Column Metrics Row */}
                <div className="recipe-card-stats-row">
                  {/* Metric 1: Data ("54600" medium 18, "Data" normal 14) */}
                  <div className="recipe-stat-col">
                    <div className="recipe-stat-val-med18">{recipe.dataCount}</div>
                    <div className="recipe-stat-lbl-norm14">Data</div>
                  </div>

                  {/* Metric 2: Labeling ("00%" medium 18, "Labeling" normal 14) */}
                  <div className="recipe-stat-col">
                    <div className="recipe-stat-val-med18">{recipe.labelingPercent}</div>
                    <div className="recipe-stat-lbl-norm14">Labeling</div>
                  </div>

                  {/* Metric 3: Accuracy ("00%" medium 18, "Accuracy" normal 14) */}
                  <div className="recipe-stat-col">
                    <div className="recipe-stat-val-med18">{recipe.accuracyPercent}</div>
                    <div className="recipe-stat-lbl-norm14">Accuracy</div>
                  </div>
                </div>

                {/* Footer Badges & Dots Menu Row */}
                <div className="recipe-card-footer-row">
                  <div className="recipe-badges-cluster">
                    {/* Badge 1: Training Status */}
                    {recipe.status === 'Trained' ? (
                      <span className="recipe-pill-badge badge-trained-blue">
                        Trained
                      </span>
                    ) : (
                      <span className="recipe-pill-badge badge-untrained-orange">
                        Un-Trained
                      </span>
                    )}

                    {/* Badge 2: Deployment Status */}
                    {recipe.deploymentStatus && (
                      <span className="recipe-pill-badge badge-deployed-green">
                        {recipe.deploymentStatus}
                      </span>
                    )}
                  </div>

                  {/* Vertical Dots Icon */}
                  <div className="recipe-card-dots-wrap" style={{ position: 'relative' }}>
                    <button
                      className="recipe-card-dots-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === recipe.id ? null : recipe.id);
                      }}
                    >
                      <img src={verticalDotsIcon} alt="Options" className="vertical-dots-icon-img" />
                    </button>

                    {activeMenuId === recipe.id && (
                      <div className="recipe-card-popover-menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="popover-item"
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setActiveMenuId(null);
                          }}
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          className="popover-item"
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setIsTrainingModalOpen(true);
                            setActiveMenuId(null);
                          }}
                        >
                          Retrain Model
                        </button>
                        <button
                          type="button"
                          className="popover-item"
                          onClick={() => {
                            setSelectedRecipe(recipe);
                            setIsDeployModalOpen(true);
                            setActiveMenuId(null);
                          }}
                        >
                          Deploy Recipe
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )}

      {/* =====================================================================
          IMAGE 2: CREATE RECIPE SLIDE-OUT DRAWER
         ===================================================================== */}
      {isCreateDrawerOpen && (
        <div className="create-recipe-drawer-backdrop" onClick={() => setIsCreateDrawerOpen(false)}>
          <div
            className="create-recipe-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="create-drawer-header">
              <h2 className="create-drawer-title">Create Recipe</h2>
              <button
                className="create-drawer-close-btn"
                onClick={() => setIsCreateDrawerOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body Form */}
            <form onSubmit={handleCreateRecipe} className="create-drawer-form">
              <div className="create-form-fields-grid">
                {/* Recipe Name */}
                <div className="create-input-group">
                  <input
                    type="text"
                    placeholder="Recipe Name"
                    value={newRecipeName}
                    onChange={(e) => setNewRecipeName(e.target.value)}
                    className="create-text-input"
                    required
                  />
                </div>

                {/* Item Number */}
                <div className="create-input-group">
                  <input
                    type="text"
                    placeholder="Item Number"
                    value={newItemNumber}
                    onChange={(e) => setNewItemNumber(e.target.value)}
                    className="create-text-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="create-input-group">
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="create-text-input full-width"
                />
              </div>

              {/* Data Attachment Buttons */}
              <div className="create-data-attach-row">
                <button
                  type="button"
                  className="create-data-attach-btn"
                  onClick={() => labeledDataInputRef.current && labeledDataInputRef.current.click()}
                >
                  <img src={addIcon} alt="Add" className="attach-add-icon" />
                  Labeled Data
                </button>
                <input
                  type="file"
                  ref={labeledDataInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileAttach(e, true)}
                />

                <button
                  type="button"
                  className="create-data-attach-btn"
                  onClick={() => unLabeledDataInputRef.current && unLabeledDataInputRef.current.click()}
                >
                  <img src={addIcon} alt="Add" className="attach-add-icon" />
                  Un-Labeled Data
                </button>
                <input
                  type="file"
                  ref={unLabeledDataInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileAttach(e, false)}
                />
              </div>

              {/* Attached files preview count if any */}
              {attachedFiles.length > 0 && (
                <div className="attached-files-counter-tag">
                  {attachedFiles.length} image(s) attached
                </div>
              )}

              {/* Drawer Footer Actions (Clear & Create) */}
              <div className="create-drawer-footer">
                <button
                  type="button"
                  className="create-drawer-clear-btn"
                  onClick={handleClearDrawer}
                >
                  Clear
                </button>
                <button type="submit" className="create-drawer-submit-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          RECIPE 6: IMPORT DATA DIALOG (826 x 618)
         ===================================================================== */}
      {isImportModalOpen && (
        <div className="recipe-modal-backdrop" onClick={() => setIsImportModalOpen(false)}>
          <div className="recipe-import-dialog-826x618" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Import Data</h2>
              <button
                className="recipe-dialog-close-btn"
                onClick={() => setIsImportModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dropzone Box */}
            <div
              className="import-dropzone-box"
              onClick={() => importFileInputRef.current && importFileInputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleStartUpload(Array.from(e.dataTransfer.files), false);
                }
              }}
            >
              <img src={uploadIcon} alt="Upload" className="import-upload-svg" />
              <div className="import-upload-main-text">
                <span className="import-upload-link-blue">Click to upload</span> or Drag and drop
              </div>
              <div className="import-upload-subtext">Maximum file size 01 GB</div>
              <input
                type="file"
                ref={importFileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.zip"
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleStartUpload(Array.from(e.target.files), false);
                  }
                }}
              />
            </div>

            {/* Stacked Action Buttons */}
            <button
              className="import-action-btn-stacked"
              onClick={() => importLabelledInputRef.current && importLabelledInputRef.current.click()}
            >
              Import Labelled Datasets
            </button>
            <input
              type="file"
              ref={importLabelledInputRef}
              style={{ display: 'none' }}
              accept="image/*,.zip"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleStartUpload(Array.from(e.target.files), true);
                }
              }}
            />

            <button
              className="import-action-btn-stacked"
              onClick={() => {
                setIsImportModalOpen(false);
                setIsCameraModalOpen(true);
              }}
            >
              Capture from Camera
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          RECIPE 8: IMAGE UPLOADING DIALOG (826 x 550)
         ===================================================================== */}
      {isUploadingModalOpen && (
        <div className="recipe-modal-backdrop" onClick={handleCancelUpload}>
          <div className="recipe-uploading-dialog-826x550" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Image Uploading</h2>
              <button
                className="recipe-dialog-close-btn"
                onClick={handleCancelUpload}
              >
                <X size={20} />
              </button>
            </div>

            {/* Center Box */}
            <div className="uploading-center-card">
              <div className="uploading-top-meta-row">
                <img src={folderIconBlue} alt="Folder" className="uploading-folder-svg" />
                <div className="uploading-percent-val">{uploadProgress}%</div>
              </div>

              {/* Progress Bar */}
              <div className="uploading-progress-track">
                <div
                  className="uploading-progress-bar-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>

              {/* Info Row */}
              <div className="uploading-stats-row">
                <span>{uploadFileCount} Images ({uploadFileSize}), Zip file</span>
                <span>{uploadTimeLeft}</span>
              </div>

              {/* Helper Message */}
              <p className="uploading-bottom-desc">
                We like to make sure your data is in good shape. It will make your analysis
                more accurate.
              </p>
            </div>

            {/* Footer Action */}
            <button className="uploading-cancel-btn" onClick={handleCancelUpload}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          RECIPE 7: MODEL TRAINING DIALOG (826 x 599)
         ===================================================================== */}
      {isTrainingModalOpen && (
        <div className="recipe-modal-backdrop" onClick={() => setIsTrainingModalOpen(false)}>
          <div className="recipe-training-dialog-826x599" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Model Training</h2>
              <button
                className="recipe-dialog-close-btn"
                onClick={() => setIsTrainingModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary Box */}
            <div className="training-summary-card">
              <div className="training-summary-title">Summary</div>
              <div className="training-summary-grid">
                <div className="training-summary-row">
                  <span className="training-summary-key">Total Images :</span>
                  <span className="training-summary-val">
                    {selectedRecipe ? (selectedRecipe.images?.length > 0 ? selectedRecipe.images.length * 100 : '292931') : '292931'}
                  </span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Created At :</span>
                  <span className="training-summary-val">12/ 05/ 2023</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Image Resolution :</span>
                  <span className="training-summary-val">1200^1200</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Epochs :</span>
                  <span className="training-summary-val">None</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Image Type :</span>
                  <span className="training-summary-val">JPEG</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Training Mode :</span>
                  <span className="training-summary-val">Standard</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Camera Type :</span>
                  <span className="training-summary-val">Boomer</span>
                </div>
                <div className="training-summary-row">
                  <span className="training-summary-key">Estimated Time & Credit :</span>
                  <span className="training-summary-val">{trainingDurations[durationIndex]} (50 Credits)</span>
                </div>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="training-duration-selector-row">
              <div className="training-duration-left">
                <Clock size={18} color="#6B7280" />
                <span>Enter Your Training Duration ({trainingDurations[durationIndex]})</span>
              </div>
              <div className="training-duration-arrows">
                <button
                  type="button"
                  className="training-arrow-btn"
                  onClick={handlePrevDuration}
                  title="Previous Duration"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="training-arrow-btn"
                  onClick={handleNextDuration}
                  title="Next Duration"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="training-footer-actions">
              <button
                type="button"
                className="training-cancel-btn"
                onClick={() => setIsTrainingModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="training-submit-btn"
                onClick={handleExecuteTraining}
              >
                Train
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          RECIPE 5: CAMERA VIEW DIALOG (1585 x 831)
         ===================================================================== */}
      {isCameraModalOpen && (
        <div className="recipe-modal-backdrop" onClick={closeCameraModal}>
          <div className="recipe-camera-dialog-1585x831" onClick={(e) => e.stopPropagation()}>
            {/* Top Right Controls */}
            <div className="camera-top-controls-bar">
              {!capturedImageForAnnotation && (
                <button
                  type="button"
                  className="camera-start-pill-btn"
                  onClick={() => isCameraStreaming ? stopCamera() : startCamera()}
                >
                  <Play size={13} fill="#FFFFFF" />
                  {isCameraStreaming ? 'Stop' : 'Start'}
                </button>
              )}

              <button
                type="button"
                className="camera-icon-round-btn"
                onClick={() => {
                  const el = document.querySelector('.recipe-camera-dialog-1585x831');
                  if (el) {
                    if (document.fullscreenElement) document.exitFullscreen();
                    else el.requestFullscreen();
                  }
                }}
                title="Fullscreen"
              >
                <Maximize2 size={18} />
              </button>

              <button
                type="button"
                className="camera-icon-round-btn"
                onClick={closeCameraModal}
                title="Close Camera"
              >
                <X size={20} />
              </button>
            </div>

            {/* Viewfinder Center Area: Live Stream OR Defect Annotation Mode */}
            {capturedImageForAnnotation ? (
              <div className="camera-annotation-stage-root">
                {/* Floating Glass Toolbar for Defect Selection */}
                <div className="camera-annotation-toolbar-glass">
                  <div className="annotation-toolbar-header-row">
                    <div className="annotation-toolbar-title-group">
                      <Tag size={18} color="#60A5FA" />
                      <span>Draw Area Covering Defect to Annotate</span>
                      <span className="annotation-toolbar-badge">
                        {capturedAnnotations.length} Flaw(s) Boxed
                      </span>
                    </div>

                    {/* Severity Selector */}
                    <div className="severity-selector-group">
                      <span style={{ fontSize: '12px', color: '#94A3B8', marginRight: '4px' }}>Severity:</span>
                      <button
                        type="button"
                        className={`severity-toggle-btn critical ${selectedSeverity === 'critical' ? 'active' : ''}`}
                        onClick={() => setSelectedSeverity('critical')}
                      >
                        Critical
                      </button>
                      <button
                        type="button"
                        className={`severity-toggle-btn moderate ${selectedSeverity === 'moderate' ? 'active' : ''}`}
                        onClick={() => setSelectedSeverity('moderate')}
                      >
                        Moderate
                      </button>
                      <button
                        type="button"
                        className={`severity-toggle-btn minor ${selectedSeverity === 'minor' ? 'active' : ''}`}
                        onClick={() => setSelectedSeverity('minor')}
                      >
                        Minor
                      </button>
                    </div>
                  </div>

                  {/* Defect Category Pills */}
                  <div className="defect-types-selector-row">
                    <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>Defect Type:</span>
                    {DEFECT_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`defect-type-chip-btn ${selectedAnnotationDefect === cat ? 'active' : ''}`}
                        onClick={() => setSelectedAnnotationDefect(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Click-and-Drag Drawing Canvas Area */}
                <div
                  ref={annotationStageRef}
                  className="camera-annotation-viewport-area"
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleMoveDraw}
                  onMouseUp={handleEndDraw}
                >
                  <img
                    src={capturedImageForAnnotation}
                    alt="Captured Frame for Defect Labeling"
                    className="camera-annotation-preview-img"
                  />

                  {/* Rendered Defect Bounding Boxes */}
                  {capturedAnnotations.map(ann => (
                    <div
                      key={ann.id}
                      className={`camera-annotation-interactive-box severity-${ann.severity}`}
                      style={{
                        left: `${ann.box.x}%`,
                        top: `${ann.box.y}%`,
                        width: `${ann.box.width}%`,
                        height: `${ann.box.height}%`
                      }}
                    >
                      <div className={`camera-annotation-box-label severity-${ann.severity}`}>
                        <span>{ann.label}</span>
                        <button
                          type="button"
                          className="camera-annotation-box-remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCapturedAnnotations(capturedAnnotations.filter(a => a.id !== ann.id));
                          }}
                          title="Remove Defect Box"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Live Dragging Preview Box */}
                  {currentDragAnnotationBox && (
                    <div
                      className="camera-annotation-interactive-box drawing"
                      style={{
                        left: `${currentDragAnnotationBox.x}%`,
                        top: `${currentDragAnnotationBox.y}%`,
                        width: `${currentDragAnnotationBox.width}%`,
                        height: `${currentDragAnnotationBox.height}%`
                      }}
                    >
                      <div className="camera-annotation-box-label severity-critical" style={{ background: '#00f2fe', color: '#0F172A' }}>
                        <span>{selectedAnnotationDefect} (Drawing...)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="camera-annotation-bottom-bar">
                  <button
                    type="button"
                    className="camera-annotation-save-btn"
                    onClick={handleSaveCapturedAnnotation}
                  >
                    <Check size={16} />
                    Save Annotation & Train Model
                  </button>
                  <button
                    type="button"
                    className="camera-annotation-retake-btn"
                    onClick={handleRetakePhoto}
                  >
                    <RotateCcw size={15} />
                    Retake Photo
                  </button>
                  <button
                    type="button"
                    className="camera-annotation-retake-btn"
                    onClick={closeCameraModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="camera-viewfinder-stage">
                {/* Always mount video element with callback ref so stream binds immediately */}
                <video
                  ref={handleSetCameraVideo}
                  autoPlay
                  playsInline
                  muted
                  className="camera-video-feed"
                  style={{
                    display: isCameraStreaming && !isSimulatedCamera ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Simulated camera live inspection feed when no physical camera is plugged in */}
                {isCameraStreaming && isSimulatedCamera && (
                  <div className="camera-simulated-viewport">
                    <img
                      src={selectedRecipe?.image || cottonFabricImg}
                      alt="Live Camera Feed"
                      className="camera-simulated-feed-img"
                    />
                    <div className="camera-laser-scan-line" />
                    <div className="camera-corner-reticle top-left" />
                    <div className="camera-corner-reticle top-right" />
                    <div className="camera-corner-reticle bottom-left" />
                    <div className="camera-corner-reticle bottom-right" />
                    <div className="camera-center-target-reticle" />
                    <div className="camera-live-badge-pill">
                      <span className="camera-live-dot" />
                      <span>CAM-01 • 1080p 60FPS • LIVE FEED</span>
                    </div>
                  </div>
                )}

                {/* Offline / Stopped State */}
                {!isCameraStreaming && (
                  <div className="camera-offline-view">
                    <img
                      src={cameraIcon}
                      alt="Camera Icon"
                      className="camera-center-svg-img"
                    />
                    <div className="camera-offline-hint">Camera Paused. Click Start to resume.</div>
                  </div>
                )}

                {/* Floating Capture Button */}
                <button
                  type="button"
                  className="camera-capture-floating-btn"
                  onClick={handleCaptureImage}
                >
                  <Camera size={18} />
                  Capture
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          DIALOG 1: TRAINING IN PROGRESS DIALOG (826 x 550)
         ===================================================================== */}
      {isTrainingInProgressOpen && (
        <div className="recipe-modal-backdrop" onClick={handleCancelTraining}>
          <div className="recipe-training-in-progress-dialog-826x550" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Training in Progress</h2>
              <button
                type="button"
                className="recipe-dialog-close-btn"
                onClick={handleCancelTraining}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inner Bordered Card */}
            <div className="training-in-progress-card">
              <div className="progress-top-meta-row">
                <img src={folderIconBlue} alt="Folder" className="progress-folder-svg" />
                <div className="progress-percent-val">{trainingProgress}%</div>
              </div>

              {/* Progress Bar */}
              <div className="progress-track-bar">
                <div
                  className="progress-fill-bar"
                  style={{ width: `${trainingProgress}%` }}
                ></div>
              </div>

              {/* Sub Info Row */}
              <div className="progress-sub-info-row">
                <span className="progress-wait-text">Please Wait...</span>
                <span className="progress-time-text">{trainingTimeLeft}</span>
              </div>
            </div>

            {/* Bottom-right Cancel Button */}
            <div className="dialog-single-footer-action">
              <button
                type="button"
                className="dialog-cancel-pill-btn"
                onClick={handleCancelTraining}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DIALOG 2: DEPLOYMENT IN PROGRESS DIALOG ("Please Wait...") (826 x 480)
         ===================================================================== */}
      {isDeployingInProgressOpen && (
        <div className="recipe-modal-backdrop" onClick={handleCancelDeployment}>
          <div className="recipe-deploying-dialog-826x480" onClick={(e) => e.stopPropagation()}>
            {/* Header Area */}
            <div className="deploying-dialog-header">
              <h2 className="deploying-main-title">Please Wait...</h2>
              <p className="deploying-sub-title">We are publishing your recipe...</p>
            </div>

            {/* Progress Area without border */}
            <div className="deploying-progress-block">
              <div className="progress-top-meta-row">
                <img src={folderIconBlue} alt="Folder" className="progress-folder-svg" />
                <div className="progress-percent-val">{deployProgress}%</div>
              </div>

              {/* Progress Bar */}
              <div className="progress-track-bar">
                <div
                  className="progress-fill-bar"
                  style={{ width: `${deployProgress}%` }}
                ></div>
              </div>

              {/* Sub Info Row */}
              <div className="deploy-sub-info-row">
                <span className="deploy-time-text">{deployTimeLeft}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DIALOG 3: DEPLOY RECIPE DIALOG (826 x 380)
         ===================================================================== */}
      {isDeployModalOpen && (
        <div className="recipe-modal-backdrop" onClick={() => setIsDeployModalOpen(false)}>
          <div className="recipe-deploy-dialog-826x380" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-dialog-header">
              <h2 className="recipe-dialog-title">Deploy Recipe</h2>
              <button
                type="button"
                className="recipe-dialog-close-btn"
                onClick={() => setIsDeployModalOpen(false)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Subtitle */}
            <p className="deploy-dialog-subtext">Select option to continue</p>

            {/* Workstation Selector Dropdown */}
            <div className="deploy-select-container">
              <div
                className={`deploy-select-field ${isWorkstationDropdownOpen ? 'open' : ''}`}
                onClick={() => setIsWorkstationDropdownOpen(!isWorkstationDropdownOpen)}
              >
                <span className={selectedWorkstation ? 'deploy-select-value' : 'deploy-select-placeholder'}>
                  {selectedWorkstation || 'Select Workstation'}
                </span>
                <ChevronDown
                  size={18}
                  className={`deploy-chevron-icon ${isWorkstationDropdownOpen ? 'rotate' : ''}`}
                />
              </div>

              {/* Dropdown Options List */}
              {isWorkstationDropdownOpen && (
                <div className="deploy-dropdown-menu">
                  {['Workstation 01', 'Workstation 02', 'Workstation 03', 'Workstation 04'].map((ws) => (
                    <div
                      key={ws}
                      className={`deploy-dropdown-item ${selectedWorkstation === ws ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedWorkstation(ws);
                        setIsWorkstationDropdownOpen(false);
                      }}
                    >
                      <span>{ws}</span>
                      {selectedWorkstation === ws && <Check size={16} color="#0A5DE9" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons: Clear & Deploy */}
            <div className="deploy-footer-actions">
              <button
                type="button"
                className="deploy-clear-btn"
                onClick={() => {
                  setSelectedWorkstation('');
                  setIsWorkstationDropdownOpen(false);
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="deploy-submit-btn"
                onClick={handleExecuteDeploy}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          DIALOG 4: PUBLISHED SUCCESSFULLY DIALOG (760 x 480)
         ===================================================================== */}
      {isPublishedSuccessOpen && (
        <div className="recipe-modal-backdrop" onClick={() => setIsPublishedSuccessOpen(false)}>
          <div className="recipe-published-success-dialog-760x480" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="recipe-dialog-close-btn published-close-btn"
              onClick={() => setIsPublishedSuccessOpen(false)}
              title="Close"
            >
              <X size={20} />
            </button>

            <h2 className="published-success-heading">Published Successfully</h2>
            <p className="published-success-subheading">
              You can now use your published recipe in your Inspection platform.
            </p>

            <div
              className="published-success-icon-wrap"
              onClick={() => setIsPublishedSuccessOpen(false)}
              title="Click to dismiss"
            >
              <img
                src={tickGreen}
                alt="Published Successfully"
                className="published-success-tick-svg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

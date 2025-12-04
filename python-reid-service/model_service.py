"""
Person Re-Identification Model Service
Contains all model logic from your working Colab pipeline
"""

import torch
import torchvision
import torchreid
import numpy as np
import cv2
from PIL import Image
from ultralytics import YOLO
from sklearn.metrics.pairwise import cosine_similarity
import os
from typing import List, Dict, Tuple
import base64
from io import BytesIO


class PersonReIDService:
    """
    Person Re-Identification Service
    Handles model loading and inference
    """
    
    def __init__(self, model_dir: str = "models"):
        """
        Initialize the service and load models
        
        Args:
            model_dir: Directory containing model files
        """
        self.model_dir = model_dir
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        print(f"🖥️  Using device: {self.device}")
        if torch.cuda.is_available():
            print(f"✅ GPU: {torch.cuda.get_device_name(0)}")
        
        # Model placeholders
        self.osnet_model = None
        self.yolo_model = None
        
        # Load models
        self.load_models()
    
    def load_models(self):
        """Load OSNet-IBN and YOLOv8 models"""
        print("📥 Loading models...")
        
        # Load OSNet-IBN (Person Re-ID)
        print("  Loading OSNet-IBN...")
        self.osnet_model = torchreid.models.build_model(
            name='osnet_ibn_x1_0',
            num_classes=751,
            loss='softmax',
            pretrained=False  # We'll load our weights
        )
        
        # Load saved weights
        osnet_path = os.path.join(self.model_dir, "osnet_ibn_x1_0.pth")
        state_dict = torch.load(osnet_path, map_location=self.device)
        self.osnet_model.load_state_dict(state_dict)
        self.osnet_model = self.osnet_model.to(self.device)
        self.osnet_model.eval()
        print("  ✅ OSNet-IBN loaded!")
        
        # Load YOLOv8 (Person Detection)
        print("  Loading YOLOv8...")
        yolo_path = os.path.join(self.model_dir, "yolov8n.pt")
        self.yolo_model = YOLO(yolo_path)
        print("  ✅ YOLOv8 loaded!")
        
        print("✅ All models loaded successfully!\n")
    
    def extract_features(self, img: Image.Image) -> np.ndarray:
        """
        Extract 512-dim feature vector from person image
        
        Args:
            img: PIL Image
        Returns:
            feature: numpy array (1, 512)
        """
        # Resize and normalize (exact same as your pipeline)
        img_resized = img.resize((128, 256))
        img_tensor = torchvision.transforms.ToTensor()(img_resized)
        normalize = torchvision.transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
        img_tensor = normalize(img_tensor).unsqueeze(0).to(self.device)
        
        # Extract features
        self.osnet_model.eval()
        with torch.no_grad():
            feature = self.osnet_model(img_tensor)
        
        return feature.cpu().numpy()
    
    def extract_video_frames(
        self, 
        video_path: str, 
        frame_interval: int = 30
    ) -> Tuple[List[np.ndarray], List[int], float]:
        """
        Extract frames from video
        
        Args:
            video_path: Path to video file
            frame_interval: Extract every Nth frame (30 = 1fps for 30fps video)
        Returns:
            frames: List of RGB frames
            frame_numbers: Frame indices
            fps: Video FPS
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError("Cannot open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"📊 Video: {fps:.1f} FPS, {total_frames} frames, {total_frames/fps:.1f}s")
        print(f"   Extracting every {frame_interval} frames...")
        
        frames, frame_numbers = [], []
        frame_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                frame_numbers.append(frame_count)
            
            frame_count += 1
        
        cap.release()
        print(f"✅ Extracted {len(frames)} frames\n")
        
        return frames, frame_numbers, fps
    
    def detect_and_match(
        self, 
        frames: List[np.ndarray], 
        ref_feature: np.ndarray
    ) -> List[Dict]:
        """
        Detect all persons in frames and match with reference
        
        Args:
            frames: List of video frames
            ref_feature: Reference person feature vector
        Returns:
            all_detections: List of detections per frame
        """
        all_detections = []
        
        print(f"🔍 Processing {len(frames)} frames...")
        
        for frame_idx, frame in enumerate(frames):
            # Detect persons with YOLO
            results = self.yolo_model(frame, verbose=False)
            
            frame_data = {'frame_idx': frame_idx, 'persons': []}
            
            for result in results:
                for box in result.boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Only process person class (0) with confidence > 0.3
                    if cls == 0 and conf >= 0.3:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        
                        # Crop person
                        person_crop = frame[y1:y2, x1:x2]
                        
                        # Skip if too small
                        if person_crop.shape[0] < 20 or person_crop.shape[1] < 20:
                            continue
                        
                        try:
                            # Extract features
                            person_pil = Image.fromarray(person_crop)
                            person_feature = self.extract_features(person_pil)
                            
                            # Calculate similarity
                            similarity = cosine_similarity(ref_feature, person_feature)[0][0]
                            
                            frame_data['persons'].append({
                                'bbox': [x1, y1, x2, y2],
                                'similarity': float(similarity),
                                'image': person_pil
                            })
                        except Exception as e:
                            print(f"⚠️  Error processing person: {e}")
                            continue
            
            all_detections.append(frame_data)
        
        total = sum(len(d['persons']) for d in all_detections)
        print(f"✅ Detected {total} persons\n")
        
        return all_detections
    
    def find_matches(
        self, 
        all_detections: List[Dict], 
        frame_numbers: List[int], 
        fps: float, 
        threshold: float = 0.70, 
        top_n: int = 3
    ) -> Tuple[List[Dict], np.ndarray]:
        """
        Find best matching persons above threshold
        
        Returns:
            matches: List of top matches
            all_sims: All similarity scores (for analysis)
        """
        matches, all_sims = [], []
        
        for detection in all_detections:
            frame_idx = detection['frame_idx']
            frame_num = frame_numbers[frame_idx]
            timestamp = frame_num / fps
            
            for person in detection['persons']:
                sim = person['similarity']
                all_sims.append(sim)
                
                if sim >= threshold:
                    matches.append({
                        'frame_idx': frame_idx,
                        'frame_num': frame_num,
                        'time': timestamp,
                        'similarity': sim,
                        'bbox': person['bbox'],
                        'image': person['image']
                    })
        
        # Sort by similarity (highest first)
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        return matches[:top_n], np.array(all_sims)
    
    def image_to_base64(self, img: Image.Image) -> str:
        """Convert PIL Image to base64 string"""
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/jpeg;base64,{img_str}"
    
    def analyze(
        self, 
        reference_image_path: str, 
        video_path: str, 
        threshold: float = 0.70,
        top_n: int = 3
    ) -> Dict:
        """
        Main analysis pipeline
        
        Args:
            reference_image_path: Path to reference person image
            video_path: Path to CCTV video
            threshold: Similarity threshold (0.65-0.80 recommended)
            top_n: Number of top matches to return
        
        Returns:
            results: Dictionary with matches and metadata
        """
        print("="*80)
        print("🚀 STARTING PERSON RE-IDENTIFICATION")
        print("="*80)
        
        try:
            # 1. Load reference image
            print("\n📸 Loading reference image...")
            ref_img = Image.open(reference_image_path).convert('RGB')
            print("✅ Reference image loaded")
            
            # 2. Extract reference features
            print("\n🔍 Extracting reference features...")
            ref_feature = self.extract_features(ref_img)
            print(f"✅ Feature shape: {ref_feature.shape}")
            
            # 3. Extract video frames
            print("\n🎬 Extracting video frames...")
            frames, frame_nums, fps = self.extract_video_frames(video_path, frame_interval=30)
            
            # 4. Detect and match
            print("\n🔎 Detecting persons and matching...")
            all_detections = self.detect_and_match(frames, ref_feature)
            
            # 5. Find best matches
            print("\n✅ Finding best matches...")
            matches, all_sims = self.find_matches(
                all_detections, frame_nums, fps, threshold, top_n
            )
            
            # 6. Format results
            print("\n📊 Formatting results...")
            
            results = {
                "status": "success",
                "video_info": {
                    "fps": float(fps),
                    "total_frames": len(frames),
                    "duration_seconds": float(len(frames) * 30 / fps)
                },
                "statistics": {
                    "total_detections": len(all_sims),
                    "mean_similarity": float(all_sims.mean()) if len(all_sims) > 0 else 0,
                    "max_similarity": float(all_sims.max()) if len(all_sims) > 0 else 0,
                    "matches_found": len(matches)
                },
                "matches": []
            }
            
            # Convert matches to JSON-serializable format
            for i, match in enumerate(matches):
                results["matches"].append({
                    "rank": i + 1,
                    "confidence": float(match['similarity']),
                    "frame_number": int(match['frame_num']),
                    "timestamp_seconds": float(match['time']),
                    "bbox": [int(x) for x in match['bbox']],
                    "image_base64": self.image_to_base64(match['image'])
                })
            
            print("\n" + "="*80)
            print("✅ ANALYSIS COMPLETE")
            print("="*80)
            print(f"   Found {len(matches)} matches")
            print(f"   Top confidence: {results['matches'][0]['confidence']:.4f}" if matches else "   No matches found")
            print("="*80 + "\n")
            
            return results
            
        except Exception as e:
            print(f"\n❌ Error during analysis: {e}")
            return {
                "status": "error",
                "message": str(e),
                "matches": []
            }


# Singleton instance (loaded once)
_service_instance = None

def get_service(model_dir: str = "models") -> PersonReIDService:
    """Get or create service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = PersonReIDService(model_dir)
    return _service_instance
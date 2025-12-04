# Person Re-Identification Python Service

FastAPI service for person re-identification in CCTV footage.

## 📁 File Structure

```
python-reid-service/
├── models/                      # Place your downloaded models here
│   ├── osnet_ibn_x1_0.pth      # OSNet model
│   ├── yolov8n.pt              # YOLO model
│   └── config.json             # Model config
├── uploads/                     # Temporary file storage (auto-created)
│   ├── images/
│   └── videos/
├── main.py                      # FastAPI server
├── model_service.py             # Model logic
├── requirements.txt             # Dependencies
├── .env                         # Configuration
└── README.md                    # This file
```

## 🚀 Setup Instructions

### 1. Place Your Models

Copy your downloaded models to the `models/` folder:

```bash
mkdir models
# Copy your models here:
# - osnet_ibn_x1_0.pth
# - yolov8n.pt
# - config.json
```

### 2. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Edit `.env` file if needed (defaults should work):

```bash
PORT=8000
DEVICE=cuda  # or cpu if no GPU
DEFAULT_THRESHOLD=0.70
```

### 4. Run the Server

```bash
python main.py
```

Server will start at: `http://localhost:8000`

## 📚 API Endpoints

### 1. Health Check
```bash
GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "device": "cuda",
  "timestamp": "2024-11-20T10:30:00"
}
```

### 2. Analyze Video (Main Endpoint)
```bash
POST http://localhost:8000/analyze
Content-Type: multipart/form-data

reference_image: [file]
video: [file]
threshold: 0.70 (optional)
top_n: 3 (optional)
```

**Response:**
```json
{
  "status": "success",
  "video_info": {
    "fps": 30.0,
    "total_frames": 1500,
    "duration_seconds": 50.0
  },
  "statistics": {
    "total_detections": 45,
    "mean_similarity": 0.62,
    "max_similarity": 0.89,
    "matches_found": 3
  },
  "matches": [
    {
      "rank": 1,
      "confidence": 0.89,
      "frame_number": 450,
      "timestamp_seconds": 15.2,
      "bbox": [100, 50, 200, 300],
      "image_base64": "data:image/jpeg;base64,..."
    },
    {
      "rank": 2,
      "confidence": 0.85,
      "frame_number": 892,
      "timestamp_seconds": 29.7,
      "bbox": [150, 60, 250, 320],
      "image_base64": "data:image/jpeg;base64,..."
    }
  ]
}
```

## 🧪 Testing

### Using curl:

```bash
curl -X POST http://localhost:8000/analyze \
  -F "reference_image=@/path/to/person.jpg" \
  -F "video=@/path/to/footage.mp4" \
  -F "threshold=0.70" \
  -F "top_n=3"
```

### Using Python requests:

```python
import requests

url = "http://localhost:8000/analyze"
files = {
    'reference_image': open('person.jpg', 'rb'),
    'video': open('footage.mp4', 'rb')
}
data = {
    'threshold': 0.70,
    'top_n': 3
}

response = requests.post(url, files=files, data=data)
print(response.json())
```

### Using the interactive docs:

Visit `http://localhost:8000/docs` for Swagger UI with built-in testing.

## 🔧 Configuration

### Adjust Threshold:
- **0.75-0.80**: Strict (fewer false positives)
- **0.65-0.70**: Balanced (default)
- **0.55-0.60**: Lenient (more results)

### Adjust Frame Extraction:
In `model_service.py`, change `frame_interval`:
```python
frames, frame_nums, fps = self.extract_video_frames(
    video_path, 
    frame_interval=30  # Change this: 30=1fps, 15=2fps, 60=0.5fps
)
```

## 📊 Performance

- **GPU (NVIDIA)**: ~30-60 seconds for 1-minute video
- **CPU**: ~2-5 minutes for 1-minute video

Processing time depends on:
- Video length
- Number of persons detected
- Frame extraction rate
- Hardware specs

## 🐛 Troubleshooting

### Models not loading:
```bash
# Check if models exist
ls models/
# Should show: osnet_ibn_x1_0.pth, yolov8n.pt

# Check file sizes
ls -lh models/
```

### CUDA errors:
```bash
# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"

# If False, set DEVICE=cpu in .env
```

### Out of memory:
- Reduce `frame_interval` (extract fewer frames)
- Use CPU instead of GPU
- Process shorter video segments

## 🔗 Integration with Node.js

Your Node.js backend should proxy requests to this service:

```javascript
// In your server.ts
app.post('/api/reid/analyze', async (req, res) => {
  const formData = new FormData();
  formData.append('reference_image', req.files.image);
  formData.append('video', req.files.video);
  
  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    body: formData
  });
  
  const results = await response.json();
  res.json(results);
});
```

## 📝 Notes

- Files are temporarily stored in `uploads/` during processing
- Set `AUTO_CLEANUP=true` in `.env` to auto-delete after processing
- Use `/cleanup` endpoint to manually clear uploads
- For production, configure proper CORS origins in `main.py`

## 🆘 Support

Check the console logs for detailed processing information. All operations are logged with emoji indicators for easy tracking.
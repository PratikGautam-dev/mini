# Person Re-Identification Models

## Files Included
- `osnet_ibn_x1_0.pth` - OSNet-IBN model for feature extraction
- `yolov8n.pt` - YOLOv8 model for person detection
- `config.json` - Model configuration

## Model Details

### OSNet-IBN
- Input size: 128x256
- Feature dimension: 512
- Use for: Extracting person features

### YOLOv8n
- Task: Object detection (person class = 0)
- Use for: Detecting persons in frames

## Loading Instructions

```python
import torch
import torchreid
from ultralytics import YOLO

# Load OSNet
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
osnet_model = torchreid.models.build_model(
    name='osnet_ibn_x1_0',
    num_classes=751,
    loss='softmax',
    pretrained=False
)
osnet_model.load_state_dict(torch.load('osnet_ibn_x1_0.pth', map_location=device))
osnet_model = osnet_model.to(device)
osnet_model.eval()

# Load YOLO
yolo_model = YOLO('yolov8n.pt')
```

## Requirements
- torch
- torchreid
- ultralytics
- opencv-python
- numpy
- pillow
- scikit-learn

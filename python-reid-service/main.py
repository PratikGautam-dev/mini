"""
FastAPI Server for Person Re-Identification
Wraps the model service with HTTP endpoints
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import shutil
from typing import Optional
import uvicorn
from datetime import datetime

from model_service import get_service

# Initialize FastAPI app
app = FastAPI(
    title="Person Re-Identification API",
    description="API for person re-identification in CCTV footage",
    version="1.0.0"
)

# CORS configuration (allow your Next.js frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:5000",  # Node.js backend
        "*"  # Allow all (change in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directories
UPLOAD_DIR = "uploads"
os.makedirs(f"{UPLOAD_DIR}/images", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/videos", exist_ok=True)

# Global service instance
service = None


@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    global service
    print("\n" + "="*80)
    print("🚀 STARTING PERSON RE-ID SERVICE")
    print("="*80 + "\n")
    
    try:
        service = get_service(model_dir="models")
        print("✅ Service initialized successfully!\n")
    except Exception as e:
        print(f"❌ Failed to initialize service: {e}\n")
        raise


@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "service": "Person Re-Identification API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "analyze": "POST /analyze",
            "health": "GET /health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return {
        "status": "healthy",
        "models_loaded": True,
        "device": str(service.device),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/analyze")
async def analyze_video(
    reference_image: UploadFile = File(..., description="Reference person image"),
    video: UploadFile = File(..., description="CCTV video footage"),
    threshold: Optional[float] = Form(0.70, description="Similarity threshold (0.0-1.0)"),
    top_n: Optional[int] = Form(3, description="Number of top matches to return")
):
    """
    Analyze video for person re-identification
    
    Args:
        reference_image: Image of person to find
        video: CCTV footage to search
        threshold: Minimum similarity score (default: 0.70)
        top_n: Number of top matches to return (default: 3)
    
    Returns:
        JSON with matches, confidence scores, and images
    """
    
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate files
    if not reference_image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Reference must be an image file")
    
    if not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Video file required")
    
    # Validate parameters
    if not 0.0 <= threshold <= 1.0:
        raise HTTPException(status_code=400, detail="Threshold must be between 0.0 and 1.0")
    
    if top_n < 1 or top_n > 10:
        raise HTTPException(status_code=400, detail="top_n must be between 1 and 10")
    
    # Save uploaded files temporarily
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    try:
        # Save reference image
        image_path = f"{UPLOAD_DIR}/images/ref_{timestamp}.jpg"
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(reference_image.file, buffer)
        
        # Save video
        video_ext = os.path.splitext(video.filename)[1]
        video_path = f"{UPLOAD_DIR}/videos/video_{timestamp}{video_ext}"
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        
        print(f"\n📁 Files saved:")
        print(f"   Image: {image_path}")
        print(f"   Video: {video_path}")
        
        # Run analysis
        print(f"\n🔍 Starting analysis (threshold={threshold}, top_n={top_n})...")
        results = service.analyze(
            reference_image_path=image_path,
            video_path=video_path,
            threshold=threshold,
            top_n=top_n
        )
        
        # Clean up files (optional - comment out for debugging)
        try:
            os.remove(image_path)
            os.remove(video_path)
            print("🗑️  Temporary files cleaned up")
        except:
            pass
        
        return JSONResponse(content=results)
        
    except Exception as e:
        # Clean up files on error
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
            if os.path.exists(video_path):
                os.remove(video_path)
        except:
            pass
        
        print(f"\n❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze-batch")
async def analyze_batch(
    reference_image: UploadFile = File(...),
    videos: list[UploadFile] = File(...),
    threshold: Optional[float] = Form(0.70),
    top_n: Optional[int] = Form(3)
):
    """
    Analyze multiple videos with same reference image
    (Optional endpoint for batch processing)
    """
    
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    results = []
    
    for video in videos:
        try:
            # Process each video
            result = await analyze_video(reference_image, video, threshold, top_n)
            results.append({
                "video_name": video.filename,
                "result": result
            })
        except Exception as e:
            results.append({
                "video_name": video.filename,
                "error": str(e)
            })
    
    return JSONResponse(content={"batch_results": results})


@app.delete("/cleanup")
async def cleanup_uploads():
    """
    Clean up all uploaded files
    (Optional maintenance endpoint)
    """
    try:
        # Clean images
        for file in os.listdir(f"{UPLOAD_DIR}/images"):
            os.remove(f"{UPLOAD_DIR}/images/{file}")
        
        # Clean videos
        for file in os.listdir(f"{UPLOAD_DIR}/videos"):
            os.remove(f"{UPLOAD_DIR}/videos/{file}")
        
        return {"status": "success", "message": "All uploads cleaned"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


# Development server
if __name__ == "__main__":
    print("\n" + "="*80)
    print("🚀 PERSON RE-ID API SERVER")
    print("="*80)
    print("\n📍 Starting server at http://localhost:8000")
    print("📚 API docs at http://localhost:8000/docs")
    print("📊 Health check at http://localhost:8000/health")
    print("\n" + "="*80 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
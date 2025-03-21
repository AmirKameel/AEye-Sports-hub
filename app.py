import cv2
# Add this import for newer OpenCV versions
try:
    import cv2.legacy
except ImportError:
    pass
import numpy as np
import os
import tempfile
import time
import uuid
from typing import List, Dict, Optional, Union
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import JSONResponse, FileResponse

app = FastAPI(title="Object Tracking API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float = 1.0
    class_name: str = "object"

class FrameData(BaseModel):
    frame_number: int
    timestamp: float
    bounding_boxes: List[BoundingBox]

class VideoAnalysisRequest(BaseModel):
    video_id: str
    fps: int = 2  # Default to processing 2 frames per second
    tracker_type: str = "csrt"  # Default tracker
    initial_bbox: Optional[BoundingBox] = None

class VideoAnalysisResponse(BaseModel):
    video_id: str
    frames: List[FrameData]
    total_frames: int
    duration: float
    fps_processed: float

# Global storage for video uploads
UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "video_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Storage for processed results
RESULTS_CACHE = {}

# Helper functions
def get_video_path(video_id: str) -> str:
    return os.path.join(UPLOAD_DIR, f"{video_id}.mp4")

def create_tracker(tracker_type: str):
    try:
        # Try the newest approach first
        return cv2.Tracker.create(tracker_type.upper())
    except (AttributeError, cv2.error):
        try:
            # Try the intermediate approach
            tracker_types = {
                'csrt': cv2.TrackerCSRT.create,
                'kcf': cv2.TrackerKCF.create,
                'boosting': cv2.TrackerBoosting.create,
                'mil': cv2.TrackerMIL.create,
                'tld': cv2.TrackerTLD.create,
                'medianflow': cv2.TrackerMedianFlow.create,
                'mosse': cv2.TrackerMOSSE.create
            }
            
            if tracker_type not in tracker_types:
                tracker_type = 'csrt'  # Default to CSRT if not found
            
            return tracker_types[tracker_type]()
        except AttributeError:
            # Try the legacy approach
            if tracker_type.lower() == 'csrt':
                return cv2.legacy.TrackerCSRT.create()
            elif tracker_type.lower() == 'kcf':
                return cv2.legacy.TrackerKCF.create()
            elif tracker_type.lower() == 'boosting':
                return cv2.legacy.TrackerBoosting.create()
            elif tracker_type.lower() == 'mil':
                return cv2.legacy.TrackerMIL.create()
            elif tracker_type.lower() == 'tld':
                return cv2.legacy.TrackerTLD.create()
            elif tracker_type.lower() == 'medianflow':
                return cv2.legacy.TrackerMedianFlow.create()
            elif tracker_type.lower() == 'mosse':
                return cv2.legacy.TrackerMOSSE.create()
            else:
                # Default to KCF as a final fallback (widely available)
                return cv2.legacy.TrackerKCF.create()

def process_video(video_path: str, fps_target: int, tracker_type: str, initial_bbox: Optional[BoundingBox] = None) -> VideoAnalysisResponse:
    # Open video
    video = cv2.VideoCapture(video_path)
    if not video.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video file")
    
    # Get video properties
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    video_fps = video.get(cv2.CAP_PROP_FPS)
    video_duration = total_frames / video_fps
    
    # Calculate frame interval for desired FPS
    frame_interval = int(video_fps / fps_target)
    if frame_interval < 1:
        frame_interval = 1
    
    # Initialize tracker if initial bbox is provided
    tracker = create_tracker(tracker_type)
    tracker_initialized = False
    
    # Process frames
    frames_data = []
    frame_number = 0
    processed_frames = 0
    
    start_time = time.time()
    
    while True:
        ret, frame = video.read()
        if not ret:
            break
        
        # Process only every nth frame based on frame_interval
        if frame_number % frame_interval == 0:
            # Initialize tracker on first frame if initial bbox is provided
            if initial_bbox and not tracker_initialized:
                bbox = (initial_bbox.x, initial_bbox.y, initial_bbox.width, initial_bbox.height)
                tracker.init(frame, bbox)
                tracker_initialized = True
                
                # Add first frame data
                timestamp = frame_number / video_fps
                frames_data.append(
                    FrameData(
                        frame_number=frame_number,
                        timestamp=timestamp,
                        bounding_boxes=[initial_bbox]
                    )
                )
            elif tracker_initialized:
                # Update tracker
                success, box = tracker.update(frame)
                
                if success:
                    # Convert to BoundingBox model
                    x, y, w, h = [int(v) for v in box]
                    bbox = BoundingBox(
                        x=x,
                        y=y,
                        width=w,
                        height=h
                    )
                    
                    # Add frame data
                    timestamp = frame_number / video_fps
                    frames_data.append(
                        FrameData(
                            frame_number=frame_number,
                            timestamp=timestamp,
                            bounding_boxes=[bbox]
                        )
                    )
            
            processed_frames += 1
        
        frame_number += 1
    
    end_time = time.time()
    processing_time = end_time - start_time
    actual_fps = processed_frames / processing_time if processing_time > 0 else 0
    
    video.release()
    
    return VideoAnalysisResponse(
        video_id=os.path.basename(video_path).split('.')[0],
        frames=frames_data,
        total_frames=total_frames,
        duration=video_duration,
        fps_processed=actual_fps
    )

@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    # Generate a unique ID for the video
    video_id = str(uuid.uuid4())
    
    # Save the uploaded video
    video_path = get_video_path(video_id)
    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())
    
    return {"video_id": video_id, "message": "Video uploaded successfully"}

@app.post("/extract-coordinates/", response_model=VideoAnalysisResponse)
async def extract_coordinates(request: VideoAnalysisRequest):
    video_path = get_video_path(request.video_id)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        # Process the video
        result = process_video(
            video_path, 
            request.fps, 
            request.tracker_type, 
            request.initial_bbox
        )
        
        # Cache the result
        RESULTS_CACHE[request.video_id] = result
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/get-analysis/{video_id}")
async def get_analysis(video_id: str):
    if video_id not in RESULTS_CACHE:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return RESULTS_CACHE[video_id]

@app.post("/track-object/")
async def track_object(
    video_id: str = Form(...),
    x: int = Form(...),
    y: int = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    fps: int = Form(2),
    tracker_type: str = Form("csrt")
):
    video_path = get_video_path(video_id)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Create initial bounding box
    initial_bbox = BoundingBox(
        x=x,
        y=y,
        width=width,
        height=height
    )
    
    try:
        # Process the video
        result = process_video(
            video_path, 
            fps, 
            tracker_type, 
            initial_bbox
        )
        
        # Cache the result
        RESULTS_CACHE[video_id] = result
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")

@app.get("/extract-frames/{video_id}")
async def extract_frames(video_id: str, fps: int = 2):
    video_path = get_video_path(video_id)
    
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Create a directory to store frames
    frames_dir = os.path.join(UPLOAD_DIR, f"{video_id}_frames")
    os.makedirs(frames_dir, exist_ok=True)
    
    # Open video
    video = cv2.VideoCapture(video_path)
    if not video.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video file")
    
    # Get video properties
    video_fps = video.get(cv2.CAP_PROP_FPS)
    
    # Calculate frame interval for desired FPS
    frame_interval = int(video_fps / fps)
    if frame_interval < 1:
        frame_interval = 1
    
    # Extract frames
    frames_data = []
    frame_number = 0
    
    while True:
        ret, frame = video.read()
        if not ret:
            break
        
        # Process only every nth frame based on frame_interval
        if frame_number % frame_interval == 0:
            # Save frame
            frame_path = os.path.join(frames_dir, f"frame_{frame_number}.jpg")
            cv2.imwrite(frame_path, frame)
            
            # Add frame data
            timestamp = frame_number / video_fps
            frames_data.append({
                "frame_number": frame_number,
                "timestamp": timestamp,
                "frame_path": frame_path
            })
        
        frame_number += 1
    
    video.release()
    
    return {"video_id": video_id, "frames": frames_data, "total_frames": len(frames_data)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
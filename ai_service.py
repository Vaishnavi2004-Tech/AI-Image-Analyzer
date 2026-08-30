from flask import Flask, request, jsonify, Response
from ultralytics import YOLO
from PIL import Image
from pi_heif import register_heif_opener
register_heif_opener()  # allows PIL to open .heic/.heif photos (common from iPhone)
from transformers import BlipProcessor, BlipForConditionalGeneration
from deepface import DeepFace
import numpy as np
import cv2
import io
import torch

app = Flask(__name__)

# ---------------- Load models once ----------------
yolo_model = YOLO("yolov8n.pt")
caption_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
caption_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")

# ---------------- Fast analyze (YOLO + BLIP only) ----------------
@app.route("/analyze", methods=["POST"])
def analyze():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_bytes = file.read()
    pil_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    pil_image.thumbnail((800, 800))

    # YOLO detection
    results = yolo_model(pil_image, conf=0.3)
    objects = []
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            label = str(yolo_model.names[cls_id])
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
            conf = float(box.conf[0])
            objects.append({
                "label": label,
                "x": float(x1),
                "y": float(y1),
                "width": float(x2 - x1),
                "height": float(y2 - y1),
                "conf": float(conf)
            })

    # BLIP caption
    with torch.no_grad():
        inputs = caption_processor(pil_image, return_tensors="pt")
        out = caption_model.generate(**inputs)
        caption = str(caption_processor.decode(out[0], skip_special_tokens=True))

    width, height = pil_image.size

    result = {
        "description": caption,
        "objects": objects,
        "count": int(len(objects)),
        "imageWidth": int(width),
        "imageHeight": int(height)
    }

    return jsonify(result)

# ---------------- Separate gender detection ----------------
@app.route("/gender", methods=["POST"])
def gender():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_bytes = file.read()
    np_bytes = np.frombuffer(file_bytes, np.uint8)
    cv_image = cv2.imdecode(np_bytes, cv2.IMREAD_COLOR)

    gender, gender_confidence = None, None
    try:
        # enforce_detection=True -> raises an exception when no real face is found,
        # instead of silently guessing gender from a random region of the image.
        face_result = DeepFace.analyze(
            img_path=cv_image,
            actions=["gender"],
            enforce_detection=True,
            detector_backend="mtcnn"
        )
        gender = str(face_result[0]["dominant_gender"])
        gender_confidence = float(face_result[0]["gender"][gender])
    except ValueError:
        # No face found in the image — this is the expected/correct outcome
        # for photos with no person in them.
        print("No face detected in image — skipping gender result.")
    except Exception as e:
        print("Gender detection error:", e)

    result = {
        "gender": gender,
        "genderConfidence": gender_confidence,
        "faceDetected": gender is not None
    }

    return jsonify(result)

# ---------------- Live camera stream ----------------
@app.route("/camera_stream")
def camera_stream():
    def generate():
        cap = cv2.VideoCapture(0)
        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                results = yolo_model(frame)
                annotated = results[0].plot()
                _, buffer = cv2.imencode(".jpg", annotated)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        finally:
            cap.release()
    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")

if __name__ == "__main__":
    app.run(port=5000, debug=False)
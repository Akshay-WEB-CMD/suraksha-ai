from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import os
import base64

try:
    from tensorflow.keras.models import load_model, Sequential
    from tensorflow.keras.layers import Conv2D, Activation, GlobalAveragePooling2D, Dense, Dropout
    HAS_TF = True
except ImportError:
    HAS_TF = False

try:
    from ultralytics import YOLO
    import easyocr
    HAS_TRAFFIC_AI = True
except ImportError:
    HAS_TRAFFIC_AI = False

app = Flask(__name__)
CORS(app) # Enable CORS for frontend integration

# Pothole Settings
POTHOLE_MODEL_PATH = "pothole_model.h5"
size = 100
pothole_model = None

# Traffic Settings
HELMET_MODEL_PATH = "helmet.pt"
PLATE_MODEL_PATH = "license_plate.pt"
helmet_model = None
plate_model = None
ocr_reader = None

# Reconstruct Pothole model manually (matches GitHub architecture)
if HAS_TF and os.path.exists(POTHOLE_MODEL_PATH):
    try:
        # Based on GitHub repo's kerasModel4()
        pothole_model = Sequential([
            Conv2D(16, (8, 8), strides=(4, 4), padding='valid', input_shape=(size, size, 1)),
            Activation('relu'),
            Conv2D(32, (5, 5), padding="same"),
            Activation('relu'),
            GlobalAveragePooling2D(),
            Dense(512),
            Dropout(0.1),
            Activation('relu'),
            Dense(2),
            Activation('softmax')
        ])
        pothole_model.load_weights(POTHOLE_MODEL_PATH)
        print("✅ Pothole model (Reconstructed) loaded successfully.")
    except Exception as e:
        print(f"❌ Error loading Pothole weights: {e}")
        pothole_model = None
else:
    print("⚠️ pothole_model.h5 not found or TensorFlow not installed. Pothole detector in Mock Mode.")

# Load Traffic models if they exist
if HAS_TRAFFIC_AI:
    if os.path.exists(HELMET_MODEL_PATH):
        try:
            helmet_model = YOLO(HELMET_MODEL_PATH)
            print("✅ Helmet detection model loaded.")
        except Exception as e:
            print(f"❌ Error loading Helmet model: {e}")
    
    if os.path.exists(PLATE_MODEL_PATH):
        try:
            plate_model = YOLO(PLATE_MODEL_PATH)
            print("✅ License plate model loaded.")
        except Exception as e:
            print(f"❌ Error loading Plate model: {e}")
    
    try:
        ocr_reader = easyocr.Reader(['en'])
        print("✅ EasyOCR Reader initialized.")
    except Exception as e:
        print(f"❌ Error initializing EasyOCR: {e}")
else:
    print("⚠️ Ultralytics/EasyOCR not installed. Traffic detector in Mock Mode.")

@app.route('/detect', methods=['POST'])
def detect():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image uploaded"}), 400
            
        file = request.files['image']
        lat = request.form.get('lat', 'Unknown')
        lon = request.form.get('lon', 'Unknown')

        # Mock response if model is missing
        if pothole_model is None:
            # Simple simulation: if lat/lon ends in even number, call it a pothole for testing
            is_pothole = (int(float(lat)*100) % 2 == 0) if lat != 'Unknown' else True
            result = "pothole" if is_pothole else "road"
            print(f"MOCK Location: {lat}, {lon} Result: {result}")
            return jsonify({"result": result, "mode": "mock"})

        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), 0)
        img = cv2.resize(img, (size, size))
        img = img.reshape(1, size, size, 1)

        prediction = pothole_model.predict(img)
        label = int(np.argmax(prediction))

        if label == 1:
            result = "pothole"
        else:
            result = "road"

        return jsonify({"result": result, "mode": "live"})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/traffic', methods=['POST'])
def traffic():
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image"}), 400
            
        file = request.files['image']
        
        # Mock Response if AI modules missing
        if not HAS_TRAFFIC_AI or helmet_model is None:
            # Return a simulated violation for testing UI
            mock_data = {
                "violations": ["no-helmet", "triple-riding"],
                "plate": "KA 01 AB 1234",
                "mode": "mock"
            }
            return jsonify(mock_data)

        # Real Logic
        img_bytes = file.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        violations = []
        plate_number = "UNKNOWN"

        # 1. Helmet Detection
        if helmet_model:
            h_results = helmet_model(frame)
            for r in h_results:
                if hasattr(r, 'boxes'):
                    for box in r.boxes:
                        label = helmet_model.names[int(box.cls[0])]
                        if label == "no-helmet" and label not in violations:
                            violations.append(label)

        # 2. Plate & OCR
        if plate_model:
            p_results = plate_model(frame)
            for pr in p_results:
                if hasattr(pr, 'boxes'):
                    for pbox in pr.boxes:
                        px1, py1, px2, py2 = map(int, pbox.xyxy[0])
                        plate_roi = frame[py1:py2, px1:px2]
                        
                        if ocr_reader:
                            # EasyOCR returns a list of tuples: (bbox, text, confidence)
                            text_results = ocr_reader.readtext(plate_roi)
                            if text_results:
                                # Join all detected texts into one string
                                plate_parts = [res[1] for res in text_results]
                                plate_number = " ".join(plate_parts).upper()

        return jsonify({
            "violations": violations,
            "plate": plate_number,
            "mode": "live"
        })

    except Exception as e:
        print(f"Traffic Error: {e}")
        return jsonify({"error": str(e)}), 500
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)

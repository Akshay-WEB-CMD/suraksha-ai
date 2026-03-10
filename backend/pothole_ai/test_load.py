import os
import tensorflow as tf
from tensorflow.keras.models import load_model
import traceback

MODEL_PATH = "pothole_model.h5"
if os.path.exists(MODEL_PATH):
    try:
        model = load_model(MODEL_PATH, compile=False)
        print("SUCCESS")
    except Exception as e:
        print(f"FAILURE: {e}")
        traceback.print_exc()
else:
    print("NOT FOUND")

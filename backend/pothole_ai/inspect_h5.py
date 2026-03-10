import h5py

filename = 'pothole_model.h5'

with h5py.File(filename, 'r') as f:
    if 'model_weights' in f:
        print("MODEL WEIGHTS FOUND")
        for layer in f['model_weights']:
            print(f"Layer: {layer}")
    else:
        print("NO MODEL WEIGHTS ROOT")
        # For older models, they are often in root
        for key in f.keys():
            print(f"Key: {key}")

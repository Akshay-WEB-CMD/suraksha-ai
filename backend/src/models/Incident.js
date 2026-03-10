import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['violation', 'pothole', 'sos']
  },
  title: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  evidence: {
    url: String,
    mediaType: String // 'image' or 'video'
  },
  vehicleDetails: {
    plateNumber: String,
    type: String
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Verified', 'Resolved', 'Ignored']
  },
  severity: {
    type: String,
    default: 'Medium',
    enum: ['Low', 'Medium', 'High', 'Critical']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Incident = mongoose.model('Incident', incidentSchema);

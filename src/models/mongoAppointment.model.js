const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true }
}, { timestamps: true });

const patientSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  name: { type: String, required: true }
}, { timestamps: true });

// EMBEDDING: snapshots belong to one appointment and are read with it.
const doctorSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true }
}, { _id: false });

const patientSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { _id: false });

const appointmentSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },

  // REFERENCING: these ObjectIds point to independent collection documents.
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },

  // EMBEDDING: historical display values live inside the appointment document.
  doctorSnapshot: { type: doctorSnapshotSchema, required: true },
  patientSnapshot: { type: patientSnapshotSchema, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  status: { type: String, required: true }
}, { timestamps: true });

appointmentSchema.index({ ownerId: 1, date: 1, time: 1 });

const Appointment = mongoose.models.Appointment ||
  mongoose.model('Appointment', appointmentSchema);
const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

module.exports = {
  Appointment,
  Doctor,
  Patient,
  appointmentSchema,
  doctorSchema,
  patientSchema,
  doctorSnapshotSchema,
  patientSnapshotSchema
};

const {
  Appointment,
  Doctor,
  Patient
} = require('../models/mongoAppointment.model');

/**
 * Creates an appointment using both MongoDB relationship strategies.
 *
 * References:
 *   `doctor` and `patient` store ObjectIds pointing to independent documents.
 * Embedding:
 *   snapshots copy the small historical values that belong to this booking.
 */
async function createAppointmentWithRelationships(ownerId, input) {
  const [doctor, patient] = await Promise.all([
    Doctor.findOne({ _id: input.doctorId, ownerId }),
    Patient.findOne({ _id: input.patientId, ownerId })
  ]);

  if (!doctor || !patient) {
    throw new Error('Doctor and patient references must exist.');
  }

  return Appointment.create({
    ownerId,
    doctor: doctor._id,
    patient: patient._id,
    doctorSnapshot: {
      name: doctor.name,
      specialty: doctor.specialty
    },
    patientSnapshot: { name: patient.name },
    date: input.date,
    time: input.time,
    duration: input.duration,
    status: input.status
  });
}

/** Resolve referenced Doctor and Patient documents while snapshots stay embedded. */
function listAppointmentsWithPopulatedReferences(ownerId) {
  return Appointment.find({ ownerId })
    .populate('doctor', 'name specialty')
    .populate('patient', 'name')
    .sort({ date: 1, time: 1 });
}

module.exports = {
  createAppointmentWithRelationships,
  listAppointmentsWithPopulatedReferences
};

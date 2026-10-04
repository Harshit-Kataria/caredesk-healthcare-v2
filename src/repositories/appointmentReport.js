const APPOINTMENT_REPORT_SQL = `
  SELECT
    a.id,
    a.date,
    a.time,
    a.duration,
    a.status,
    a.reason,
    d.id AS doctorId,
    d.name AS doctorName,
    d.specialty AS doctorSpecialty,
    p.id AS patientId,
    p.name AS patientName
  FROM appointments AS a
  INNER JOIN doctors AS d ON d.id = a.doctorId
  INNER JOIN patients AS p ON p.id = a.patientId
  WHERE a.ownerId = ?
    AND d.ownerId = a.ownerId
    AND p.ownerId = a.ownerId
  ORDER BY a.date ASC, a.time ASC
`;

function listAppointmentReport(database, ownerId) {
  return database.prepare(APPOINTMENT_REPORT_SQL).all(ownerId);
}

module.exports = { APPOINTMENT_REPORT_SQL, listAppointmentReport };

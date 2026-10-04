/**
 * MongoDB model demonstrating both relationship strategies used by CareDesk.
 *
 * References keep the canonical Doctor and Patient records independent.
 * Embedded snapshots preserve the names displayed on the appointment even if
 * a directory record is edited later.
 */
const appointmentCollectionSchema = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      'ownerId',
      'doctorId',
      'patientId',
      'doctorSnapshot',
      'patientSnapshot',
      'date',
      'time'
    ],
    properties: {
      ownerId: {
        bsonType: 'string',
        description: 'Reference to the CareDesk account that owns the record.'
      },
      doctorId: {
        bsonType: 'objectId',
        description: 'Reference to a document in the doctors collection.'
      },
      patientId: {
        bsonType: 'objectId',
        description: 'Reference to a document in the patients collection.'
      },
      doctorSnapshot: {
        bsonType: 'object',
        description: 'Embedded doctor data captured when the visit is booked.',
        required: ['name', 'specialty'],
        properties: {
          name: { bsonType: 'string' },
          specialty: { bsonType: 'string' }
        }
      },
      patientSnapshot: {
        bsonType: 'object',
        description: 'Embedded patient data captured when the visit is booked.',
        required: ['name'],
        properties: { name: { bsonType: 'string' } }
      },
      date: { bsonType: 'string' },
      time: { bsonType: 'string' }
    }
  }
};

module.exports = { appointmentCollectionSchema };

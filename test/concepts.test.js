const test=require('node:test');
const assert=require('node:assert/strict');
const{
  formatConceptLabel,
  hoistingExample,
  createRequestTracker,
  callbackToPromise,
  demonstrateEventLoop
}=require('../src/concepts/javascriptConcepts');
const{APPOINTMENT_REPORT_SQL}=require('../src/repositories/appointmentReport');
const{buildAppointmentDocument}=require('../src/integrations/mongoRepository');
const{appointmentCollectionSchema}=require('../src/integrations/mongoAppointmentSchema');
const{toolDefinitions,executeToolCall}=require('../src/services/toolRegistry');

test('closure keeps private state between calls',()=>{
  const first=createRequestTracker();
  const second=createRequestTracker(10);
  assert.equal(first(),1);
  assert.equal(first(),2);
  assert.equal(second(),11);
});

test('callback API is converted to a Promise for async/await',async()=>{
  const result=await callbackToPromise(done=>setImmediate(()=>done(null,'loaded')));
  assert.equal(result,'loaded');
});

test('event loop runs microtasks before timer macrotasks',async()=>{
  assert.deepEqual(await demonstrateEventLoop(),[
    'synchronous',
    'promise microtask',
    'timer macrotask'
  ]);
});

test('hoisted declaration formats concept labels',()=>{
  assert.equal(hoistingExample,'doctor appointment system');
  assert.equal(formatConceptLabel('sql_joins'),'sql joins');
});

test('SQL report uses joins for doctor and patient relationships',()=>{
  assert.match(APPOINTMENT_REPORT_SQL,/INNER JOIN doctors/i);
  assert.match(APPOINTMENT_REPORT_SQL,/INNER JOIN patients/i);
});

test('Mongo appointment embeds snapshots and references source records',()=>{
  const document=buildAppointmentDocument('owner-1',{reason:'Review'},{_id:'patient-1',name:'Asha'},{_id:'doctor-1',name:'Dr Rao',specialty:'Cardiology'});
  assert.equal(document.patientId,'patient-1');
  assert.equal(document.patientSnapshot.name,'Asha');
  assert.equal(document.doctorSnapshot.specialty,'Cardiology');
  const fields=appointmentCollectionSchema.$jsonSchema.properties;
  assert.equal(fields.doctorId.bsonType,'objectId');
  assert.equal(fields.patientId.bsonType,'objectId');
  assert.equal(fields.doctorSnapshot.bsonType,'object');
  assert.equal(fields.patientSnapshot.bsonType,'object');
});

test('AI function calling publishes a schema and invokes its registered tool',async()=>{
  assert.equal(toolDefinitions[0].function.name,'get_dashboard_summary');
  const result=await executeToolCall({name:'get_dashboard_summary',arguments:{scope:'current_account'}},{get_dashboard_summary:async()=>({appointments:4})});
  assert.equal(result.appointments,4);
});

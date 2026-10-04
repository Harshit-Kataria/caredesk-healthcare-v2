const{MongoClient,ObjectId}=require('mongodb');

// MongoDB relationship design:
// - patientId and doctorId are references because those records change independently.
// - patientSnapshot is embedded because the appointment needs a historical display name.
function buildAppointmentDocument(ownerId,item,patient,doctor){
 return{
  ...item,
  ownerId,
  patientId:patient._id,
  doctorId:doctor._id,
  patientSnapshot:{name:patient.name},
  doctorSnapshot:{name:doctor.name,specialty:doctor.specialty},
  createdAt:new Date()
 };
}
async function createMongoRepository(uri=process.env.MONGODB_URI,database=process.env.MONGODB_DATABASE||'caredesk'){
 const client=new MongoClient(uri);await client.connect();const db=client.db(database),doctors=db.collection('doctors'),patients=db.collection('patients'),appointments=db.collection('appointments');
 await Promise.all([doctors.createIndex({ownerId:1,name:1}),patients.createIndex({ownerId:1,name:1}),appointments.createIndex({ownerId:1,doctorId:1,date:1,time:1})]);
 return{
  backend:'mongodb',close:()=>client.close(),
  async list(type,ownerId){return db.collection(type).find({ownerId}).toArray()},
  async create(type,ownerId,item){const record={...item,ownerId,createdAt:new Date()};const r=await db.collection(type).insertOne(record);return{id:r.insertedId.toString(),...record}},
  async update(type,ownerId,id,item){const r=await db.collection(type).findOneAndUpdate({_id:new ObjectId(id),ownerId},{$set:{...item,updatedAt:new Date()}},{returnDocument:'after'});return r&&{id:r._id.toString(),...r}},
  async delete(type,ownerId,id){return(await db.collection(type).deleteOne({_id:new ObjectId(id),ownerId})).deletedCount===1},
  async createAppointment(ownerId,item){const[patient,doctor]=await Promise.all([patients.findOne({_id:new ObjectId(item.patientId),ownerId}),doctors.findOne({_id:new ObjectId(item.doctorId),ownerId})]);if(!patient||!doctor)throw new Error('Invalid patient or doctor.');const document=buildAppointmentDocument(ownerId,item,patient,doctor);const result=await appointments.insertOne(document);return{id:result.insertedId.toString(),...document}},
  async dashboard(ownerId){const[id]=await appointments.aggregate([{$match:{ownerId}},{$group:{_id:'$status',count:{$sum:1}}}]).toArray();return{appointment_group:id||null,doctors:await doctors.countDocuments({ownerId}),patients:await patients.countDocuments({ownerId})}},
  objectId:value=>new ObjectId(value)
 };
}
module.exports={createMongoRepository,buildAppointmentDocument};

const{MongoClient,ObjectId}=require('mongodb');
async function createMongoRepository(uri=process.env.MONGODB_URI,database=process.env.MONGODB_DATABASE||'caredesk'){
 const client=new MongoClient(uri);await client.connect();const db=client.db(database),doctors=db.collection('doctors'),patients=db.collection('patients'),appointments=db.collection('appointments');
 await Promise.all([doctors.createIndex({ownerId:1,name:1}),patients.createIndex({ownerId:1,name:1}),appointments.createIndex({ownerId:1,doctorId:1,date:1,time:1})]);
 return{
  backend:'mongodb',close:()=>client.close(),
  async list(type,ownerId){return db.collection(type).find({ownerId}).toArray()},
  async create(type,ownerId,item){const record={...item,ownerId,createdAt:new Date()};const r=await db.collection(type).insertOne(record);return{id:r.insertedId.toString(),...record}},
  async update(type,ownerId,id,item){const r=await db.collection(type).findOneAndUpdate({_id:new ObjectId(id),ownerId},{$set:{...item,updatedAt:new Date()}},{returnDocument:'after'});return r&&{id:r._id.toString(),...r}},
  async delete(type,ownerId,id){return(await db.collection(type).deleteOne({_id:new ObjectId(id),ownerId})).deletedCount===1},
  async createAppointment(ownerId,item){const[patient,doctor]=await Promise.all([patients.findOne({_id:new ObjectId(item.patientId),ownerId}),doctors.findOne({_id:new ObjectId(item.doctorId),ownerId})]);if(!patient||!doctor)throw new Error('Invalid patient or doctor.');return this.create('appointments',ownerId,{...item,patientId:patient._id,doctorId:doctor._id})},
  async dashboard(ownerId){const[id]=await appointments.aggregate([{$match:{ownerId}},{$group:{_id:'$status',count:{$sum:1}}}]).toArray();return{appointment_group:id||null,doctors:await doctors.countDocuments({ownerId}),patients:await patients.countDocuments({ownerId})}},
  objectId:value=>new ObjectId(value)
 };
}
module.exports={createMongoRepository};

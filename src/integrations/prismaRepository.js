async function createPrismaRepository(){
 const{PrismaClient}=require('@prisma/client');const prisma=new PrismaClient();
 return{backend:'postgresql',close:()=>prisma.$disconnect(),list:(type,ownerId)=>prisma[type.slice(0,-1)].findMany({where:{ownerId}}),
  createAppointment(ownerId,data){return prisma.$transaction(async tx=>{const[patient,doctor]=await Promise.all([tx.patient.findFirst({where:{id:data.patientId,ownerId}}),tx.doctor.findFirst({where:{id:data.doctorId,ownerId}})]);if(!patient||!doctor)throw new Error('Invalid patient or doctor.');return tx.appointment.create({data:{...data,ownerId}})})}}
}
module.exports={createPrismaRepository};

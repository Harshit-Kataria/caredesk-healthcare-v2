async function createCache(){
 if(!process.env.REDIS_URL){const data=new Map();return{kind:'memory',async get(k){return data.get(k)||null},async set(k,v,ttl=30){data.set(k,v);setTimeout(()=>data.delete(k),ttl*1000).unref()},async delPrefix(prefix){for(const k of data.keys())if(k.startsWith(prefix))data.delete(k)},async close(){}}}
 const{createClient}=require('redis');const client=createClient({url:process.env.REDIS_URL});client.on('error',e=>console.error('Redis:',e.message));await client.connect();return{kind:'redis',get:k=>client.get(k).then(v=>v&&JSON.parse(v)),set:(k,v,ttl=30)=>client.set(k,JSON.stringify(v),{EX:ttl}),async delPrefix(prefix){for await(const key of client.scanIterator({MATCH:`${prefix}*`}))await client.del(key)},close:()=>client.quit()};
}
module.exports={createCache};

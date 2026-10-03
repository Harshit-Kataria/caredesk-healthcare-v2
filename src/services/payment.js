const crypto=require('node:crypto');
function createPaymentService({mode=process.env.PAYMENT_MODE||'sandbox',provider=process.env.PAYMENT_PROVIDER||'mock',secretKey=process.env.STRIPE_SECRET_KEY,fetchImpl=global.fetch}={}){
 if(mode!=='sandbox')throw new Error('CareDesk blocks live payments; PAYMENT_MODE must be sandbox.');
 if(provider==='stripe'){
  if(!secretKey?.startsWith('sk_test_'))throw new Error('Stripe integration accepts test keys only.');
  const call=async(path,params)=>{const response=await fetchImpl(`https://api.stripe.com/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${secretKey}`,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(params)});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||'Stripe sandbox request failed.');return{...data,mode:'sandbox'}};
  return{async createIntent({ownerId,amount,currency='inr',appointmentId}){if(!Number.isInteger(amount)||amount<100)throw new Error('Amount must be an integer of at least 100 minor units.');return call('payment_intents',{amount:String(amount),currency:currency.toLowerCase(),'metadata[ownerId]':ownerId,'metadata[appointmentId]':appointmentId||''})},async confirm(intentId){return call(`payment_intents/${encodeURIComponent(intentId)}/confirm`,{})}};
 }
 const intents=new Map();return{async createIntent({ownerId,amount,currency='INR',appointmentId}){if(!Number.isInteger(amount)||amount<100)throw new Error('Amount must be an integer of at least 100 minor units.');const intent={id:`pi_test_${crypto.randomUUID()}`,ownerId,amount,currency,status:'requires_confirmation',appointmentId,mode:'sandbox'};intents.set(intent.id,intent);return intent},async confirm(id,ownerId){const intent=intents.get(id);if(!intent||intent.ownerId!==ownerId)return null;intent.status='succeeded';return intent}};
}
module.exports={createPaymentService};

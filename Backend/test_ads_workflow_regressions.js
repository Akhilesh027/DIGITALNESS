const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const policy=require('./services/adCampaignPolicy');
const base=()=>({_id:'campaign',customerId:'customer',campaignId:'CAMP-1',campaignName:'Brand Traffic',platform:'Meta',status:'Approved',objective:'TRAFFIC',budget:{amount:600,currency:'INR'},duration:{days:14},metaSettings:{adAccountId:'act_123',pageId:'456',destinationUrl:'https://brand.example'},adVariants:[{headline:'Brand',primaryText:'Discover our services'}],creativePosterAsset:{imageUrl:'https://brand.example/ad.png',mediaType:'IMAGE'},audiences:[{name:'Local',locations:['Hyderabad'],dailyBudgetShare:100}],metaAdIds:[],metaAdSetIds:[],metrics:{impressions:0},save:async function(){return this;}});
function harness(campaign=base(), handler, missing=false){
 const calls=[];const updates=[];let sequence=100;const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(require.resolve('./services/safeMetaCampaignService'),'utf8'),{
  module,URL,Date,AbortSignal,console,
  require:id=>id==='../models/AdCampaign'?{findOne:async()=>campaign,updateOne:async(filter,update)=>{updates.push({filter,update});return{modifiedCount:1};}}:id==='../models/MarketingConnection'?{findOne:filter=>({select:async()=>missing?null:{platformAccountId:'123',accessToken:'encrypted',scopes:['ads_management']},then:resolve=>Promise.resolve(missing?null:{platformAccountId:'456'}).then(resolve)})}:id==='../utils/cryptoUtil'?{decryptToken:()=> 'real-token'}:id==='./adCampaignPolicy'?policy:id==='../config/meta'?{marketingApiVersion:'v20.0'}:id.includes('MetaTargetingNormalizer')?{normalizeTargeting:()=>({geo_locations:{cities:[{key:'293140'}]}})}:{},
  fetch:async(url,options)=>{const payload=JSON.parse(options.body);calls.push({url,payload});return handler?handler(url,payload,calls.length):{ok:true,json:async()=>({id:String(++sequence),success:true})};},
 });
 return {service:module.exports,campaign,calls,updates};
}
test('draft validation rejects invalid customers, budgets and platforms',()=>{
 for(const dailyBudget of [0,-1,'invalid',Infinity])assert.throws(()=>policy.validateCreation({customerId:'a'.repeat(24),dailyBudget}));
 assert.throws(()=>policy.validateCreation({customerId:'missing',dailyBudget:500}));
 assert.throws(()=>policy.validateCreation({customerId:'a'.repeat(24),dailyBudget:500,platform:'Other'}));
});
test('blueprint edits cannot forge approval, metrics or platform identifiers',()=>{
 for(const key of ['status','metrics','platformCampaignId','customerId','dispatchLockAt','createdBy'])assert.throws(()=>policy.editableUpdates({[key]:'forged'}));
 assert.deepEqual(policy.editableUpdates({campaignName:'Revised'}),{campaignName:'Revised'});
});
test('audience budgets sum to the chosen daily budget for percentages or rupee weights',()=>{
 for(const weights of [[50,35,15],[500,350,150]]){
 const result=policy.budgetAllocations(1000,weights.map(dailyBudgetShare=>({dailyBudgetShare})));
 assert.equal(result.reduce((a,b)=>a+b,0),100000);assert.deepEqual(result,[50000,35000,15000]);}
 assert.throws(()=>policy.budgetAllocations(150,[{},{}]),/at least/);
});
test('unapproved and unconnected campaigns cannot reach Meta',async()=>{
 const pending=harness({...base(),status:'Pending Approval'});await assert.rejects(pending.service.dispatchCampaign('CAMP-1'),/Approve/);assert.equal(pending.calls.length,0);
 const disconnected=harness(base(),null,true);await assert.rejects(disconnected.service.dispatchCampaign('CAMP-1'),/Connect a Meta/);assert.equal(disconnected.calls.length,0);
});
test('platform creation uses real IDs, stays paused, and never invents performance',async()=>{
 const h=harness();const result=await h.service.dispatchCampaign('CAMP-1');
 assert.equal(result.status,'Paused');assert.equal(result.platformCampaignId,'101');assert.equal(h.calls.length,4);
 for(const call of h.calls.filter(c=>!c.url.endsWith('adcreatives')))assert.equal(call.payload.status,'PAUSED');
 assert.equal(h.campaign.metrics.impressions,0);assert.equal(h.campaign.metrics.leadsGenerated,undefined);assert.equal(h.campaign.metaAdIds.length,1);
 await h.service.dispatchCampaign('CAMP-1');assert.equal(h.calls.length,4,'repeated creation must not duplicate platform objects');
});
test('provider failure preserves checkpoints and does not report active or success',async()=>{
 const h=harness(base(),async(url,payload,n)=>n===2?{ok:false,json:async()=>({error:{code:190,message:'token invalid'}})}:{ok:true,json:async()=>({id:String(100+n)})});
 await assert.rejects(h.service.dispatchCampaign('CAMP-1'),/Meta rejected/);
 assert.equal(h.campaign.metaCampaignId,'101');assert.equal(h.campaign.status,'Approved');assert.equal(h.campaign.syncStatus,'FAILED');assert.equal(h.calls.length,2);
 assert.ok(h.updates.some(u=>u.update.$set.dispatchLockAt===null));
});
test('activation requires explicit confirmation and pauses parent on failure',async()=>{
 const c={...base(),status:'Paused',syncStatus:'SYNCED',metaCampaignId:'101',metaAdSetIds:['102'],metaAdIds:['103']};
 const h=harness(c);await assert.rejects(h.service.toggleCampaign('CAMP-1'),/Confirm/);assert.equal(h.calls.length,0);
 const failed=harness(c,async(url,payload,n)=>n===2?{ok:false,json:async()=>({error:{code:100,message:'Cannot activate'}})}:{ok:true,json:async()=>({success:true})});
 await assert.rejects(failed.service.toggleCampaign('CAMP-1',{confirmActivation:true}),/Cannot activate/);
 assert.equal(failed.calls.at(-1).payload.status,'PAUSED');assert.equal(c.status,'Paused');
});
test('unsupported platforms cannot silently deploy to Meta',async()=>{
 const h=harness({...base(),platform:'Google'});await assert.rejects(h.service.dispatchCampaign('CAMP-1'),/supports Meta/);assert.equal(h.calls.length,0);
});

test('branch-scoped campaign access cannot read another branch customer',async()=>{
 const module={exports:{}};let campaignFilter;
 vm.runInNewContext(fs.readFileSync(require.resolve('./middleware/adCampaignAccess'),'utf8'),{
  module,require:id=>id==='./authMiddleware'?{protect(){}}:id.includes('dashboardActionPolicy')?require('./services/dashboardActionPolicy'):id.includes('Customer')?{find:()=>({select:()=>({lean:async()=>[{_id:'customer-a'}]})})}:id.includes('AdCampaign')?{findOne:filter=>{campaignFilter=filter;return {lean:async()=>null};}}:policy,
 });
 const response=()=>({status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
 for(const role of ['Client','Graphic Designer']){
  const res=response();await module.exports.scopeAds({user:{_id:'user',role},query:{},method:'GET',path:'/campaigns'},res,()=>assert.fail('unexpected access'));assert.equal(res.code,403);
 }
 const req={user:{_id:'manager',role:'Branch Manager',branchId:'branch-a'},query:{},method:'GET',path:'/campaigns'};
 let allowed=false;await module.exports.scopeAds(req,response(),()=>allowed=true);assert.ok(allowed);assert.equal(req.adsFilter.customerId.$in[0],'customer-a');
 const denied=response();await module.exports.scopeAds({...req,query:{customerId:'customer-b'}},denied,()=>assert.fail('unexpected access'));assert.equal(denied.code,403);
 const missing=response();await module.exports.scopeCampaign({...req,params:{id:'CAMP-OTHER'}},missing,()=>assert.fail('unexpected access'));assert.equal(missing.code,404);assert.equal(campaignFilter.customerId.$in[0],'customer-a');
});

test('platform identifiers and receipts survive schema serialization',()=>{
 const Model=require('./models/AdCampaign');
 const doc=new Model({campaignId:'CAMP-TEST',customerId:'a'.repeat(24),campaignName:'Traffic',budget:{amount:500},metaCampaignId:'123',platformCampaignId:'123',metaCreativeId:'124',metaAdSetIds:['125'],metaAdIds:['126'],externalStatus:'PAUSED',platformStatus:'PAUSED',syncStatus:'SYNCED',metrics:{impressions:0}});
 const data=doc.toObject();assert.equal(data.metaCampaignId,'123');assert.deepEqual(data.metaAdIds,['126']);assert.equal(data.metrics.impressions,0);assert.equal(doc.validateSync(),undefined);
});

test('preflight validates saved drafts without creating external objects or writing records',async()=>{
 const h=harness({...base(),status:'Pending Approval'});
 const result=await h.service.dispatchCampaign('CAMP-1',{validateOnly:true});
 assert.equal(result.success,true);assert.equal(h.calls.length,0);assert.equal(h.updates.length,0);assert.equal(h.campaign.status,'Pending Approval');
});

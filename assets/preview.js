'use strict';
/* Explicit, isolated static preview. Never shipped by the Express server.
   No Steam cookies, login credentials, trade URLs, inventory imports or payouts. */
(() => {
  const nativeFetch=window.fetch.bind(window);
  const base=new URL('./',location.href);
  const KEY='skinsflip:static-demo:v1';
  const scenarios=['ready','slow','private','empty','unpriced','partial','large','error','rate-limit','image-error'];
  const blank=()=>({account:'A',scenario:'ready',users:{A:{balance:1250,spins:5,discount:0,codes:[],entries:[],history:[],results:{}},B:{balance:75,spins:3,discount:0,codes:[],entries:[],history:[],results:{}}}});
  let state=blank();
  try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved&&['A','B','guest'].includes(saved.account)&&scenarios.includes(saved.scenario)&&saved.users?.A&&saved.users?.B)state=saved;}catch{}
  const save=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch{}};
  const current=()=>state.users[state.account];
  const userData=account=>({steamId:'DEMO-'+account,displayName:'Демо-профиль '+account,avatar:new URL('assets/logo.svg',base).href,balance:state.users[account].balance,spinsAvailable:state.users[account].spins,customMarginDiscount:state.users[account].discount,refCount:account==='A'?7:0,refEarnings:account==='A'?250:0,tradeUrl:null});
  const reply=(data={},status=200,headers={})=>new Response(JSON.stringify({success:status<400,...data}),{status,headers:{'Content-Type':'application/json','X-SkinsFlip-Preview':'synthetic','Cache-Control':'no-store',...headers}});
  const reject=(error,status=400,extra={})=>reply({error,...extra},status);
  const now=()=>new Date().toISOString();
  function delay(ms,signal){return new Promise((resolve,reject)=>{if(signal?.aborted)return reject(new DOMException('Aborted','AbortError'));const abort=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);signal?.addEventListener('abort',abort,{once:true});});}
  function itemData(game){
    const names={730:['AK-47 · Emerald Circuit','AWP · Arctic Signal','M4A1-S · Night Current','USP-S · Violet Edge','Karambit · Solar Fade','Gloves · Forest Weave','Glock-18 · Ocean Glass','Desert Eagle · Bronze Circuit','Sticker · Green Pulse','P250 · Frost Signal','M4A4 · Ember Field','AK-47 · Prototype'],570:['Blade of the Verdant Guard','Staff of the Northern Star','Wings of the Moon Spirit','Armor of the Forest King','Crown of the Azure Court','Courier · Little Lantern','Rune of the Jade Valley','Blade of the Hidden Path'],252490:['Arctic Assault Rifle','Forest Metal Mask','Rustwood Hunting Bow','Emerald Garage Door','Northern Roadsign Jacket','Campfire Sleeping Bag']};
    const types={730:['rifle','rifle','rifle','pistol','knife','glove','pistol','pistol','badge','pistol','rifle','rifle'],570:['blade','staff','blade','glove','badge','badge','staff','blade'],252490:['rifle','mask','bow','door','glove','badge']};
    const costs=[16500,7200,11800,1250,46000,19800,540,3200,100,890,5600,0];
    const offset=state.account==='B'?3:0, count=state.scenario==='large'?124:state.account==='B'?5:names[game].length;
    return Array.from({length:count},(_,index)=>{const n=(index+offset)%names[game].length,quantity=n===8?3:1;const priced=state.scenario!=='unpriced'&&n!==names[game].length-1;const unit=priced?Math.round(costs[n]*(1-Math.max(0,.15-current().discount))*100)/100:null;return {assetId:`DEMO-${state.account}-${game}-${index}`,name:names[game][n]+(index>=names[game].length?' · '+(index+1):''),marketHashName:names[game][n],iconUrl:new URL('assets/demo/'+(state.scenario==='image-error'&&index===0?'missing-image':types[game][n])+'.svg',base).href,quantity,tradable:n!==5,unitPrice:unit,price:unit===null?null:unit*quantity};});
  }
  const raffles=()=>[
    {id:1,title:'Изумрудная коллекция · демо',skinName:'Karambit · Solar Fade',iconUrl:new URL('assets/demo/knife.svg',base).href,expiresAt:new Date(Date.now()+86400000*2).toISOString(),participantCount:24+(current()?.entries.includes('1')?1:0),version:'preview-v1'},
    {id:2,title:'Новый сезон · демо',skinName:'AWP · Arctic Signal',iconUrl:new URL('assets/demo/rifle.svg',base).href,expiresAt:new Date(Date.now()+86400000).toISOString(),participantCount:12+(current()?.entries.includes('2')?1:0),version:'preview-v1'},
    {id:3,title:'Лесная легенда · демо',skinName:'Blade of the Verdant Guard',iconUrl:new URL('assets/demo/blade.svg',base).href,expiresAt:new Date(Date.now()+86400000*4).toISOString(),participantCount:8+(current()?.entries.includes('3')?1:0),version:'preview-v1'}
  ];
  function history(){return [...current().history,{id:1,type:'PROMO',amount:current().balance-current().history.reduce((sum,x)=>sum+x.amount,0),status:'COMPLETED',createdAt:Date.now()-86400000}];}
  const promoDefinitions=[{code:'DEMO10',type:'MARGIN_DISCOUNT',rewardValue:10,maxUses:100,usedCount:0,active:true},{code:'DEMO5',type:'SPINS',rewardValue:5,maxUses:100,usedCount:0,active:true}];
  function demoAdmin(path,url,options){
    if((options.method||'GET').toUpperCase()!=='GET')return reject('Панель в публичном preview доступна только для просмотра. Рабочие изменения выполняются на серверном стенде.',403);
    const page=Math.max(1,Number(url.searchParams.get('page'))||1);
    const common={page,hasMore:false};
    const userRows=['A','B'].map(k=>({...userData(k),isAdmin:k==='A',banned:false,activeSessions:1,discount:state.users[k].discount,createdAt:'2026-11-01T12:00:00Z'}));
    const q=(url.searchParams.get('q')||'').toLowerCase();
    if(path==='overview')return reply({counts:{users:2,banned:0,activePromos:2,activeRaffles:3,transactions:1,balances:state.users.A.balance+state.users.B.balance}});
    if(path==='integrations')return reply({steam:{lastOutcome:'unknown',lastAttemptAt:null,retryAfterSeconds:0},prices:['730','570','252490'].map(game=>({game,outcome:'unknown'})),buyout:'not_connected',payouts:'not_connected'});
    if(path==='settings')return reply({marginPercent:15});
    if(path==='analytics')return reply({days:Array.from({length:14},(_,i)=>({day:new Date(Date.now()-(13-i)*86400000).toISOString().slice(0,10),registrations:i===12?2:0,operations:i===13?1:0,bonuses:i===13?1250:0}))});
    if(path==='users')return reply({...common,users:page>1?[]:userRows.filter(u=>(u.displayName+u.steamId).toLowerCase().includes(q)&&url.searchParams.get('status')!=='banned')});
    if(/^users\/DEMO-[AB]$/.test(path))return reply({user:userRows.find(u=>u.steamId===path.split('/')[1]),operations:[],promos:[],grants:[],nextOperationCursor:null,nextPromoCursor:null,nextGrantCursor:null});
    if(/^users\/DEMO-[AB]\/(referrals|operations|promos|grants)$/.test(path))return reply({[path.split('/')[2]]:[],nextCursor:null});
    if(path==='promos')return reply({...common,promos:promoDefinitions.filter(p=>p.code.toLowerCase().includes(q)&&url.searchParams.get('status')!=='inactive')});
    if(path.startsWith('promos/'))return reply({promo:promoDefinitions.find(p=>p.code===decodeURIComponent(path.slice(7))),users:[],nextCursor:null});
    if(path==='raffles')return reply({...common,raffles:raffles().filter(r=>(r.title+r.skinName).toLowerCase().includes(q)).map(r=>({...r,participants:r.participantCount,active:true,canCancel:true,canEdit:false}))});
    if(/^raffles\/\d+$/.test(path)){const r=raffles().find(r=>String(r.id)===path.split('/')[1]);return r?reply({raffle:{...r,participants:r.participantCount,active:true,canCancel:true,canEdit:false},participants:[],nextCursor:null}):reject('Не найдено',404);}
    if(path==='operations')return reply({...common,operations:history().map(o=>({...o,...userData(state.account)}))});
    if(path==='audit')return reply({...common,events:[]});
    if(path==='trades'||path==='withdrawals')return reply({...common,[path]:[]});
    return reject('Этот серверный сценарий не включён в статический preview.',503);
  }
  window.fetch=async(input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);
    if(!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
    const scenario=state.scenario,account=state.account,path=url.pathname;
    await delay(path==='/api/steam/inventory'?(scenario==='slow'?1800:120):30,options.signal);
    if(account!==state.account)throw new DOMException('Account changed','AbortError');
    if(path==='/api/raffles/list')return reply({raffles:raffles()});
    if(path==='/api/raffles/results')return reply({results:[{title:'Тестовый розыгрыш',skinName:'Gloves · Forest Weave',winnerName:'Демо-участник',cancelled:false}]});
    if(/^\/api\/raffles\/\d+\/participants$/.test(path))return reply({participants:['ArcticFox','GreenPixel','NorthStar'].map(name=>({displayName:name+' · демо'})),nextCursor:null});
    if(!current())return reject('Вы вошли как гость. Выберите демо-профиль в верхней панели.',401);
    let body={};try{body=JSON.parse(options.body||'{}');}catch{return reject('Неверный формат');}
    if(path==='/api/user/profile')return reply({user:userData(state.account),isAdmin:state.account==='A'});
    if(path==='/api/auth/logout'){state.account='guest';save();return reply();}
    if(path==='/api/steam/inventory'){
      const game=url.searchParams.get('game')||'730';if(!['730','570','252490'].includes(game))return reject('Неизвестная игра');
      if(scenario==='private')return reject('Демо-сценарий: Steam не открыл инвентарь серверу. Настройки приватности не меняются.',502,{code:'STEAM_INVENTORY_UNAVAILABLE'});
      if(scenario==='error')return reject('Демо-сценарий: Steam временно недоступен. Можно сменить сценарий в верхней панели.',503);
      if(scenario==='rate-limit')return reply({error:'Демо-сценарий: Steam ограничил запросы.',code:'STEAM_RATE_LIMITED'},503,{'Retry-After':'10'});
      return reply({demo:true,steamId:'DEMO-'+state.account,game,items:scenario==='empty'?[]:itemData(game),partial:scenario==='partial',pricesUnavailable:scenario==='unpriced',priceSourceAt:now(),loadedAt:Date.now(),effectiveMarginPercent:Math.max(0,15-current().discount*100)});
    }
    if(path==='/api/steam/inventory/import'||path==='/api/user/trade-url')return reject('Статический preview не принимает личные данные. Используйте настроенный серверный стенд.',403);
    if(path==='/api/user/transactions')return reply({transactions:url.searchParams.has('before')?[]:history(),nextCursor:null});
    if(path==='/api/promo/redeem'){
      const code=String(body.code||'').trim().toUpperCase();if(!['DEMO10','DEMO5'].includes(code))return reject('Для демо используйте DEMO10 (−10 п.п.) или DEMO5 (+5 вращений).');
      if(current().codes.includes(code))return reject('Этот демо-код уже использован данным профилем. Сбросьте демо для повторной проверки.');
      current().codes.push(code);if(code==='DEMO10')current().discount=.10;else current().spins+=5;save();return reply({message:'Демо-код применён. Реальные средства не начислялись.',rewardType:code==='DEMO10'?'MARGIN_DISCOUNT':'SPINS'});
    }
    if(path==='/api/wheel/latest')return reply({prize:current().history.find(x=>x.type==='WHEEL')?.amount||null});
    if(path==='/api/wheel/spin'){
      if(!/^[a-f0-9]{32}$/.test(body.requestId||''))return reject('Некорректный запрос');
      if(current().results[body.requestId])return reply(current().results[body.requestId]);
      if(current().spins<=0)return reject('Демо-вращения закончились. Используйте DEMO5 или сбросьте демо.');
      const index=Object.keys(current().results).length%3,prize=[10,50,100][index];current().spins--;current().balance+=prize;
      current().history.unshift({id:Date.now(),type:'WHEEL',amount:prize,status:'COMPLETED',createdAt:Date.now()});
      const result={prize,index,remainingSpins:current().spins};current().results[body.requestId]=result;save();return reply(result);
    }
    if(path==='/api/raffles/my-entries')return reply({ids:current().entries});
    if(path==='/api/raffles/enter'){const id=String(body.raffleId);if(!raffles().some(r=>String(r.id)===id))return reject('Демо-розыгрыш не найден');if(!current().entries.includes(id))current().entries.push(id);save();return reply({message:'Демо-участие сохранено только в этой вкладке. Настоящий приз не разыгрывается.'});}
    if(path.startsWith('/api/admin/')&&state.account!=='A')return reject('Демо B не является администратором.',403);
    if(path.startsWith('/api/admin/manage/'))return demoAdmin(path.slice('/api/admin/manage/'.length),url,options);
    return reject('Выкуп, выплаты и серверные действия в preview не выполняются.',503);
  };
    function mount(){
    const options=document.querySelector('.preview-options');if(options&&!options.dataset.bound){options.dataset.bound='1';options.open=window.matchMedia('(min-width:701px)').matches;}
    const a=document.getElementById('previewAccount'),s=document.getElementById('previewScenario'),reset=document.getElementById('previewReset');
    if(a&&!a.dataset.bound){a.dataset.bound='1';a.value=state.account;a.addEventListener('change',()=>{state.account=a.value;save();location.href=new URL('index.html',base).href;});}
    if(s&&!s.dataset.bound){s.dataset.bound='1';s.value=state.scenario;s.addEventListener('change',()=>{state.scenario=s.value;save();location.reload();});}
    if(reset&&!reset.dataset.bound){reset.dataset.bound='1';reset.addEventListener('click',()=>{state=blank();save();location.href=new URL('index.html',base).href;});}
    const feed=document.getElementById('feedStatus');if(feed){feed.textContent='Демонстрационный режим';feed.parentElement.dataset.state='preview';document.getElementById('tickerContent').textContent='CS2 / Dota 2 / Rust · локальные примеры · без Steam и денежных операций';}
    for(const id of ['tradeUrlInput','saveTradeButton','privateImportData','privateImportButton','privateAppendButton']){const field=document.getElementById(id);if(field){field.disabled=true;field.title='Личные данные в preview не принимаются';}}
    const imported=document.getElementById('privateImport');if(imported){imported.querySelector('p:last-child').textContent='В preview импорт не выполняется и личные данные не отправляются. Демонстрация показывает только расположение и ограничения формы.';imported.querySelector('p').textContent='Это пример закрытого инвентаря. На рабочем сервере владелец может импортировать JSON из своего Steam, не меняя приватность. В публичном preview ввод личных данных отключён.';for(const link of imported.querySelectorAll('a')){link.removeAttribute('href');link.removeAttribute('target');}}
    const trade=document.getElementById('tradeUrlInput');if(trade)trade.placeholder='Только на рабочем сервере. Не вводите реальные данные.';
    const hint=document.getElementById('loginAccountHint');if(hint){hint.hidden=false;hint.textContent='Это демонстрация интерфейса. Вход в Steam здесь не выполняется. Можно открыть два независимых синтетических профиля A и B.';}
    if(document.getElementById('wheelCanvas')){const odds=document.querySelector('.wheel-odds p');if(odds)odds.textContent='В preview последовательно показываются 10, 50 и 100 бонусных рублей. Это тест анимации, не случайный денежный выигрыш. На сервере используются отдельные шансы и бесплатные вращения.';}
    const admin=document.getElementById('adminMain');if(admin){for(const el of admin.querySelectorAll('form input,form select,form button')){if(el.closest('#adminSearch,#adminPromoFilter,#adminOperationFilter,#adminRaffleFilter,#adminAuditFilter'))continue;el.disabled=true;}const heading=admin.querySelector('.admin-heading p');if(heading)heading.textContent='Демо-данные. Просмотр и фильтры доступны; административные изменения выполняются только на сервере.';}
  }
  window.SkinsFlipPreview={mount,login(){state.account=state.account==='guest'?'A':state.account;save();location.href=new URL('profile.html',base).href;}};
  document.addEventListener('DOMContentLoaded',mount);
})();

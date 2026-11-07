'use strict';
(() => {
 const base=new URL(document.querySelector('meta[name="app-base"]')?.content||'/',location.href);
 const paths=new Set(['/','/index.html','/login.html','/profile.html','/wheel.html','/raffles.html','/payout.html','/admin.html','/404.html'].map(path=>new URL(path.replace(/^\/+/,''),base).pathname));
 let navigation=0,controller=null,scrollTimer=null,renderedUrl=new URL(location.href);
 for(const style of document.head.querySelectorAll('style'))style.dataset.pageStyle='';
 history.scrollRestoration='manual';
 function saveScroll(){
  const state=history.state&&typeof history.state==='object'?history.state:{};
  history.replaceState({...state,skinsflipScroll:[window.scrollX,window.scrollY]},'',location.href);
 }
 window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(saveScroll,100);},{passive:true});
 async function navigate(url,{push=false,restore=null}={}){
  const ticket=++navigation;if(controller)controller.abort();controller=new AbortController();
  try{
   const response=await fetch(url.href,{signal:controller.signal,headers:{'X-SkinsFlip-Navigation':'1'}});
   if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))throw new Error('Navigation failed');
   const next=new DOMParser().parseFromString(await response.text(),'text/html');
   if(!next.body||!next.title)throw new Error('Invalid page');
   if(ticket!==navigation)return;
   if(push){clearTimeout(scrollTimer);saveScroll();history.pushState({skinsflipScroll:[0,0]},'',url.href);}
   window.SkinsFlipPage.stop();
   document.head.querySelectorAll('style[data-page-style]').forEach(style=>style.remove());
   const anchor=document.head.querySelector('link[href$="/assets/app.css"]');
   for(const style of next.head.querySelectorAll('style')){const copy=document.importNode(style,true);copy.dataset.pageStyle='';document.head.insertBefore(copy,anchor);}
   next.body.querySelectorAll('script').forEach(script=>script.remove());
   document.body.className=next.body.className;document.body.replaceChildren(...[...next.body.childNodes].map(node=>document.importNode(node,true)));
   document.title=next.title;
   renderedUrl=new URL(url.href);
   window.SkinsFlipPage.start();
   const main=document.querySelector('main');if(main){if(!main.hasAttribute('tabindex'))main.setAttribute('tabindex','-1');main.focus({preventScroll:true});}
   if(url.hash){const id=decodeURIComponent(url.hash.slice(1));document.getElementById(id)?.scrollIntoView();}
   else if(Array.isArray(restore))window.scrollTo(restore[0],restore[1]);
   else window.scrollTo(0,0);
  }catch(error){if(error.name==='AbortError'||ticket!==navigation)return;location.href=url.href;}
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href]');if(!link||link.target||link.hasAttribute('download')||link.relList.contains('external'))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||!paths.has(url.pathname))return;
  if(url.pathname===location.pathname&&url.search===location.search&&url.hash){clearTimeout(scrollTimer);saveScroll();return;}
  event.preventDefault();navigate(url,{push:true});
 });
 window.addEventListener('popstate',event=>{clearTimeout(scrollTimer);const url=new URL(location.href);if(!paths.has(url.pathname)){location.reload();return;}if(url.pathname===renderedUrl.pathname&&url.search===renderedUrl.search){navigation++;if(controller)controller.abort();if(url.hash)document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView();else if(Array.isArray(event.state?.skinsflipScroll))window.scrollTo(...event.state.skinsflipScroll);renderedUrl=url;return;}navigate(url,{restore:event.state?.skinsflipScroll});});
})();

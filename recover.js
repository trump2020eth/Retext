/* Local-only recovery at the old GitHub Pages origin. No uploads or API calls. */
(function(){
  'use strict';
  var target=new URL('https://retext-editor.pages.dev/app');
  function get(key){try{return localStorage.getItem(key)||'';}catch(_){return '';}}
  function save(blob,name){var a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},10000);}
  function text(id,value){document.getElementById(id).textContent=value;}
  var qs=new URLSearchParams(location.search),order=qs.get('paid')||get('retext_order'),sid=qs.get('sid')||get('retext_sid');
  if(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(order))target.searchParams.set('paid',order);
  if(/^cs_(?:test|live)_[a-z\d_]{1,200}$/i.test(sid))target.searchParams.set('sid',sid);
  if(qs.get('checkout')==='cancelled')target.searchParams.set('checkout','cancelled');
  document.getElementById('open-editor').href=target.href;
  if(target.searchParams.has('paid')||target.searchParams.has('sid'))document.getElementById('pending').hidden=false;
  // Remove checkout references from this old tab's visible URL after reading them.
  if(qs.has('paid')||qs.has('sid')){qs.delete('paid');qs.delete('sid');history.replaceState(null,'',location.pathname+(qs.toString()?'?'+qs:'')+location.hash);}
  var license=get('retext_license');
  if(license){document.getElementById('license-section').hidden=false;document.getElementById('old-license').value=license;
    document.getElementById('copy-license').onclick=function(){if(!navigator.clipboard){document.getElementById('old-license').select();text('license-status','Select and copy the code above.');return;}navigator.clipboard.writeText(license).then(function(){text('license-status','License code copied.');},function(){document.getElementById('old-license').select();text('license-status','Select and copy the code above.');});};
    document.getElementById('save-license').onclick=function(){save(new Blob(['Retext unlock code\n\n'+license+'\n\nRestore with License in the new editor.\n'],{type:'text/plain'}),'Retext-license.txt');};
  }
  function dataURL(blob){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result);};r.onerror=reject;r.readAsDataURL(blob);});}
  function readDrafts(){return new Promise(function(resolve,reject){if(!window.indexedDB){reject(new Error('storage'));return;}var r=indexedDB.open('retext-private-draft',1);r.onupgradeneeded=function(){r.transaction.abort();};r.onerror=function(){reject(new Error('storage'));};r.onsuccess=function(){var db=r.result;if(!db.objectStoreNames.contains('draft')){db.close();resolve([]);return;}var tx=db.transaction('draft','readonly'),store=tx.objectStore('draft'),out=[];['autosave','checkout'].forEach(function(slot){var q=store.get(slot);q.onsuccess=function(){if(q.result&&q.result.blob&&Array.isArray(q.result.boxes))out.push({slot:slot,draft:q.result});};});tx.oncomplete=function(){db.close();resolve(out);};tx.onerror=function(){db.close();reject(new Error('storage'));};};});}
  readDrafts().then(function(items){
    if(!items.length){text('project-status','No saved project was found at this old address. Your downloaded project files can be opened in the new editor.');return;}
    items.sort(function(a,b){return (b.draft.savedAt||0)-(a.draft.savedAt||0);});text('project-status','Download a backup, then open it in the new editor. Nothing is deleted from this address.');
    items.forEach(function(item){var d=item.draft,b=document.createElement('button');b.textContent='Download '+(item.slot==='autosave'?'autosaved project':'checkout project');b.onclick=async function(){b.disabled=true;try{var used=new Set();d.boxes.forEach(function(q){if(q.style)used.add(q.style.family);if(q.orig&&q.orig.style)used.add(q.orig.style.family);});var project={format:'retext-project',version:1,name:d.img&&d.img.name||'recovered.png',image:await dataURL(d.blob),boxes:d.boxes,fonts:(d.fonts||[]).filter(function(f){return used.has(f.family);})};save(new Blob([JSON.stringify(project)],{type:'application/json'}),'Retext-recovered-'+item.slot+'.retext');text('project-status','Backup prepared. Open it with Tools → Open project in the new editor.');}catch(_){text('project-status','Could not prepare the backup. Keep this tab open and try again.');}finally{b.disabled=false;}};document.getElementById('projects').appendChild(b);});
  }).catch(function(){text('project-status','Saved browser storage is unavailable or empty. Downloaded .retext projects still work in the new editor.');});
})();

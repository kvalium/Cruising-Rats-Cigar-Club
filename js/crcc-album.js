/* CRCC — Album officiel. Off par défaut.
   Suno reste dans un onglet séparé, pour conserver l'écoute pendant les navigations. */
(()=>{'use strict';
const album='https://suno.com/album/434de566-c9ba-4e71-ab21-dcc1e1eb3a77';
const key='crcc-album-open';
const name='crcc-album-player';
const button=document.querySelector('[data-crcc-album]');
if(!button)return;
let player=null;
function active(){try{return sessionStorage.getItem(key)==='1';}catch{return false;}}
function setActive(on){try{sessionStorage.setItem(key,on?'1':'0');}catch{}button.setAttribute('aria-pressed',String(on));button.textContent=on?'♫ ALBUM · ON':'♫ ALBUM · OFF';button.title=on?'Fermer la fenêtre de l’album CRCC':'Ouvrir l’album CRCC dans un onglet séparé (lecture manuelle)';}
setActive(active());
button.addEventListener('click',()=>{
 if(active()){
   try{const w=player&&!player.closed?player:window.open('',name);if(w&&!w.closed)w.close();}catch{}
   player=null;setActive(false);return;
 }
 // Explicit user action: open the official Suno album in a persistent tab.
 player=window.open(album,name);
 if(!player){setActive(false);return;}
 try{player.focus();}catch{}
 setActive(true);
});
window.addEventListener('storage',e=>{if(e.key===key)setActive(e.newValue==='1');});
})();
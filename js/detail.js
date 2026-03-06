
(function(){
const q=k=>new URL(location.href).searchParams.get(k);
fetch('./games.json').then(r=>r.json()).then(d=>{
 const g=d.find(x=>String(x.id)===String(q('id')));
 document.getElementById('title').textContent=g.title;
 hero.src=g.cover;
 document.getElementById('size').textContent=g.size;
 document.getElementById('version').textContent=g.version;
 document.getElementById('platform').textContent=g.platform;
 document.getElementById('date').textContent=g.date;
 document.getElementById('views').textContent=g.views;
 document.getElementById('desc').textContent=g.desc;
 const track=document.getElementById('track');
 track.innerHTML=g.shots.map(u=>`<img src="${u}"/>`).join('');
 const prev=document.getElementById('prevBtn'),next=document.getElementById('nextBtn');
 const vp=track.parentElement;
 const max=g.shots.length-1;
 function idx(){return Math.round(track.scrollLeft/vp.clientWidth);} 
 function go(i){track.scrollTo({left:i*vp.clientWidth,behavior:'smooth'});} 
 prev.onclick=()=>go(Math.max(0,idx()-1));
 next.onclick=()=>go(Math.min(max,idx()+1));
 window.onresize=()=>go(idx());
});
})();

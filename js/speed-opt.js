
// simple runtime optimizations
window.addEventListener('load',()=>{
  const links=document.querySelectorAll('a[href$=".js"],a[href$=".css"]');
  links.forEach(a=>{
    const p=document.createElement('link');
    p.rel='prefetch'; p.href=a.href;
    document.head.appendChild(p);
  });
});

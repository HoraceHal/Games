
// 简单交互：移动端菜单占位、返回顶部
window.addEventListener('DOMContentLoaded', () => {
  const toTop = document.createElement('button');
  toTop.textContent = '↑';
  Object.assign(toTop.style, {position:'fixed',right:'16px',bottom:'20px',padding:'8px 10px',borderRadius:'10px',border:'1px solid #333',background:'#1b1b1b',color:'#fff',cursor:'pointer',opacity:'.85'});
  toTop.title = '返回顶部';
  toTop.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
  document.body.appendChild(toTop);
});

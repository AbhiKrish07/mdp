const stage=document.querySelector('#modelStage');
const toast=document.querySelector('#toast');
let toastTimer;
function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),1800)}
document.querySelectorAll('.view-choice').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.view-choice').forEach(item=>item.classList.remove('active'));button.classList.add('active');document.querySelector('#robot').classList.toggle('rotated',button.dataset.view!=='ISO');notify(`${button.textContent} view`)}));
document.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.toggle;const className=key==='bounds'?'hide-bounds':`hide-${key}`;stage.classList.toggle(className);button.classList.toggle('selected');notify(`${key[0].toUpperCase()+key.slice(1)} ${stage.classList.contains(className)?'hidden':'shown'}`)}));
document.querySelector('#reset').addEventListener('click',()=>{stage.classList.remove('hide-bounds','hide-grid','hide-axes');document.querySelectorAll('[data-toggle]').forEach(button=>button.classList.add('selected'));document.querySelector('#robot').classList.remove('rotated');document.querySelectorAll('.view-choice').forEach(button=>button.classList.toggle('active',button.dataset.view==='ISO'));notify('View reset')});
document.querySelector('#snapshot').addEventListener('click',()=>notify('Snapshot captured'));
document.querySelectorAll('.tab').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(tab=>tab.classList.remove('active'));button.classList.add('active');if(button.dataset.panel!=='overview')notify(`${button.textContent.trim()} panel selected`)}));
document.querySelectorAll('.subsystem').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.subsystem').forEach(row=>row.style.borderColor='');button.style.borderColor='var(--accent)';notify(`${button.querySelector('strong').textContent} selected`)}));
document.querySelector('#expandAll').addEventListener('click',()=>notify('Showing all 5 subsystems'));

const workspace=document.querySelector('.workspace');
const sidebarToggle=document.querySelector('#sidebarToggle');
sidebarToggle.addEventListener('click',()=>{const collapsed=workspace.classList.toggle('sidebar-collapsed');sidebarToggle.setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');sidebarToggle.title=collapsed?'Expand navigation':'Collapse navigation'});
document.querySelectorAll('.nav-item').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(item=>item.classList.remove('active'));button.classList.add('active');notify(`${button.querySelector('.nav-label').textContent} selected`)}));
const themeToggle=document.querySelector('#themeToggle');
function setTheme(theme){document.body.dataset.theme=theme;const isDark=theme==='dark';themeToggle.setAttribute('aria-label',`Switch to ${isDark?'light':'dark'} mode`);themeToggle.title=`Switch to ${isDark?'light':'dark'} mode`;themeToggle.querySelector('.theme-glyph').textContent=isDark?'☼':'◐';themeToggle.querySelector('.theme-label').textContent=isDark?'Light mode':'Dark mode';}
setTheme(localStorage.getItem('form-theme')||'dark');
themeToggle.addEventListener('click',()=>{const next=document.body.dataset.theme==='dark'?'light':'dark';setTheme(next);localStorage.setItem('form-theme',next);notify(`${next==='dark'?'Dark':'Light'} mode enabled`)});

(() => {
  const KEY = 'campus-finds-v1';
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const samples = [
    {id:'demo-1',type:'lost',title:'Silver water bottle',category:'Accessories',description:'Tall bottle with a small mountain sticker on the side.',location:'Main library, 2nd floor',date:daysAgo(1),contact:'student@example.edu',status:'active',demo:true},
    {id:'demo-2',type:'found',title:'Blue notebook',category:'Books & Notes',description:'Grid pages, “Maya” written inside the front cover.',location:'Room 204, Science block',date:daysAgo(0),contact:'helper@example.edu',status:'active',demo:true},
    {id:'demo-3',type:'lost',title:'Black wireless earbuds',category:'Electronics',description:'Small charging case, no visible brand name.',location:'Cafeteria near the window seats',date:daysAgo(2),contact:'student@example.edu',status:'active',demo:true},
    {id:'demo-4',type:'found',title:'Campus ID card',category:'IDs & Cards',description:'Found near the east entrance. Contact me with the name on the card.',location:'East gate',date:daysAgo(3),contact:'helper@example.edu',status:'active',demo:true},
    {id:'demo-5',type:'found',title:'Grey zip-up hoodie',category:'Clothing',description:'Medium size, left behind after the afternoon lecture.',location:'Auditorium, row G',date:daysAgo(4),contact:'helper@example.edu',status:'active',demo:true},
    {id:'demo-6',type:'lost',title:'USB-C charger',category:'Electronics',description:'White 65W wall charger with two ports.',location:'Computer lab 3',date:daysAgo(5),contact:'student@example.edu',status:'returned',demo:true}
  ];
  const $ = (s, root=document) => root.querySelector(s), $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const grid = $('#listing-grid'), dialog = $('#report-dialog'), form = $('#report-form');
  let filter = 'all', toastTimer;
  function load() {
    try { const saved = localStorage.getItem(KEY); if (saved !== null) { const value = JSON.parse(saved); if (Array.isArray(value)) return value; } }
    catch (error) { console.warn('Could not read saved listings.', error); }
    return samples.map(item => ({...item}));
  }
  let listings = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(listings)); } catch { toast('Could not save. Check browser storage settings.'); } }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function dateLabel(value) {
    const date = new Date(`${value}T00:00:00`); if (Number.isNaN(date.getTime())) return '';
    const today = new Date(); today.setHours(0,0,0,0); const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    if (+date === +today) return 'Today'; if (+date === +yesterday) return 'Yesterday';
    return new Intl.DateTimeFormat(undefined,{day:'numeric',month:'short'}).format(date);
  }
  function contactUrl(value) {
    const s = String(value || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return `mailto:${s}`;
    const digits = s.replace(/[^\d+]/g,''); return digits.length >= 7 ? `tel:${digits}` : `mailto:${s}`;
  }
  function card(item) {
    const done = item.status === 'returned', kind = done ? 'returned' : item.type;
    const label = done ? 'Reunited' : item.type;
    const contactText = item.type === 'lost' ? 'Contact owner ↗' : 'Contact finder ↗';
    const action = done ? '<span class="listing-date">Happily reunited</span>' : `<a class="contact-link" href="${esc(contactUrl(item.contact))}">${contactText}</a><button class="returned-button" type="button" data-return="${esc(item.id)}">Mark returned</button>`;
    return `<article class="listing-card"><div class="listing-top"><span class="badge badge-${kind}">${label}</span><span class="category-label">${esc(item.category)}</span></div><h3>${esc(item.title)}</h3><p class="listing-description">${esc(item.description || 'No extra details added.')}</p><div class="listing-meta"><span class="pin">⌖</span><span>${esc(item.location)}</span></div><div class="listing-foot"><span class="listing-date">${dateLabel(item.date)}${item.demo ? ' · sample' : ''}</span><div class="card-actions">${action}</div></div></article>`;
  }
  function render() {
    const query = $('#search-input').value.trim().toLowerCase(), category = $('#category-filter').value;
    const direction = $('#sort-order').value === 'newest' ? -1 : 1;
    const filtered = [...listings].sort((a,b) => direction * a.date.localeCompare(b.date)).filter(item => {
      const done = item.status === 'returned';
      if (filter === 'returned' && !done) return false;
      if (filter === 'lost' && (item.type !== 'lost' || done)) return false;
      if (filter === 'found' && (item.type !== 'found' || done)) return false;
      if (category !== 'all' && item.category !== category) return false;
      return `${item.title} ${item.description || ''} ${item.location} ${item.category} ${item.type}`.toLowerCase().includes(query);
    });
    grid.innerHTML = filtered.map(card).join(''); $('#empty-state').hidden = filtered.length > 0; grid.hidden = !filtered.length;
    const active = listings.filter(item => item.status !== 'returned'), lost = active.filter(item => item.type === 'lost').length, found = active.filter(item => item.type === 'found').length;
    $('#stat-active').textContent = active.length; $('#stat-lost').textContent = lost; $('#stat-found').textContent = found;
    $('#count-all').textContent = listings.length; $('#count-lost').textContent = lost; $('#count-found').textContent = found; $('#count-returned').textContent = listings.length - active.length;
  }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2600); }
  function openDialog() { form.reset(); $('input[name="date"]',form).value = daysAgo(0); $$('.field',form).forEach(x=>x.classList.remove('has-error')); $('#form-error').textContent=''; dialog.showModal(); setTimeout(()=>$('input[name="title"]',form).focus(),50); }
  $$('[data-open]').forEach(button=>button.addEventListener('click',openDialog));
  $('#close-dialog').addEventListener('click',()=>dialog.close()); $('#cancel-dialog').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  $('#search-input').addEventListener('input',render); $('#category-filter').addEventListener('change',render); $('#sort-order').addEventListener('change',render);
  $$('.filter-chip').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter; $$('.filter-chip').forEach(chip=>{const on=chip===button;chip.classList.toggle('selected',on);chip.setAttribute('aria-pressed',String(on));});render();}));
  grid.addEventListener('click',e=>{const button=e.target.closest('[data-return]');if(!button)return;const item=listings.find(x=>x.id===button.dataset.return);if(!item)return;item.status='returned';save();render();toast('Marked as reunited. Thanks for helping!');});
  form.addEventListener('submit',e=>{
    e.preventDefault(); $$('.field',form).forEach(x=>x.classList.remove('has-error')); $('#form-error').textContent='';
    const data=new FormData(form); let invalid=null;
    ['title','category','date','location','contact'].forEach(name=>{const control=form.elements[name];if(!String(data.get(name)||'').trim()){const field=control.closest('.field');field.classList.add('has-error');const message=$('.field-error',field);if(message)message.textContent='Please fill in this field.';invalid ||= control;}});
    const date=String(data.get('date')||''); if(date>daysAgo(0)){ $('#form-error').textContent='Please choose today or an earlier date.'; invalid ||= form.elements.date; }
    if(invalid){invalid.focus();return;}
    listings.unshift({id:globalThis.crypto?.randomUUID?.()||`item-${Date.now()}`,type:data.get('type'),title:String(data.get('title')).trim(),category:data.get('category'),date,location:String(data.get('location')).trim(),description:String(data.get('description')||'').trim(),contact:String(data.get('contact')).trim(),status:'active',demo:false});
    save(); dialog.close(); filter='all'; $$('.filter-chip').forEach(chip=>{const on=chip.dataset.filter==='all';chip.classList.toggle('selected',on);chip.setAttribute('aria-pressed',String(on));}); $('#search-input').value='';$('#category-filter').value='all';render();toast('Your listing is on the board.');$('#listings').scrollIntoView({behavior:'smooth'});
  });
  $('#search-input').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.currentTarget.focus();}if(e.key==='Escape'){e.currentTarget.value='';render();e.currentTarget.blur();}});
  let deferredInstall = null;
  const installButton = $('#install-app');
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredInstall = event; installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!deferredInstall) return;
    try {
      await deferredInstall.prompt();
      const result = await deferredInstall.userChoice;
      if (result.outcome === 'accepted') toast('Campus Finds was installed.');
    } catch (error) { console.warn('Install prompt unavailable.', error); }
    deferredInstall = null; installButton.hidden = true;
  });
  window.addEventListener('appinstalled', () => { deferredInstall = null; installButton.hidden = true; toast('Campus Finds was installed.'); });
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Offline support could not start.', error));
  }
  render();
})();

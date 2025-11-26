
// Load data and build UI
(async function(){
  const res = await fetch('data.json');
  const data = await res.json();
  const content = document.getElementById('content');
  const search = document.getElementById('search');
  const eventFilter = document.getElementById('eventFilter');
  const downloadCsvBtn = document.getElementById('downloadCsv');

  // Populate event type filter
  const evts = ['(All event types)', ...data.eventTypes];
  evts.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    eventFilter.appendChild(opt);
  });
  eventFilter.value = '(All event types)';

  function buildCard(item, filterEvt){
    const card = document.createElement('div');
    card.className = 'card';
    const h2 = document.createElement('h2');
    h2.textContent = item.language;
    const count = Object.keys(item.subjects).length;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = count + ' subjects';
    h2.appendChild(badge);
    card.appendChild(h2);

    const table = document.createElement('table');
    table.className = 'table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Event Type</th><th>Subject Line</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    const entries = Object.entries(item.subjects);
    const filteredEntries = filterEvt === '(All event types)'
      ? entries
      : entries.filter(([evt]) => evt === filterEvt);

    filteredEntries.forEach(([evt, subj]) => {
      const tr = document.createElement('tr');
      const tdEvt = document.createElement('td'); tdEvt.textContent = evt;
      const tdSubj = document.createElement('td');
      tdSubj.textContent = subj;

      // Copy to clipboard button
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.title = 'Copy subject line';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(subj);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 1500);
        } catch {
          alert('Copy failed. Please copy manually.');
        }
      });

      tdSubj.appendChild(copyBtn);
      tr.appendChild(tdEvt); tr.appendChild(tdSubj);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    card.appendChild(table);
    return card;
  }

  function render(){
    const q = (search.value || '').toLowerCase();
    const filterEvt = eventFilter.value;
    content.innerHTML = '';

    let shown = 0;
    data.items.forEach(item => {
      const langText = item.language.toLowerCase();
      const matchesSearch = !q || langText.includes(q) || Object.values(item.subjects).some(v => v.toLowerCase().includes(q));
      const matchesEvent = filterEvt === '(All event types)' || (item.subjects[filterEvt] !== undefined);
      if (!matchesSearch || !matchesEvent) return;
      shown++;
      content.appendChild(buildCard(item, filterEvt));
    });

    if (shown === 0){
      const div = document.createElement('div');
      div.className = 'no-results';
      div.textContent = 'No matching languages or subject lines.';
      content.appendChild(div);
    }
  }

  // CSV download of current view
  function toCsv(items, filterEvt, q){
    const rows = [['Language','Event Type','Subject Line']];
    items.forEach(item => {
      const langText = item.language.toLowerCase();
      const matchesSearch = !q || langText.includes(q) || Object.values(item.subjects).some(v => v.toLowerCase().includes(q));
      if (!matchesSearch) return;
      const entries = Object.entries(item.subjects);
      const filteredEntries = filterEvt === '(All event types)' ? entries : entries.filter(([evt]) => evt === filterEvt);
      filteredEntries.forEach(([evt, subj]) => rows.push([item.language, evt, subj]));
    });
    return rows.map(r => r.map(v => `"${String(v).replace(/\"/g,'\"')}"`).join(',')).join('\n');
  }

  downloadCsvBtn.addEventListener('click', () => {
    const q = (search.value || '').toLowerCase();
    const filterEvt = eventFilter.value;
    const csv = toCsv(data.items, filterEvt, q);
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'subject-lines.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  search.addEventListener('input', render);
  eventFilter.addEventListener('change', render);
  render();

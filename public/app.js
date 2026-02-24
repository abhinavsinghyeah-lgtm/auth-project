let currentSection = 'overview';
let quill;
let editingNoteId = null;
const ITEMS_PER_PAGE = 10;

async function fetchData(url, method = 'GET', body = null) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) throw new Error('Error fetching data');
  return res.json();
}

function formatCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB').format(new Date(date)); // DD-MM-YYYY
}

function showSection(section) {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.getElementById(section).classList.remove('hidden');
  currentSection = section;
  loadSectionData();
}

async function loadSectionData() {
  try {
    if (currentSection === 'overview') {
      const data = await fetchData('/api/overview');
      document.getElementById('total-revenue').innerText = formatCurrency(data.revenue);
      document.getElementById('total-expenses').innerText = formatCurrency(data.expenses);
      document.getElementById('net-profit').innerText = formatCurrency(data.profit);
      document.getElementById('active-users').innerText = data.totalUsers;

      new ApexCharts(document.getElementById('revenue-chart'), {
        chart: { type: 'line' },
        series: [{ name: 'Revenue', data: data.revenueGraph }],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] }
      }).render();

      new ApexCharts(document.getElementById('profit-chart'), {
        chart: { type: 'bar' },
        series: [{ name: 'Profit', data: data.profitGraph }],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] }
      }).render();

      // Schedule glimpse (next 7 days)
      const schedule = await fetchData('/api/schedule');
      const glimpse = document.getElementById('schedule-glimpse');
      glimpse.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const day = schedule.days[i];
        const div = document.createElement('div');
        div.innerHTML = `<h4>Day ${i+1}</h4><ul>${day.tasks.map(t => `<li>${t.task} ${t.completed ? '(Done)' : ''}</li>`).join('')}</ul>`;
        glimpse.appendChild(div);
      }

      // Low stock alerts
      const alerts = document.getElementById('low-stock-alerts');
      alerts.innerHTML = data.lowStockAlerts.length ? `<div class="alert">Low Stock: ${data.lowStockAlerts.map(i => i.name).join(', ')}</div>` : '';
    } else if (currentSection === 'finance') {
      loadFinance();
    } else if (currentSection === 'users') {
      loadUsers();
      loadLogs();
    } else if (currentSection === 'suppliers') {
      loadSuppliers();
    } else if (currentSection === 'inventory') {
      loadInventory();
    } else if (currentSection === 'schedule') {
      loadSchedule();
    } else if (currentSection === 'notes') {
      loadNotes();
    } else if (currentSection === 'settings') {
      const user = await fetchData('/profile');
      document.getElementById('theme-select').value = user.theme;
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadFinance(page = 1) {
  const data = await fetchData('/api/finance');
  const search = document.getElementById('finance-search').value.toLowerCase();
  const filtered = data.filter(e => e.remark.toLowerCase().includes(search) || e.category.toLowerCase().includes(search));
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const table = document.getElementById('finance-table');
  table.innerHTML = paginated.map(e => `
    <tr>
      <td>${e.type}</td>
      <td>${formatCurrency(e.amount)}</td>
      <td>${formatDate(e.date)}</td>
      <td>${e.remark}</td>
      <td>${e.category}</td>
      <td>
        <button onclick="editFinance('${e._id}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
        <button onclick="deleteFinance('${e._id}')" class="bg-red-500 text-white p-1 rounded">Delete</button>
      </td>
    </tr>
  `).join('');

  renderPagination('finance', filtered.length, page);

  // Charts (aggregate)
  const revenueData = data.filter(e => e.type === 'sale').map(e => e.amount);
  const profitData = data.filter(e => e.type === 'sale').map(e => e.amount - data.filter(ex => ex.type === 'expense').reduce((s, ex) => s + ex.amount, 0)/revenueData.length); // Simple calc
  new ApexCharts(document.getElementById('finance-revenue-chart'), { chart: { type: 'line' }, series: [{ data: revenueData }], xaxis: { categories: data.map(e => formatDate(e.date)) } }).render();
  new ApexCharts(document.getElementById('finance-profit-chart'), { chart: { type: 'bar' }, series: [{ data: profitData }], xaxis: { categories: data.map(e => formatDate(e.date)) } }).render();
}

document.getElementById('finance-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const body = Object.fromEntries(formData);
  await fetchData('/api/finance', 'POST', body);
  loadFinance();
  e.target.reset();
});

async function editFinance(id) {
  const data = await fetchData(`/api/finance`);
  const entry = data.find(e => e._id === id);
  // Populate form (for simplicity, alert or use modal; here repopulate form)
  document.querySelector('[name="type"]').value = entry.type;
  document.querySelector('[name="amount"]').value = entry.amount;
  document.querySelector('[name="date"]').value = new Date(entry.date).toISOString().split('T')[0];
  document.querySelector('[name="remark"]').value = entry.remark;
  document.querySelector('[name="category"]').value = entry.category;
  // Change submit to update
  const form = document.getElementById('finance-form');
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const body = Object.fromEntries(new FormData(form));
    await fetchData(`/api/finance/${id}`, 'PUT', body);
    loadFinance();
    form.reset();
    form.onsubmit = originalFinanceSubmit; // Reset
  };
}

async function deleteFinance(id) {
  if (confirm('Delete?')) {
    await fetchData(`/api/finance/${id}`, 'DELETE');
    loadFinance();
  }
}

async function loadUsers(page = 1) {
  const data = await fetchData('/api/users');
  const search = document.getElementById('users-search').value.toLowerCase();
  const filtered = data.filter(u => u.username.toLowerCase().includes(search));
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const table = document.getElementById('users-table');
  table.innerHTML = paginated.map(u => `
    <tr>
      <td>${u.username}</td>
      <td>${u.role}</td>
      <td>${u.lastLogin ? 'Active' : 'Inactive'}</td>
      <td>${formatDate(u.createdAt)}</td>
      <td>
        <select onchange="updateRole('${u._id}', this.value)">
          <option ${u.role === 'user' ? 'selected' : ''}>user</option>
          <option ${u.role === 'admin' ? 'selected' : ''}>admin</option>
          <option ${u.role === 'owner' ? 'selected' : ''}>owner</option>
        </select>
        <button onclick="deleteUser('${u._id}')" class="bg-red-500 text-white p-1 rounded">Delete</button>
      </td>
    </tr>
  `).join('');

  renderPagination('users', filtered.length, page);
}

async function updateRole(id, role) {
  await fetchData(`/api/users/${id}/role`, 'PUT', { role });
  loadUsers();
}

async function deleteUser(id) {
  if (confirm('Delete?')) {
    await fetchData(`/api/users/${id}`, 'DELETE');
    loadUsers();
  }
}

async function loadLogs() {
  const data = await fetchData('/api/logs');
  const table = document.getElementById('logs-table');
  table.innerHTML = data.map(l => `
    <tr>
      <td>${l.userId.username}</td>
      <td>${l.action}</td>
      <td>${formatDate(l.createdAt)}</td>
    </tr>
  `).join('');
}

async function loadSuppliers(page = 1) {
  const data = await fetchData('/api/suppliers');
  const search = document.getElementById('suppliers-search').value.toLowerCase();
  const filtered = data.filter(s => s.name.toLowerCase().includes(search));
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const table = document.getElementById('suppliers-table');
  table.innerHTML = paginated.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${s.contact}</td>
      <td>${s.address}</td>
      <td>${s.activityLevel}</td>
      <td>
        <ul>${s.payments.map(p => `<li>${formatCurrency(p.amount)} - ${formatDate(p.date)} - ${p.reason}</li>`).join('')}</ul>
        <form onsubmit="addPayment(event, '${s._id}')">
          <input name="amount" type="number" placeholder="Amount" class="p-1 border">
          <input name="date" type="date" class="p-1 border">
          <input name="reason" placeholder="Reason" class="p-1 border">
          <button type="submit" class="bg-green-500 text-white p-1 rounded">Add Payment</button>
        </form>
      </td>
      <td>
        <button onclick="editSupplier('${s._id}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
        <button onclick="deleteSupplier('${s._id}')" class="bg-red-500 text-white p-1 rounded">Delete</button>
      </td>
    </tr>
  `).join('');

  renderPagination('suppliers', filtered.length, page);
}

document.getElementById('supplier-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  await fetchData('/api/suppliers', 'POST', body);
  loadSuppliers();
  e.target.reset();
});

async function addPayment(e, id) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  await fetchData(`/api/suppliers/${id}/payments`, 'POST', body);
  loadSuppliers();
  e.target.reset();
}

async function deleteSupplier(id) {
  if (confirm('Delete?')) {
    await fetchData(`/api/suppliers/${id}`, 'DELETE');
    loadSuppliers();
  }
}

async function editSupplier(id) {
  // Similar to finance edit; populate form and change submit to PUT
  // Omitted for brevity; you can copy pattern from editFinance
}

async function loadInventory(page = 1) {
  const data = await fetchData('/api/inventory');
  document.getElementById('total-products').innerText = data.items.length;
  document.getElementById('total-stock').innerText = data.totalStock;
  document.getElementById('inventory-value').innerText = formatCurrency(data.totalValue);
  document.getElementById('total-profit').innerText = formatCurrency(data.totalProfit);

  const search = document.getElementById('inventory-search').value.toLowerCase();
  const filtered = data.items.filter(i => i.name.toLowerCase().includes(search));
  const paginated = filtered.slice((page-1)*ITEMS_PER_PAGE, page*ITEMS_PER_PAGE);

  const table = document.getElementById('inventory-table');
  table.innerHTML = paginated.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.stock}</td>
      <td>${formatCurrency(i.cost)}</td>
      <td>${formatCurrency(i.sellPrice)}</td>
      <td>${i.margin}%</td>
      <td>${formatCurrency(i.profit)}</td>
      <td>
        <button onclick="editInventory('${i._id}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
        <button onclick="deleteInventory('${i._id}')" class="bg-red-500 text-white p-1 rounded">Delete</button>
      </td>
    </tr>
  `).join('');

  renderPagination('inventory', filtered.length, page);

  const alerts = document.getElementById('inventory-alerts');
  const low = filtered.filter(i => i.stock < 10);
  alerts.innerHTML = low.length ? `<div class="alert">Low Stock: ${low.map(i => i.name).join(', ')}</div>` : '';
}

document.getElementById('inventory-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  await fetchData('/api/inventory', 'POST', body);
  loadInventory();
  e.target.reset();
});

async function deleteInventory(id) {
  if (confirm('Delete?')) {
    await fetchData(`/api/inventory/${id}`, 'DELETE');
    loadInventory();
  }
}

// Edit similar to others

async function loadSchedule() {
  const data = await fetchData('/api/schedule');
  const daysDiv = document.getElementById('schedule-days');
  daysDiv.innerHTML = '';
  data.days.forEach((day, index) => {
    const div = document.createElement('div');
    div.classList.add('bg-white', 'p-4', 'rounded', 'shadow');
    div.innerHTML = `
      <h4>Day ${index + 1}</h4>
      <ul>${day.tasks.map((t, tIndex) => `
        <li>
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${index}, ${tIndex}, this.checked)">
          ${t.task}
        </li>
      `).join('')}</ul>
      <form onsubmit="addTask(event, ${index})">
        <input name="task" placeholder="New Task" class="p-1 border">
        <button type="submit" class="bg-blue-500 text-white p-1 rounded">Add</button>
      </form>
    `;
    daysDiv.appendChild(div);
  });
}

async function addTask(e, dayIndex) {
  e.preventDefault();
  const body = { task: e.target.task.value };
  await fetchData(`/api/schedule/${dayIndex}/task`, 'POST', body);
  loadSchedule();
  e.target.reset();
}

async function toggleTask(dayIndex, taskIndex, completed) {
  await fetchData(`/api/schedule/${dayIndex}/task/${taskIndex}`, 'PUT', { completed });
  loadSchedule();
}

function showNoteForm(id = null) {
  document.getElementById('note-form').classList.remove('hidden');
  if (id) {
    // Load existing note
    editingNoteId = id;
    // Fetch and set title/content
  } else {
    editingNoteId = null;
    quill.setContents([]);
    document.getElementById('note-title').value = '';
  }
}

async function saveNote() {
  const title = document.getElementById('note-title').value;
  const content = quill.root.innerHTML;
  if (editingNoteId) {
    await fetchData(`/api/notes/${editingNoteId}`, 'PUT', { title, content });
  } else {
    await fetchData('/api/notes', 'POST', { title, content });
  }
  loadNotes();
  document.getElementById('note-form').classList.add('hidden');
}

async function loadNotes() {
  const data = await fetchData('/api/notes');
  const list = document.getElementById('notes-list');
  list.innerHTML = data.map(n => `
    <div class="bg-white p-4 rounded shadow mb-4">
      <h3 class="font-bold">${n.title}</h3>
      <div>${n.content}</div>
      <small>${formatDate(n.updatedAt)}</small>
      <button onclick="showNoteForm('${n._id}')" class="bg-yellow-500 text-white p-1 rounded">Edit</button>
      <button onclick="deleteNote('${n._id}')" class="bg-red-500 text-white p-1 rounded">Delete</button>
    </div>
  `).join('');
}

async function deleteNote(id) {
  if (confirm('Delete?')) {
    await fetchData(`/api/notes/${id}`, 'DELETE');
    loadNotes();
  }
}

async function updateTheme() {
  const theme = document.getElementById('theme-select').value;
  const user = await fetchData('/profile');
  await fetchData(`/api/users/${user._id}/theme`, 'PUT', { theme });
  document.body.className = `theme-${theme}`;
}

async function logout() {
  await fetchData('/logout', 'POST');
  window.location.href = '/';
}

function renderPagination(section, total, currentPage) {
  const pages = Math.ceil(total / ITEMS_PER_PAGE);
  const pagDiv = document.getElementById(`${section}-pagination`);
  pagDiv.innerHTML = '';
  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.classList.add('p-2', 'border', 'mx-1', i === currentPage ? 'bg-blue-500 text-white' : '');
    btn.onclick = () => loadSectionData(i); // Adjust for each load func
    pagDiv.appendChild(btn);
  }
}

function exportToCSV(section) {
  // Implement CSV export using data from table or fetch
  // Example for finance:
  fetchData('/api/finance').then(data => {
    const csv = 'Type,Amount,Date,Remark,Category\n' + data.map(e => `${e.type},${e.amount},${formatDate(e.date)},${e.remark},${e.category}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${section}.csv`;
    a.click();
  });
}

// Init
async function init() {
  quill = new Quill('#note-editor', { theme: 'snow' });
  const user = await fetchData('/profile');
  document.body.className = `theme-${user.theme}`;
  showSection('overview');
}

init();

// Add event listeners for searches
document.getElementById('finance-search').addEventListener('input', () => loadFinance());
document.getElementById('users-search').addEventListener('input', () => loadUsers());
document.getElementById('suppliers-search').addEventListener('input', () => loadSuppliers());
document.getElementById('inventory-search').addEventListener('input', () => loadInventory());
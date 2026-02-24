// =============================================
// RYVEN Admin Dashboard - Main JavaScript
// =============================================

let currentSection = 'overview';
let quill = null;
let editingNoteId = null;
const TOAST_DURATION = 3000;

// =============================================
// Utility Functions
// =============================================

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-2xl text-white font-medium transform translate-y-0 transition-all duration-300 z-50 ${
    type === 'error' ? 'bg-red-600' : 'bg-green-600'
  }`;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, TOAST_DURATION);
}

async function apiRequest(url, method = 'GET', body = null) {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null,
      credentials: 'include'
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err) {
    showToast(err.message || 'Something went wrong', 'error');
    throw err;
  }
}

function formatCurrency(num) {
  return '₹' + Number(num).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
}

// =============================================
// Theme Handling
// =============================================

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  document.querySelectorAll('[data-theme-select]').forEach(el => {
    el.value = theme;
  });
}

async function loadTheme() {
  try {
    const user = await apiRequest('/profile');
    applyTheme(user.theme || 'light');
    document.getElementById('theme-select').value = user.theme || 'light';
  } catch {}
}

async function saveTheme() {
  const theme = document.getElementById('theme-select').value;
  try {
    await apiRequest(`/api/users/${await (await apiRequest('/profile'))._id}/theme`, 'PUT', { theme });
    applyTheme(theme);
    showToast('Theme updated');
  } catch {}
}

// =============================================
// Navigation & Section Switching
// =============================================

function showSection(sectionId) {
  document.querySelectorAll('section[id]').forEach(s => s.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
  document.getElementById('page-title').textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  currentSection = sectionId;
  loadSectionData();
}

// Mobile sidebar
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('-translate-x-full');
  document.getElementById('overlay').classList.remove('hidden');
});

document.getElementById('close-sidebar')?.addEventListener('click', closeMobileMenu);
document.getElementById('overlay')?.addEventListener('click', closeMobileMenu);

function closeMobileMenu() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('overlay').classList.add('hidden');
}

// =============================================
// Load Data per Section
// =============================================

async function loadSectionData() {
  if (currentSection === 'overview')      await loadOverview();
  else if (currentSection === 'finance')  await loadFinance();
  else if (currentSection === 'inventory') await loadInventory();
  else if (currentSection === 'settings') await loadSettings();
  // Add other sections when you implement them
}

async function loadOverview() {
  try {
    const data = await apiRequest('/api/overview');

    document.getElementById('total-revenue').textContent = formatCurrency(data.revenue);
    document.getElementById('total-expenses').textContent = formatCurrency(data.expenses);
    document.getElementById('net-profit').textContent = formatCurrency(data.profit);
    document.getElementById('active-users').textContent = data.totalUsers || 0;

    // Revenue chart
    new ApexCharts(document.getElementById('revenue-chart'), {
      chart: { type: 'area', height: 300, toolbar: { show: false } },
      series: [{ name: 'Revenue', data: data.revenueGraph || [] }],
      xaxis: { categories: ['Jan','Feb','Mar','Apr','May','Jun'] },
      colors: ['#3b82f6'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2 } }
    }).render();

    // Profit chart
    new ApexCharts(document.getElementById('profit-chart'), {
      chart: { type: 'bar', height: 300, toolbar: { show: false } },
      series: [{ name: 'Profit', data: data.profitGraph || [] }],
      xaxis: { categories: ['Jan','Feb','Mar','Apr','May','Jun'] },
      colors: ['#10b981']
    }).render();

    // Low stock
    const low = data.lowStockAlerts || [];
    const alertEl = document.getElementById('low-stock-alert');
    if (low.length > 0) {
      alertEl.classList.remove('hidden');
      document.getElementById('low-stock-items').textContent = low.map(i => i.name).join(', ');
    } else {
      alertEl.classList.add('hidden');
    }

  } catch (err) {
    console.error(err);
  }
}

async function loadFinance() {
  // Implement similar to previous versions - table, form submit, charts
  // For brevity: add your existing finance code here or expand later
}

async function loadInventory() {
  try {
    const data = await apiRequest('/api/inventory');

    document.getElementById('total-products').textContent = data.items?.length || 0;
    document.getElementById('total-stock').textContent = data.totalStock || 0;
    document.getElementById('inventory-value').textContent = formatCurrency(data.totalValue || 0);
    document.getElementById('total-profit').textContent = formatCurrency(data.totalProfit || 0);

    const tbody = document.getElementById('inventory-table');
    tbody.innerHTML = '';

    (data.items || []).forEach(item => {
      const row = document.createElement('tr');
      row.className = item.stock < 10 ? 'low-stock' : '';
      row.innerHTML = `
        <td class="p-3">${item.name}</td>
        <td class="p-3">${item.stock}</td>
        <td class="p-3">${formatCurrency(item.cost)}</td>
        <td class="p-3">${formatCurrency(item.sellPrice || 0)}</td>
        <td class="p-3">${(item.margin || 0).toFixed(1)}%</td>
        <td class="p-3">${formatCurrency(item.profit || 0)}</td>
        <td class="p-3 text-right space-x-2">
          <button class="text-blue-600 hover:underline">Edit</button>
          <button class="text-red-600 hover:underline">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error(err);
  }
}

async function loadSettings() {
  await loadTheme();
}

// =============================================
// Inventory Auto Calculation
// =============================================

function initInventoryAutoCalc() {
  const form = document.getElementById('inventory-form');
  if (!form) return;

  const cost = form.querySelector('[name="cost"]');
  const sell = form.querySelector('[name="sellPrice"]');
  const margin = form.querySelector('[name="margin"]');

  const calc = () => {
    const c = parseFloat(cost.value) || 0;
    const s = parseFloat(sell.value) || 0;
    if (c > 0) {
      margin.value = (((s - c) / c) * 100).toFixed(1);
    } else {
      margin.value = '';
    }
  };

  cost.addEventListener('input', calc);
  sell.addEventListener('input', calc);
}

// =============================================
// Initialization
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadTheme();
  showSection('overview');

  // Inventory form auto-calc
  initInventoryAutoCalc();

  // Add form submit listeners etc. here when implementing full features
});

// Logout example
async function logout() {
  try {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/';
  } catch {}
}
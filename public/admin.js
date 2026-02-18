// Global stuff that have to be added //

let supplierPayments = [];
let supplierPaymentChartInstance = null;

let revenueChartInstance = null;
let expenseChartInstance = null;
let salesChartInstance = null;
let profitChartInstance = null;


/* ================= Sidebar Toggle ================= */

function toggleSidebar(){
const sb=document.getElementById("sidebar");
sb.classList.toggle("collapsed");
document.getElementById("logoText").innerText=
sb.classList.contains("collapsed")?"R":"RYVEN";
}

/* ================= Module Engine ================= */

function showModule(name, el){

document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));

if(el){
  el.classList.add("active");
}

if(name==="overview") loadOverview();
if(name==="finance") loadFinance();
if(name==="users") renderUsersModule();
if(name==="suppliers") loadSuppliers();
if(name==="inventory") loadInventory();
if(name==="schedule") loadSchedule();
if(name==="notes") loadNotes();
if(name==="settings") loadSettings();

}


/* Initial load */
loadOverview();
function loadOverview(){

const container=document.getElementById("moduleContent");

container.innerHTML=`
<div class="grid">
  <div class="card">
    <div class="muted">Total Revenue</div>
    <div class="stat">₹1,24,000</div>
    <div class="muted">+12% this month</div>
  </div>

  <div class="card">
    <div class="muted">Total Expenses</div>
    <div class="stat">₹52,000</div>
    <div class="muted">+5% this month</div>
  </div>

  <div class="card">
    <div class="muted">Net Profit</div>
    <div class="stat">₹72,000</div>
    <div class="muted">+18% growth</div>
  </div>

  <div class="card">
    <div class="muted">Active Users</div>
    <div class="stat">24</div>
    <div class="muted">3 new today</div>
  </div>
</div>

<div class="grid">
  <div class="card">
    <canvas id="overviewRevenueChart"></canvas>
  </div>

  <div class="card">
    <canvas id="overviewProfitChart"></canvas>
  </div>
</div>

<div class="grid">
  <div class="card">
    <canvas id="workActivityChart"></canvas>
  </div>

  <div class="card">
    <h3 style="margin-bottom:15px;">7 Day Schedule</h3>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px;">
      ${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>
        `<div style="padding:12px;border-radius:10px;background:var(--card));font-size:12px;">
           <b>${d}</b><br>Work Block
         </div>`
      ).join("")}
    </div>
  </div>
</div>
`;

renderOverviewCharts();
}

function renderOverviewCharts(){

new Chart(document.getElementById("overviewRevenueChart"),{
type:'line',
data:{
labels:['Jan','Feb','Mar','Apr','May','Jun'],
datasets:[{
label:'Revenue',
data:[20000,25000,30000,28000,35000,40000],
borderColor:'#2563eb',
backgroundColor:'rgba(37,99,235,0.1)',
fill:true,
tension:0.4
}]
}
});

new Chart(document.getElementById("overviewProfitChart"),{
type:'bar',
data:{
labels:['Jan','Feb','Mar','Apr','May','Jun'],
datasets:[{
label:'Profit',
data:[8000,12000,15000,11000,18000,22000],
backgroundColor:'#16a34a'
}]
}
});

new Chart(document.getElementById("workActivityChart"),{
type:'line',
data:{
labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
datasets:[{
label:'Work Hours',
data:[2,4,3,6,5,7,4],
borderColor:'#a855f7',
tension:0.4
}]
}
});

}
// ----------------------------------------------- //

//      FINANCEANCE MODEL THING  ;-;               //

// --------------------------------------------------//



let financeEntries = [];
let activePeriod = "all";

function loadFinance(){

const container = document.getElementById("moduleContent");

container.innerHTML = `
<h2 style="margin-bottom:25px;">Finance Dashboard</h2>

<div class="period-switch">
  <button onclick="setPeriod('all')" class="period-btn active">All Time</button>
  <button onclick="setPeriod('daily')" class="period-btn">Daily</button>
  <button onclick="setPeriod('weekly')" class="period-btn">Weekly</button>
  <button onclick="setPeriod('monthly')" class="period-btn">Monthly</button>
  <button onclick="setPeriod('yearly')" class="period-btn">Yearly</button>
</div>

<div class="finance-grid">
  <div class="finance-card"><canvas id="financeRevenueChart"></canvas></div>
  <div class="finance-card"><canvas id="financeExpenseChart"></canvas></div>
  <div class="finance-card"><canvas id="financeSalesChart"></canvas></div>
  <div class="finance-card"><canvas id="financeProfitChart"></canvas></div>
</div>

<div class="finance-entry-card">

<h3>Add Financial Entry</h3>

<div class="finance-form">

<select id="financeType">
  <option value="expense">Expense</option>
  <option value="sale">Sale</option>
</select>

<input type="number" id="financeAmount" placeholder="Amount">

<input type="datetime-local" id="financeDate">

<input type="text" id="financeRemark" placeholder="Remark / Description">

<button class="btn-primary" onclick="addFinanceEntry()">Add Entry</button>

</div>

</div>

<h3 style="margin-top:40px;">Expenses</h3>
<div class="finance-table-wrapper">
<table>
<thead>
<tr>
<th>Date</th>
<th>Amount</th>
<th>Remark</th>
</tr>
</thead>
<tbody id="expenseTable"></tbody>
</table>
</div>

<h3 style="margin-top:30px;">Sales</h3>
<div class="finance-table-wrapper">
<table>
<thead>
<tr>
<th>Date</th>
<th>Amount</th>
<th>Remark</th>
</tr>
</thead>
<tbody id="salesTable"></tbody>
</table>
</div>
`;

fetchFinanceEntries();
}
async function fetchFinanceEntries() {
  try {
    const res = await fetch("/api/finance", {
      credentials: "include"
    });

    if (!res.ok) {
      alert("Failed to load finance data");
      return;
    }

    const data = await res.json();

    // Convert date strings to Date objects
    financeEntries = data.map(entry => ({
      ...entry,
      date: new Date(entry.date)
    }));

    renderFinance();

  } catch (err) {
    console.error("Finance fetch error:", err);
  }
}

function setPeriod(period){
activePeriod = period;

document.querySelectorAll(".period-btn").forEach(btn=>btn.classList.remove("active"));
event.target.classList.add("active");

renderFinance();
}

async function addFinanceEntry(){

  const type = document.getElementById("financeType").value;
  const amount = parseFloat(document.getElementById("financeAmount").value);
  const date = document.getElementById("financeDate").value;
  const remark = document.getElementById("financeRemark").value;

  if(!amount || !date){
    alert("Please fill amount and date");
    return;
  }

  try {

    const res = await fetch("/api/finance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type,
        amount,
        date,
        remark
      })
    });

    if (!res.ok) {
      alert("Failed to save entry");
      return;
    }

    // Reload entries from backend
    await fetchFinanceEntries();

    // Clear fields
    document.getElementById("financeAmount").value = "";
    document.getElementById("financeDate").value = "";
    document.getElementById("financeRemark").value = "";

  } catch (err) {
    console.error("Add finance error:", err);
  }
}


function filterEntriesByPeriod(){

const now = new Date();

return financeEntries.filter(e=>{

if(activePeriod === "all") return true;

if(activePeriod === "daily"){
return e.date.toDateString() === now.toDateString();
}

if(activePeriod === "weekly"){
const oneWeekAgo = new Date();
oneWeekAgo.setDate(now.getDate()-7);
return e.date >= oneWeekAgo;
}

if(activePeriod === "monthly"){
return e.date.getMonth() === now.getMonth() &&
e.date.getFullYear() === now.getFullYear();
}

if(activePeriod === "yearly"){
return e.date.getFullYear() === now.getFullYear();
}

});
}

function renderFinance(){

const filtered = filterEntriesByPeriod();

let totalSales = 0;
let totalExpenses = 0;

filtered.forEach(e=>{
if(e.type==="sale") totalSales += e.amount;
if(e.type==="expense") totalExpenses += e.amount;
});

const profit = totalSales - totalExpenses;

renderFinanceTables(filtered);
renderFinanceCharts(totalSales,totalExpenses,profit);
}
function renderFinanceTables(data){

const expenseTable = document.getElementById("expenseTable");
const salesTable = document.getElementById("salesTable");

expenseTable.innerHTML="";
salesTable.innerHTML="";

data.forEach(e=>{

const row = `
<tr>
<td>${e.date.toLocaleString()}</td>
<td>₹${e.amount}</td>
<td>${e.remark || "-"}</td>
<td>
  <button onclick="deleteFinanceEntry('${entry._id}')">
    Delete
  </button>
</td>
<button onclick="editFinanceEntry('${entry._id}')">
  Edit
</button>
</tr>
`;

if(e.type==="expense") expenseTable.innerHTML+=row;
if(e.type==="sale") salesTable.innerHTML+=row;

});
}

async function editFinanceEntry(id) {

  const entry = financeEntries.find(e => e._id === id);

  if (!entry) return;

  const newAmount = prompt("Enter new amount:", entry.amount);
  if (!newAmount) return;

  const newRemark = prompt("Enter new remark:", entry.remark || "");

  try {
    const res = await fetch(`/api/finance/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type: entry.type,
        amount: parseFloat(newAmount),
        date: entry.date,
        remark: newRemark
      })
    });

    if (!res.ok) {
      alert("Failed to update");
      return;
    }

    await fetchFinanceEntries();

  } catch (err) {
    console.error("Edit error:", err);
  }
}


function renderFinanceCharts(sales,expenses,profit){

const filtered = filterEntriesByPeriod();

let labels = [];
let revenueData = [];

// ===== ALL TIME =====
if(activePeriod === "all"){

if(filtered.length === 0){
labels = [];
revenueData = [];
}else{

// find earliest & latest date
let dates = filtered.map(e => new Date(e.date));
let minDate = new Date(Math.min(...dates));
let maxDate = new Date(Math.max(...dates));

let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

while(current <= maxDate){
labels.push(current.toLocaleString("default",{month:"short",year:"numeric"}));
revenueData.push(0);
current.setMonth(current.getMonth()+1);
}

// fill data
filtered.forEach(e=>{
if(e.type === "sale"){
let index = labels.findIndex(label=>{
let d = new Date(e.date);
let labelDate = new Date(label);
return d.getMonth() === labelDate.getMonth() &&
       d.getFullYear() === labelDate.getFullYear();
});
if(index >= 0){
revenueData[index] += e.amount;
}
}
});

}
}

if(activePeriod === "yearly"){

labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
revenueData = new Array(12).fill(0);

filtered.forEach(e=>{
let month = e.date.getMonth();
if(e.type === "sale"){
revenueData[month] += e.amount;
}
});

}

if(activePeriod === "monthly"){

labels = ["Week 1","Week 2","Week 3","Week 4"];
revenueData = [0,0,0,0];

filtered.forEach(e=>{
let week = Math.floor((e.date.getDate()-1)/7);
if(e.type === "sale"){
revenueData[week] += e.amount;
}
});

}

if(activePeriod === "weekly"){

labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
revenueData = new Array(7).fill(0);

filtered.forEach(e=>{
let day = e.date.getDay();
if(e.type === "sale"){
revenueData[day] += e.amount;
}
});

}

if(activePeriod === "daily"){

labels = ["0-4","4-8","8-12","12-16","16-20","20-24"];
revenueData = [0,0,0,0,0,0];

filtered.forEach(e=>{
let hour = e.date.getHours();
let block = Math.floor(hour/4);
if(e.type === "sale"){
revenueData[block] += e.amount;
}
});

}

Chart.getChart("financeRevenueChart")?.destroy();

new Chart(document.getElementById("financeRevenueChart"),{
type:'line',
data:{
labels:labels,
datasets:[{
label:"Revenue",
data:revenueData,
borderColor:"#3b82f6",
backgroundColor:"rgba(59,130,246,0.1)",
fill:true,
tension:0.4
}]
},
options:{
responsive:true,
scales:{y:{beginAtZero:true}}
}
});

// ----- EXPENSE CHART -----

let expenseLabels = labels; // use same labels as revenue
let expenseData = new Array(expenseLabels.length).fill(0);

filtered.forEach(e=>{
if(e.type === "expense"){

if(activePeriod === "yearly"){
expenseData[e.date.getMonth()] += e.amount;
}

else if(activePeriod === "monthly"){
let week = Math.floor((e.date.getDate()-1)/7);
expenseData[week] += e.amount;
}

else if(activePeriod === "weekly"){
expenseData[e.date.getDay()] += e.amount;
}

else if(activePeriod === "daily"){
let block = Math.floor(e.date.getHours()/4);
expenseData[block] += e.amount;
}

else if(activePeriod === "all"){
let index = expenseLabels.findIndex(label=>{
let d = new Date(e.date);
let labelDate = new Date(label);
return d.getMonth() === labelDate.getMonth() &&
       d.getFullYear() === labelDate.getFullYear();
});
if(index >= 0){
expenseData[index] += e.amount;
}
}

}
});

Chart.getChart("financeExpenseChart")?.destroy();

new Chart(document.getElementById("financeExpenseChart"),{
type:'bar',
data:{
labels:expenseLabels,
datasets:[{
label:"Expenses",
data:expenseData,
backgroundColor:"rgba(239,68,68,0.8)",
borderRadius:6
}]
},
options:{
responsive:true,
plugins:{legend:{display:true}},
scales:{y:{beginAtZero:true}}
}
});
// ----- SALES CHART (Purple Area Line) -----

let salesLabels = labels;
let salesData = new Array(salesLabels.length).fill(0);

filtered.forEach(e=>{
if(e.type === "sale"){

if(activePeriod === "yearly"){
salesData[e.date.getMonth()] += e.amount;
}
else if(activePeriod === "monthly"){
let week = Math.floor((e.date.getDate()-1)/7);
salesData[week] += e.amount;
}
else if(activePeriod === "weekly"){
salesData[e.date.getDay()] += e.amount;
}
else if(activePeriod === "daily"){
let block = Math.floor(e.date.getHours()/4);
salesData[block] += e.amount;
}
else if(activePeriod === "all"){
let index = salesLabels.findIndex(label=>{
let d = new Date(e.date);
let labelDate = new Date(label);
return d.getMonth() === labelDate.getMonth() &&
       d.getFullYear() === labelDate.getFullYear();
});
if(index >= 0){
salesData[index] += e.amount;
}
}

}
});

Chart.getChart("financeSalesChart")?.destroy();

const salesCtx = document.getElementById("financeSalesChart").getContext("2d");

const salesGradient = salesCtx.createLinearGradient(0,0,0,300);
salesGradient.addColorStop(0,"rgba(168,85,247,0.4)");
salesGradient.addColorStop(1,"rgba(168,85,247,0)");

new Chart(salesCtx,{
type:'line',
data:{
labels:salesLabels,
datasets:[{
label:"Sales",
data:salesData,
fill:true,
backgroundColor:salesGradient,
borderColor:"#a855f7",
tension:0.4,
pointRadius:4
}]
},
options:{
responsive:true,
plugins:{legend:{display:true}},
scales:{y:{beginAtZero:true}}
}
});

// ----- PROFIT CHART (Green Premium Line) -----

let profitData = salesData.map((sale,i)=> sale - expenseData[i]);

Chart.getChart("financeProfitChart")?.destroy();

const profitCtx = document.getElementById("financeProfitChart").getContext("2d");

const profitGradient = profitCtx.createLinearGradient(0,0,0,300);
profitGradient.addColorStop(0,"rgba(34,197,94,0.4)");
profitGradient.addColorStop(1,"rgba(34,197,94,0)");

new Chart(profitCtx,{
type:'line',
data:{
labels:salesLabels,
datasets:[{
label:"Profit",
data:profitData,
fill:true,
backgroundColor:profitGradient,
borderColor:"#16a34a",
tension:0.4,
pointRadius:4
}]
},
options:{
responsive:true,
plugins:{legend:{display:true}},
scales:{y:{beginAtZero:true}}
}
});

}


async function deleteFinanceEntry(id) {

  if (!confirm("Are you sure you want to delete this entry?")) return;

  try {
    const res = await fetch(`/api/finance/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      alert("Failed to delete entry");
      return;
    }

    await fetchFinanceEntries();

  } catch (err) {
    console.error("Delete error:", err);
  }
}

/* ================= ------------------------  ================= */

    /* ================= USERS MODULE ================= */

/* ================= ------------------------  ================= */

let usersData = [
  {id:1, username:"architect", email:"architect@ryven.com", role:"owner", status:"active", created:"2026-02-10"},
  {id:2, username:"john", email:"john@ryven.com", role:"admin", status:"active", created:"2026-02-11"},
  {id:3, username:"emma", email:"emma@ryven.com", role:"user", status:"inactive", created:"2026-02-12"}
];

function renderUsersModule(){

document.getElementById("moduleContent").innerHTML = `

<div class="grid">

<div class="card blue"><h3>Total Users</h3><h1>${usersData.length}</h1></div>
<div class="card purple"><h3>Admins</h3><h1>${usersData.filter(u=>u.role==="admin").length}</h1></div>
<div class="card green"><h3>Owners</h3><h1>${usersData.filter(u=>u.role==="owner").length}</h1></div>
<div class="card red"><h3>Active Users</h3><h1>${usersData.filter(u=>u.status==="active").length}</h1></div>

</div>

<div class="card">

<div style="display:flex;justify-content:space-between;margin-bottom:20px;gap:10px;flex-wrap:wrap">

<input id="userSearch" placeholder="Search users..." style="padding:10px;border-radius:10px;border:1px solid var(--border);width:200px">

<select id="roleFilter" style="padding:10px;border-radius:10px;border:1px solid #ddd">
<option value="">All Roles</option>
<option value="owner">Owner</option>
<option value="admin">Admin</option>
<option value="user">User</option>
</select>

<button class="create-btn" onclick="openCreateUser()">
  + Create User
</button>

</div>

<table id="usersTable">
<thead>
<tr>
<th>User</th>
<th>Email</th>
<th>Role</th>
<th>Status</th>
<th>Created</th>
<th>Actions</th>
</tr>
</thead>
<tbody></tbody>
</table>

</div>

<div id="userModalContainer"></div>

`;

renderUsersTable();

document.getElementById("userSearch").addEventListener("input",renderUsersTable);
document.getElementById("roleFilter").addEventListener("change",renderUsersTable);

}

/* ===== TABLE RENDER ===== */

function renderUsersTable(){

const search = document.getElementById("userSearch").value.toLowerCase();
const filter = document.getElementById("roleFilter").value;

const tbody = document.querySelector("#usersTable tbody");
tbody.innerHTML = "";

usersData
.filter(u => u.username.toLowerCase().includes(search))
.filter(u => !filter || u.role === filter)
.forEach(user=>{

tbody.innerHTML += `
<tr>

<td>
<div style="display:flex;align-items:center;gap:10px">
<div style="width:35px;height:35px;border-radius:50%;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-weight:600">
${user.username[0].toUpperCase()}
</div>
${user.username}
</div>
</td>

<td>${user.email}</td>

<td>
<div class="role-wrapper">
  <div class="role-badge ${user.role}" onclick="toggleRoleMenu(${user.id})">
    ${user.role}
  </div>
  <div class="role-menu" id="roleMenu-${user.id}">
    <div onclick="changeRole(${user.id},'owner')">Owner</div>
    <div onclick="changeRole(${user.id},'admin')">Admin</div>
    <div onclick="changeRole(${user.id},'user')">User</div>
  </div>
</div>
</td>


<td>
<label style="position:relative;display:inline-block;width:40px;height:20px">
<input type="checkbox" ${user.status==="active"?"checked":""}
onchange="toggleStatus(${user.id})"
style="opacity:0;width:0;height:0">
<span style="
position:absolute;
cursor:pointer;
top:0;left:0;right:0;bottom:0;
background-color:${user.status==="active"?"#22c55e":"#ccc"};
transition:.4s;
border-radius:20px;
"></span>
</label>
</td>

<td>${user.created}</td>

<td>
<div class="action-buttons">
  <button class="icon-btn edit" onclick="openEditUser(${user.id})">
    ✏
  </button>
  <button class="icon-btn delete" onclick="openDeleteUser(${user.id})">
    🗑
  </button>
</div>
</td>


</tr>
`;

});

}

/* ===== ROLE CHANGE ===== */

function changeRole(id,newRole){
const user = usersData.find(u=>u.id===id);
user.role = newRole;
renderUsersModule();
}

/* ===== STATUS TOGGLE ===== */

function toggleStatus(id){
const user = usersData.find(u=>u.id===id);
user.status = user.status==="active"?"inactive":"active";
renderUsersModule();
}

/* ===== CREATE USER ===== */

function openCreateUser(){
showUserModal(`
<h3>Create User</h3>

<div class="form-grid">

<div class="form-group full">
<label>Username</label>
<input id="newUsername" placeholder="Username">
</div>

<div class="form-group full">
<label>Email</label>
<input id="newEmail" placeholder="Email">
</div>

<div class="form-group full">
<label>Role</label>
<select id="newRole">
<option value="user">User</option>
<option value="admin">Admin</option>
<option value="owner">Owner</option>
</select>
</div>

</div>

<button onclick="createUser()" class="btn-primary">
Create User
</button>
`);
}

function createUser(){
const username=document.getElementById("newUsername").value;
const email=document.getElementById("newEmail").value;
const role=document.getElementById("newRole").value;

usersData.push({
id:Date.now(),
username,email,role,status:"active",created:new Date().toISOString().slice(0,10)
});

closeUserModal();
renderUsersModule();
}

/* ===== EDIT USER ===== */

function openEditUser(id){
const user = usersData.find(u=>u.id===id);

showUserModal(`
<h3>Edit User</h3>

<div class="form-grid">

<div class="form-group full">
<label>Username</label>
<input id="editUsername" value="${user.username}">
</div>

<div class="form-group full">
<label>Email</label>
<input id="editEmail" value="${user.email}">
</div>

</div>

<button onclick="saveUser(${id})" class="btn-primary">
Save Changes
</button>
`);
}

function saveUser(id){
const user = usersData.find(u=>u.id===id);
user.username=document.getElementById("editUsername").value;
user.email=document.getElementById("editEmail").value;
closeUserModal();
renderUsersModule();
}

/* ===== DELETE ===== */

function openDeleteUser(id){
showUserModal(`
<h3>Delete User?</h3>
<button onclick="confirmDelete(${id})" class="btn-primary" style="background:var(--card)#ef4444">
Confirm Delete
</button>
`);
}

function confirmDelete(id){
usersData = usersData.filter(u=>u.id!==id);
closeUserModal();
renderUsersModule();
}

/* ===== MODAL SYSTEM ===== */

function showUserModal(content){

document.getElementById("userModalContainer").innerHTML = `
<div class="modal-overlay">
  <div class="modal-box">
    ${content}
    <button class="btn-secondary full-btn" onclick="closeUserModal()">Close</button>
  </div>
</div>
`;

}
function closeUserModal(){
document.getElementById("userModalContainer").innerHTML="";
}

/* ===== MODAL INPUT STYLE ===== */

document.head.insertAdjacentHTML("beforeend",`
`);


function toggleRoleMenu(id){
document.querySelectorAll(".role-menu").forEach(m=>m.style.display="none");
const menu=document.getElementById("roleMenu-"+id);
menu.style.display="block";
}

document.addEventListener("click",function(e){
if(!e.target.closest(".role-wrapper")){
document.querySelectorAll(".role-menu").forEach(m=>m.style.display="none");
}
});

let suppliersList = [];

suppliers = [
{
id:1,
name:"Essence Labs",
contact:"+91 9876543210",
location:"Mumbai",
status:"active",
strength:"High",
notes:"Primary perfume oil supplier"
},
{
id:2,
name:"BottleWorks",
contact:"+91 9123456780",
location:"Delhi",
status:"active",
strength:"Medium",
notes:"Bottle manufacturing partner"
}
];

function loadSuppliers(){

const container = document.getElementById("moduleContent");

container.innerHTML = `
<h2 style="margin-bottom:25px;">Suppliers Management</h2>

<div class="supplier-stats-grid">

  <div class="supplier-stat-card">
    <div class="stat-label">Total Suppliers</div>
    <div class="stat-value">${suppliers.length}</div>
  </div>

  <div class="supplier-stat-card">
    <div class="stat-label">Active</div>
    <div class="stat-value">
      ${suppliers.filter(s=>s.status==="active").length}
    </div>
  </div>

  <div class="supplier-stat-card">
    <div class="stat-label">Inactive</div>
    <div class="stat-value">
      ${suppliers.filter(s=>s.status==="inactive").length}
    </div>
  </div>

  <div class="supplier-stat-card highlight">
    <div class="stat-label">Total Paid</div>
    <div class="stat-value">
      ₹${supplierPayments.reduce((sum,p)=>sum+p.amount,0)}
    </div>
  </div>

</div>

<div style="margin-top:25px;">
  <button class="btn-primary" onclick="openCreateSupplier()">+ Add Supplier</button>
</div>

<div class="supplier-list">
${suppliers.map(s=>`
  <div class="supplier-card">

    <div class="supplier-header">

  <div class="supplier-left">

    <div class="supplier-title">
      ${s.name}
    </div>

    <div class="supplier-details">
      ✆ ${s.contact || "-"} •
      ⚲ ${s.location || "-"} •
      🏷 ${s.itemSupplied || "Not specified"} •
      🔗 ${s.strength || "-"} •
      ${s.status}
    </div>

  </div>

  <div class="supplier-right">

    <div class="supplier-total">
      ₹${getSupplierTotalPaid(s.id)}
    </div>

    <div class="supplier-actions">
      <button onclick="openEditSupplier('${s.id}')" class="icon-btn edit">✏</button>
      <button onclick="deleteSupplier('${s.id}')" class="icon-btn delete">🗑</button>
      <button onclick="toggleSupplier('${s.id}')" class="icon-btn">▼</button>
    </div>

  </div>

</div>

    <div class="supplier-body" id="supplier-body-${s.id}">

      <div class="supplier-payment-form">

        <select id="payType-${s.id}">
          <option value="payment">Payment</option>
        </select>

        <input type="number" placeholder="Amount" id="payAmount-${s.id}">
        <input type="date" id="payDate-${s.id}">
        <input type="text" placeholder="Reason" id="payReason-${s.id}">

        <button class="btn-primary" onclick="addSupplierPayment('${s.id}')">
          Add Payment
        </button>

      </div>

      <div class="supplier-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody id="supplierPayments-${s.id}">
          </tbody>
        </table>
      </div>

    </div>

  </div>
`).join("")}
</div>

<h3 style="margin-top:40px;">Supplier Payment Overview</h3>
<div class="supplier-chart-card">
  <canvas id="supplierPaymentChart"></canvas>
</div>
`;

renderAllSupplierTables();
renderSupplierPaymentChart();
}
function toggleSupplier(id){
  const body = document.getElementById("supplier-body-" + id);
  if(!body) return;
  body.classList.toggle("open");
}


function addSupplierPayment(id){

  const amount = parseFloat(document.getElementById("payAmount-"+id).value);
  const date = document.getElementById("payDate-"+id).value;
  const reason = document.getElementById("payReason-"+id).value;

  if(!amount || !date){
    alert("Enter amount and date");
    return;
  }

  supplierPayments.push({
    id: Date.now(),
    supplierId: id,
    amount,
    date: new Date(date),
    reason
  });

  loadSuppliers();
}

function renderAllSupplierTables(){

  suppliers.forEach(s=>{

    const tbody = document.getElementById("supplierPayments-"+s.id);
    if(!tbody) return;

    const data = supplierPayments.filter(p=>p.supplierId==s.id);

    tbody.innerHTML="";

    data.forEach(p=>{
      tbody.innerHTML+=`
        <tr>
          <td>${p.date.toLocaleDateString()}</td>
          <td>₹${p.amount}</td>
          <td>${p.reason || "-"}</td>
        </tr>
      `;
    });

  });
}

function getSupplierTotalPaid(id){
  return supplierPayments
    .filter(p=>p.supplierId==id)
    .reduce((sum,p)=>sum+p.amount,0);
}

function renderSupplierPaymentChart(){

  const canvas = document.getElementById("supplierPaymentChart");
  if(!canvas) return;

  if(supplierPaymentChartInstance){
    supplierPaymentChartInstance.destroy();
  }

  const labels = suppliers.map(s=>s.name);
  const data = suppliers.map(s=>getSupplierTotalPaid(s.id));

  supplierPaymentChartInstance = new Chart(canvas,{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"Total Paid",
        data,
        backgroundColor:"#6366f1"
      }]
    },
    options:{
      responsive:true,
      plugins:{
        legend:{display:false}
      }
    }
  });
}

function renderSuppliersTable(){

const tbody=document.getElementById("suppliersTable");
tbody.innerHTML="";

suppliers.forEach(s=>{

tbody.innerHTML+=`
<tr>
<td><strong>${s.name}</strong></td>
<td>${s.contact}</td>
<td>${s.location}</td>
<td>
<span class="status-badge ${s.status}">
${s.status}
</span>
</td>
<td>
<span class="strength-badge ${s.strength.toLowerCase()}">
${s.strength}
</span>
</td>
<td>
<div class="action-buttons">
<button class="icon-btn edit" onclick="openEditSupplier('${s.id}')">✏</button>
<button class="icon-btn delete" onclick="deleteSupplier(${s.id})">🗑</button>
</div>
</td>
</tr>
`;

});
}
function openCreateSupplier(){
openModal(`
<h3>Add Supplier</h3>

<div class="form-grid">

<div class="form-group full">
<label>Supplier Name</label>
<input id="sName">
</div>

<div class="form-group full">
<label>Item Supplied</label>
<input id="sItem">
</div>

<div class="form-group full">
<label>Contact</label>
<input id="sContact">
</div>

<div class="form-group full">
<label>Location</label>
<input id="sLocation">
</div>

<div class="form-group">
<label>Status</label>
<select id="sStatus">
<option value="active">Active</option>
<option value="inactive">Inactive</option>
</select>
</div>

<div class="form-group">
<label>Relationship</label>
<select id="sStrength">
<option value="High">High</option>
<option value="Medium">Medium</option>
<option value="Low">Low</option>
</select>
</div>

<div class="form-group full">
<label>Notes</label>
<textarea id="sNotes"></textarea>
</div>

</div>

<button class="btn-primary" onclick="createSupplier()">
Create Supplier
</button>
`);
}

function createSupplier(){

suppliers.push({
id:Date.now(),
name:document.getElementById("sName").value,
itemSupplied: document.getElementById("sItem").value,
contact:document.getElementById("sContact").value,
location:document.getElementById("sLocation").value,
status:document.getElementById("sStatus").value,
strength:document.getElementById("sStrength").value,
notes:document.getElementById("sNotes").value
});

closeModal();
loadSuppliers();
}

function openEditSupplier(id){

  const supplier = suppliers.find(s => String(s.id) === String(id));
  if(!supplier) return;

  openModal(`
    <h3>Edit Supplier</h3>

    <div class="form-grid">

      <div class="form-group full">
        <label>Supplier Name</label>
        <input id="editSupplierName" value="${supplier.name}">
      </div>

        <div class="form-group full">
        <label>Item Supplied</label>
        <input id="editSupplierItem" value="${supplier.itemSupplied || ''}">
        </div>      

      <div class="form-group full">
        <label>Contact</label>
        <input id="editSupplierContact" value="${supplier.contact}">
      </div>

      <div class="form-group full">
        <label>Location</label>
        <input id="editSupplierLocation" value="${supplier.location}">
      </div>

      <div class="form-group">
        <label>Status</label>
        <select id="editSupplierStatus">
          <option value="active" ${supplier.status === 'active' ? 'selected' : ''}>Active</option>
          <option value="inactive" ${supplier.status === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>

      <div class="form-group">
        <label>Relationship</label>
        <select id="editSupplierStrength">
          <option value="High" ${supplier.strength === 'High' ? 'selected' : ''}>High</option>
          <option value="Medium" ${supplier.strength === 'Medium' ? 'selected' : ''}>Medium</option>
          <option value="Low" ${supplier.strength === 'Low' ? 'selected' : ''}>Low</option>
        </select>
      </div>

      <div class="form-group full">
        <label>Notes</label>
        <textarea id="editSupplierNotes">${supplier.notes || ''}</textarea>
      </div>

    </div>

    <button class="btn-primary" onclick="saveEditedSupplier('${supplier.id}')">
      Update Supplier
    </button>
  `);
}



function saveEditedSupplier(id){

const supplier = suppliers.find(s=>String(s.id)===String(id));
if(!supplier) return;

supplier.name = document.getElementById("editSupplierName").value;
supplier.itemSupplied = document.getElementById("editSupplierItem").value;
supplier.contact = document.getElementById("editSupplierContact").value;
supplier.location = document.getElementById("editSupplierLocation").value;
supplier.status = document.getElementById("editSupplierStatus").value;
supplier.strength = document.getElementById("editSupplierStrength").value;
supplier.notes = document.getElementById("editSupplierNotes").value;

closeModal();
loadSuppliers();
}
function deleteSupplier(id){

  openUltraDelete(
    "Delete Supplier",
    "This supplier and all related payments will be permanently deleted.",
    function(){

      suppliers = suppliers.filter(s=>s.id != id);
      supplierPayments = supplierPayments.filter(p=>p.supplierId != id);

      loadSuppliers();
    }
  );
}



function updateSupplier(id){

let s=suppliers.find(x=>x.id===id);

s.name=document.getElementById("eName").value;
s.contact=document.getElementById("eContact").value;
s.location=document.getElementById("eLocation").value;
s.status=document.getElementById("eStatus").value;
s.strength=document.getElementById("eStrength").value;
s.notes=document.getElementById("eNotes").value;

closeModal();
loadSuppliers();
}
/* ================================
   GLOBAL MODAL SYSTEM
================================ */

function openModal(contentHTML){

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-close" onclick="closeModal()">✕</div>
      ${contentHTML}
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeModal(){
  const overlay = document.querySelector(".modal-overlay");
  if(overlay){
    overlay.remove();
  }
}
let inventoryList = [
  {
    id:1,
    name:"Colossus 100ml",
    sku:"COL-100",
    category:"Perfume",
    supplier:"Dubai Supplier",
    qty:120,
    cost:900,
    sell:1499,
    status:"Active"
  },
  {
    id:2,
    name:"Aether 50ml",
    sku:"AET-50",
    category:"Perfume",
    supplier:"Local Vendor",
    qty:25,
    cost:700,
    sell:1199,
    status:"Active"
  }
];
function loadInventory(){

const container=document.getElementById("moduleContent");

/* ===== CORRECT CALCULATIONS ===== */

let totalStock = inventoryList.reduce((sum,i)=>sum+i.qty,0);

let totalInventoryValue = inventoryList.reduce((sum,i)=>{
return sum+(i.sell*i.qty);
},0);

let totalProfitValue = inventoryList.reduce((sum,i)=>{
return sum+((i.sell-i.cost)*i.qty);
},0);

/* ===== UI ===== */

container.innerHTML=`

<h2 style="margin-bottom:25px;">Inventory Management</h2>

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;flex-wrap:wrap;gap:20px;">

<div style="display:flex;gap:25px;flex-wrap:wrap;">

<div class="inv-stat">
<h4>Total Products</h4>
<h2>${inventoryList.length}</h2>
</div>

<div class="inv-stat">
<h4>Total Stock</h4>
<h2>${totalStock}</h2>
</div>

<div class="inv-stat">
<h4>Inventory Value (Sell)</h4>
<h2>₹${totalInventoryValue.toLocaleString()}</h2>
</div>

<div class="inv-stat">
<h4>Total Profit Value</h4>
<h2 style="color:#22c55e;">₹${totalProfitValue.toLocaleString()}</h2>
</div>

</div>

<button class="add-product-btn" onclick="openCreateProduct()">+ Add Product</button>

</div>

<div class="inventory-grid">

${inventoryList.map(p=>{

let margin=((p.sell-p.cost)/p.cost)*100;
let stockColor=p.qty<20?"#ef4444":p.qty<50?"#f59e0b":"#22c55e";
let profitPerUnit = p.sell - p.cost;

return `

<div class="inventory-card">

<div class="inventory-top">
<h3>${p.name}</h3>
<span class="badge">${p.category}</span>
</div>

<div class="inventory-mid">

<div>
<small>Stock</small>
<div style="color:${stockColor};font-weight:600">${p.qty} units</div>
</div>

<div>
<small>Cost</small>
<div>₹${p.cost}</div>
</div>

<div>
<small>Sell</small>
<div>₹${p.sell}</div>
</div>

<div>
<small>Margin</small>
<div style="color:${margin>0?"#22c55e":"#ef4444"}">
${margin.toFixed(1)}%
</div>
</div>

<div>
<small>Profit / Unit</small>
<div style="color:#22c55e;font-weight:600">
₹${profitPerUnit}
</div>
</div>

</div>

<div class="inventory-actions">
<button class="edit-btn" onclick="openEditProduct(${p.id})">Edit</button>
<button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
</div>

</div>

`;

}).join("")}

</div>
`;
}


function openCreateProduct(){

openModal(`
<h2 style="margin-bottom:25px;">Create New Product</h2>

<div class="form-grid">

<div class="form-group">
<label>Product Name</label>
<input id="newName" placeholder="Colossus 100ml">
</div>

<div class="form-group">
<label>Category</label>
<input id="newCategory" placeholder="Perfume">
</div>

<div class="form-group">
<label>SKU</label>
<input id="newSku" placeholder="COL-100">
</div>

<div class="form-group">
<label>Supplier</label>
<input id="newSupplier" placeholder="Dubai Supplier">
</div>

<div class="form-group">
<label>Quantity</label>
<input type="number" id="newQty" placeholder="100">
</div>

<div class="form-group">
<label>Cost Price</label>
<input type="number" id="newCost" placeholder="900">
</div>

<div class="form-group full">
<label>Selling Price</label>
<input type="number" id="newSell" placeholder="1499">
</div>

</div>

<button class="btn-primary" style="margin-top:25px;width:100%;" onclick="createProduct()">
Create Product
</button>

`);

}

function createProduct(){

const newProduct={
id:Date.now(),
name:document.getElementById("newName").value,
sku:document.getElementById("newSku").value,
category:document.getElementById("newCategory").value,
supplier:document.getElementById("newSupplier").value,
qty:Number(document.getElementById("newQty").value),
cost:Number(document.getElementById("newCost").value),
sell:Number(document.getElementById("newSell").value),
status:"Active"
};

inventoryList.push(newProduct);

closeModal();
loadInventory();
}
function openEditProduct(id){

const p = inventoryList.find(x=>x.id===id);

openModal(`

<h2 style="margin-bottom:25px;">Edit Product</h2>

<div class="form-grid">

<div class="form-group">
<label>Product Name</label>
<input id="editName" value="${p.name}">
</div>

<div class="form-group">
<label>Category</label>
<input id="editCategory" value="${p.category}">
</div>

<div class="form-group">
<label>SKU</label>
<input id="editSku" value="${p.sku}">
</div>

<div class="form-group">
<label>Supplier</label>
<input id="editSupplier" value="${p.supplier}">
</div>

<div class="form-group">
<label>Quantity</label>
<input type="number" id="editQty" value="${p.qty}">
</div>

<div class="form-group">
<label>Cost Price</label>
<input type="number" id="editCost" value="${p.cost}">
</div>

<div class="form-group full">
<label>Selling Price</label>
<input type="number" id="editSell" value="${p.sell}">
</div>

</div>

<button class="btn-primary" style="margin-top:25px;width:100%;" onclick="saveProduct(${id})">
Save Changes
</button>

`);

}


function saveProduct(id){

const p = inventoryList.find(i=>i.id===id);

p.name=document.getElementById("editName").value;
p.qty=Number(document.getElementById("editQty").value);
p.cost=Number(document.getElementById("editCost").value);
p.sell=Number(document.getElementById("editSell").value);

closeModal();
loadInventory();
}

function deleteProduct(id){

  openUltraDelete(
    "Delete Product",
    "This product will be permanently removed from inventory.",
    function(){

      inventoryList = inventoryList.filter(p => p.id != id);
      loadInventory();

    }
  );
}



let scheduleData = {};

function loadSchedule(){

const container = document.getElementById("moduleContent");

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();

const monthName = today.toLocaleString('default', { month: 'long' });

const daysInMonth = new Date(year, month + 1, 0).getDate();

container.innerHTML = `
<div style="margin-bottom:25px;">
  <div style="font-size:14px;border:1px solid var(--border);margin-bottom:6px;">
    Schedule
  </div>
  <div style="font-size:26px;font-weight:600;">
    ${monthName} ${year}
  </div>
</div>


<div id="todayBox" style="
margin-bottom:30px;
background:var(--card)#ffffff;
padding:20px 25px;
border-radius:16px;
box-shadow:0 8px 25px rgba(0,0,0,0.04);
border:1px solid var(--border);
">
  <div style="font-size:14px;border:1px solid var(--border);margin-bottom:6px;">
    Today
  </div>
  <div style="font-size:18px;font-weight:600;margin-bottom:12px;">
    Today's Tasks
  </div>
  <div id="todayTasks"></div>
</div>


<div class="calendar-grid" id="calendarGrid"></div>
`;

const grid = document.getElementById("calendarGrid");

for(let day=1; day<=daysInMonth; day++){

  const dateKey = `${year}-${month+1}-${day}`;
  const isToday = day === today.getDate();

  const tasks = scheduleData[dateKey] || [];

  const div = document.createElement("div");
  div.className = "calendar-day";
  if(isToday) div.classList.add("today-highlight");

  div.innerHTML = `
    <div class="calendar-date">${day}</div>

    <div class="calendar-tasks">
      ${tasks.map((task,index)=>`

<div class="task-item ${task.completed ? 'completed':''}"
     onclick="toggleTask('${dateKey}',${index})">

  <input type="checkbox"
    ${task.completed ? 'checked':''}
    onclick="event.stopPropagation(); toggleTask('${dateKey}',${index});">

  <span>${task.text}</span>

</div>


      `).join("")}
    </div>

    <button class="mini-btn"
      onclick="openScheduleModal('${dateKey}')">+</button>
  `;

  grid.appendChild(div);
}

renderTodayTasks();
}
function toggleTask(dateKey,index){

  if(!scheduleData[dateKey]) return;

  scheduleData[dateKey][index].completed =
    !scheduleData[dateKey][index].completed;

  loadSchedule();
}

function addTask(dateKey,text){

  if(!scheduleData[dateKey]){
    scheduleData[dateKey] = [];
  }

  scheduleData[dateKey].push({
    text:text,
    completed:false
  });

  loadSchedule();
}


function getTasksForDay(dateKey){

  const tasks = scheduleData[dateKey] || [];

  return tasks.map((task,index)=>`
    <div class="task-item ${task.completed ? 'completed':''}">
      <input type="checkbox"
        ${task.completed ? 'checked':''}
        onchange="toggleTask('${dateKey}',${index})"
        style="margin-right:6px;">
      ${task.text}
    </div>
  `).join("");
}

function toggleTask(dateKey,index){

  if(!scheduleData[dateKey]) return;

  scheduleData[dateKey][index].completed =
    !scheduleData[dateKey][index].completed;

  loadSchedule();
}

function addTask(dateKey,text){

  if(!scheduleData[dateKey]){
    scheduleData[dateKey] = [];
  }

  scheduleData[dateKey].push({
    text,
    completed:false
  });

  loadSchedule();
}


function openScheduleModal(dateKey){

const existing = scheduleData[dateKey] || [];

/* Convert objects to plain text for textarea */
const textValue = existing.map(t => t.text).join("\n");

openModal(`
<h3>Tasks for ${dateKey}</h3>

<textarea id="scheduleInput" style="height:120px;">
${textValue}
</textarea>

<button class="btn-primary" onclick="saveSchedule('${dateKey}')">
Save Tasks
</button>
`);
}


function saveSchedule(dateKey){

  const value = document.getElementById("scheduleInput").value.trim();

  if(!value){
    scheduleData[dateKey] = [];
    closeModal();
    loadSchedule();
    return;
  }

  const lines = value.split("\n").filter(l => l.trim() !== "");

  /* Preserve completion state if text didn't change */
  const oldTasks = scheduleData[dateKey] || [];

  scheduleData[dateKey] = lines.map(line => {

    const existingTask = oldTasks.find(t => t.text === line);

    return {
      text: line,
      completed: existingTask ? existingTask.completed : false
    };

  });

  closeModal();
  loadSchedule();
}


function renderTodayTasks(){

  const today = new Date();
  const dateKey =
    today.getFullYear() + "-" +
    (today.getMonth()+1) + "-" +
    today.getDate();

  const tasks = scheduleData[dateKey] || [];
  const container = document.getElementById("todayTasks");

  if(tasks.length === 0){
    container.innerHTML = "No tasks for today";
    return;
  }

container.innerHTML = tasks.map(t=>`
  <div style="
    display:flex;
    align-items:center;
    gap:8px;
    padding:8px 0;
    font-size:14px;
  ">
    <span style="font-size:16px;">
      ${t.completed ? "✔" : "○"}
    </span>
    <span style="${t.completed ? "text-decoration:line-through;opacity:.6;" : ""}">
      ${t.text}
    </span>
  </div>
`).join("");
}


/* =========================
   NOTES SYSTEM (CLEAN)
========================= */

let notes = [];

function loadNotes(){

const container = document.getElementById("moduleContent");

container.innerHTML = `
<div style="margin-bottom:30px;">
  <div style="font-size:14px;border:1px solid var(--border);margin-bottom:6px;">
    Notes
  </div>
  <div style="font-size:26px;font-weight:600;">
    All Notes
  </div>
</div>

<button class="btn-primary"
  style="margin-bottom:25px;"
  onclick="createNewNote()">
  + New Note
</button>

<div class="notes-grid">
${notes.map(note=>`

  <div class="note-card"
       onclick="openNote('${note.id}')">

    <div class="note-title">
      ${note.title || "Untitled Note"}
    </div>

    <div class="note-preview">
      ${stripHtml(note.content).slice(0,120)}...
    </div>

    <div class="note-meta">
      Created: ${formatDate(note.createdAt)}<br>
      Edited: ${formatDate(note.updatedAt)}
    </div>

  </div>

`).join("")}
</div>
`;
}

function createNewNote(){

const newNote = {
  id: Date.now(),
  title: "Untitled Note",
  content: "",
  createdAt: new Date(),
  updatedAt: new Date()
};

notes.unshift(newNote);
openNote(newNote.id);
}

function openNote(id){

const note = notes.find(n=>n.id==id);
if(!note) return;

const container = document.getElementById("moduleContent");

container.innerHTML = `
<div style="margin-bottom:20px;">
  <button onclick="loadNotes()" class="btn-secondary">
    ← Back to Notes
  </button>
</div>

<div style="margin-bottom:15px;">
  <input id="noteTitle"
         value="${note.title}"
         style="
           width:100%;
           font-size:28px;
           font-weight:600;
           border:none;
           outline:none;
           background:transparent;
         ">
</div>

<div class="editor-toolbar">

  <button data-format="bold"
    onclick="formatText('bold')"><b>B</b></button>

  <button data-format="italic"
    onclick="formatText('italic')"><i>I</i></button>

  <button data-format="underline"
    onclick="formatText('underline')"><u>U</u></button>

  <button data-format="strike"
    onclick="formatText('strikeThrough')">S</button>

  <button onclick="formatText('insertUnorderedList')">• List</button>

  <button onclick="formatText('insertOrderedList')">1. List</button>

  <button onclick="formatText('formatBlock','h1')">H1</button>

  <button onclick="formatText('formatBlock','h2')">H2</button>

  <button onclick="formatText('justifyLeft')">Left</button>

  <button onclick="formatText('justifyCenter')">Center</button>

  <button onclick="formatText('justifyRight')">Right</button>

  <button onclick="formatText('removeFormat')">Clear</button>

</div>

<div id="noteEditor"
     contenteditable="true"
     class="note-editor">
  ${note.content}
</div>

<div style="margin-top:20px;display:flex;gap:10px;">
  <button class="btn-primary"
    onclick="saveNote('${note.id}')">
    Save Note
  </button>

<button class="btn-danger"
  style="min-width:120px;"
onclick="openUltraDelete(
  'Delete Note',
  'Your note will be permanently deleted. This action cannot be undone.',
  function(){
    notes = notes.filter(n=>n.id!='${note.id}');
    loadNotes();
  }
)"> Delete Note
</button>

</div>

<div style="margin-top:15px;font-size:12px;border:1px solid var(--border);">
  Created: ${formatDate(note.createdAt)} |
  Last Edited: ${formatDate(note.updatedAt)}
</div>
`;
}

function saveNote(id){

const note = notes.find(n=>n.id==id);
if(!note) return;

note.title = document.getElementById("noteTitle").value;
note.content = document.getElementById("noteEditor").innerHTML;
note.updatedAt = new Date();

loadNotes();
}

function deleteNote(id){

openModal(`
<div class="delete-modal-square">

  <div class="delete-icon">
    ⚠
  </div>

  <div class="delete-heading">
    Delete Note
  </div>

  <div class="delete-subtext">
    Your note will be permanently deleted.
    This action cannot be undone.
  </div>

  <div class="delete-buttons">
    <button class="btn-cancel"
      onclick="closeModal()">
      Cancel
    </button>

    <button class="btn-delete"
      onclick="confirmDelete('${id}')">
      Delete
    </button>
  </div>

</div>
`);
}

function confirmDelete(id){
  notes = notes.filter(n=>n.id!=id);
  closeModal();
  loadNotes();
}

function updateToolbarState() {

  const buttons = document.querySelectorAll(".editor-toolbar button");

  buttons.forEach(btn => btn.classList.remove("active"));

  if (document.queryCommandState("bold"))
    document.querySelector("[data-format='bold']")?.classList.add("active");

  if (document.queryCommandState("italic"))
    document.querySelector("[data-format='italic']")?.classList.add("active");

  if (document.queryCommandState("underline"))
    document.querySelector("[data-format='underline']")?.classList.add("active");

  if (document.queryCommandState("strikeThrough"))
    document.querySelector("[data-format='strike']")?.classList.add("active");
}

let activeFormats = {
  bold:false,
  italic:false
};

function formatText(command, value = null) {

  const editor = document.getElementById("noteEditor");

  // Always focus editor first
  editor.focus();

  // Small delay ensures selection is active
  setTimeout(() => {
    document.execCommand(command, false, value);
    updateToolbarState();
  }, 0);
}
function toggleToolbarButton(type,isActive){
  const btn = document.querySelector(`[data-format="${type}"]`);
  if(!btn) return;
  btn.classList.toggle("active",isActive);
}


function formatDate(date){
  if(!date) return "-";
  return new Date(date).toLocaleString();
}

function stripHtml(html){
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.innerText;
}

let ultraDeleteCallback = null;

function openUltraDelete(title, message, onConfirm){

  const overlay = document.getElementById("ultraDeleteOverlay");
  const confirmBtn = document.getElementById("ultraConfirmDeleteBtn");

  document.querySelector(".ultra-delete-title").innerText = title;
  document.querySelector(".ultra-delete-text").innerText = message;

  ultraDeleteCallback = onConfirm;

  confirmBtn.onclick = function(){
    if(typeof ultraDeleteCallback === "function"){
      ultraDeleteCallback();
    }
    closeUltraDelete();
  };

  overlay.classList.add("active");
}

function closeUltraDelete(){
  document.getElementById("ultraDeleteOverlay")
    .classList.remove("active");
}


// ---------------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------- //


// -------------              S   E  T    T   I  N  G  S                                 ---------------- //


// ---------------------------------------------------------------------------------------------------- //
// ---------------------------------------------------------------------------------------------------- //


let settings = {
  companyName: "RYVEN",
  theme: "light",
  accent: "#3b82f6",
  fontScale: 1,
  compactMode: false,
  animations: true,
  cardStyle: "elevated",
  sidebarCollapsed: false
};
function loadSettings(){

const container = document.getElementById("moduleContent");

container.innerHTML = `
<h2 style="margin-bottom:30px;">Appearance Settings</h2>

<div class="settings-card">

  <label>Color Mode</label>
  <select id="themeSelect">
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="blue">Blue Dashboard</option>
  </select>

  <label>Accent Color</label>
  <input type="color" id="accentInput" value="${settings.accent}">

  <label>Font Scale</label>
  <input type="range" min="0.9" max="1.2" step="0.05"
    id="fontScaleInput" value="${settings.fontScale}">

  <div class="toggle-setting">
    <label>Compact Mode</label>
    <input type="checkbox" id="compactToggle"
      ${settings.compactMode ? "checked":""}>
  </div>

  <div class="toggle-setting">
    <label>Enable Animations</label>
    <input type="checkbox" id="animationToggle"
      ${settings.animations ? "checked":""}>
  </div>

  <div class="toggle-setting">
    <label>Flat Cards</label>
    <input type="checkbox" id="cardStyleToggle"
      ${settings.cardStyle === "flat" ? "checked":""}>
  </div>

  <button class="btn-primary"
    onclick="saveSettings()">
    Save Settings
  </button>

</div>
`;

document.getElementById("themeSelect").value = settings.theme;
}
function applySettings(){

/* FONT SCALE */
document.documentElement.style.fontSize =
  settings.fontScale + "rem";

/* ACCENT */
document.documentElement.style.setProperty(
  "--accent", settings.accent);

/* THEME */
document.body.setAttribute("data-theme", settings.theme);

/* COMPACT MODE */
document.body.classList.toggle(
  "compact-mode", settings.compactMode);

/* ANIMATIONS */
document.body.classList.toggle(
  "no-animations", !settings.animations);

/* CARD STYLE */
document.body.classList.toggle(
  "flat-cards", settings.cardStyle === "flat");

}
function saveSettings(){

settings.theme =
  document.getElementById("themeSelect").value;

settings.accent =
  document.getElementById("accentInput").value;

settings.fontScale =
  document.getElementById("fontScaleInput").value;

settings.compactMode =
  document.getElementById("compactToggle").checked;

settings.animations =
  document.getElementById("animationToggle").checked;

settings.cardStyle =
  document.getElementById("cardStyleToggle").checked
  ? "flat"
  : "elevated";

applySettings();
}

/* LOGOUT FROM ADMIN PANEL */

function logoutUser() {
  fetch("/logout", {
    method: "POST",
    credentials: "include"
  })
  .then(() => {
    window.location.href = "/login.html";
  });
}


/* DONE ABOVE ^^ */

document.addEventListener("DOMContentLoaded", () => {
  fetchFinanceEntries();
});

/* bhang bhosda */
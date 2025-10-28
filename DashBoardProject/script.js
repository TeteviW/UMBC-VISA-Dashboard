/***** MODE SWITCH *****/
// Auto-detect hosting environment so the same code works locally and on GitHub Pages.
// - If you visit the site on localhost (127.0.0.1 or localhost) we assume an API is available.
// - Otherwise we default to the dummy dataset so the static site works on GitHub Pages.
const QUERY = new URLSearchParams(window.location.search);
const FETCH_MODE = (function(){
  const q = QUERY.get('mode'); if(q === 'api' || q === 'dummy') return q;
  const host = location.hostname;
  if(host === '127.0.0.1' || host === 'localhost') return 'api';
  return 'dummy';
})();

// API base: used only when FETCH_MODE === 'api'. Adjust to your deployed API URL if needed.
const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
  ? 'http://127.0.0.1:8000'
  : 'https://your-api.example.com';


/***** DUMMY DATA *****/
const DUMMY = [
  { givenName:"Ana",   familyName:"Khan",  visaType:"H-1B", startDate:"2024-08-01", endDate:"2027-08-01", department:"CSEE",   gender:"F" },
  { givenName:"Ben",   familyName:"Li",    visaType:"J-1",  startDate:"2025-01-10", endDate:"2026-01-10", department:"Math",   gender:"M" },
  { givenName:"Chidi", familyName:"Okoye", visaType:"F-1",  startDate:"2023-09-01", endDate:"2026-05-25", department:"CS",     gender:"M" },
  { givenName:"Dina",  familyName:"Roy",   visaType:"H-1B", startDate:"2022-11-03", endDate:"2025-11-03", department:"Biology",gender:"F" }
];


/***** STATE *****/
const cols = ["givenName","familyName","visaType","startDate","endDate","department"];
let allRows = [];
let viewRows = [];
let page=1, per=25;
let sortCol=null, sortAsc=true;


/***** VIEW SWITCHING *****/
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const view = btn.dataset.view;
    document.getElementById("viewTitle").textContent = view.charAt(0).toUpperCase()+view.slice(1);
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    document.getElementById(`view-${view}`).classList.add("active");
  });
});


/***** DATA LOADERS *****/
async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}


async function loadData(){
  if(FETCH_MODE === "dummy"){
    allRows = DUMMY.slice();
    return;
  }
  // API mode (FastAPI /api/records) - try, but fall back to dummy so Pages still works.
  try{
    const data = await fetchJSON(`${API_BASE}/api/records?limit=2000`);
    // expect { rows: [...] } or an array directly
    allRows = Array.isArray(data) ? data : (data.rows || []);
  }catch(err){
    console.warn('Failed to load API data, falling back to dummy dataset:', err);
    allRows = DUMMY.slice();
  }
}


/***** CARDS *****/
function loadCards(){
  const today = new Date(); 
  today.setHours(0,0,0,0);
  
  const in90 = new Date(today); 
  in90.setDate(today.getDate()+90);


  const total = allRows.length;
  const active = allRows.filter(r => new Date(r.endDate) >= today).length;
  const expSoon = allRows.filter(r => {
    const d = new Date(r.endDate);
    return d >= today && d <= in90;
  }).length;
  const newH1B = allRows.filter(r => r.visaType === 'H-1B' && new Date(r.startDate).getFullYear() >= new Date().getFullYear()).length;


  setText("totalCases", total);
  setText("activeCases", active);
  setText("expiringSoon", expSoon);
  setText("newH1B", newH1B);
}


/***** FILTERS *****/
function setupFilters(){
  // Populate Dept dropdown
  const depts = [...new Set(allRows.map(r=>r.department).filter(Boolean))].sort();
  setHTML("deptFilter", ['<option value="">All Depts</option>', ...depts.map(d=>`<option>${d}</option>`)].join(''));


  const deb = (fn,ms=300)=>{ let t; return (...a)=>{clearTimeout(t); t=setTimeout(()=>fn(...a),ms);} };
  qs("#q").addEventListener("input", deb(applyFilters));
  qs("#visaFilter").addEventListener("change", applyFilters);
  qs("#deptFilter").addEventListener("change", applyFilters);


  applyFilters();
}
function applyFilters(){
  const q = qs("#q").value.toLowerCase().trim();
  const visa = qs("#visaFilter").value;
  const dept = qs("#deptFilter").value;


  let rows = allRows.slice();
  if(q) rows = rows.filter(r => `${r.givenName} ${r.familyName}`.toLowerCase().includes(q));
  if(visa) rows = rows.filter(r => r.visaType === visa);
  if(dept) rows = rows.filter(r => r.department === dept);


  page = 1;
  renderTable(rows);
}


/***** TABLE & PAGINATION *****/
const dateCols = new Set(["startDate","endDate"]);

function renderTable(rows){
  viewRows = rows;
  if(sortCol){
    viewRows.sort((a,b)=>{
      const av = a[sortCol], bv = b[sortCol];
      if (dateCols.has(sortCol)){
        const ax = av ? new Date(av).getTime() : 0;
        const bx = bv ? new Date(bv).getTime() : 0;
        return sortAsc ? ax - bx : bx - ax;
      }else{
        const x = (av ?? "") + ""; 
        const y = (bv ?? "") + "";
        return sortAsc ? x.localeCompare(y) : y.localeCompare(x);
      }
    });
  }
  const start=(page-1)*per, end=start+per, slice=viewRows.slice(start,end);


  // header
  setHTML("theadRow", cols.map(c=>`<th data-col="${c}" class="sort">${c}</th>`).join(""));


  // body
  const bodyHTML = slice.map(r=>`<tr>${cols.map(c=>`<td>${r[c]??""}</td>`).join("")}</tr>`).join("");
  qs("#dataTable tbody").innerHTML = bodyHTML;


  // pager
  const totalPages = Math.max(1, Math.ceil(viewRows.length/per));
  setText("pageInfo", `Page ${page} / ${totalPages}`);
  qs("#prevBtn").disabled = page<=1;
  qs("#nextBtn").disabled = page>=totalPages;


  // sort handlers
  qsa('th.sort').forEach(th=>{
    th.onclick = ()=>{
      const col = th.dataset.col;
      sortAsc = (sortCol===col) ? !sortAsc : true;
      sortCol = col; page=1; renderTable(viewRows);
    };
  });
}


qs("#prevBtn").onclick = ()=>{ if(page>1){ page--; renderTable(viewRows); } };
qs("#nextBtn").onclick = ()=>{
  const totalPages = Math.max(1, Math.ceil(viewRows.length/per));
  if(page<totalPages){ page++; renderTable(viewRows); }
};


/***** REPORTS (demo) *****/
qs("#genderBtn").addEventListener("click", async ()=>{
  if(FETCH_MODE === "dummy"){
    const counts = countBy(allRows, r=>r.gender||"Unknown");
    qs("#genderReport").textContent = Object.entries(counts).map(([k,v])=>`${k}: ${v}`).join(" | ");
  }else{
    const rep = await fetchJSON(`${API_BASE}/api/reports/gender`);
    const pairs = rep.labels.map((lab,i)=>`${lab}: ${rep.counts[i]}`);
    qs("#genderReport").textContent = pairs.join(" | ");
  }
});


/***** HELPERS *****/
function qs(s){ return document.querySelector(s); }
function qsa(s){ return [...document.querySelectorAll(s)]; }
function setText(id, v){ const el=document.getElementById(id); if(el) el.textContent=v; }
function setHTML(id, v){ const el=document.getElementById(id); if(el) el.innerHTML=v; }
function countBy(arr, fn){ return arr.reduce((m, x)=>{ const k=fn(x); m[k]=(m[k]||0)+1; return m; },{}); }


/***** BOOT *****/
(async function boot(){
  await loadData();
  loadCards();
  setupFilters();
})();

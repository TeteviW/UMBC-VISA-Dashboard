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
  { givenName:"Ana",   familyName:"Khan",  visaType:"H-1B", startDate:"2024-08-01", endDate:"2027-08-01", department:"CSEE",   gender:"Female" },
  { givenName:"Ben",   familyName:"Li",    visaType:"J-1",  startDate:"2025-01-10", endDate:"2026-01-10", department:"Math",   gender:"Male" },
  { givenName:"Chidi", familyName:"Okoye", visaType:"F-1",  startDate:"2023-09-01", endDate:"2026-05-25", department:"CS",     gender:"Male" },
  { givenName:"Dina",  familyName:"Roy",   visaType:"H-1B", startDate:"2022-11-03", endDate:"2025-11-03", department:"Biology",gender:"Female" }
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


  let rows = allRows.filter(isActive);
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
  const bodyHTML = slice.map(r => {
    const cells = cols.map(c => {
      let val = r[c] ?? "";
      if (dateCols.has(c) && val){
        val = formatDateDisplay(val);
      }
      return `<td>${val}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
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

function renderArchiveTable(){
  const archived = allRows.filter(isArchived);

  const head = qs("#archiveHead");
  const body = qs("#archiveBody");
  if(!head || !body) return;

  //Same columns as main table
  head.innerHTML = cols.map(c=>`<th>${c}</th>`).join("");

  const rowsHTML = archived.map(r => {
    const cells = cols.map(c => {
      let val = r[c] ?? "";
      if (dateCols.has(c) && val){
        val = formatDateDisplay(val);
      }
      return `<td>${val}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  body.innerHTML = rowsHTML;
}


qs("#prevBtn").onclick = ()=>{ if(page>1){ page--; renderTable(viewRows); } };
qs("#nextBtn").onclick = ()=>{
  const totalPages = Math.max(1, Math.ceil(viewRows.length/per));
  if(page<totalPages){ page++; renderTable(viewRows); }
};


/***** REPORTS (demo) *****/
/*
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
*/

/***** REPORTS *****/

// Helper: parse a date string safely
function parseDate(value){
  if(!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Helper: format number of days
function daysToYears(days){
  if(!days || days <= 0) return "0.0";
  const years = days / 365;
  return years.toFixed(1);
}

// Helper: format a date value as MM/DD/YYYY for display
function formatDateDisplay(value){
  if(!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if(isNaN(d.getTime())) return value;
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()+0).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

//A record is archived if its endDate has passed.
function isArchived(r){
  const end = parseDate(r.endDate);
  if(!end) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  return end < today;
}

function isActive(r){
  return !isArchived(r);
}
// Render summary + table in the Reports tab
function setReportTable(columns, rows){
  // header
  setHTML("reportHead", columns.map(c=>`<th>${c}</th>`).join(""));

  // body
  const bodyHTML = rows.map(r=>{
   // r can be an array of cell values
   return `<tr>${r.map(cell=>`<td>${cell ?? ""}</td>`).join("")}</tr>`;
  }).join("");
  setHTML("reportBody", bodyHTML);
}


// Main dispatcher for reports
function runReport(){
  if(!allRows || allRows.length === 0){
    setHTML("reportSummary", "No data available.");
    setHTML("reportHead", "");
    setHTML("reportBody", "");
    return;
  }

  const type = qs("#reportType").value;
  const startVal = qs("#reportStart").value;
  const endVal = qs("#reportEnd").value;

  let start = startVal ? parseDate(startVal) : null;
  let end = endVal ? parseDate(endVal) : null;

  // Normalize end date to end of day
  if(end){ end.setHours(23,59,59,999);  }

  switch(type){
    case "gender":
      renderGenderReport();
      break;
    case "dept":
      renderDeptReport();
      break;
    case "visaType":
      renderVisaTypeReport();
      break;
    case "lengthStay":
      renderLengthOfStayReport();
      break;
    case "newH1B":
      renderNewH1BReport(start, end);
      break;
    case "expiringH1B":
      renderExpiringH1BReport(start, end);
      break;
    default:
      setHTML("reportSummary", "Unknown report type.");
      setHTML("reportHead", "");
      setHTML("reportBody", "");
  }
}


/***** Individual Reports Implementation *****/

// Gender Summart Report
function renderGenderReport(){
  const counts = countBy(allRows, r=>r.gender||"Unknown");
  const total = Object.values(counts).reduce((a,b)=>a+b,0);


  const rows = Object.entries(counts).map(([gender,count])=>{
    const pct = total ? ((count/total)*100).toFixed(1) + "%" : "0.0%";
    return [gender, count, pct];
  });

  setHTML(
    "reportSummary",
    `Gender Summary: ${total} records grouped by gender (counts and percentage of total).`
  );
  setReportTable(["Gender","Count","Percent"], rows);
}


// Department Summary Report
function renderDeptReport(){
  const counts = countBy(allRows, r=>r.department||"Unassigned");
  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  const rows = Object.entries(counts)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([dept,count])=>{
      const pct = total ? ((count/total)*100).toFixed(1) + "%" : "0.0%";
      return [dept, count, pct];
    });

  setHTML(
    "reportSummary",
    `Department Summary: ${total} active records grouped by department.`
  );
  setReportTable(["Department","Count","Percent"], rows);
}


// Visa Type Summary Report
function renderVisaTypeReport(){
  const counts = countBy(allRows, r=>r.visaType||"Unknown");
  const total = Object.values(counts).reduce((a,b)=>a+b,0);

  const rows = Object.entries(counts)
    .sort((a,b)=>a[0].localeCompare(b[0]))
    .map(([vt,count])=>{
      const pct = total ? ((count/total)*100).toFixed(1) + "%" : "0.0%";
      return [vt, count, pct];
    });

  setHTML(
    "reportSummary",
    `Visa Type Summary: ${total}records grouped by visa type.`
  );
  setReportTable(["Visa Type","Count","Percent"], rows);
}


// length of Stay Report (average & max)
function renderLengthOfStayReport(){
  const rowsWithDur = allRows
  .map(r=>{
    const s = parseDate(r.startDate);
      const e = parseDate(r.endDate);
      if(!s || !e) return null;
      const days = Math.round((e - s) / (1000*60*60*24));
      return {...r, days};
    })
    .filter(Boolean);

    if (rowsWithDur.length === 0){
      setHTML("reportSummary", "No records with valid start and end dates.");
      setReportTable([], []);
      return;
    }

    const totalDays = rowsWithDur.reduce((sum,r)=>sum + (r.days || 0), 0);
    const avgDays = totalDays / rowsWithDur.length;
    const maxRec = rowsWithDur.reduce((max,r)=>r.days > max.days ? r : max, rowsWithDur[0]);

    const avgYears = daysToYears(avgDays);
    const maxYears = daysToYears(maxRec.days);

    setHTML(
      "reportSummary",
      `Length of Stay Report: ${rowsWithDur.length} records. Average duration is ${avgYears} years. Maximum duration is ${maxYears} years (for ${maxRec.givenName} ${maxRec.familyName}).`
    );

    const rows = rowsWithDur.map(r=>{
    const name = `${r.givenName ?? ""} ${r.familyName ?? ""}`.trim();
    return [
      name || "(Unknown)",
      r.visaType || "",
      r.department || "",
      formatDateDisplay(r.startDate),
      formatDateDisplay(r.endDate),
      daysToYears(r.days)
    ];
  });

  setReportTable(
    ["Name","Visa Type","Department","Start Date","End Date","Duration (years)"],
    rows
  );
}


// New H-1B Report (by start date range)
function renderNewH1BReport(start, end){
  // default range: current calendar year
  const now = new Date();
  if(!start){
    start = new Date(now.getFullYear(), 0, 1); // Jan 1
  }
  if(!end){
    end = new Date(now.getFullYear(), 11, 31); // Dec 31
  }

  const rows = allRows.filter(r=>{
    if(r.visaType !== "H-1B") return false;
    const s = parseDate(r.startDate);
    if(!s) return false;
    return s >= start && s <= end;
  });

  const rangeText = `${formatDateDisplay(start)} → ${formatDateDisplay(end)}`;
  setHTML(
    "reportSummary",
    `New H-1B Report: ${rows.length} cases with start dates between ${rangeText}.`
  );


  const tableRows = rows.map(r=>{
    const name = `${r.givenName ?? ""} ${r.familyName ?? ""}`.trim();
    return [
      name || "(Unknown)",
      r.department || "",
      formatDateDisplay(r.startDate),
      formatDateDisplay(r.endDate)
    ];
  });

  setReportTable(
    ["Name","Department","Start Date","End Date"],
    tableRows
  );
}


// Expiring H-1B Report / Extension style Report (by end date range)
function renderExpiringH1BReport(start, end){
  // default range: next 12 months
  const now = new Date();
  if(!start){
    start = now;
  }
  if(!end){
    end = new Date(now);
    end.setFullYear(now.getFullYear() + 1);
  }

  const rows = allRows.filter(r=>{
    if(r.visaType !== "H-1B") return false;
    const e = parseDate(r.endDate);
    if(!e) return false;
    return e >= start && e <= end;
  });

  const rangeText = `${formatDateDisplay(start)} → ${formatDateDisplay(end)}`;
  setHTML(
    "reportSummary",
    `Expiring H-1B Report: ${rows.length} cases with end dates between ${rangeText}.`
  );

  const tableRows = rows.map(r=>{
    const name = `${r.givenName ?? ""} ${r.familyName ?? ""}`.trim();
    return [
      name || "(Unknown)",
      r.department || "",
      formatDateDisplay(r.startDate),
      formatDateDisplay(r.endDate)
    ];
  });


  setReportTable(
    ["Name","Department","Start Date","End Date"],
    tableRows
  );
}


// Wire up the Run Report button
const runReportBtn = qs("#runReportBtn");
if(runReportBtn){
  runReportBtn.addEventListener("click", runReport);
}

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
  renderArchiveTable(); //build Archive view based on expired endDate
})();



/***** Color Coded Expiration Status *****/

// Helper: days until a given end date (from today)

function daysUntil(value){
  const d = parseDate(value);
  if(!d) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffMs = d.getTime() - today.getTime();
  return Math.round(diffMs / (1000*60*60*24));
}


// Helper: Map days to status label + CSS class

function getUrgencyInfo(days){
  if(days === null) return { label: "No date", cls: "status-unknown" };
  if(days < 0) return { label: "Expired", cls: "status-expired" };
  if(days <= 30) return { label: `${days} days (Urgent)`, cls: "status-red"};
  if(days <= 90) return { label: `${days} days (Soon)`, cls: "status-yellow"};
  return { label: `${days} days`, cls: "status-green" };
}


// Dashboard: show details for Expiring ≤ 90 days card

function showExpiringDetails(){
  const panel = qs("#expiringPanel");
  const body = qs("#expiringBody");
  if(!panel || !body) return;

  const today = new Date();
  today.setHours(0,0,0,0);
  const in90 = new Date(today);
  in90.setDate(today.getDate()+90);

  // Filter rows expiring within the next 90 days

  const rows = allRows
    .map(r => {
      const d = parseDate(r.endDate);
      if(!d) return null;
      return { ...r, _endDateObj: d };
    })
    .filter(r => r && r._endDateObj >= today && r._endDateObj <= in90)
    .sort((a,b) => a._endDateObj - b._endDateObj);

    if(rows.length === 0){
      body.innerHTML = `<tr><td colspan="5">No cases expiring within 90 days.</td></tr>`;
    } else {
      const html = rows.map(r => {
        const name = `${r.givenName ?? ""} ${r.familyName ?? ""}`.trim() || "(Unknown)";
        const endStr = formatDateDisplay(r.endDate);
        const days = daysUntil(r.endDate);
        const info = getUrgencyInfo(days);
        return `<tr>
          <td>${name}</td>
          <td>${r.visaType || ""}</td>
          <td>${r.department || ""}</td>
          <td>${endStr}</td>
          <td><span class="status-pill ${info.cls}">${info.label}</span></td>
        </tr>`;
      }).join("");
      body.innerHTML = html;
    }

    panel.classList.remove("hidden");
}


// Wire up click on Expiring ≤ 90 days card and panel close button

const expiringCard = qs("#card-expiring");
const expiringClose = qs("#expiringClose");

if(expiringCard){
  expiringCard.addEventListener("click", showExpiringDetails);
}


if(expiringClose){
  expiringClose.addEventListener("click", ()=>{
    const panel = qs("#expiringPanel");
    if(panel) panel.classList.add("hidden");
  });
}


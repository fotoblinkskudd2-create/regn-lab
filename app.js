/* REGN Lab — fem prototyper i én fil. Local-first, ingen konto, ingen nett. */
const $ = (s, r = document) => r.querySelector(s);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem("regn:" + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem("regn:" + k, JSON.stringify(v)); }
};
const dager = d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 864e5);
const today = () => new Date().toISOString().slice(0, 10);
const app = $("#app");

const APPS = [
  { id: "pust",   navn: "PUST",      tittel: "Panikk i øyeblikket", desc: "Pustesirkel + 5-4-3-2-1 grounding. Én knapp, ingen meny.", cls: "pust" },
  { id: "skap",   navn: "SKAP",      tittel: "Mat går ut",          desc: "Hva har du, og hva må spises først.", cls: "skap" },
  { id: "dose",   navn: "DOSE",      tittel: "Glemt dose",          desc: "Morgen/middag/kveld — huk av, null pålogging.", cls: "dose" },
  { id: "sjekk",  navn: "SJEKK",     tittel: "Bor alene",           desc: "Én daglig «jeg har det bra». Resten skjer av seg selv.", cls: "sjekk" },
  { id: "konv",   navn: "KONVOLUTT", tittel: "Penger uten ramme",   desc: "Konvolutt-budsjett: del ut før måneden spiser deg.", cls: "konv" },
];

const header = (tittel, sub = "") => `
  <div class="topbar">
    <button class="back" onclick="go('')" aria-label="Tilbake">‹</button>
    <div><h1 class="title">${tittel}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>
  </div>`;

function go(id) { location.hash = "#/" + id; }
window.go = go;
window.addEventListener("hashchange", render);

function home() {
  app.innerHTML = `<div class="screen">
    <div class="hero"><h1>REGN Lab</h1><p>Fem prototyper. Local-first. Velg én.</p></div>
    <div class="apps">${APPS.map(a => `
      <button class="app-card" onclick="go('${a.id}')">
        <span class="icon ${a.cls}">${a.navn}</span>
        <span><b>${a.tittel}</b><span>${a.desc}</span></span>
        <span class="chev">›</span>
      </button>`).join("")}
    </div>
    <p class="footer-note">Alt lagres på enheten din (localStorage). Ingen data forlater telefonen.</p>
  </div>`;
}

/* ---------- PUST ---------- */
function pust() {
  app.innerHTML = `<div class="screen">${header("PUST", "Pust med sirkelen. 4 sek inn — 4 hold — 8 ut.")}
    <div class="breath" id="sirkel">Klar?</div>
    <button class="btn" id="start">Start pust</button>
    <div class="card"><h3 style="margin-bottom:8px">Eller grounding — 5-4-3-2-1</h3>
      <div class="ground">${[["5","ting du ser"],["4","ting du kan ta på"],["3","lyder du hører"],["2","lukter"],["1","ting du er glad for"]]
        .map((g,i)=>`<div class="item"><span class="num">${g[0]}</span><span>${g[1]}<div class="meta">Si dem høyt, én om gangen.</div></span></div>`).join("")}</div>
    </div>
    <p class="src">Inspirert av <a href="https://github.com/omar1u7777/Lugn-Trygg">Lugn-Trygg</a>.</p>
  </div>`;
  let on = false;
  $("#start").onclick = () => {
    on = !on;
    $("#sirkel").classList.toggle("run", on);
    $("#sirkel").textContent = on ? "Pust…" : "Klar?";
    $("#start").textContent = on ? "Stopp" : "Start pust";
  };
}

/* ---------- SKAP ---------- */
function skap() {
  const items = store.get("skap", []);
  app.innerHTML = `<div class="screen">${header("SKAP", `${items.length} ting i skapet`)}
    <div class="card">
      <div class="field"><label>Vare</label><input class="input" id="navn" placeholder="F.eks. melk"></div>
      <div class="field"><label>Best før</label><input class="input" id="dato" type="date"></div>
      <button class="btn" id="leggtil">Legg til</button>
    </div>
    <div class="list">${items.length ? items.map((it,i)=>{
      const d = dager(it.dato);
      const cls = d<0?"red":d<=2?"yellow":"green";
      const txt = d<0?`${-d} d over`:d===0?"i dag":`${d} d igjen`;
      return `<div class="item row"><span><b>${it.navn}</b><div class="meta">${it.dato}</div></span>
        <span class="tag ${cls}">${txt}</span></div>`;
    }).join("") : `<div class="empty">Tomt. Legg til det som går ut først.</div>`}</div>
    <p class="src">Inspirert av <a href="https://github.com/touhidtamim/Keepfresh-Client-Side">Keep Fresh</a>.</p>
  </div>`;
  $("#leggtil").onclick = () => {
    const navn = $("#navn").value.trim(), dato = $("#dato").value;
    if (!navn || !dato) return;
    items.push({ navn, dato }); store.set("skap", items); skap();
  };
}

/* ---------- DOSE ---------- */
function dose() {
  const key = "dose:" + today();
  const tatt = store.get(key, { morgen: false, middag: false, kveld: false });
  const slot = (id, label, tid) => `
    <button class="dose-slot ${tatt[id] ? "done" : ""}" data-slot="${id}">
      <b>${label}</b><div class="meta">${tid} · ${tatt[id] ? "Tatt ✓" : "Ikke tatt"}</div>
    </button>`;
  app.innerHTML = `<div class="screen">${header("DOSE", today())}
    <div class="dose-grid">${slot("morgen","Morgen","08:00")}${slot("middag","Middag","14:00")}${slot("kveld","Kveld","20:00")}</div>
    <div class="card"><b>${Object.values(tatt).filter(Boolean).length} av 3</b><div class="meta">doser huket av i dag</div></div>
    <p class="footer-note">Nuller seg selv hver midnatt. Kun på denne enheten.</p>
    <p class="src">Inspirert av <a href="https://github.com/dizzafizza/Meditrax">Meditrax</a>.</p>
  </div>`;
  app.querySelectorAll(".dose-slot").forEach(b => b.onclick = () => {
    tatt[b.dataset.slot] = !tatt[b.dataset.slot]; store.set(key, tatt); dose();
  });
}

/* ---------- SJEKK ---------- */
function sjekk() {
  const log = store.get("sjekk:logg", {});          // {dato: ts}
  const kontakt = store.get("sjekk:kontakt", "");
  const sjekketInn = !!log[today()];
  const iGår = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  let streak = 0, d = today();
  while (log[d]) { streak++; d = new Date(new Date(d) - 864e5).toISOString().slice(0, 10); }
  const glømt = !sjekketInn && !log[iGår] && Object.keys(log).length > 0;
  app.innerHTML = `<div class="screen">${header("SJEKK", "Én trykk om dagen. Det er alt.")}
    ${glømt ? `<div class="card" style="border-color:var(--warn)"><b>Ingen sjekk i går.</b><div class="meta">I produksjon ville ${kontakt || "din kontakt"} fått varsel nå.</div></div>` : ""}
    <button class="big-hit" id="hit" ${sjekketInn ? "disabled" : ""}>${sjekketInn ? "Sjekket inn ✓" : "Jeg har det bra"}</button>
    <div class="kpis">
      <div class="kpi"><b>${streak}</b><span>dager på rad</span></div>
      <div class="kpi"><b>${Object.keys(log).length}</b><span>sjekker totalt</span></div>
      <div class="kpi"><b>${log[today()] ? new Date(log[today()]).toLocaleTimeString("nb-NO",{hour:"2-digit",minute:"2-digit"}) : "—"}</b><span>i dag</span></div>
    </div>
    <div class="card">
      <div class="field"><label>Hvem varsles hvis du ikke sjekker inn?</label>
      <input class="input" id="kontakt" placeholder="Navn / nummer" value="${kontakt}"></div>
      <button class="btn ghost" id="lagre">Lagre kontakt</button>
    </div>
    <p class="footer-note">Prototype: varsel er ikke sendt — det er markert som simulering. I drift: SMS/push til kontakt ved 24t uten sjekk.</p>
    <p class="src">Inspirert av <a href="https://github.com/alfredang/iamgood">SafeCheck</a>.</p>
  </div>`;
  $("#hit").onclick = () => { log[today()] = new Date().toISOString(); store.set("sjekk:logg", log); sjekk(); };
  $("#lagre").onclick = () => { store.set("sjekk:kontakt", $("#kontakt").value.trim()); sjekk(); };
}

/* ---------- KONVOLUTT ---------- */
function konv() {
  const envs = store.get("konv", [{ navn: "Mat", budsjett: 3000, brukt: 0 }, { navn: "Transport", budsjett: 800, brukt: 0 }]);
  const totB = envs.reduce((s,e)=>s+e.budsjett,0), totU = envs.reduce((s,e)=>s+e.brukt,0);
  app.innerHTML = `<div class="screen">${header("KONVOLUTT", `${totU} av ${totB} kr brukt`)}
    <div class="list">${envs.map((e,i)=>{
      const p = e.budsjett ? Math.min(100, e.brukt/e.budsjett*100) : 0;
      const cls = p>90?"danger":p>70?"warn":"";
      return `<div class="item"><div class="row"><b>${e.navn}</b><span class="tag ${p>90?"red":p>70?"yellow":"green"}">${e.brukt}/${e.budsjett} kr</span></div>
        <div class="bar ${cls}" style="margin-top:8px"><i style="width:${p}%"></i></div>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn ghost" style="padding:8px" data-spend="${i}">+ utgift</button>
          <button class="btn ghost" style="padding:8px" data-del="${i}">Slett</button>
        </div></div>`;
    }).join("")}</div>
    <div class="card">
      <div class="field"><label>Ny konvolutt</label><input class="input" id="enavn" placeholder="Navn"></div>
      <div class="field"><label>Budsjett (kr)</label><input class="input" id="ekr" type="number" inputmode="numeric"></div>
      <button class="btn" id="ny">Opprett</button>
    </div>
    <p class="src">Inspirert av <a href="https://github.com/actualbudget/actual">Actual Budget</a>.</p>
  </div>`;
  $("#ny").onclick = () => {
    const navn = $("#enavn").value.trim(), budsjett = +$("#ekr").value;
    if (!navn || !budsjett) return;
    envs.push({ navn, budsjett, brukt: 0 }); store.set("konv", envs); konv();
  };
  app.querySelectorAll("[data-spend]").forEach(b => b.onclick = () => {
    const v = +prompt("Utgift (kr):"); if (!v) return;
    envs[b.dataset.spend].brukt += v; store.set("konv", envs); konv();
  });
  app.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
    envs.splice(b.dataset.del, 1); store.set("konv", envs); konv();
  });
}

const routes = { pust, skap, dose, sjekk, konv, "": home };
function render() { (routes[location.hash.replace(/^#\//, "")] || home)(); }
render();

/* InkMatch — local-first fountain pen ink vibe + swatch card
   State is stored in the URL hash as base64url(JSON).
*/

const $ = (id) => document.getElementById(id);

const PRESETS = [
  {
    id: "konpeki",
    name: "Pilot Iroshizuku Kon-peki (bright blue, well-behaved)",
    color: "#2f6df6",
    fx: { shading: true, sheen: false, shimmer: false, waterRes: false, ironGall: false },
    flow: 1,
    dryTime: 1,
    maintenance: 0,
    paper: "nice",
    nib: "m",
    notes: "safe daily blue"
  },
  {
    id: "nitrogen",
    name: "Organics Studio Nitrogen (monster sheen, smear risk)",
    color: "#1b4fff",
    fx: { shading: false, sheen: true, shimmer: false, waterRes: false, ironGall: false },
    flow: 2,
    dryTime: 3,
    maintenance: 3,
    paper: "tomo",
    nib: "b",
    notes: "don’t touch it for a day"
  },
  {
    id: "emerald",
    name: "J. Herbin Emerald of Chivor (sheen + shimmer cult classic)",
    color: "#0b8a73",
    fx: { shading: true, sheen: true, shimmer: true, waterRes: false, ironGall: false },
    flow: 1,
    dryTime: 2,
    maintenance: 2,
    paper: "tomo",
    nib: "b",
    notes: "sparkly postcard energy"
  },
  {
    id: "pelikan4001",
    name: "Pelikan 4001 (classic drier, faster-ish)",
    color: "#0e3d8b",
    fx: { shading: false, sheen: false, shimmer: false, waterRes: false, ironGall: false },
    flow: -1,
    dryTime: 0,
    maintenance: 0,
    paper: "daily",
    nib: "f",
    notes: "tames wet pens"
  },
  {
    id: "irongall",
    name: "Iron gall vibe (archival-ish, higher maintenance)",
    color: "#222831",
    fx: { shading: false, sheen: false, shimmer: false, waterRes: true, ironGall: true },
    flow: -1,
    dryTime: 0,
    maintenance: 3,
    paper: "daily",
    nib: "ef",
    notes: "clean your pen"
  }
];

function base64UrlEncode(str){
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64UrlDecode(str){
  str = str.replace(/-/g,'+').replace(/_/g,'/');
  while(str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function getStateFromUI(){
  const state = {
    v: 1,
    preset: $("preset").value || "custom",
    color: $("baseColor").value,
    fx: {
      shading: $("fxShading").checked,
      sheen: $("fxSheen").checked,
      shimmer: $("fxShimmer").checked,
      waterRes: $("fxWaterRes").checked,
      ironGall: $("fxIronGall").checked,
    },
    flow: parseInt($("flow").value, 10),
    dryTime: parseInt($("dryTime").value, 10),
    maintenance: parseInt($("maintenance").value, 10),
    paper: $("paper").value,
    nib: $("nib").value,
    notes: $("notes").value.trim().slice(0, 64)
  };

  // Keep it sane: iron gall implies water resistance and high maintenance.
  if (state.fx.ironGall){
    state.fx.waterRes = true;
    state.maintenance = Math.max(state.maintenance, 2);
  }

  // Shimmer implies maintenance.
  if (state.fx.shimmer){
    state.maintenance = Math.max(state.maintenance, 1);
  }

  return state;
}

function setUIFromState(state){
  $("preset").value = state.preset || "custom";
  $("baseColor").value = state.color || "#2f6df6";

  const fx = state.fx || {};
  $("fxShading").checked = !!fx.shading;
  $("fxSheen").checked = !!fx.sheen;
  $("fxShimmer").checked = !!fx.shimmer;
  $("fxWaterRes").checked = !!fx.waterRes;
  $("fxIronGall").checked = !!fx.ironGall;

  $("flow").value = clamp(parseInt(state.flow ?? 0,10), -2, 2);
  $("dryTime").value = clamp(parseInt(state.dryTime ?? 1,10), 0, 3);
  $("maintenance").value = clamp(parseInt(state.maintenance ?? 1,10), 0, 3);
  $("paper").value = state.paper || "daily";
  $("nib").value = state.nib || "m";
  $("notes").value = (state.notes || "").slice(0, 64);

  updateLabels();
}

function getStateFromHash(){
  const h = (location.hash || "").replace(/^#/, "").trim();
  if (!h) return null;
  try {
    const json = base64UrlDecode(h);
    const obj = JSON.parse(json);
    if (!obj || obj.v !== 1) return null;
    return obj;
  } catch {
    return null;
  }
}

function setHashFromState(state){
  const encoded = base64UrlEncode(JSON.stringify(state));
  const newHash = "#" + encoded;
  if (location.hash !== newHash) history.replaceState(null, "", newHash);
}

function flowLabel(v){
  return ({"-2":"Very dry","-1":"Dry","0":"Balanced","1":"Wet","2":"Very wet"})[String(v)] || "Balanced";
}
function dryLabel(v){
  return ({"0":"Fast","1":"Medium","2":"Slow","3":"Very slow"})[String(v)] || "Medium";
}
function maintLabel(v){
  return ({"0":"Low","1":"Normal","2":"High","3":"Chaos"})[String(v)] || "Normal";
}

function updateLabels(){
  $("flowVal").textContent = flowLabel($("flow").value);
  $("dryVal").textContent = dryLabel($("dryTime").value);
  $("maintVal").textContent = maintLabel($("maintenance").value);
}

function describe(state){
  const effects = [];
  if (state.fx.shading) effects.push("shading");
  if (state.fx.sheen) effects.push("sheen");
  if (state.fx.shimmer) effects.push("shimmer");
  if (state.fx.waterRes) effects.push("water resistance");
  if (state.fx.ironGall) effects.push("iron gall");

  const effectsText = effects.length ? effects.join(", ") : "no special effects";
  return `Ink vibe: ${effectsText}; flow=${flowLabel(state.flow)}; dry=${dryLabel(state.dryTime)}; maintenance=${maintLabel(state.maintenance)}.`;
}

function makeAdvice(state){
  const bullets = [];

  // Paper vs sheen/shimmer
  if (state.fx.sheen && state.paper === "daily"){
    bullets.push("If you want sheen on unknown office paper: temper expectations (or switch to better paper). Sheen loves coated paper.");
  }
  if (state.fx.sheen && state.paper === "tomo"){
    bullets.push("Tomoe River mode: you’ll see sheen — but accept longer dry times and smear risk.");
  }

  // Nib size + shading
  if (state.fx.shading && state.nib === "ef"){
    bullets.push("Shading is harder in EF/F. Consider a wetter pen or moving to M for more visible shading.");
  }
  if (state.fx.shading && (state.nib === "m" || state.nib === "b")){
    bullets.push("Shading-friendly setup: medium/broad nib + decent paper.");
  }

  // Shimmer maintenance
  if (state.fx.shimmer){
    bullets.push("Shimmer reminder: rotate the pen occasionally; clean sooner than you think. Avoid very dry feeds.");
  }

  // Iron gall warning
  if (state.fx.ironGall){
    bullets.push("Iron gall vibe: don’t leave it in a pen forever. Rinse on a schedule (especially in steel nibs)." );
  }

  // Flow advice
  if (state.flow <= -1){
    bullets.push("Dry-flow preference: good for cheap paper control, but can feel scratchy in already-dry pens.");
  }
  if (state.flow >= 1){
    bullets.push("Wet-flow preference: juicy feel + sheen potential, but watch feathering and dry time.");
  }

  // Dry time tradeoffs
  if (state.dryTime === 0 && state.fx.sheen){
    bullets.push("Fast-dry + sheen is a tough combo. If you truly need fast dry, prioritize shading or water resistance over monster sheen.");
  }

  // Maintenance gate
  if (state.maintenance <= 0 && (state.fx.shimmer || state.fx.ironGall)){
    bullets.push("You asked for low maintenance but selected high-maintenance effects. Either raise tolerance or disable shimmer/iron gall.");
  }

  // Always include a small "shopping checklist"
  const checklist = [];
  if (state.fx.waterRes) checklist.push("water-resistant" );
  if (state.fx.sheen) checklist.push("sheening (paper-dependent)" );
  if (state.fx.shading) checklist.push("shading" );
  if (state.fx.shimmer) checklist.push("shimmer" );
  if (state.fx.ironGall) checklist.push("iron gall (higher maintenance)" );

  const need = checklist.length ? checklist.join(", ") : "well-behaved daily ink";

  return {
    headline: `${need} · ${flowLabel(state.flow)} flow · ${dryLabel(state.dryTime)} dry · ${maintLabel(state.maintenance)} maintenance`,
    bullets: bullets.length ? bullets : ["This combo is pretty sane. Try it in a pen you already trust, then iterate one variable at a time."],
    checklist: [
      `Look for: ${need}.`,
      `Pair with: ${state.nib.toUpperCase()} nib and “${state.paper}” paper scenario.`,
      `Avoid regret: if it smears, downgrade sheen OR upgrade paper.`
    ]
  };
}

function renderOutput(state){
  const advice = makeAdvice(state);
  const fxBadges = [];
  if (state.fx.shading) fxBadges.push("Shading");
  if (state.fx.sheen) fxBadges.push("Sheen");
  if (state.fx.shimmer) fxBadges.push("Shimmer");
  if (state.fx.waterRes) fxBadges.push("Water-resistant");
  if (state.fx.ironGall) fxBadges.push("Iron gall");

  const badges = fxBadges.length
    ? fxBadges.map(b => `<span class="chip" style="border-color: rgba(106,169,255,.35)">${b}</span>`).join(" ")
    : `<span class="chip">No special effects</span>`;

  $("output").innerHTML = `
    <p class="big">${escapeHtml(advice.headline)}</p>
    <div class="chips" aria-label="Selected effects">${badges}</div>
    <ul>
      ${advice.bullets.map(li => `<li>${escapeHtml(li)}</li>`).join("")}
    </ul>
    <p class="small"><strong>Shopping checklist</strong></p>
    <ul>
      ${advice.checklist.map(li => `<li>${escapeHtml(li)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function hexToRgb(hex){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if(!m) return {r: 47, g: 109, b: 246};
  return {r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16)};
}

function mix(a,b,t){ return a + (b-a)*t; }

function drawCard(state){
  const c = $("cardCanvas");
  const ctx = c.getContext("2d");

  const {r,g,b} = hexToRgb(state.color);

  // background
  ctx.clearRect(0,0,c.width,c.height);
  ctx.fillStyle = "#0f1320";
  ctx.fillRect(0,0,c.width,c.height);

  // subtle gradient
  const grad = ctx.createLinearGradient(0,0,c.width,c.height);
  grad.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
  grad.addColorStop(1, `rgba(${Math.round(mix(r,160,.25))},${Math.round(mix(g,120,.25))},${Math.round(mix(b,255,.25))},0.10)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,c.width,c.height);

  // Card frame
  roundRect(ctx, 36, 36, c.width-72, c.height-72, 18);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = "#e9eef6";
  ctx.font = "800 40px ui-sans-serif, system-ui";
  ctx.fillText("InkMatch", 70, 106);

  // Vibe line
  ctx.font = "600 18px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(233,238,246,0.85)";
  ctx.fillText(describe(state), 70, 142);

  // Swatch blob
  const swX=70, swY=170, swW=360, swH=260;
  roundRect(ctx, swX, swY, swW, swH, 16);
  ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
  ctx.fill();

  // Shading hint
  if (state.fx.shading){
    const sh = ctx.createLinearGradient(swX, swY, swX, swY+swH);
    sh.addColorStop(0, `rgba(255,255,255,0.00)`);
    sh.addColorStop(1, `rgba(255,255,255,0.22)`);
    ctx.fillStyle = sh;
    roundRect(ctx, swX, swY, swW, swH, 16);
    ctx.fill();
  }

  // Sheen hint (top-right metallic overlay)
  if (state.fx.sheen){
    const sheen = ctx.createLinearGradient(swX+swW*0.2, swY, swX+swW, swY+swH*0.35);
    sheen.addColorStop(0, `rgba(255,255,255,0.00)`);
    sheen.addColorStop(1, `rgba(255, 84, 220, 0.28)`);
    ctx.fillStyle = sheen;
    roundRect(ctx, swX, swY, swW, swH, 16);
    ctx.fill();
  }

  // Shimmer dots
  if (state.fx.shimmer){
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, swX, swY, swW, swH, 16);
    ctx.clip();
    ctx.fillStyle = "rgba(255,215,120,0.65)";
    for (let i=0;i<140;i++){
      const x = swX + Math.random()*swW;
      const y = swY + Math.random()*swH;
      const s = 0.7 + Math.random()*2.0;
      ctx.beginPath();
      ctx.arc(x,y,s,0,Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Right-side info
  const infoX=470;
  const line = (txt, y, size=22, weight=700, alpha=0.92) => {
    ctx.font = `${weight} ${size}px ui-sans-serif, system-ui`;
    ctx.fillStyle = `rgba(233,238,246,${alpha})`;
    ctx.fillText(txt, infoX, y);
  };

  line("Setup", 210, 18, 800, 0.85);
  ctx.font = "600 18px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(233,238,246,0.82)";
  ctx.fillText(`Paper: ${state.paper}`, infoX, 242);
  ctx.fillText(`Nib: ${state.nib.toUpperCase()}`, infoX, 268);
  ctx.fillText(`Flow: ${flowLabel(state.flow)}`, infoX, 294);
  ctx.fillText(`Dry: ${dryLabel(state.dryTime)}`, infoX, 320);
  ctx.fillText(`Maintenance: ${maintLabel(state.maintenance)}`, infoX, 346);

  line("Effects", 392, 18, 800, 0.85);
  const fx = [];
  if (state.fx.shading) fx.push("Shading");
  if (state.fx.sheen) fx.push("Sheen");
  if (state.fx.shimmer) fx.push("Shimmer");
  if (state.fx.waterRes) fx.push("Water-resistant");
  if (state.fx.ironGall) fx.push("Iron gall");
  const fxText = fx.length ? fx.join(" · ") : "None";
  wrapText(ctx, fxText, infoX, 420, 360, 20);

  if (state.notes){
    line("Note", 470, 18, 800, 0.85);
    wrapText(ctx, `“${state.notes}”`, infoX, 498, 360, 22);
  }

  // footer line
  ctx.font = "600 14px ui-sans-serif, system-ui";
  ctx.fillStyle = "rgba(233,238,246,0.60)";
  ctx.fillText(`Share link encodes state. Generated locally.`, 70, c.height-64);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text).split(/\s+/);
  let line = "";
  for (let n=0; n<words.length; n++){
    const test = line ? line + " " + words[n] : words[n];
    if (ctx.measureText(test).width > maxWidth && line){
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function roundRect(ctx, x, y, width, height, radius){
  const r = Math.min(radius, width/2, height/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+width, y, x+width, y+height, r);
  ctx.arcTo(x+width, y+height, x, y+height, r);
  ctx.arcTo(x, y+height, x, y, r);
  ctx.arcTo(x, y, x+width, y, r);
  ctx.closePath();
  return ctx;
}

async function copyToClipboard(text){
  try{
    await navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
  } catch {
    // fallback
    const ta=document.createElement('textarea');
    ta.value=text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast("Copied (fallback)");
  }
}

function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `position:fixed;left:50%;bottom:18px;transform:translateX(-50%);
    padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);
    background: rgba(0,0,0,.70); color:#fff; font-weight:700; z-index:9999`;
  document.body.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .25s'; }, 900);
  setTimeout(()=>el.remove(), 1250);
}

function buildShareText(state){
  const lines = [];
  lines.push("🖋️ InkMatch — my ink vibe");
  lines.push(describe(state));
  if (state.notes) lines.push(`Note: ${state.notes}`);
  lines.push("Link: " + location.href);
  return lines.join("\n");
}

function randomChallenge(){
  const fxSets = [
    {shading:true, sheen:false, shimmer:false, waterRes:false, ironGall:false, name:"Shading enjoyer"},
    {shading:false, sheen:true, shimmer:false, waterRes:false, ironGall:false, name:"Sheen goblin"},
    {shading:true, sheen:true, shimmer:false, waterRes:false, ironGall:false, name:"Shading+sheen chaos"},
    {shading:false, sheen:false, shimmer:true, waterRes:false, ironGall:false, name:"Sparkle goblin"},
    {shading:false, sheen:false, shimmer:false, waterRes:true, ironGall:false, name:"Water-resistant pragmatist"},
    {shading:false, sheen:false, shimmer:false, waterRes:true, ironGall:true, name:"Iron gall traditionalist"},
  ];
  const pick = fxSets[Math.floor(Math.random()*fxSets.length)];
  const palette = ["#2f6df6","#0b8a73","#6f42ff","#ef4b5d","#222831","#f2b705","#8a2be2","#2d6a4f"];
  const st = getStateFromUI();
  st.preset = "custom";
  st.color = palette[Math.floor(Math.random()*palette.length)];
  st.fx = {...st.fx, ...pick};
  st.flow = [-1,0,1,2][Math.floor(Math.random()*4)];
  st.dryTime = [0,1,2,3][Math.floor(Math.random()*4)];
  st.maintenance = [0,1,2,3][Math.floor(Math.random()*4)];
  st.paper = ["daily","nice","tomo"][Math.floor(Math.random()*3)];
  st.nib = ["ef","m","b"][Math.floor(Math.random()*3)];
  st.notes = pick.name;
  setUIFromState(st);
  setHashFromState(st);
  syncAll();
}

function syncAll(){
  const state = getStateFromUI();
  setHashFromState(state);
  renderOutput(state);
  drawCard(state);
}

function applyPreset(id){
  const p = PRESETS.find(x => x.id === id);
  if (!p) return;
  const state = {
    v: 1,
    preset: p.id,
    color: p.color,
    fx: {...p.fx},
    flow: p.flow,
    dryTime: p.dryTime,
    maintenance: p.maintenance,
    paper: p.paper,
    nib: p.nib,
    notes: p.notes || ""
  };
  setUIFromState(state);
  setHashFromState(state);
  syncAll();
}

function downloadPng(){
  const c = $("cardCanvas");
  const link = document.createElement('a');
  link.download = `inkmatch-${Date.now()}.png`;
  link.href = c.toDataURL('image/png');
  link.click();
}

function init(){
  // presets dropdown
  const sel = $("preset");
  sel.innerHTML = `<option value="custom">Custom</option>` + PRESETS.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");

  // restore from hash, else default
  const fromHash = getStateFromHash();
  if (fromHash) setUIFromState(fromHash);

  updateLabels();
  syncAll();

  // bind
  const bind = (id, ev="input") => $(id).addEventListener(ev, () => {
    if (id !== 'preset') $("preset").value = 'custom';
    updateLabels();
    syncAll();
  });

  ["baseColor","fxShading","fxSheen","fxShimmer","fxWaterRes","fxIronGall","flow","dryTime","maintenance","paper","nib","notes"].forEach(id => bind(id));

  sel.addEventListener('change', () => {
    if (sel.value !== 'custom') applyPreset(sel.value);
    else syncAll();
  });

  window.addEventListener('hashchange', () => {
    const st = getStateFromHash();
    if (st) setUIFromState(st);
    syncAll();
  });

  $("btnCopyLink").addEventListener('click', () => copyToClipboard(location.href));
  $("btnCopyText").addEventListener('click', () => copyToClipboard(buildShareText(getStateFromUI())));
  $("btnDownload").addEventListener('click', downloadPng);
  $("btnRandom").addEventListener('click', randomChallenge);

  // lightweight offline support
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }
}

init();

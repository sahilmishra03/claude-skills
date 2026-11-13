/* RunwayX product demo: a deterministic timeline. render(t) draws frame t (seconds).
 * record.cjs steps t at 30 fps and screenshots each frame. SFX lists the sound cues. */

/* ---------------- helpers ---------------- */
const $ = (s) => document.querySelector(s);
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const pr = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const eo = (x) => 1 - Math.pow(1 - x, 3);
const eo5 = (x) => 1 - Math.pow(1 - x, 5);
const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(eo(pr(t, a, a + fi)), 1 - eio(pr(t, b - fo, b)));
const bump = (t, a, b) => { const x = pr(t, a, b); return Math.sin(Math.PI * x); };
function inr(n) {
  const s = String(Math.round(n));
  if (s.length <= 3) return "₹" + s;
  return "₹" + s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3);
}
const typed = (str, t, a, b) => str.slice(0, Math.round(str.length * pr(t, a, b)));

const ICON = {
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  upright: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  server: '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  coffee: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>',
  cal: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  down: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  zap: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  hour: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  play: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5Z" fill="currentColor"/>',
  stop: '<rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>',
  sidebar: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>',
};
const ic = (n, s = 20, w = 1.9) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICON[n]}</svg>`;
const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

const statusBar = (white = false) => `<div class="sb${white ? " w" : ""}"><span>9:41</span><span class="ic">
<svg width="19" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3.2" height="4" rx="1"/><rect x="4.8" y="5.5" width="3.2" height="6.5" rx="1"/><rect x="9.6" y="3" width="3.2" height="9" rx="1"/><rect x="14.4" y="0" width="3.2" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M1.3 4.4a9.8 9.8 0 0 1 13.4 0"/><path d="M4 7.2a6 6 0 0 1 8 0"/><circle cx="8" cy="10.2" r="1.4" fill="currentColor" stroke="none"/></svg>
<svg width="28" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" fill="currentColor" opacity="0.45"/></svg></span></div>`;

const avatar = (ini, a, b, s = 36) =>
  `<span class="av" style="width:${s}px;height:${s}px;font-size:${s * 0.36}px;background:linear-gradient(140deg,${a},${b})">${ini}</span>`;
const PEOPLE = {
  AK: ["#f6b38f", "#e0795a"], RM: ["#8ec5fc", "#4f7de0"], NS: ["#a8e0b4", "#3f9d63"], DP: ["#d7b8f3", "#8d5bd6"],
  KG: ["#ffd27a", "#e09a2f"], SM: ["#9fd8e8", "#3a92b0"], PJ: ["#f5a8c0", "#d0567f"], VR: ["#c8c8cc", "#7d7d84"],
};
const av = (k, s) => avatar(k, PEOPLE[k][0], PEOPLE[k][1], s);
const lrow = (icon, tint, fg, name, meta, amt, id = "") =>
  `<div class="lrow"${id ? ` id="${id}"` : ""}><span class="tile" style="background:${tint};color:${fg}">${ic(icon, 20)}</span><span class="nm"><b>${name}</b><small>${meta}</small></span><span class="am">${amt}</span></div>`;

/* ---------------- timeline constants ---------------- */
const A = 14; // the app launches in the simulator
const END = A + 67.5;
const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const BURN = [3.4, 3.7, 3.5, 3.9, 4.0, 4.2];

/* ---------------- build: intro ---------------- */
function buildIntro() {
  const el = $("#intro");
  const chip = (cls, tint, fg, icon, b, s) =>
    `<div class="chip ${cls}"><span class="ct" style="background:${tint};color:${fg}">${ic(icon, 20)}</span><span><b>${b}</b><small>${s}</small></span></div>`;
  const chips = [
    chip("", "#fff1e5", "#d9670f", "server", "AWS", "₹38,400 · Software"),
    chip("dark", "rgba(155,225,93,.18)", "#9be15d", "hour", "18.0 months", "Runway"),
    chip("", "#e8f1ff", "#2f6fe0", "plane", "IndiGo · BLR", "₹12,950 · Travel"),
    chip("", "#fdecec", "#c2352f", "zap", "₹4.2L / mo", "Burn rate"),
    chip("", "#f1ecff", "#6b4de6", "laptop", "Figma", "₹3,100 · Annual"),
    chip("", "#e8f6ec", "#1c7a3d", "check", "Receipt scanned", "4 fields filled"),
    chip("dark", "rgba(124,92,255,.25)", "#c9b8ff", "sparkles", "AI CFO", "Save ₹9k / mo"),
    chip("", "#ffeaf1", "#d23c75", "megaphone", "LinkedIn Ads", "₹8,000 · Marketing"),
    chip("", "#f6efe7", "#8a5a2b", "users", "Payroll", "₹3.1L · 12 people"),
    chip("", "#fff6e0", "#8a5d00", "upright", "+3.7 months", "Runway you can win"),
    chip("", "#f6efe7", "#8a5a2b", "coffee", "Blue Tokai", "₹1,300 · Food"),
    chip("", "#e8f1ff", "#2f6fe0", "wallet", "HDFC •• 4242", "Bank account"),
  ];
  el.innerHTML = `
    <span class="iw" id="w-still">Still guessing</span>
    <span class="iw" id="w-how">How long will</span>
    <span class="iw" id="w-cash">your cash last?</span>
    <div id="stack" class="abs" style="left:885px;top:488px;width:150px;height:104px">
      <div class="stackc" id="sc0" style="background:#fbfaf6;padding:12px 14px;font-size:11px;color:#333;font-family:'Courier New',monospace;line-height:1.5"><b style="font-family:Geist;font-size:12px">AWS · Invoice</b><br>EC2 ....... 31,200<br>S3 ......... 4,100<br><b>Total ₹38,400</b></div>
      <div class="stackc" id="sc1" style="background:#fff;padding:12px 14px"><div style="font-size:11px;color:#6b6c6e;font-weight:500">Monthly burn</div><div style="display:flex;align-items:flex-end;gap:6px;height:56px;margin-top:8px">${BURN.map((v, i) => `<i style="flex:1;border-radius:4px;height:${v * 12}px;background:${i === 5 ? "#0d0e0f" : "rgba(13,14,15,.1)"}"></i>`).join("")}</div></div>
      <div class="stackc" id="sc2" style="background:#0d0e0f;color:#fff;padding:12px 14px"><div style="font-size:11px;color:rgba(255,255,255,.55);font-weight:500">Runway</div><div style="font-size:34px;font-weight:600;letter-spacing:-.05em;margin-top:6px">18.0<span style="font-size:13px;color:rgba(255,255,255,.55);letter-spacing:0"> months</span></div><svg viewBox="0 0 150 30" style="position:absolute;left:0;bottom:0;width:150px;height:30px"><path d="M0 26 C30 24 45 16 70 18 S110 8 150 4" fill="none" stroke="#9be15d" stroke-width="2"/></svg></div>
    </div>
    <div id="meet" class="abs" style="left:0;right:0;top:0;height:1080px;display:flex;align-items:center;justify-content:center;gap:22px">
      <span class="iw" style="position:static" id="w-meet">Meet</span>
      <img src="assets/logo-tile.png" id="meet-logo" style="width:104px;height:104px;border-radius:26px;box-shadow:0 2px 4px rgba(0,0,0,.08),0 20px 40px -14px rgba(12,18,32,.45)">
      <span class="iw" style="position:static" id="w-rx">RunwayX</span>
    </div>
    ${chips.join("")}`;
}

/* ---------------- build: desktop ---------------- */
function buildDesktop() {
  // Menu bar for the Simulator app. Dark text, since the wallpaper is light.
  $("#menubar").innerHTML = `<div class="l"><svg width="15" height="18" viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 2 5.8 1.1 7.3c-1.9 3.2-.5 8 1.3 10.6.9 1.300 2 2.7 3.3 2.6 1.3-.1 1.8-.9 3.4-.9s2 .9 3.4.8c1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-3-4.2zM11.5 3c.7-.9 1.2-2 1-3.2-1 0-2.2.7-3 1.5-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.4z"/></svg>
    <b>Simulator</b><span>File</span><span>Edit</span><span>Device</span><span>I/O</span><span>Features</span><span>Debug</span><span>Window</span><span>Help</span></div>
    <div class="r"><svg width="20" height="14" viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.3 4.4a9.8 9.8 0 0 1 13.4 0"/><path d="M4 7.2a6 6 0 0 1 8 0"/><circle cx="8" cy="10.2" r="1.4" fill="currentColor" stroke="none"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.8" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="17" height="9" rx="2.5" fill="currentColor"/></svg>
    ${ic("search", 15, 2.2)}<span>Fri 13 Nov&nbsp;&nbsp;9:41 AM</span></div>`;
}

/* ---------------- build: app screens ---------------- */
function buildPhone() {
  const bars = `<div class="bars">${[1, 2, 3].map((g) => `<span class="gl" style="bottom:${g * 33}%"></span>`).join("")}${BURN.map((v, i) => `<span class="bar${i === 5 ? " last" : ""}" id="hb${i}">${i === 5 ? '<span class="tip" id="hb-tip">₹4.2L</span>' : ""}</span>`).join("")}</div><div class="mrow">${MONTHS.map((m) => `<span>${m}</span>`).join("")}</div>`;
  const legend = [["Software", "#0d0e0f", 38], ["Payroll", "#6b4de6", 31], ["Marketing", "#d23c75", 14], ["Travel", "#2f6fe0", 9], ["Other", "#c9c9cc", 8]];

  const home = `
  <div class="scr" id="s-home">${statusBar()}
    <div class="content" id="home-c">
      <div class="row" style="padding:6px 20px 0;justify-content:space-between;align-items:flex-end">
        <div><p class="kick">Friday, 13 Nov</p><p class="h1">Overview</p></div>
        <span id="avatar" style="margin-bottom:4px">${av("AK", 40)}</span>
      </div>
      <div class="hero" id="runway-card">
        <svg viewBox="0 0 360 90" preserveAspectRatio="none" style="position:absolute;left:0;right:0;bottom:0;width:100%;height:84px"><defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be15d" stop-opacity=".28"/><stop offset="1" stop-color="#9be15d" stop-opacity="0"/></linearGradient></defs><path d="M0 70 C40 66 60 52 100 56 S160 40 200 42 S270 22 310 26 S350 14 360 12 L360 90 L0 90 Z" fill="url(#hg)"/><path id="spark" d="M0 70 C40 66 60 52 100 56 S160 40 200 42 S270 22 310 26 S350 14 360 12" fill="none" stroke="#9be15d" stroke-width="2.2"/></svg>
        <div class="row" style="justify-content:space-between;position:relative"><span class="muted" style="font-size:14px;font-weight:500">Runway</span><span class="live"><i></i>Live</span></div>
        <p style="position:relative;margin-top:8px;display:flex;align-items:baseline;gap:8px"><span id="h-run" style="font-size:62px;font-weight:600;letter-spacing:-.05em;line-height:1">18.0</span><span class="muted" style="font-size:18px;font-weight:500">months</span></p>
        <p id="h-note" style="position:relative;margin-top:8px;padding-bottom:30px;font-size:14px;font-weight:600;color:var(--accent)">+2.0 mo vs last month</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 16px 0">
        <div class="card" style="padding:16px"><p class="lab">Cash available</p><p id="h-cash" style="margin-top:4px;font-size:24px;font-weight:600;letter-spacing:-.03em">₹75.6L</p><span class="pill pos" style="margin-top:6px">${ic("down", 12, 2.6)} 0.5%</span></div>
        <div class="card" style="padding:16px"><p class="lab">Burn this month</p><p id="h-burn" style="margin-top:4px;font-size:24px;font-weight:600;letter-spacing:-.03em">₹4.2L</p><span class="pill neg" style="margin-top:6px" id="h-bd">${ic("upright", 12, 2.6)} <span id="h-bdv">3.1%</span></span></div>
      </div>
      <div class="card" style="margin:12px 16px 0;padding:16px 16px 14px">
        <div class="row" style="justify-content:space-between;margin-bottom:34px"><b style="font-size:16px;font-weight:600">Monthly burn</b><span class="t2" style="font-size:13px;font-weight:600;display:flex;align-items:center">Details ${ic("right", 14, 2.2)}</span></div>
        ${bars}
      </div>
      <div class="card" style="margin:12px 16px 0;padding:16px">
        <div class="row" style="justify-content:space-between;margin-bottom:14px"><b style="font-size:16px;font-weight:600">Where it goes</b><span class="t2" style="font-size:13px;font-weight:600;display:flex;align-items:center">Breakdown ${ic("right", 14, 2.2)}</span></div>
        <div class="seg">${legend.map(([, c, p], i) => `<i id="hs${i}" style="background:${c};width:${p}%"></i>`).join("")}</div>
        <div style="margin-top:8px">${legend.map(([n, c, p]) => `<div class="leg"><i style="background:${c}"></i><span>${n}</span><b>${p}%</b></div>`).join("")}</div>
      </div>
      <div class="sec">Recent <span>View all</span></div>
      <div class="card" style="margin:0 16px">${lrow("laptop", "#f1ecff", "#6b4de6", "Figma", "Software · Yesterday", "₹3,100", "h-recent")}${lrow("megaphone", "#ffeaf1", "#d23c75", "LinkedIn Ads", "Marketing · Neha", "₹8,000")}</div>
      <div style="height:140px"></div>
    </div>
  </div>`;

  const expenses = `
  <div class="scr" id="s-exp">${statusBar()}
    <div class="content" id="exp-c">
      <div class="row" style="padding:6px 20px 0;justify-content:space-between;align-items:flex-end"><p class="h1">Expenses</p><span class="backb" style="margin-bottom:2px">${ic("search", 19)}</span></div>
      <div class="card" style="margin:16px 16px 0;padding:18px">
        <p class="lab">Spent to date</p>
        <div class="row" style="gap:10px;margin-top:2px"><p id="ex-total" style="font-size:36px;font-weight:600;letter-spacing:-.045em">₹1,57,050</p><span class="pill wrn">${ic("upright", 12, 2.6)} 8%</span></div>
        <div class="prog" style="margin-top:14px"><i id="ex-bar" style="width:62%"></i></div>
        <p class="t2" style="font-size:13px;margin-top:8px"><b style="color:var(--t1)">62%</b> of November budget used</p>
      </div>
      <div class="chips"><span class="on">All</span><span>Software</span><span>Travel</span><span>Payroll</span><span>Office</span></div>
      <div class="sec">Recent <span>View all</span></div>
      <p class="t3" style="padding:0 24px 8px;font-size:12.5px;font-weight:600">TODAY</p>
      <div class="card" style="margin:0 16px;overflow:hidden">
        ${lrow("server", "#fff1e5", "#d9670f", "AWS", "Software · HDFC •• 4242", "₹38,400", "ex-new")}
        ${lrow("plane", "#e8f1ff", "#2f6fe0", "IndiGo · BLR", "Travel · Rohan", "₹12,950")}
        ${lrow("coffee", "#f6efe7", "#8a5a2b", "Blue Tokai", "Food & drinks · Receipt", "₹1,300")}
      </div>
      <p class="t3" style="padding:18px 24px 8px;font-size:12.5px;font-weight:600">YESTERDAY</p>
      <div class="card" style="margin:0 16px">
        ${lrow("laptop", "#f1ecff", "#6b4de6", "Figma", "Software · Annual", "₹3,100")}
        ${lrow("megaphone", "#ffeaf1", "#d23c75", "LinkedIn Ads", "Marketing · Neha", "₹8,000")}
      </div>
      <p class="t3" style="padding:18px 24px 8px;font-size:12.5px;font-weight:600">10 NOV</p>
      <div class="card" style="margin:0 16px">
        ${lrow("building", "#eef0f3", "#4a5568", "WeWork", "Office · Recurring", "₹45,000")}
        ${lrow("file", "#eef0f3", "#4a5568", "Notion", "Software · Recurring", "₹1,600")}
        ${lrow("users", "#e8f6ec", "#1c7a3d", "Team offsite", "Team · Aisha", "₹46,700")}
      </div>
      <div style="height:140px"></div>
    </div>
  </div>`;

  const teams = [
    ["Engineering", "5 members", ["RM", "DP", "SM", "KG"], "₹1.8L", 86, true],
    ["Growth", "3 members", ["NS", "PJ", "VR"], "₹72k", 64],
    ["Design", "2 members", ["DP", "PJ"], "₹58k", 48],
    ["Operations", "2 members", ["AK", "KG"], "₹40k", 40],
  ];
  const team = `
  <div class="scr" id="s-team">${statusBar()}
    <div class="content" id="team-c">
      <div class="row" style="padding:6px 20px 0;justify-content:space-between;align-items:flex-end"><p class="h1">Team</p><span class="pill" style="background:var(--inv);color:var(--oninv);padding:8px 14px;font-size:13.5px;margin-bottom:4px">${ic("plus", 15, 2.4)} Create new team</span></div>
      <div class="field" style="margin:16px 16px 0;height:46px;border-radius:14px">${ic("search", 18)}<span>Search teams</span></div>
      <div class="card" style="margin:12px 16px 0;padding:18px">
        <p class="lab">Team spend this month</p>
        <p style="font-size:36px;font-weight:600;letter-spacing:-.045em;margin-top:2px">₹3.5L <span class="t3" style="font-size:16px;font-weight:500;letter-spacing:0">of ₹4.5L</span></p>
        <div class="prog" style="margin-top:14px"><i id="tm-bar" style="width:78%"></i></div>
        <p class="t2" style="font-size:13px;margin-top:8px"><b style="color:var(--t1)">78%</b> used · 12 people on payroll</p>
      </div>
      <div class="sec">All teams <span>4</span></div>
      <div class="card" style="margin:0 16px">
        ${teams.map(([n, m, ps, amt, pct, w], i) => `<div class="lrow" style="flex-wrap:wrap;padding:14px 16px"><span class="avs">${ps.map((p) => av(p, 30)).join("")}</span><span class="nm"><b>${n}</b><small>${m}</small></span><span class="am">${amt}<small class="t3" style="font-size:12px;font-weight:500"> /mo</small></span><div class="prog" style="width:100%;margin-top:12px;height:6px"><i class="${w ? "w" : ""}" id="tb${i}" style="width:${pct}%"></i></div></div>`).join("")}
      </div>
      <div class="sec">Payroll</div>
      <div class="card" style="margin:0 16px">
        ${lrow("wallet", "#e8f6ec", "#1c7a3d", "November salaries", "Processed · 12 members", "₹3,10,000")}
      </div>
      <div style="height:140px"></div>
    </div>
  </div>`;

  const ai = `
  <div class="scr" id="s-ai">${statusBar()}
    <div class="content" id="ai-c">
      <div class="row" style="padding:6px 20px 0;justify-content:space-between;align-items:flex-end"><div><p class="kick">Insights from your numbers</p><p class="h1">AI CFO</p></div><span class="backb" style="margin-bottom:2px" id="ai-ref">${ic("refresh", 18)}</span></div>
      <div id="ai-sk" style="margin-top:16px"><div class="skel"><i style="width:40%"></i><i style="width:90%"></i><i style="width:75%;margin:0"></i></div><div class="skel"><i style="width:55%"></i><i style="width:85%"></i><i style="width:65%;margin:0"></i></div><div class="skel"><i style="width:45%"></i><i style="width:80%;margin:0"></i></div></div>
      <div id="ai-cards" style="position:absolute;left:0;right:0;top:94px">
        <div class="ins" id="ai0"><span class="glow"></span>
          <span class="live" style="position:relative">${ic("sparkles", 13, 2.2)} Headline</span>
          <p style="position:relative;margin-top:12px;font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.2">Cloud is now 38% of your burn.</p>
          <p class="muted" style="position:relative;margin-top:8px;font-size:14.5px;line-height:1.4;color:color-mix(in srgb,var(--oninv) 62%,transparent)">AWS grew 12% this month. Rightsizing idle EC2 instances saves about ₹9k a month.</p>
        </div>
        <div id="ai1"><div class="ttl"><b>Top recommendations</b><small>What to act on first</small></div>
          <div class="card" style="margin:0 16px">
            <div class="rec"><span class="n">1</span><p>Rightsize idle EC2 instances</p><span class="pill pos">Save ₹9k/mo</span></div>
            <div class="rec"><span class="n">2</span><p>Pause low-ROI LinkedIn ads</p><span class="pill pos">Save ₹6k/mo</span></div>
            <div class="rec"><span class="n">3</span><p>Move Figma to annual billing</p><span class="pill pos">Save ₹1.2k/mo</span></div>
          </div></div>
        <div id="ai2"><div class="ttl"><b>Extend your runway</b><small>Ways to make cash last longer</small></div>
          <div class="card" style="margin:0 16px;padding:18px">
            <div class="row" style="justify-content:space-between"><div><p class="lab">Possible runway</p><p style="font-size:30px;font-weight:600;letter-spacing:-.04em">20.1 <span class="t3" style="font-size:15px;font-weight:500;letter-spacing:0">months</span></p></div><span class="pill pos" style="font-size:13px;padding:6px 11px">+3.7 mo</span></div>
            <div style="display:flex;gap:6px;align-items:flex-end;height:64px;margin-top:14px">${[16.4, 16.7, 17.0, 17.6, 18.8, 20.1].map((v, i) => `<i id="ai2b${i}" style="flex:1;border-radius:6px;background:${i === 5 ? "var(--accent)" : "color-mix(in srgb,var(--t1) 10%,transparent)"};height:${(v - 12) * 7.5}px"></i>`).join("")}</div>
          </div></div>
        <div id="ai3"><div class="ttl"><b>Cut your burn</b><small>Where monthly spend can drop</small></div>
          <div class="card" style="margin:0 16px;padding:6px 0">
            <div class="rec"><span class="tile" style="width:36px;height:36px;background:#fff1e5;color:#d9670f">${ic("server", 17)}</span><p>Infrastructure<br><small class="t2" style="font-size:12.5px">₹1.7L · 38% of burn</small></p><span class="pill wrn">High</span></div>
            <div class="rec"><span class="tile" style="width:36px;height:36px;background:#ffeaf1;color:#d23c75">${ic("megaphone", 17)}</span><p>Marketing<br><small class="t2" style="font-size:12.5px">₹64k · 14% of burn</small></p><span class="pill pos">OK</span></div>
          </div></div>
        <div style="height:160px"></div>
      </div>
    </div>
  </div>`;

  const sheet = `
  <div id="scrim"></div>
  <div id="sheet"><div class="grab"></div>
    <p style="font-size:20px;font-weight:700;letter-spacing:-.02em;padding:0 6px 12px">Add expense</p>
    <div class="card" style="overflow:hidden">
      <div class="opt" id="opt-scan"><span class="tile" style="background:var(--inv);color:var(--oninv)">${ic("scan", 21)}</span><span style="flex:1"><b>Scan receipt</b><small>Auto-fill the details from a photo</small></span>${ic("right", 18)}</div>
      <div style="height:1px;background:var(--hair);margin:0 16px"></div>
      <div class="opt"><span class="tile" style="background:var(--muted)">${ic("pencil", 19)}</span><span style="flex:1"><b>Add manually</b><small>Enter the amount and category yourself</small></span>${ic("right", 18)}</div>
    </div>
  </div>`;

  const scan = `
  <div class="scr" id="s-scan"><div class="vf"></div>
    <div class="receipt" id="receipt">
      <h4>amazon web services</h4><p style="font-size:11px;color:#666">Tax invoice · INV-20431</p><hr>
      <div class="rl"><span>Bill date</span><span>13 Nov 2026</span></div>
      <div class="rl"><span>Account</span><span>RunwayX Labs</span></div><hr>
      <div class="rl"><span>EC2 instances</span><span>31,200.00</span></div>
      <div class="rl"><span>S3 storage</span><span>4,100.00</span></div>
      <div class="rl"><span>CloudFront</span><span>3,100.00</span></div><hr>
      <div class="rl" style="font-weight:700;font-size:14px"><span>TOTAL INR</span><span>38,400.00</span></div><hr>
      <p style="font-size:10px;color:#777;margin-top:8px">Paid by card ending 4242<br>Thank you for using AWS.</p>
      <div style="display:flex;gap:2px;margin-top:14px;height:30px">${Array.from({ length: 38 }, (_, i) => `<i style="flex:${1 + ((i * 7) % 3)};background:${i % 2 ? "transparent" : "#333"}"></i>`).join("")}</div>
    </div>
    <span class="brk" style="left:40px;top:140px;border-right:0;border-bottom:0;border-radius:14px 0 0 0"></span>
    <span class="brk" style="right:40px;top:140px;border-left:0;border-bottom:0;border-radius:0 14px 0 0"></span>
    <span class="brk" style="left:40px;top:590px;border-right:0;border-top:0;border-radius:0 0 0 14px"></span>
    <span class="brk" style="right:40px;top:590px;border-left:0;border-top:0;border-radius:0 0 14px 0"></span>
    <div id="scanline"></div>
    ${statusBar(true)}
    <div class="row" style="position:absolute;left:16px;right:16px;top:62px;justify-content:space-between;color:#fff;z-index:5"><span class="backb" style="background:rgba(255,255,255,.14);box-shadow:none">${ic("x", 19)}</span><b style="font-size:17px">Scan receipt</b><span style="width:40px"></span></div>
    <p style="position:absolute;left:0;right:0;top:640px;text-align:center;color:rgba(255,255,255,.75);font-size:14.5px">Fit the receipt inside the frame</p>
    <div id="shutter"><i></i></div>
    <div id="reading"><span style="width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(from 200deg,#9be15d,#3a9ddb,#7c5cff,#9be15d)" id="read-ic">${ic("sparkles", 26, 2)}</span>Reading receipt…<small style="font-weight:500;opacity:.7;font-size:13.5px">Amount, vendor, date and category</small></div>
    <div id="flash"></div>
  </div>`;

  const fields = [
    ["tag", "Title", "AWS"], ["layers", "Category", "Software"], ["cal", "Date", "13 Nov 2026"],
    ["wallet", "Paid from", "HDFC •• 4242"], ["file", "Note", "EC2, S3 and CloudFront"],
  ];
  const review = `
  <div class="scr" id="s-review">${statusBar()}
    <div class="navh"><span class="backb">${ic("left", 20, 2.2)}</span><b style="flex:1;text-align:center;font-size:17px;margin-right:40px">New expense</b></div>
    <div style="text-align:center;padding-top:8px"><span class="aib" id="rv-badge">${ic("sparkles", 13, 2.2)} Filled by AI from your receipt</span>
      <p class="lab" style="margin-top:18px">Amount</p>
      <p id="rv-amt" style="font-size:52px;font-weight:600;letter-spacing:-.05em;margin-top:2px">₹0</p></div>
    <div class="card" style="margin:20px 16px 0">${fields.map(([icn, l, v], i) => `<div class="frow"><span class="t2">${ic(icn, 17)}</span><span class="fl">${l}</span><span class="fvv"><span class="shim" id="rs${i}"></span><span id="rv${i}" style="opacity:0">${i === 1 ? `<span class="pill" style="background:#fff1e5;color:#d9670f;font-size:13px">${v}</span>` : v}</span></span></div>`).join("")}</div>
    <div class="card" style="margin:12px 16px 0"><div class="frow"><span class="t2">${ic("repeat", 17)}</span><span class="fl" style="flex:1">Repeats monthly</span><span class="toggle"><i></i></span></div>
      <div class="frow"><span class="t2">${ic("receipt", 17)}</span><span class="fl" style="flex:1">Receipt</span><span style="width:34px;height:42px;border-radius:6px;background:#fbfaf6;box-shadow:inset 0 0 0 1px var(--hair);display:block"></span></div></div>
    <div class="btn" id="save-btn" style="position:absolute;left:16px;right:16px;bottom:40px">Save expense</div>
  </div>`;

  const chat = `
  <div class="scr" id="s-chat">${statusBar()}
    <div class="row" style="gap:12px;padding:4px 16px 12px;border-bottom:1px solid var(--hair)">
      <span class="backb" id="chat-back">${ic("left", 20, 2.2)}</span>
      <span style="width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:#fff;background:conic-gradient(from 200deg,#9be15d,#3a9ddb,#7c5cff,#9be15d)">${ic("sparkles", 19, 2)}</span>
      <span style="flex:1"><b style="display:block;font-size:17px">AI CFO</b><small class="t2" style="font-size:12.5px">Reads your live books</small></span>
      <span class="t2">${ic("more", 22)}</span>
    </div>
    <div class="msgs">
      <div class="bot" style="font-size:15px">Hi Aisha. Ask me anything about burn, runway, team costs or spending.</div>
      <div class="you" id="c-you" style="opacity:0">How can we extend our runway?</div>
      <div class="bot dots" id="c-dots" style="opacity:0"><i></i><i></i><i></i></div>
      <div class="bot" id="c-bot" style="opacity:0"></div>
    </div>
    <div class="cbar" id="chat-input"><span class="ph" id="c-ph">Ask about your numbers…</span><span id="send-btn">${ic("up", 20, 2.4)}</span></div>
  </div>`;

  const runway = `
  <div class="scr" id="s-runway">${statusBar()}
    <div class="navh"><span class="backb" id="runway-back">${ic("left", 20, 2.2)}</span><b style="flex:1;text-align:center;font-size:17px">Runway</b><span class="backb">${ic("refresh", 17)}</span></div>
    <div class="card" style="margin:8px 16px 0;padding:18px">
      <div class="row" style="justify-content:space-between"><p class="lab">Estimated runway</p><span class="pill pos" style="font-size:12.5px">● Healthy</span></div>
      <p style="font-size:50px;font-weight:600;letter-spacing:-.05em;line-height:1.05;margin-top:6px"><span id="rw-n">16.4</span> <span class="t3" style="font-size:18px;font-weight:500;letter-spacing:0">months</span></p>
      <p class="t2" style="font-size:14px;margin-top:4px">Cash runs out <b style="color:var(--t1)">March 2028</b></p>
    </div>
    <div class="card" style="margin:12px 16px 0;padding:16px">
      <div class="row" style="justify-content:space-between"><b style="font-size:16px">Cash projection</b><span class="t3" style="font-size:12.5px;font-weight:600">At current burn</span></div>
      <svg viewBox="0 0 330 160" style="width:100%;margin-top:12px;overflow:visible">
        <defs><linearGradient id="rwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9be15d" stop-opacity=".3"/><stop offset="1" stop-color="#9be15d" stop-opacity="0"/></linearGradient></defs>
        ${[30, 75, 120].map((y) => `<line x1="0" x2="330" y1="${y}" y2="${y}" stroke="currentColor" stroke-opacity=".08" stroke-dasharray="3 4"/>`).join("")}
        <path id="rw-fill" d="M0 22 C50 26 90 38 130 52 L130 160 L0 160 Z" fill="url(#rwg)"/>
        <path id="rw-line" d="M0 22 C50 26 90 38 130 52" fill="none" stroke="var(--t1)" stroke-width="2.8" stroke-linecap="round"/>
        <path id="rw-proj" d="M130 52 C190 76 250 112 322 150" fill="none" stroke="var(--t1)" stroke-width="2.8" stroke-linecap="round" stroke-dasharray="1 7"/>
        <line x1="130" x2="130" y1="0" y2="160" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="2 3"/>
        <circle id="rw-dot" cx="130" cy="52" r="7" fill="#9be15d" stroke="var(--t1)" stroke-width="2.8"/>
        <g id="rw-end"><circle cx="322" cy="150" r="5" fill="var(--neg)"/><rect x="248" y="118" width="70" height="22" rx="7" fill="var(--neg)"/><text x="283" y="133" text-anchor="middle" font-size="11.5" font-weight="700" fill="#fff">Mar 2028</text></g>
        <rect x="100" y="-4" width="60" height="22" rx="7" fill="var(--t1)"/><text x="130" y="11" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--bg)">Today</text>
      </svg>
      <div class="row t3" style="justify-content:space-between;font-size:11.5px;font-weight:600;margin-top:10px"><span>May 26</span><span>Nov 26</span><span>May 27</span><span>Nov 27</span><span>Mar 28</span></div>
    </div>
    <div class="sec" style="padding-top:18px">Signals</div>
    <div class="card" style="margin:0 16px" id="rw-sig">
      <div class="lrow"><span class="tile wrn" style="width:36px;height:36px">${ic("upright", 17, 2.4)}</span><span class="nm"><b>Software spend up 12%</b><small>Adds ₹38k to monthly burn</small></span></div>
      <div class="lrow"><span class="tile pos" style="width:36px;height:36px">${ic("check", 17, 2.4)}</span><span class="nm"><b>Payroll steady</b><small>₹3.1L for 12 people</small></span></div>
    </div>
    <div class="card" style="margin:12px 16px 0;padding:14px 16px"><p class="lab">How it works</p><p style="font-size:15px;font-weight:600;margin-top:4px">₹75.2L remaining ÷ ₹4.6L burn = 16.4 months</p></div>
  </div>`;

  const srow = (icn, b, s) => `<div class="srow"><span class="tile">${ic(icn, 18)}</span><span class="nm"><b>${b}</b><small>${s}</small></span><span class="t3">${ic("right", 17)}</span></div>`;
  const settings = `
  <div class="scr" id="s-settings">${statusBar()}
    <div class="navh"><span class="backb" id="settings-back">${ic("left", 20, 2.2)}</span><span style="flex:1;text-align:center;margin-right:40px"><b style="font-size:17px;display:block">Settings</b></span></div>
    <div class="grp" style="margin-top:6px"><div class="srow" style="padding:16px">${av("AK", 50)}<span class="nm"><b style="font-size:17px">Aisha Khan</b><small>aisha@acme.in · Admin</small></span><span class="t3">${ic("right", 17)}</span></div></div>
    <p class="sec" style="padding-top:18px">Company</p>
    <div class="grp">${srow("building", "Company details", "Name, address and structure")}${srow("wallet", "Add funding", "Record a new round or top-up")}${srow("layers", "Budgets", "Monthly limit per category")}${srow("repeat", "Recurring payments", "Subscriptions and salaries")}${srow("file", "Statements", "Download expense reports")}</div>
    <p class="sec" style="padding-top:18px">Preferences</p>
    <div class="grp"><div class="srow"><span class="tile">${ic("moon", 18)}</span><span class="nm"><b>Appearance</b></span></div>
      <div class="segc"><span id="seg-ind"></span><span>Light</span><span id="seg-dark">Dark</span><span>System</span></div>
      <div class="srow" style="border-top:1px solid var(--hair)"><span class="tile">${ic("globe", 18)}</span><span class="nm"><b>Currency</b><small>Indian rupee · lakh and crore</small></span><span class="t2" style="font-weight:600">₹ INR</span></div></div>
  </div>`;

  const spring = `
  <div class="scr" id="s-spring">${statusBar(true)}
    <div class="apps">
      ${[["#34c759", "FaceTime"], ["#ffffff", "Calendar"], ["#ff9f0a", "Photos"], ["#8e8e93", "Camera"], ["#0a84ff", "Mail"], ["#ffcc00", "Notes"], ["#ff375f", "Reminders"], ["#5e5ce6", "Clock"],
         ["#30b0c7", "Maps"], ["#ff453a", "News"], ["#0a84ff", "App Store"], ["#8e8e93", "Settings"]]
        .map(([c, n]) => `<span class="app"><i style="background:${c};opacity:.92"></i>${n}</span>`).join("")}
      <span class="app" id="app-rx"><i style="background-image:url(assets/logo-tile.png);box-shadow:0 0 0 .5px rgba(0,0,0,.1)"></i>RunwayX</span>
    </div>
    <div class="dock"><i style="background:#34c759"></i><i style="background:#0a84ff"></i><i style="background:#fff"></i><i style="background:#ff9f0a"></i></div>
  </div>`;

  const splash = `<div class="scr" id="s-splash" style="display:grid;place-items:center"><img src="assets/logo-mark-ink.png" style="width:120px;height:120px"></div>`;

  const login = `
  <div class="scr" id="s-login">${statusBar()}
    <div style="padding:10px 24px 0">
      <img src="assets/logo-mark-ink.png" style="width:56px;height:56px;margin-top:14px">
      <p class="h1" style="margin-top:22px;font-size:34px">Welcome back</p>
      <p class="t2" style="margin-top:8px;font-size:16px;line-height:1.4">Sign in to see your runway, burn and team.</p>
      <label class="flabel" style="margin-top:30px">Email address</label>
      <div class="field" id="f-email">${ic("mail", 19)}<span id="email-v" class="fv"></span><span class="caret" id="email-c"></span><span id="email-ph">you@company.com</span></div>
      <label class="flabel">Password</label>
      <div class="field" id="f-pass">${ic("lock", 19)}<span id="pass-v" class="fv" style="letter-spacing:2px"></span><span class="caret" id="pass-c"></span><span id="pass-ph">Your password</span></div>
      <p style="text-align:right;margin-top:14px;font-size:14px;font-weight:600">Forgot password?</p>
      <div class="btn" id="login-btn" style="margin-top:22px"><span id="login-txt">Log in</span><span class="spin" id="login-spin"></span></div>
      <div class="divider"><span>or continue with</span></div>
      <div class="btn ghost">${GOOGLE} Google</div>
    </div>
    <p class="t3" style="position:absolute;bottom:40px;width:100%;text-align:center;font-size:13.5px">Your AI CFO is ready when you are</p>
  </div>`;

  $("#phone").innerHTML = `
    <div id="tabs" class="scr" style="background:transparent">
      ${home}${expenses}${team}${ai}
      <div id="ask-btn">${ic("sparkles", 24, 2)}</div>
      <div id="tabbar"><div class="tb-pill"><span id="tb-ind"></span>
        <div class="tab" id="tab-home">${ic("home", 22)}<span>Home</span></div>
        <div class="tab" id="tab-exp">${ic("receipt", 22)}<span>Expenses</span></div>
        <div class="tb-add" id="tab-add">${ic("plus", 24, 2.4)}</div>
        <div class="tab" id="tab-team">${ic("users", 22)}<span>Team</span></div>
        <div class="tab" id="tab-ai">${ic("sparkles", 22)}<span>AI CFO</span></div>
      </div></div>
      ${sheet}
    </div>
    ${spring}${splash}${login}${scan}${review}${chat}${runway}${settings}
    <div id="toast"><i>${ic("check", 15, 3)}</i>Expense saved · runway updated</div>
    <div class="island"></div><div class="homeind" id="homeind"></div>`;
}

/* ---------------- navigation timeline ---------------- */
const NAV = [
  [0, "spring", "none"],
  [A, "splash", "zoom"],
  [A + 1.4, "login", "fade"],
  [A + 5.8, "tabs", "fade"],
  [A + 14.65, "scan", "push"],
  [A + 18.8, "review", "push"],
  [A + 21.95, "tabs", "pop"],
  [A + 38.65, "chat", "push"],
  [A + 47.45, "tabs", "pop"],
  [A + 49.45, "runway", "push"],
  [A + 53.45, "tabs", "pop"],
  [A + 54.25, "settings", "push"],
  [A + 57.05, "tabs", "pop"],
];
const TABNAV = [[0, "home"], [A + 24.65, "exp"], [A + 29.05, "team"], [A + 33.05, "ai"], [A + 48.45, "home"]];
const TAB_IDX = { home: 0, exp: 1, team: 3, ai: 4 };
const DARK_AT = A + 55.7;

/* cursor: [time, target, kind] kind: "click" | "down" | "drag" | "move" */
const ph = (x, y) => ({ ph: [x, y] });
const CURSOR = [
  [10.3, { sc: [0.7, 0.66] }, "move"],
  [A - 0.15, "#app-rx", "click"],
  [A + 1.9, "#f-email", "click"],
  [A + 3.8, "#f-pass", "click"],
  [A + 5.0, "#login-btn", "click"],
  [A + 8.8, ph(200, 640), "down"],
  [A + 10.4, ph(200, 340), "drag"],
  [A + 11.5, ph(200, 360), "down"],
  [A + 12.6, ph(200, 660), "drag"],
  [A + 13.2, "#tab-add", "click"],
  [A + 14.6, "#opt-scan", "click"],
  [A + 17.5, "#shutter", "click"],
  [A + 21.8, "#save-btn", "click"],
  [A + 24.6, "#tab-exp", "click"],
  [A + 26.4, ph(200, 660), "down"],
  [A + 27.6, ph(200, 420), "drag"],
  [A + 29.0, "#tab-team", "click"],
  [A + 33.0, "#tab-ai", "click"],
  [A + 35.9, ph(200, 660), "down"],
  [A + 37.3, ph(200, 340), "drag"],
  [A + 38.6, "#ask-btn", "click"],
  [A + 39.2, "#chat-input", "click"],
  [A + 41.3, "#send-btn", "click"],
  [A + 47.4, "#chat-back", "click"],
  [A + 48.4, "#tab-home", "click"],
  [A + 49.4, "#runway-card", "click"],
  [A + 53.4, "#runway-back", "click"],
  [A + 54.2, "#avatar", "click"],
  [A + 55.6, "#seg-dark", "click"],
  [A + 57.0, "#settings-back", "click"],
];
const SCROLLS = { // screen -> [[t0, t1, from, to]]
  home: [[A + 8.8, A + 10.4, 0, 300], [A + 11.5, A + 12.6, 300, 0]],
  exp: [[A + 26.4, A + 27.6, 0, 240]],
  ai: [[A + 35.9, A + 37.3, 0, 320]],
};
const CAPTIONS = [
  [A + 1.6, A + 5.6, "Sign in, safely.", "Email or Google. Verified before your numbers load."],
  [A + 6.0, A + 12.9, "Your runway, live.", "Cash, burn and months left, always current."],
  [A + 13.4, A + 21.6, "Snap a receipt.", "AI reads the amount, vendor, date and category."],
  [A + 22.1, A + 28.7, "Every rupee, sorted.", "Burn and runway update the moment you save."],
  [A + 29.1, A + 32.8, "Teams and payroll.", "Members, salaries and budgets in one ledger."],
  [A + 33.2, A + 38.4, "AI CFO, built in.", "Insights and savings drawn from your own books."],
  [A + 38.8, A + 47.2, "Ask anything.", "Plain answers from real figures, never made up."],
  [A + 48.6, A + 53.8, "See when cash runs out.", "A live projection with early warning signals."],
  [A + 54.2, A + 58.2, "Light or dark.", "Your preference, remembered across devices."],
];
const CHAT_ANSWER = [
  [["You have ", 0], ["16.4 months", 1], [" of runway at a ₹4.6L monthly burn.", 0]],
  [["Three moves would add about ", 0], ["3.7 months", 1], [":", 0]],
  [["1. ", 1], ["Rightsize idle EC2 instances (₹9k/mo)", 0]],
  [["2. ", 1], ["Pause low-ROI LinkedIn ads (₹6k/mo)", 0]],
  [["3. ", 1], ["Move the next design hire to Q2 (₹70k/mo)", 0]],
];
const CHAT_Q = "How can we extend our runway?";

/* ---------------- sound cues (read by the audio script) ---------------- */
const SFX = [];
(function buildSfx() {
  [2.25, 4.95, 7.85, A + 59.8].forEach((t) => SFX.push({ t, type: "whoosh" }));
  [2.9, 5.25].forEach((t) => SFX.push({ t, type: "pop" }));
  CURSOR.forEach(([t, , k]) => { if (k === "click" || k === "down") SFX.push({ t, type: "click" }); });
  const keys = (str, a, b) => { for (let i = 0; i < str.length; i++) if (str[i] !== " ") SFX.push({ t: a + ((b - a) * (i + 0.5)) / str.length, type: "key" }); };
  keys("aisha@acme.in", A + 2.2, A + 3.6);
  keys("password", A + 3.95, A + 4.6);
  keys(CHAT_Q, A + 39.4, A + 41.0);
  SFX.push({ t: A + 17.55, type: "shutter" });
  SFX.push({ t: A + 18.7, type: "sparkle" });
  SFX.push({ t: A + 22.2, type: "chime" });
  SFX.push({ t: A + 60.6, type: "logo" });
})();

/* ---------------- render ---------------- */
let EL = {};
function setVis(el, on) { el.style.visibility = on ? "visible" : "hidden"; }

function renderIntro(t) {
  const L = $("#intro");
  const outro = 1 - eio(pr(t, 7.5, 8.3));
  L.style.opacity = outro;
  L.style.visibility = outro > 0 ? "visible" : "hidden";
  if (outro <= 0) return;

  // phase 1: "Still guessing"
  const w1 = EL.still;
  const a1 = eo(pr(t, 0.25, 1.05)), o1 = eio(pr(t, 2.05, 2.45));
  w1.style.left = "50%";
  w1.style.transform = `translate(-50%,-50%) translateY(${(1 - a1) * 46 - o1 * 60}px)`;
  w1.style.opacity = a1 * (1 - o1);
  w1.style.filter = `blur(${(1 - a1) * 14 + o1 * 10}px)`;

  // phase 2: "How long will [stack] your cash last?"
  const a2 = eo(pr(t, 2.35, 3.05)), o2 = eio(pr(t, 4.7, 5.1));
  const gap = 108 * back(pr(t, 2.75, 3.35));
  EL.how.style.left = `${960 - gap - EL.howW}px`;
  EL.cash.style.left = `${960 + gap}px`;
  [EL.how, EL.cash].forEach((w, i) => {
    const a = eo(pr(t, 2.35 + i * 0.12, 3.05 + i * 0.12));
    w.style.transform = `translateY(-50%) translateY(${(1 - a) * 46 - o2 * 60}px)`;
    w.style.opacity = a * (1 - o2);
    w.style.filter = `blur(${(1 - a) * 14 + o2 * 10}px)`;
  });
  const sp = back(pr(t, 2.85, 3.4));
  EL.stack.style.opacity = cl(sp * 3) * (1 - o2);
  EL.stack.style.transform = `scale(${0.3 + 0.7 * sp}) translateY(${-o2 * 60}px)`;
  const cyc = Math.max(0, t - 3.3) / 0.55;
  for (let i = 0; i < 3; i++) {
    const k = (i + Math.floor(cyc)) % 3;
    const f = eo(cyc % 1);
    const rot = [-9, 5, -2][k], dx = [-14, 12, 0][k], dy = [6, -4, 0][k];
    const prevk = (k + 2) % 3;
    const r0 = [-9, 5, -2][prevk], x0 = [-14, 12, 0][prevk], y0 = [6, -4, 0][prevk];
    const z = t < 3.3 ? [rot, dx, dy] : [lerp(r0, rot, f), lerp(x0, dx, f), lerp(y0, dy, f)];
    const el = EL.sc[i];
    el.style.transform = `translate(${z[1]}px,${z[2]}px) rotate(${z[0]}deg)`;
    el.style.zIndex = k + 1;
  }

  // phase 3: "Meet [logo] RunwayX" with chips flying outward
  const a3 = eo(pr(t, 5.15, 5.85)), o3 = eio(pr(t, 7.3, 7.9));
  EL.meet.style.opacity = a3 * (1 - o3);
  EL.meet.style.transform = `scale(${0.94 + 0.06 * a3 + o3 * 0.06})`;
  EL.meet.style.filter = `blur(${(1 - a3) * 12 + o3 * 8}px)`;
  EL.meetLogo.style.transform = `scale(${back(pr(t, 5.25, 5.85))}) rotate(${(1 - eo(pr(t, 5.25, 5.85))) * -20}deg)`;
  EL.chips.forEach((c, i) => {
    const s0 = 4.85 + (i % 6) * 0.17 + Math.floor(i / 6) * 0.45;
    const x = pr(t, s0, s0 + 3.1);
    const ang = (i * 137.5 * Math.PI) / 180 + 0.4;
    const r = 300 + 900 * Math.pow(x, 1.7);
    const sc = 0.75 + 1.25 * x;
    const vis = x > 0 && x < 1 ? Math.min(cl(x * 6), 1 - pr(x, 0.75, 1)) : 0;
    c.style.opacity = vis;
    c.style.transform = `translate(${960 + Math.cos(ang) * r * 1.35 - c.offsetWidth / 2}px,${540 + Math.sin(ang) * r * 0.8 - c.offsetHeight / 2}px) scale(${sc})`;
    c.style.filter = `blur(${Math.max(0, (sc - 1.05) * 9) + (x < 0.15 ? (0.15 - x) * 40 : 0)}px)`;
    c.style.zIndex = Math.round(sc * 10);
  });
}

// Camera: the whole MacBook always stays in frame (no cropping), centred under
// the chapter title. Only a very slow drift so the shot doesn't feel frozen.
function camAt(t) {
  const s = 0.8 + 0.012 * eio(pr(t, 10, A + 58)) - 0.012 * eio(pr(t, A + 58, A + 60));
  return { s, cx: 778, cy: 418 + Math.sin(t * 0.35) * 2 };
}
function renderDesk(t) {
  const c = camAt(t);
  EL.cam.style.transform = `translate(${960 - c.cx * c.s}px,${540 - c.cy * c.s}px) scale(${c.s})`;
  const rise = eo(pr(t, 7.85, 10.0));
  EL.mac.style.transform = `translateY(${(1 - rise) * 980}px)`;
  EL.desk.style.visibility = t > 7.4 ? "visible" : "hidden";
  // backdrop drifts slightly against the camera for depth
  EL.backdrop.style.transform = `scale(${1 + (c.s - 0.8) * 0.6})`;
}

function renderNav(t) {
  const SCR = EL.scr;
  Object.values(SCR).forEach((el) => { setVis(el, false); el.style.transform = ""; el.style.opacity = 1; el.style.filter = ""; el.style.zIndex = ""; });
  let i = 0;
  for (let k = 0; k < NAV.length; k++) if (t >= NAV[k][0]) i = k;
  const [t0, cur, type] = NAV[i];
  const prev = i > 0 ? NAV[i - 1][1] : null;
  const dur = type === "push" || type === "pop" ? 0.5 : type === "zoom" ? 0.55 : 0.4;
  const x = pr(t, t0, t0 + dur);
  const C = SCR[cur], P = prev && SCR[prev];
  setVis(C, true);
  if (x < 1 && P) {
    setVis(P, true);
    const e = eo(x);
    if (type === "fade") { C.style.zIndex = 3; P.style.zIndex = 2; C.style.opacity = e; C.style.transform = `scale(${0.98 + 0.02 * e})`; }
    if (type === "zoom") {
      C.style.zIndex = 3; C.style.opacity = cl(x * 2.5);
      C.style.transformOrigin = EL.iconOrigin;
      C.style.transform = `scale(${lerp(0.17, 1, e)})`;
      C.style.borderRadius = `${(1 - e) * 80}px`;
    }
    if (type === "push") { C.style.zIndex = 3; P.style.zIndex = 2; C.style.transform = `translateX(${(1 - e) * 393}px)`; P.style.transform = `translateX(${-e * 118}px)`; P.style.filter = `brightness(${1 - 0.1 * e})`; C.style.boxShadow = "-10px 0 30px rgba(0,0,0,.12)"; }
    if (type === "pop") { P.style.zIndex = 3; C.style.zIndex = 2; P.style.transform = `translateX(${e * 393}px)`; C.style.transform = `translateX(${-(1 - e) * 118}px)`; C.style.filter = `brightness(${0.9 + 0.1 * e})`; }
  } else C.style.boxShadow = "";
  EL.homeind.style.background = cur === "scan" || cur === "spring" ? "#fff" : "";

  // tabs inside the tab layer
  let j = 0;
  for (let k = 0; k < TABNAV.length; k++) if (t >= TABNAV[k][0]) j = k;
  const tcur = TABNAV[j][1], tprev = j > 0 ? TABNAV[j - 1][1] : null;
  const tx = pr(t, TABNAV[j][0], TABNAV[j][0] + 0.22);
  const tabsOn = EL.scr.tabs.style.visibility === "visible";
  ["home", "exp", "team", "ai"].forEach((n) => setVis(EL.tab[n], tabsOn && (n === tcur || (tx < 1 && n === tprev))));
  [EL.ask, $("#tabbar")].forEach((el) => setVis(el, tabsOn));
  EL.tab[tcur].style.opacity = tprev ? eo(tx) : 1;
  EL.tab[tcur].style.zIndex = 2;
  if (tprev) { EL.tab[tprev].style.zIndex = 1; EL.tab[tprev].style.opacity = 1; }
  // indicator
  const ia = TAB_IDX[tprev || tcur], ib = TAB_IDX[tcur];
  const ix = lerp(EL.tabX[ia], EL.tabX[ib], eo(pr(t, TABNAV[j][0], TABNAV[j][0] + 0.32)));
  EL.ind.style.transform = `translateX(${ix}px)`;
  ["home", "exp", "team", "ai"].forEach((n) => EL.tabBtn[n].classList.toggle("on", n === tcur));
  // ask button on home and AI only
  const showAsk = tcur === "home" || tcur === "ai";
  const ak = showAsk ? back(cl(tx * 1.4)) : 1 - eo(cl(tx * 2));
  EL.ask.style.transform = `scale(${0.6 + 0.4 * ak})`;
  EL.ask.style.opacity = cl(ak);

  // scroll offsets
  for (const [n, list] of Object.entries(SCROLLS)) {
    let y = 0;
    for (const [a, b, f, to] of list) { if (t >= a) y = lerp(f, to, eio(pr(t, a, b))); }
    if (n === "home" && t >= A + 48.4) y = 0;
    EL.content[n].style.transform = `translateY(${-y}px)`;
  }

  // sheet
  const up = eo(pr(t, A + 13.3, A + 13.75)), dn = eio(pr(t, A + 14.65, A + 14.95));
  const sh = up * (1 - dn);
  EL.scrim.style.visibility = sh > 0 && tabsOn ? "visible" : "hidden";
  setVis(EL.sheet, tabsOn);
  EL.scrim.style.opacity = sh;
  EL.sheet.style.transform = `translateY(${(1 - sh) * 110}%)`;

  EL.phone.classList.toggle("dark", t >= DARK_AT);
}

function renderScreens(t) {
  // login
  const em = typed("aisha@acme.in", t, A + 2.2, A + 3.6);
  EL.emailV.textContent = em;
  EL.emailPh.style.display = em ? "none" : "";
  const pw = typed("••••••••", t, A + 3.95, A + 4.6);
  EL.passV.textContent = pw;
  EL.passPh.style.display = pw ? "none" : "";
  const fE = t >= A + 1.95 && t < A + 3.85, fP = t >= A + 3.85 && t < A + 5.0;
  EL.fEmail.classList.toggle("focus", fE);
  EL.fPass.classList.toggle("focus", fP);
  const blink = (Math.floor(t * 2.2) % 2 === 0) ? 1 : 0;
  EL.emailC.style.opacity = fE ? blink : 0;
  EL.passC.style.opacity = fP ? blink : 0;
  const loading = t >= A + 5.05;
  EL.loginTxt.style.opacity = loading ? 0 : 1;
  EL.loginSpin.style.opacity = loading ? 1 : 0;
  EL.loginSpin.style.transform = `rotate(${t * 720}deg)`;

  // home
  const h0 = A + 5.9;
  const saved = A + 22.4;
  const sv = eio(pr(t, saved, saved + 1.0));
  const run = t < saved ? 18.0 * eo(pr(t, h0 + 0.2, h0 + 1.5)) : lerp(18.0, 16.4, sv);
  EL.hRun.textContent = run.toFixed(1);
  EL.hCash.textContent = `₹${lerp(75.6, 75.2, sv).toFixed(1)}L`;
  EL.hBurn.textContent = `₹${lerp(4.2, 4.6, sv).toFixed(1)}L`;
  EL.hBdv.textContent = `${lerp(3.1, 12.4, sv).toFixed(1)}%`;
  const noteAfter = t >= saved + 0.3;
  EL.hNote.textContent = noteAfter ? "−1.6 mo · AWS added just now" : "+2.0 mo vs last month";
  EL.hNote.style.color = noteAfter ? (t >= DARK_AT ? "#b25a00" : "#ffb36b") : "";
  BURN.forEach((v, i) => {
    const g = eo(pr(t, h0 + 0.3 + i * 0.08, h0 + 1.1 + i * 0.08));
    const val = i === 5 ? lerp(v, 4.6, sv) : v;
    EL.hb[i].style.height = `${(val / 5) * 100 * g}%`;
  });
  EL.hbTip.textContent = `₹${lerp(4.2, 4.6, sv).toFixed(1)}L`;
  EL.hbTip.style.opacity = eo(pr(t, h0 + 1.0, h0 + 1.4));
  const legW = [38, 31, 14, 9, 8];
  EL.hs.forEach((s, i) => { s.style.width = `${legW[i] * eo(pr(t, h0 + 3.2 + i * 0.1, h0 + 4.2 + i * 0.1))}%`; });
  EL.spark.style.strokeDashoffset = `${EL.sparkL * (1 - eo(pr(t, h0 + 0.2, h0 + 1.6)))}`;
  if (t >= saved && !EL.recentSet) { EL.recent.outerHTML = lrow("server", "#fff1e5", "#d9670f", "AWS", "Software · Just now", "₹38,400", "h-recent"); EL.recent = $("#h-recent"); EL.recentSet = true; }
  if (t < saved && EL.recentSet) { EL.recent.outerHTML = lrow("laptop", "#f1ecff", "#6b4de6", "Figma", "Software · Yesterday", "₹3,100", "h-recent"); EL.recent = $("#h-recent"); EL.recentSet = false; }
  // toast
  const ts = win(t, A + 22.3, A + 24.4, 0.35, 0.35);
  EL.toast.style.opacity = ts;
  EL.toast.style.transform = `translateX(-50%) translateY(${(1 - ts) * -24}px) scale(${0.92 + 0.08 * ts})`;

  // scan
  const sl = (t - (A + 15.1)) / 1.9;
  EL.scanline.style.top = `${160 + 440 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * Math.max(0, sl) * 0.5))}px`;
  EL.scanline.style.opacity = t > A + 15.0 && t < A + 17.5 ? 1 : 0;
  EL.flash.style.opacity = bump(t, A + 17.52, A + 17.85) * 0.9;
  const rd = win(t, A + 17.65, A + 19.2, 0.3, 0.1);
  EL.reading.style.opacity = rd;
  EL.readIc.style.transform = `rotate(${t * 240}deg)`;
  EL.receipt.style.transform = `rotate(${-3 + Math.sin(t * 1.3) * 0.6}deg) translate(${Math.sin(t * 0.9) * 2}px,${Math.cos(t * 1.1) * 2}px)`;
  EL.shutter.style.transform = `scale(${1 - 0.1 * bump(t, A + 17.4, A + 17.65)})`;

  // review: fields fill one by one
  const r0 = A + 19.1;
  const amt = 38400 * eo(pr(t, r0, r0 + 0.9));
  EL.rvAmt.textContent = inr(amt);
  for (let i = 0; i < 5; i++) {
    const f = pr(t, r0 + 0.25 + i * 0.32, r0 + 0.5 + i * 0.32);
    EL.rv[i].style.opacity = f;
    EL.rs[i].style.opacity = 1 - f;
    EL.rs[i].style.backgroundPosition = `${-((t * 1.5) % 2) * 100}% 0`;
  }
  EL.rvBadge.style.opacity = eo(pr(t, r0 - 0.1, r0 + 0.4));
  EL.save.style.transform = `scale(${1 - 0.04 * bump(t, A + 21.72, A + 21.92)})`;

  // expenses: highlight the new row
  const hl = win(t, A + 24.8, A + 27.0, 0.3, 0.8);
  EL.exNew.style.background = `rgba(155,225,93,${0.22 * hl})`;
  EL.exBar.style.width = `${62 * eo(pr(t, A + 24.7, A + 25.6))}%`;

  // team bars
  [86, 64, 48, 40].forEach((p, i) => { EL.tb[i].style.width = `${p * eo(pr(t, A + 29.2 + i * 0.1, A + 30.2 + i * 0.1))}%`; });
  EL.tmBar.style.width = `${78 * eo(pr(t, A + 29.1, A + 30.0))}%`;

  // AI insights: shimmer, then cards in sequence
  const aiT = A + 33.1;
  const sk = 1 - pr(t, aiT + 0.9, aiT + 1.1);
  EL.aiSk.style.opacity = sk;
  EL.aiSk.querySelectorAll("i").forEach((i) => { i.style.backgroundPosition = `${-((t * 1.4) % 2) * 100}% 0`; });
  EL.aiRef.style.transform = `rotate(${t < aiT + 1.0 ? t * 360 : 0}deg)`;
  EL.ai.forEach((c, i) => {
    const f = eo(pr(t, aiT + 1.0 + i * 0.16, aiT + 1.5 + i * 0.16));
    c.style.opacity = f;
    c.style.transform = `translateY(${(1 - f) * 22}px)`;
  });
  [16.4, 16.7, 17.0, 17.6, 18.8, 20.1].forEach((v, i) => { EL.ai2b[i].style.height = `${(v - 12) * 7.5 * eo(pr(t, aiT + 1.5 + i * 0.07, aiT + 2.2 + i * 0.07))}px`; });

  // chat
  const q = typed(CHAT_Q, t, A + 39.4, A + 41.0);
  const sent = t >= A + 41.35;
  EL.cPh.textContent = sent ? "Ask about your numbers…" : q || "Ask about your numbers…";
  EL.cPh.classList.toggle("typed", !sent && !!q);
  const you = eo(pr(t, A + 41.35, A + 41.65));
  EL.cYou.style.opacity = you;
  EL.cYou.style.transform = `translateY(${(1 - you) * 16}px)`;
  const dotsOn = t >= A + 41.6 && t < A + 42.4;
  EL.cDots.style.display = t >= A + 42.4 ? "none" : "";
  EL.cDots.style.opacity = dotsOn ? 1 : 0;
  EL.cDots.querySelectorAll("i").forEach((d, i) => { d.style.transform = `translateY(${-4 * Math.max(0, Math.sin(t * 9 - i * 0.9))}px)`; });
  const total = CHAT_ANSWER.flat().reduce((n, [s]) => n + s.length, 0);
  let n = Math.round(total * pr(t, A + 42.4, A + 46.4));
  EL.cBot.style.opacity = t >= A + 42.4 ? 1 : 0;
  const html = CHAT_ANSWER.map((line, li) => {
    const parts = [];
    for (const [s, b] of line) { if (n <= 0) break; const piece = s.slice(0, n); n -= piece.length; parts.push(b ? `<b>${piece}</b>` : piece); }
    if (!parts.length) return "";
    return `<div style="${li ? "margin-top:" + (li === 1 ? 10 : 4) + "px" : ""}">${parts.join("")}</div>`;
  }).join("");
  if (EL.cBot.innerHTML !== html) EL.cBot.innerHTML = html;

  // runway screen chart
  const rw = A + 49.8;
  EL.rwLine.style.strokeDashoffset = `${EL.rwLineL * (1 - eo(pr(t, rw, rw + 0.7)))}`;
  EL.rwFill.style.opacity = eo(pr(t, rw + 0.3, rw + 0.9));
  EL.rwProj.style.opacity = eo(pr(t, rw + 0.6, rw + 1.2));
  EL.rwProj.style.strokeDashoffset = `${-t * 10}`;
  EL.rwDot.setAttribute("r", 7 + 2 * Math.max(0, Math.sin(t * 4)));
  EL.rwEnd.style.opacity = eo(pr(t, rw + 1.1, rw + 1.5));
  EL.rwN.textContent = (16.4 * eo(pr(t, rw - 0.2, rw + 0.9))).toFixed(1);

  // settings segmented control
  EL.segInd.style.transform = `translateX(${eo(pr(t, A + 55.65, A + 55.95)) * 100}%)`;
}

function cursorTarget(tgt) {
  if (typeof tgt === "string") { const r = $(tgt).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  if (tgt.ph) { const r = EL.phone.getBoundingClientRect(); const k = r.width / 393; return [r.left + tgt.ph[0] * k, r.top + tgt.ph[1] * k]; }
  if (tgt.sc) { const r = $("#screen").getBoundingClientRect(); return [r.left + r.width * tgt.sc[0], r.top + r.height * tgt.sc[1]]; }
}

function renderCursor(t) {
  const s = camAt(t).s;
  const vis = win(t, 10.25, A + 58.6, 0.3, 0.4);
  EL.cursor.style.opacity = vis;
  if (vis <= 0) { EL.ripple.style.opacity = 0; return; }
  let i = 0;
  for (let k = 0; k < CURSOR.length; k++) if (t >= CURSOR[k][0]) i = k;
  let pos;
  const next = CURSOR[i + 1];
  const [ti, tgi] = CURSOR[i];
  const pi = cursorTarget(tgi);
  if (t < CURSOR[0][0]) pos = cursorTarget(CURSOR[0][1]);
  else if (next) {
    const [tn, tgn, kn] = next;
    const pn = cursorTarget(tgn);
    let f;
    if (kn === "drag") f = eio(pr(t, ti, tn));
    else { const d = Math.min(0.8, tn - ti - 0.25); f = eio(pr(t, tn - 0.1 - d, tn - 0.1)); }
    pos = [lerp(pi[0], pn[0], f), lerp(pi[1], pn[1], f)];
  } else pos = pi;
  // pressed state: clicks are short, drags hold from "down" to "drag"
  let press = 0;
  CURSOR.forEach(([tc, , k], idx) => {
    if (k === "click") press = Math.max(press, bump(t, tc - 0.05, tc + 0.15));
    if (k === "down" && CURSOR[idx + 1]) press = Math.max(press, t >= tc && t <= CURSOR[idx + 1][0] ? Math.min(cl((t - tc) / 0.08), cl((CURSOR[idx + 1][0] + 0.1 - t) / 0.1)) : 0);
  });
  const sz = 1.0;
  EL.cursor.style.transform = `translate(${pos[0] - 8}px,${pos[1] - 4}px) scale(${sz * (1 - 0.14 * press)})`;
  // ripple on the most recent click inside the phone
  let rp = 0, rpos = null;
  CURSOR.forEach(([tc, tg, k]) => { if ((k === "click" || k === "down") && t >= tc && t < tc + 0.45 && tc > 12) { rp = pr(t, tc, tc + 0.45); rpos = cursorTarget(tg); } });
  if (rpos) {
    EL.ripple.style.opacity = 0.9 * (1 - rp);
    EL.ripple.style.transform = `translate(${rpos[0]}px,${rpos[1]}px) scale(${(0.35 + 0.75 * eo(rp)) * s})`;
  } else EL.ripple.style.opacity = 0;
}

function renderCaption(t) {
  const c = CAPTIONS.findIndex(([a, b]) => t >= a - 0.1 && t < b + 0.1);
  if (c < 0) { EL.cap.style.opacity = 0; return; }
  const [a, b, h, s] = CAPTIONS[c];
  const v = win(t, a, b, 0.5, 0.35);
  EL.cap.style.opacity = v;
  EL.cap.style.transform = `translateY(${(1 - eo(pr(t, a, a + 0.6))) * 18}px)`;
  EL.cap.style.filter = `blur(${(1 - v) * 6}px)`;
  const n = `${String(c + 1).padStart(2, "0")} / ${String(CAPTIONS.length).padStart(2, "0")}`;
  if (EL.capN.textContent !== n) { EL.capN.textContent = n; EL.capH.textContent = h; EL.capS.textContent = s; }
}

function renderOutro(t) {
  const o0 = A + 60.0;
  const v = eio(pr(t, o0, o0 + 0.7));
  EL.outro.style.opacity = v;
  EL.outro.style.visibility = v > 0 ? "visible" : "hidden";
  if (v <= 0) return;
  const lg = back(pr(t, o0 + 0.5, o0 + 1.1));
  EL.oLogo.style.transform = `scale(${lg}) rotate(${(1 - eo(pr(t, o0 + 0.5, o0 + 1.1))) * -16}deg)`;
  EL.oLogo.style.opacity = cl(lg * 2);
  const parts = [EL.oWm, EL.oTg, EL.oCta];
  parts.forEach((p, i) => {
    const f = eo(pr(t, o0 + 0.75 + i * 0.3, o0 + 1.45 + i * 0.3));
    p.style.opacity = f;
    p.style.transform = `translateY(${(1 - f) * 26}px)`;
    p.style.filter = `blur(${(1 - f) * 10}px)`;
  });
}

function render(t) {
  renderIntro(t);
  renderDesk(t);
  renderNav(t);
  renderScreens(t);
  renderCaption(t);
  renderCursor(t);
  renderOutro(t);
}

/* ---------------- init ---------------- */
function init() {
  buildIntro();
  buildDesktop();
  buildPhone();
  $("#outro").innerHTML = `
    <div class="lg"><img id="o-logo" src="assets/logo-mark-ink.png"><span class="wm" id="o-wm">RunwayX</span></div>
    <p class="tg" id="o-tg">Know your runway, not just your <em>spend</em>.</p>
    <div class="cta" id="o-cta"><span class="a">${ic("sparkles", 22, 2)} AI CFO built in</span><span class="b">iOS and Android · Free to start</span></div>`;

  EL = {
    still: $("#w-still"), how: $("#w-how"), cash: $("#w-cash"), stack: $("#stack"), sc: [$("#sc0"), $("#sc1"), $("#sc2")],
    meet: $("#meet"), meetLogo: $("#meet-logo"), chips: [...document.querySelectorAll(".chip")],
    desk: $("#desk"), cam: $("#cam"), mac: $("#mac"), backdrop: $("#backdrop"),
    phone: $("#phone"), homeind: $("#homeind"),
    scr: { spring: $("#s-spring"), splash: $("#s-splash"), login: $("#s-login"), tabs: $("#tabs"), scan: $("#s-scan"), review: $("#s-review"), chat: $("#s-chat"), runway: $("#s-runway"), settings: $("#s-settings") },
    tab: { home: $("#s-home"), exp: $("#s-exp"), team: $("#s-team"), ai: $("#s-ai") },
    tabBtn: { home: $("#tab-home"), exp: $("#tab-exp"), team: $("#tab-team"), ai: $("#tab-ai") },
    content: { home: $("#home-c"), exp: $("#exp-c"), ai: $("#ai-c") },
    ind: $("#tb-ind"), ask: $("#ask-btn"), scrim: $("#scrim"), sheet: $("#sheet"),
    emailV: $("#email-v"), emailPh: $("#email-ph"), emailC: $("#email-c"), passV: $("#pass-v"), passPh: $("#pass-ph"), passC: $("#pass-c"),
    fEmail: $("#f-email"), fPass: $("#f-pass"), loginTxt: $("#login-txt"), loginSpin: $("#login-spin"),
    hRun: $("#h-run"), hCash: $("#h-cash"), hBurn: $("#h-burn"), hBdv: $("#h-bdv"), hNote: $("#h-note"),
    hb: BURN.map((_, i) => $("#hb" + i)), hbTip: $("#hb-tip"), hs: [0, 1, 2, 3, 4].map((i) => $("#hs" + i)), spark: $("#spark"), recent: $("#h-recent"),
    toast: $("#toast"), scanline: $("#scanline"), flash: $("#flash"), reading: $("#reading"), readIc: $("#read-ic"), receipt: $("#receipt"), shutter: $("#shutter"),
    rvAmt: $("#rv-amt"), rv: [0, 1, 2, 3, 4].map((i) => $("#rv" + i)), rs: [0, 1, 2, 3, 4].map((i) => $("#rs" + i)), rvBadge: $("#rv-badge"), save: $("#save-btn"),
    exNew: $("#ex-new"), exBar: $("#ex-bar"), tb: [0, 1, 2, 3].map((i) => $("#tb" + i)), tmBar: $("#tm-bar"),
    aiSk: $("#ai-sk"), aiRef: $("#ai-ref"), ai: [0, 1, 2, 3].map((i) => $("#ai" + i)), ai2b: [0, 1, 2, 3, 4, 5].map((i) => $("#ai2b" + i)),
    cPh: $("#c-ph"), cYou: $("#c-you"), cDots: $("#c-dots"), cBot: $("#c-bot"),
    rwLine: $("#rw-line"), rwFill: $("#rw-fill"), rwProj: $("#rw-proj"), rwDot: $("#rw-dot"), rwEnd: $("#rw-end"), rwN: $("#rw-n"),
    segInd: $("#seg-ind"),
    cursor: $("#cursor"), ripple: $("#ripple"), cap: $("#caption"), capN: $("#cap-n"), capH: $("#cap-h"), capS: $("#cap-s"),
    outro: $("#outro"), oLogo: $("#o-logo"), oWm: $("#o-wm"), oTg: $("#o-tg"), oCta: $("#o-cta"),
  };
}

function measure() {
  EL.howW = EL.how.offsetWidth;
  const pr0 = EL.phone.getBoundingClientRect(), ir = $("#app-rx i").getBoundingClientRect(), kk = pr0.width / 393;
  EL.iconOrigin = `${(ir.left + ir.width / 2 - pr0.left) / kk}px ${(ir.top + ir.height / 2 - pr0.top) / kk}px`;
  // tab indicator x positions (relative to the pill)
  const pill = $(".tb-pill").getBoundingClientRect();
  const k = pill.width / $(".tb-pill").offsetWidth;
  EL.tabX = {};
  [["home", 0], ["exp", 1], ["team", 3], ["ai", 4]].forEach(([n, idx]) => {
    const r = EL.tabBtn[n].getBoundingClientRect();
    EL.tabX[idx] = (r.left - pill.left) / k + r.width / k / 2 - 35;
  });
  EL.sparkL = EL.spark.getTotalLength();
  EL.spark.style.strokeDasharray = EL.sparkL;
  EL.rwLineL = EL.rwLine.getTotalLength();
  EL.rwLine.style.strokeDasharray = EL.rwLineL;
}

window.DURATION = END;
window.SFX = SFX;
window.render = render;
// Thumbnail: the full MacBook on the Overview screen, with a title instead of a chapter.
window.renderPoster = () => {
  render(A + 8.3);
  EL.cursor.style.opacity = 0;
  EL.ripple.style.opacity = 0;
  EL.cap.style.opacity = 1;
  EL.cap.style.transform = "none";
  EL.cap.style.filter = "none";
  EL.capN.textContent = "PRODUCT TOUR · 1:21";
  EL.capH.textContent = "RunwayX, end to end.";
  EL.capS.textContent = "Expenses, receipts, runway, team and the AI CFO on one iPhone.";
};
window.READY = (async () => {
  init();
  await document.fonts.ready;
  await Promise.all([...document.images].map((i) => (i.complete ? 0 : i.decode().catch(() => 0))));
  measure();
  render(0);
  return true;
})();

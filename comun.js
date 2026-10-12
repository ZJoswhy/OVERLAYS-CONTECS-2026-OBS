/* Funciones compartidas de los overlays CONTECS 2026 */
(function(){
  const P = new URLSearchParams(location.search);
  const $ = (s, r=document) => r.querySelector(s);
  const D = () => window.CONTECS || {};
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  // Colores configurables
  function colores(){
    const c = D().colores || {}, r = document.documentElement.style;
    if(c.fondo)  r.setProperty("--fondo-marco", c.fondo);
    if(c.acento) r.setProperty("--verde-400", c.acento);
    if(c.acento2) r.setProperty("--lima", c.acento2);
  }

  // Logo: D.logo (subido en el configurador) > logo.png > texto
  function marca(el, conTag){
    if(!el) return;
    const texto = '<div class="wordmark">CONTECS <span>2026</span></div>';
    el.innerHTML = texto;
    const img = new Image();
    img.onload = () => { el.innerHTML = ""; el.appendChild(img); };
    img.src = D().logo || "logo.png";
  }

  function particulas(canvas, n=70){
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width = 1920, H = canvas.height = 1080;
    const pts = Array.from({length:n}, () => ({x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.6, vy:(Math.random()-.5)*.6}));
    (function frame(){
      ctx.clearRect(0,0,W,H);
      for(const p of pts){ p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W)p.vx*=-1; if(p.y<0||p.y>H)p.vy*=-1; }
      for(let i=0;i<n;i++){
        for(let j=i+1;j<n;j++){
          const a=pts[i], b=pts[j], d=Math.hypot(a.x-b.x,a.y-b.y);
          if(d<190){ ctx.strokeStyle=`rgba(34,197,94,${.28*(1-d/190)})`; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
        }
        ctx.fillStyle="rgba(163,247,91,.75)"; ctx.beginPath(); ctx.arc(pts[i].x,pts[i].y,2.6,0,Math.PI*2); ctx.fill();
      }
      requestAnimationFrame(frame);
    })();
  }

  function ticker(el, segundos=7){
    if(!el) return;
    const msgs = (D().mensajes && D().mensajes.length) ? D().mensajes : [D().hashtag || ""];
    const caja = $(".msg", el);
    let i = 0, actual = null;
    function sig(){
      const s = document.createElement("span");
      s.className = "espera"; s.textContent = msgs[i % msgs.length]; i++;
      caja.appendChild(s);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{ s.className="entra"; }));
      if(actual){ const v=actual; v.className="sale"; setTimeout(()=>v.remove(),800); }
      actual = s;
    }
    sig(); clearInterval(window.__tick); window.__tick = setInterval(sig, segundos*1000);
    const r = $(".reloj", el);
    if(r){ const t=()=>{ r.textContent = new Date().toLocaleTimeString("es-PA",{hour:"numeric",minute:"2-digit"}); }; t(); clearInterval(window.__reloj); window.__reloj = setInterval(t, 10000); }
  }

  function expositor(id){
    if(id === "actual" || id === null || id === undefined || id === "") id = D().actual;
    return (D().expositores || []).find(e => String(e.id) === String(id));
  }

  // Carrusel de patrocinadores: muestra grupos de N logos y va rotando
  function carrusel(el, porGrupo=3, segundos=6){
    if(!el) return;
    const lista = (D().patrocinadores || []).filter(p => p.nombre || p.img);
    if(!lista.length || D().mostrarPatrocinadores === false){ el.style.display="none"; return; }
    const pista = $(".logos-pista", el);
    let g = 0;
    function pinta(){
      const grupo = [];
      for(let k=0;k<Math.min(porGrupo,lista.length);k++) grupo.push(lista[(g*porGrupo+k) % lista.length]);
      pista.classList.remove("vis");
      setTimeout(()=>{
        pista.innerHTML = grupo.map(p => `<div class="logo-p">${p.img?`<img src="${esc(p.img)}" alt="${esc(p.nombre)}">`:`<b>${esc(p.nombre)}</b>`}</div>`).join("");
        pista.classList.add("vis");
      }, 450);
      g++;
    }
    pinta();
    clearInterval(window.__carr);
    if(lista.length > porGrupo) window.__carr = setInterval(pinta, segundos*1000);
  }

  // Recarga datos.js cada pocos segundos; si cambió, llama a cb()
  function vivo(cb, ms=1500){
    if(P.get("vivo") === "0") return;
    let ultimo = JSON.stringify(D());
    setInterval(()=>{
      const s = document.createElement("script");
      s.src = "datos.js?v=" + Date.now();
      s.onload = () => { s.remove(); const ahora = JSON.stringify(D()); if(ahora !== ultimo){ ultimo = ahora; cb(); } };
      s.onerror = () => s.remove();
      document.head.appendChild(s);
    }, ms);
  }

  // Vista previa desde configurar.html (postMessage)
  function escuchaPrevia(cb){
    window.addEventListener("message", ev => {
      if(ev.data && ev.data.tipo === "contecs-datos"){ window.CONTECS = ev.data.datos; cb(); }
    });
  }

  colores();
  // Órdenes en vivo desde el Deck (OBS WebSocket -> obs-browser emit_event "contecs")
  function alEvento(cb){
    window.addEventListener("contecs", ev => {
      const d = ev.detail || {};
      if(d.accion === "actual" && d.id != null && window.CONTECS) window.CONTECS.actual = d.id;
      cb(d);
    });
  }

  window.UT = { get D(){ return D(); }, P, $, esc, marca, particulas, ticker, expositor, carrusel, vivo, escuchaPrevia, colores, alEvento };
})();

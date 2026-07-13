/* =====================================================
   APEX — PROGRAMA ELITE
   elite.js — interacciones propias de esta página
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ─────────────────────────────────────────────
     1. ROADMAP INTERACTIVO
  ───────────────────────────────────────────── */
  (function initRoadmap(){

    const steps = document.querySelectorAll(".rm-step");
    const lineFill = document.getElementById("rmLineFill");
    const panelInner = document.getElementById("rmPanelInner");
    const tagEl   = document.getElementById("rmTag");
    const weekEl  = document.getElementById("rmWeek");
    const titleEl = document.getElementById("rmTitle");
    const descEl  = document.getElementById("rmDesc");
    const skillsEl = document.getElementById("rmSkills");

    if(!steps.length) return;

    const data = [
      {
        tag: "INICIO", week: "SEMANA 1", title: "Introducción",
        desc: "Diagnóstico inicial de manejo y adaptación completa al simulador profesional: postura, configuración de fuerza del volante y primeros contactos con la telemetría.",
        skills: ["Evaluación de nivel", "Setup del simulador", "Primeros circuitos"]
      },
      {
        tag: "FUNDAMENTOS", week: "SEMANA 2–3", title: "Técnica",
        desc: "Frenado progresivo, trazadas ideales y control del vehículo en el límite. Se corrigen vicios y se construye una base sólida antes de sumar velocidad.",
        skills: ["Frenado y trail-braking", "Trazada ideal", "Control de sobreviraje"]
      },
      {
        tag: "ANÁLISIS", week: "SEMANA 3–4", title: "Telemetría",
        desc: "Lectura profesional de datos vuelta a vuelta: comparación de sectores, canales de velocidad, freno y acelerador contra la vuelta de referencia del coach.",
        skills: ["Overlay de vueltas", "Canales de freno/acelerador", "Detección de pérdidas"]
      },
      {
        tag: "COMPETICIÓN", week: "SEMANA 5–6", title: "Racecraft",
        desc: "Estrategia de carrera, adelantamientos limpios, defensa de posición y gestión de neumáticos y combustible en carreras de larga duración.",
        skills: ["Adelantamientos", "Gestión de recursos", "Lectura de carrera"]
      },
      {
        tag: "PRÁCTICA", week: "SEMANA 7", title: "Simulación",
        desc: "Carreras completas en escenarios de competición real, con parrilla, clasificación y condiciones variables, replicando un fin de semana de carrera.",
        skills: ["Clasificación", "Carrera completa", "Condiciones variables"]
      },
      {
        tag: "CERTIFICACIÓN", week: "SEMANA 8", title: "Evaluación Final",
        desc: "Evaluación integral de desempeño, entrega de certificación oficial APEX y presentación en la red de contactos de equipos y organizadores.",
        skills: ["Evaluación final", "Certificación APEX", "Red de contactos"]
      }
    ];

    function render(i){
      const d = data[i];

      panelInner.classList.add("is-swapping");

      setTimeout(() => {
        tagEl.textContent = d.tag;
        weekEl.textContent = d.week;
        titleEl.textContent = d.title;
        descEl.textContent = d.desc;
        skillsEl.innerHTML = d.skills.map(s => `<span class="rm-skill-chip">${s}</span>`).join("");
        panelInner.classList.remove("is-swapping");
      }, 200);

      steps.forEach(s => {
        s.classList.remove("active");
        s.setAttribute("aria-selected", "false");
      });
      steps[i].classList.add("active");
      steps[i].setAttribute("aria-selected", "true");

      const pct = steps.length > 1 ? (i / (steps.length - 1)) * 100 : 0;
      if(lineFill) lineFill.style.width = pct + "%";
    }

    steps.forEach((s, i) => {
      s.addEventListener("click", () => render(i));
    });

    render(0);

  })();


  /* ─────────────────────────────────────────────
     2. TELEMETRÍA EN VIVO
  ───────────────────────────────────────────── */
  (function initTelemetry(){

    const tabs = document.querySelectorAll(".tm-tab");
    const lineEl = document.getElementById("tmLine");
    const areaEl = document.getElementById("tmArea");
    const dotEl  = document.getElementById("tmDot");
    const valueEl = document.getElementById("tmValue");
    const unitEl  = document.getElementById("tmUnit");
    const chart   = document.getElementById("tmChart");

    if(!tabs.length || !chart) return;

    const W = 720, H = 220, PAD = 18;

    const metrics = {
      speed: { unit: "km/h", min: 60, max: 320, base: [140,180,260,300,270,230,290,312] },
      rpm:   { unit: "rpm",  min: 2000, max: 9000, base: [4200,5600,7800,8600,7200,6000,8200,8900] },
      brake: { unit: "%",    min: 0, max: 100, base: [10,0,0,85,60,15,0,95] }
    };

    let current = "speed";
    let raf = null;
    let phase = 0;

    function genPoints(metric, seed){
      const m = metrics[metric];
      const n = m.base.length;
      const pts = [];
      for(let i=0;i<n;i++){
        const noise = Math.sin(seed*0.7 + i*1.3) * (m.max-m.min) * 0.035;
        let v = m.base[i] + noise;
        v = Math.max(m.min, Math.min(m.max, v));
        const x = PAD + (i/(n-1)) * (W-PAD*2);
        const y = H - PAD - ((v-m.min)/(m.max-m.min)) * (H-PAD*2);
        pts.push([x,y,v]);
      }
      return pts;
    }

    function draw(){
      phase += 0.045;
      const pts = genPoints(current, phase);

      const lineStr = pts.map(p => p[0]+","+p[1]).join(" ");
      lineEl.setAttribute("points", lineStr);

      const areaStr = `${PAD},${H-PAD} ` + lineStr + ` ${W-PAD},${H-PAD}`;
      areaEl.setAttribute("points", areaStr);

      const last = pts[pts.length-1];
      dotEl.setAttribute("cx", last[0]);
      dotEl.setAttribute("cy", last[1]);

      valueEl.textContent = Math.round(last[2]).toLocaleString("es-AR");

      raf = requestAnimationFrame(draw);
    }

    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => { t.classList.remove("active"); t.setAttribute("aria-selected","false"); });
        tab.classList.add("active");
        tab.setAttribute("aria-selected","true");
        current = tab.dataset.metric;
        unitEl.textContent = metrics[current].unit;
        chart.classList.add("is-switching");
        setTimeout(() => chart.classList.remove("is-switching"), 350);
      });
    });

    unitEl.textContent = metrics[current].unit;
    draw();

  })();


  /* ─────────────────────────────────────────────
     3. PREGUNTAS FRECUENTES
  ───────────────────────────────────────────── */
  (function initFAQ(){

    const items = document.querySelectorAll(".faq-item");
    if(!items.length) return;

    items.forEach(item => {
      const btn = item.querySelector(".faq-question");
      btn.addEventListener("click", () => {
        const isActive = item.classList.contains("active");
        items.forEach(i => {
          i.classList.remove("active");
          i.querySelector(".faq-question").setAttribute("aria-expanded","false");
        });
        if(!isActive){
          item.classList.add("active");
          btn.setAttribute("aria-expanded","true");
        }
      });
    });

  })();


  /* ─────────────────────────────────────────────
     4. SESIÓN DE COMPETICIÓN
  ───────────────────────────────────────────── */
  (function initSession(){

    const tabs = document.querySelectorAll(".ss-tab");
    const inner = document.getElementById("ssPanelInner");
    const timeEl = document.getElementById("ssTime");
    const titleEl = document.getElementById("ssTitle");
    const descEl = document.getElementById("ssDesc");

    if(!tabs.length) return;

    const data = [
      { time: "18:00 — 18:15", title: "Briefing", desc: "Se define el objetivo de la sesión, el circuito a trabajar y la estrategia según el nivel de cada piloto. Coach y piloto repasan la vuelta anterior antes de salir a pista." },
      { time: "18:15 — 19:00", title: "Simulación", desc: "Trabajo en pista sobre el objetivo definido: técnica, ritmo o carrera completa, según la etapa del programa en la que esté el piloto." },
      { time: "19:00 — 19:20", title: "Telemetría", desc: "Se analizan los datos de la sesión en vivo: comparación contra la vuelta de referencia, sectores donde se pierde tiempo y patrones a corregir." },
      { time: "19:20 — 19:45", title: "Coaching", desc: "Correcciones puntuales guiadas por el coach, con nuevas vueltas de prueba aplicando los ajustes sobre la marcha." },
      { time: "19:45 — 20:00", title: "Debrief", desc: "Cierre de la sesión con un plan de trabajo concreto para la próxima clase y objetivos de mejora personalizados." }
    ];

    function render(i){
      const d = data[i];
      inner.classList.add("is-swapping");
      setTimeout(() => {
        timeEl.textContent = d.time;
        titleEl.textContent = d.title;
        descEl.textContent = d.desc;
        inner.classList.remove("is-swapping");
      }, 200);

      tabs.forEach(t => t.classList.remove("active"));
      tabs[i].classList.add("active");
    }

    tabs.forEach((t,i) => t.addEventListener("click", () => render(i)));

  })();

});

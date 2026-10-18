/* Hanzi Lab — Núcleo: estado y guardado local, repetición espaciada, diccionario,
 * voz, temas, utilidades y componentes compartidos (oración en cuadrícula, ficha de palabra). */
'use strict';
window.HTL = window.HTL || {};
(function (H) {
  const CLAVE = 'hanziLab.estado';
  const VERSION = 1;
  H.CLAVE = CLAVE;
  H.vistas = {};
  H._limpiar = [];
  H.alSalir = fn => H._limpiar.push(fn);

  /* ================= Fechas ================= */
  const dos = n => String(n).padStart(2, '0');
  H.fechaLocal = (d = new Date()) => d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  H.hoy = () => H.fechaLocal();
  H.sumarDias = (f, n) => { const [y, m, d] = f.split('-').map(Number); return H.fechaLocal(new Date(y, m - 1, d + n)); };
  H.diasEntre = (a, b) => { const p = s => s.split('-').map(Number); const [y1, m1, d1] = p(a), [y2, m2, d2] = p(b); return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000); };
  H.fechaLarga = f => { const [y, m, d] = f.split('-').map(Number); const t = new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  H.fechaCorta = f => { if (!f) return '—'; const [y, m, d] = f.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); };

  /* ================= Estado ================= */
  const tipo = v => Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v;
  function estadoInicial() {
    return {
      version: VERSION, creado: new Date().toISOString(), guardadoEn: 0, tutorialVisto: false,
      srs: {}, favoritos: [], propias: [], leidas: {}, actividad: {},
      listas: [{ id: 'mis', nombre: 'Mis palabras', fija: true, ids: [] }],
      quiz: { total: 0, bien: 0 },
      escritura: {},
      ajustes: { tema: 'sistema', velocidadVoz: 0.8, voz: '', pinyinTarjetas: true, pinyinLectura: true, traduccionLectura: false, ultimoRespaldo: '' }
    };
  }
  H.estadoInicial = estadoInicial;
  function normalizar(e) {
    const base = estadoInicial();
    if (tipo(e) !== 'object') return base;
    for (const k of Object.keys(base)) if (tipo(e[k]) !== tipo(base[k])) e[k] = base[k];
    e.quiz = Object.assign({}, base.quiz, e.quiz);
    e.ajustes = Object.assign({}, base.ajustes, e.ajustes);
    e.listas = e.listas.filter(l => l && typeof l.id === 'string' && typeof l.nombre === 'string' && Array.isArray(l.ids));
    if (!e.listas.some(l => l.id === 'mis')) e.listas.unshift(base.listas[0]);
    e.propias = e.propias.filter(v => v && typeof v.id === 'string' && typeof v.h === 'string');
    e.version = VERSION;
    return e;
  }
  H.normalizarEstado = normalizar;
  H.cargar = function () {
    let raw = null;
    try { raw = localStorage.getItem(CLAVE); } catch (err) { H._sinStorage = true; }
    if (!raw) { H.estado = estadoInicial(); return; }
    try { H.estado = normalizar(JSON.parse(raw)); H._ultimoGuardado = JSON.stringify(H.estado); }
    catch (err) {
      try { localStorage.setItem(CLAVE + '.danado', raw); } catch (e2) { /* sin espacio */ }
      H.estado = estadoInicial(); H._avisoDanado = true;
    }
  };
  H.guardar = function () {
    // guardadoEn solo cambia cuando el progreso cambió de verdad (sirve para saber cuál copia es más reciente)
    const previo = H.estado.guardadoEn;
    let txt = JSON.stringify(H.estado);
    if (txt !== H._ultimoGuardado) {
      H.estado.guardadoEn = Date.now(); txt = JSON.stringify(H.estado);
      const sinMarca = JSON.stringify(Object.assign({}, H.estado, { guardadoEn: previo }));
      if (sinMarca === H._ultimoGuardado) { H.estado.guardadoEn = previo; txt = sinMarca; }
      else if (H.archivo) H.archivo.programar();
    }
    H._ultimoGuardado = txt;
    try { localStorage.setItem(CLAVE, txt); return true; }
    catch (err) {
      if (!H._avisoGuardar && !(H.archivo && H.archivo.estado === 'listo')) { H._avisoGuardar = true; H.toast('No se pudo guardar en este navegador. Guarda tu progreso en un archivo desde Ajustes.', 'error'); }
      return false;
    }
  };

  /* ================= Tema claro / oscuro ================= */
  H.aplicarTema = function () {
    const t = H.estado ? H.estado.ajustes.tema : 'sistema';
    if (t === 'claro' || t === 'oscuro') document.documentElement.dataset.tema = t;
    else delete document.documentElement.dataset.tema;
    try { localStorage.setItem('hanziLab.tema', t); } catch (e) { /* nada */ }
    const oscuro = t === 'oscuro' || (t === 'sistema' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', oscuro ? '#0f1424' : '#f5f7fb');
    const b = document.getElementById('btnTema');
    if (b) { b.setAttribute('aria-label', oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'); b.dataset.oscuro = oscuro ? '1' : '0'; }
    return oscuro;
  };
  H.alternarTema = function () {
    const oscuroAhora = document.getElementById('btnTema').dataset.oscuro === '1';
    H.estado.ajustes.tema = oscuroAhora ? 'claro' : 'oscuro';
    H.guardar(); H.aplicarTema();
  };

  /* ================= Actividad ================= */
  H.act = (f = H.hoy()) => (H.estado.actividad[f] = H.estado.actividad[f] || {});
  H.registrar = (m, n = 1) => { const a = H.act(); a[m] = (a[m] || 0) + n; H.guardar(); };
  H.registrarQuiz = ok => { const q = H.estado.quiz; q.total++; if (ok) q.bien++; const a = H.act(); a.quizTotal = (a.quizTotal || 0) + 1; if (ok) a.quizBien = (a.quizBien || 0) + 1; H.guardar(); };
  H.marcarLeida = id => { if (!H.estado.leidas[id]) { H.estado.leidas[id] = H.hoy(); H.registrar('leidas'); } };

  /* ================= Vocabulario ================= */
  let VOCAB = null, PORID = null, PORH = null;
  H.vocabBase = function () {
    if (!VOCAB) VOCAB = HTL.VOCAB_RAW.map(a => ({ id: a[0], h: a[1], p: a[2], es: a[3], n: a[4], alt: a[5] ? a[5].split('|') : [], ej: a[6] ? a[6].split(',') : [] }));
    return VOCAB;
  };
  H.vocab = () => H.vocabBase().concat(H.estado.propias);
  H.reindexar = () => { PORID = null; PORH = null; };
  H.porId = id => { if (!PORID) { PORID = new Map(); for (const v of H.vocab()) PORID.set(v.id, v); } return PORID.get(id) || null; };
  H.porHanzi = h => { if (!PORH) { PORH = new Map(); for (const v of H.vocab()) { if (!PORH.has(v.h)) PORH.set(v.h, []); PORH.get(v.h).push(v); } } return PORH.get(h) || []; };
  H.nivelTexto = n => n ? 'HSK ' + n : 'Del diccionario';
  H.oracionPorId = id => HTL.ORACIONES.find(o => o.id === id) || null;
  H.temaNombre = id => (HTL.TEMAS.find(t => t.id === id) || { nombre: id }).nombre;
  H.esHan = s => /[\u3400-\u9fff]/.test(s);
  H.toggleFav = id => { const f = H.estado.favoritos, i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.push(id); H.guardar(); return i < 0; };

  // Palabra del diccionario guardada para estudiar
  H.agregarPropia = function (ent) {
    const ya = H.vocab().find(v => v.h === ent.s && v.p === ent.p);
    if (ya) return ya;
    const v = { id: 'x' + Date.now().toString(36) + Math.floor(Math.random() * 1000), h: ent.s, p: ent.p, es: ent.es || ent.d.split('; ').slice(0, 3).join('; '), ingles: !ent.es, n: 0, alt: [], ej: H.ejemplosDe(ent.s).slice(0, 3) };
    H.estado.propias.push(v);
    const l = H.estado.listas.find(x => x.id === 'mis'); if (l && !l.ids.includes(v.id)) l.ids.push(v.id);
    H.guardar(); H.reindexar();
    return v;
  };
  H.ejemplosDe = h => HTL.ORACIONES.filter(o => o.tokens.some(t => t[0] === h)).map(o => o.id);

  H.opcionesFuente = function (sel) {
    const opt = (v, t) => `<option value="${H.esc(v)}"${v === sel ? ' selected' : ''}>${H.esc(t)}</option>`;
    return `<optgroup label="Niveles">${HTL.NIVELES.map(n => opt('nivel:' + n.n, n.nombre)).join('')}${opt('todas', 'HSK 1 a 4 completo')}</optgroup>` +
      `<optgroup label="Lo tuyo">${opt('estudiadas', 'Palabras que ya estudiaste')}${opt('fav', 'Favoritas')}${opt('dificiles', 'Palabras difíciles')}${H.estado.listas.map(l => opt('lista:' + l.id, l.nombre + ' (' + l.ids.length + ')')).join('')}</optgroup>`;
  };
  H.selectFuente = (id, sel) => `<select id="${id}">${H.opcionesFuente(sel)}</select>`;
  H.nombreFuente = f => {
    if (!f) return '';
    if (f.startsWith('nivel:')) return 'HSK ' + f.slice(6);
    if (f.startsWith('lista:')) { const l = H.estado.listas.find(x => x.id === f.slice(6)); return l ? l.nombre : 'Lista'; }
    return { todas: 'HSK 1 a 4', estudiadas: 'Palabras estudiadas', fav: 'Favoritas', dificiles: 'Palabras difíciles' }[f] || f;
  };
  H.palabrasDe = function (f) {
    const V = H.vocab(), s = H.estado.srs;
    if (!f || f === 'todas') return H.vocabBase();
    if (f.startsWith('nivel:')) return V.filter(v => v.n === +f.slice(6));
    if (f === 'estudiadas') return V.filter(v => s[v.id]);
    if (f === 'fav') return V.filter(v => H.estado.favoritos.includes(v.id));
    if (f === 'dificiles') return V.filter(v => H.srs.dificil(v.id));
    if (f.startsWith('lista:')) { const l = H.estado.listas.find(x => x.id === f.slice(6)); return l ? l.ids.map(H.porId).filter(Boolean) : []; }
    return V;
  };

  /* ================= Repetición espaciada =================
   * Intervalos: 1 día → 3 días → intervalo × facilidad (máx. 180 días). Un error reinicia la secuencia.
   * Niveles: Nueva, Aprendiendo (<2 aciertos seguidos), En repaso, Consolidada (≥7 días), Dominada (≥21 días y ≥4 aciertos). */
  H.srs = {
    NOMBRES: ['Nueva', 'Aprendiendo', 'En repaso', 'Consolidada', 'Dominada'],
    nivel(c) { if (!c) return 0; if (c.reps < 2) return 1; if (c.intervalo >= 21 && c.aciertos >= 4) return 4; if (c.intervalo >= 7) return 3; return 2; },
    pendientes() { const hoy = H.hoy(), e = H.estado.srs; return H.vocab().filter(v => e[v.id] && e[v.id].proxima <= hoy).map(v => v.id); },
    dificil(id) { const c = H.estado.srs[id]; return !!c && (c.errores >= 2 || (c.errores > 0 && c.errores >= c.aciertos)); },
    calificar(id, sabe) {
      const hoy = H.hoy(), e = H.estado;
      let c = e.srs[id]; const nueva = !c;
      if (!c) c = e.srs[id] = { reps: 0, aciertos: 0, errores: 0, intervalo: 0, facilidad: 2.3, ultima: null, proxima: hoy };
      const tocaba = c.proxima <= hoy;
      let mensaje;
      if (sabe) {
        c.aciertos++;
        if (!nueva && !tocaba) mensaje = 'Aún no tocaba repasarla; su próximo repaso sigue siendo el ' + H.fechaCorta(c.proxima) + '.';
        else {
          c.reps++;
          c.intervalo = c.reps === 1 ? 1 : c.reps === 2 ? 3 : Math.min(180, Math.round(Math.max(c.intervalo, 1) * c.facilidad));
          c.facilidad = Math.min(2.8, c.facilidad + 0.05);
          c.proxima = H.sumarDias(hoy, c.intervalo);
          mensaje = 'Próximo repaso: ' + (c.intervalo === 1 ? 'mañana' : 'en ' + c.intervalo + ' días') + '.';
        }
      } else { c.errores++; c.reps = 0; c.intervalo = 0; c.facilidad = Math.max(1.3, c.facilidad - 0.2); c.proxima = hoy; mensaje = 'Volverá a aparecer hoy.'; }
      c.ultima = hoy;
      const a = H.act();
      if (nueva) a.nuevas = (a.nuevas || 0) + 1; else if (tocaba) a.repasos = (a.repasos || 0) + 1;
      a.tarjetas = (a.tarjetas || 0) + 1; a[sabe ? 'aciertos' : 'errores'] = (a[sabe ? 'aciertos' : 'errores'] || 0) + 1;
      H.guardar();
      return { mensaje, nivel: this.nivel(c) };
    },
    descripcion(c) {
      if (!c) return 'Palabra nueva.';
      return `${this.NOMBRES[this.nivel(c)]}. ${c.aciertos} ${c.aciertos === 1 ? 'acierto' : 'aciertos'} y ${c.errores} ${c.errores === 1 ? 'error' : 'errores'}. Próximo repaso: ${c.proxima <= H.hoy() ? 'hoy' : H.fechaCorta(c.proxima)}.`;
    }
  };

  /* ================= Estadísticas y misiones ================= */
  H.stats = function () {
    const e = H.estado, V = H.vocab(), hoy = H.hoy();
    const dias = Object.keys(e.actividad).filter(f => Object.values(e.actividad[f]).some(n => n > 0)).sort();
    const set = new Set(dias); let racha = 0, f = set.has(hoy) ? hoy : H.sumarDias(hoy, -1);
    while (set.has(f)) { racha++; f = H.sumarDias(f, -1); }
    let aciertos = 0, errores = 0, aprendidas = 0, dominadas = 0, vistas = 0;
    const niveles = [0, 0, 0, 0, 0], porNivel = {}; HTL.NIVELES.forEach(x => { porNivel[x.n] = { total: 0, aprendidas: 0 }; });
    for (const v of V) {
      const c = e.srs[v.id], n = H.srs.nivel(c);
      if (porNivel[v.n]) porNivel[v.n].total++;
      niveles[n]++;
      if (!c) continue;
      vistas++; aciertos += c.aciertos; errores += c.errores;
      if (n >= 2) { aprendidas++; if (porNivel[v.n]) porNivel[v.n].aprendidas++; }
      if (n >= 4) dominadas++;
    }
    return {
      dias, diasEstudio: dias.length, racha, aciertos, errores, niveles, porNivel, aprendidas, dominadas, vistas, total: V.length,
      precisionTarjetas: aciertos + errores ? aciertos / (aciertos + errores) * 100 : NaN,
      precisionQuiz: e.quiz.total ? e.quiz.bien / e.quiz.total * 100 : NaN,
      pendientes: H.srs.pendientes().length, leidas: Object.keys(e.leidas).length
    };
  };
  H.semilla = function (texto) {
    let h = 2166136261;
    for (const ch of texto) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    if (!h) h = 1;
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
  };
  H.misionesHoy = function () {
    const hoy = H.hoy(), act = H.estado.actividad[hoy] || {}, rnd = H.semilla(hoy);
    const fijas = HTL.MISIONES.filter(m => m.fija), pool = HTL.MISIONES.filter(m => !m.fija), el = [];
    while (el.length < 3 && pool.length) el.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return fijas.concat(el).map(m => {
      if (m.especial === 'repasos') {
        const pend = H.srs.pendientes().length, hechos = act.repasos || 0;
        if (!pend) return Object.assign({}, m, { valor: 1, meta: 1, hecha: true, nota: hechos ? `Repasaste ${hechos}. No quedan pendientes.` : 'No tienes repasos pendientes hoy.' });
        return Object.assign({}, m, { valor: hechos, meta: hechos + pend, hecha: false, nota: `${pend} pendientes` });
      }
      const valor = act[m.metrica] || 0;
      return Object.assign({}, m, { valor: Math.min(valor, m.meta), meta: m.meta, hecha: valor >= m.meta });
    });
  };
  H.oracionDelDia = function () {
    const rnd = H.semilla('oracion' + H.hoy());
    const nuevas = HTL.ORACIONES.filter(o => !H.estado.leidas[o.id] && o.nivel <= 5);
    const pool = nuevas.length ? nuevas : HTL.ORACIONES;
    return pool[Math.floor(rnd() * pool.length)];
  };

  /* ================= Diccionario completo (carga diferida) ================= */
  const DIC = { listo: false, s: [], t: [], p: [], d: [], es: [], core: [], np: null, nes: null, nen: null };
  H.dic = DIC;
  H.cargarScript = function (src) {
    H._scripts = H._scripts || {};
    if (H._scripts[src]) return H._scripts[src];
    // Versión de un solo archivo: los datos grandes vienen incrustados en la página como texto.
    const incrustado = document.getElementById('fuente:' + src);
    if (incrustado) {
      H._scripts[src] = new Promise((res, rej) => setTimeout(() => {
        try { const s = document.createElement('script'); s.textContent = incrustado.textContent; document.head.appendChild(s); incrustado.remove(); res(); }
        catch (e) { delete H._scripts[src]; rej(e); }
      }, 30));
      return H._scripts[src];
    }
    H._scripts[src] = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => { delete H._scripts[src]; rej(new Error('No se pudo cargar ' + src)); };
      document.head.appendChild(s);
    });
    return H._scripts[src];
  };
  H.cargarDiccionario = async function () {
    if (DIC.listo) return DIC;
    await H.cargarScript('js/datos/diccionario.js');
    if (DIC.listo) return DIC;
    const lineas = HTL.DIC_RAW.split('\n');
    for (const l of lineas) {
      const c = l.split('\t');
      DIC.s.push(c[0]); DIC.t.push(c[1]); DIC.p.push(c[2]); DIC.d.push(c[3]); DIC.es.push(c[4]); DIC.core.push(c[5]);
    }
    HTL.DIC_RAW = null;
    DIC.porS = new Map();
    DIC.s.forEach((s, i) => { if (!DIC.porS.has(s)) DIC.porS.set(s, []); DIC.porS.get(s).push(i); });
    DIC.t.forEach((t, i) => { if (t && t !== DIC.s[i]) { if (!DIC.porS.has(t)) DIC.porS.set(t, []); DIC.porS.get(t).push(i); } });
    DIC.listo = true;
    return DIC;
  };
  H.entrada = i => ({ i, s: DIC.s[i], t: DIC.t[i], p: DIC.p[i], d: DIC.d[i], es: DIC.es[i], core: DIC.core[i] });
  H.entradasDe = h => (DIC.porS && DIC.porS.get(h) || []).map(H.entrada);
  // Pinyin numerado de CC-CEDICT («jia1», «Lu:4») a pinyin con tonos
  const MARCAS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  H.pyNum = s => String(s).split(/\s+/).map(sil => {
    const m = sil.match(/^([a-zA-ZüÜ:]+)([1-5])$/); if (!m) return sil.replace(/u:/g, 'ü');
    let b = m[1].replace(/u:/g, 'ü').replace(/U:/g, 'Ü'); const t = +m[2]; if (t === 5) return b;
    const low = b.toLowerCase();
    let i = low.indexOf('a'); if (i < 0) i = low.indexOf('e'); if (i < 0 && low.includes('ou')) i = low.indexOf('o');
    if (i < 0) for (let k = low.length - 1; k >= 0; k--) if ('aeiouü'.includes(low[k])) { i = k; break; }
    if (i < 0) return b;
    let mk = MARCAS[low[i]][t - 1]; if (b[i] !== low[i]) mk = mk.toUpperCase();
    return b.slice(0, i) + mk + b.slice(i + 1);
  }).join(' ');
  // Definición en inglés legible: «CL:個|个[ge4]» → «clasificador: 个 (gè)»
  H.defIngles = d => String(d || '')
    .replace(/(?:[^\s,;:|\[\]()]+\|)?([^\s,;:|\[\]()]+)\[([^\]]+)\]/g, (_, h, p) => `${h} (${H.pyNum(p)})`)
    .replace(/\bCL:/g, 'clasificador: ').replace(/\),(?=\S)/g, '), ');
  H.normPinyin = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ü|u:/g, 'v').replace(/[\s'’·\-0-9]/g, '');
  H.buscarDic = function (qRaw, limite = 80) {
    const q = qRaw.trim();
    if (!q || !DIC.listo) return [];
    const res = [];
    if (H.esHan(q)) {
      const exact = [], pref = [], cont = [];
      for (let i = 0; i < DIC.s.length; i++) {
        const s = DIC.s[i], t = DIC.t[i];
        if (s === q || t === q) exact.push(i);
        else if (s.startsWith(q) || (t && t.startsWith(q))) { if (pref.length < limite) pref.push(i); }
        else if ((s.includes(q) || (t && t.includes(q))) && cont.length < limite) cont.push(i);
      }
      return exact.concat(pref, cont).slice(0, limite).map(H.entrada);
    }
    if (!DIC.np) {
      DIC.np = DIC.p.map(H.normPinyin);
      DIC.nes = DIC.es.map(x => x ? ' ' + H.norm(x) + ' ' : '');
      DIC.nen = DIC.d.map(x => ' ' + x.toLowerCase() + ' ');
    }
    const qp = H.normPinyin(q), qn = H.norm(q), ql = q.toLowerCase();
    const cubos = [[], [], [], [], [], []];
    const rePal = new RegExp('[\\s;(,¿¡]' + qn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s;),?!.]');
    const reEn = new RegExp('[\\s;(,]' + ql.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s;),.]');
    for (let i = 0; i < DIC.s.length; i++) {
      if (qp && DIC.np[i] === qp) cubos[0].push(i);
      else if (DIC.nes[i] && rePal.test(DIC.nes[i])) cubos[1].push(i);
      else if (qp.length >= 2 && DIC.np[i].startsWith(qp)) { if (cubos[2].length < limite) cubos[2].push(i); }
      else if (qn.length >= 3 && DIC.nes[i] && DIC.nes[i].includes(qn)) { if (cubos[3].length < limite) cubos[3].push(i); }
      else if (ql.length >= 2 && reEn.test(DIC.nen[i])) { if (cubos[4].length < limite) cubos[4].push(i); }
    }
    for (const c of cubos) for (const i of c) { if (res.length >= limite) break; res.push(i); }
    return res.map(H.entrada);
  };

  /* ================= Voz ================= */
  H.voz = {
    soportado: typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function',
    lista: [],
    cargar() { if (!this.soportado) return; try { this.lista = window.speechSynthesis.getVoices().filter(v => /^(zh|cmn)/i.test(v.lang)); } catch (e) { this.lista = []; } },
    init() { if (!this.soportado) return; this.cargar(); try { window.speechSynthesis.addEventListener('voiceschanged', () => this.cargar()); } catch (e) { window.speechSynthesis.onvoiceschanged = () => this.cargar(); } },
    elegir() { const pref = H.estado.ajustes.voz; return this.lista.find(v => v.voiceURI === pref) || this.lista.find(v => /zh[-_]CN/i.test(v.lang)) || this.lista.find(v => /cmn|Hans/i.test(v.lang)) || this.lista[0] || null; },
    disponible() { this.cargar(); return this.soportado && this.lista.length > 0; },
    hablar(texto) {
      if (!this.soportado) { H.toast('Este navegador no puede leer en voz alta. Prueba con Microsoft Edge o Google Chrome.', 'error'); return false; }
      this.cargar();
      const voz = this.elegir();
      if (!voz) { H.toast('No hay una voz en chino instalada. En Ajustes te explicamos cómo agregarla.', 'error'); return false; }
      try { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(texto); u.voice = voz; u.lang = voz.lang || 'zh-CN'; u.rate = H.estado.ajustes.velocidadVoz || 0.8; window.speechSynthesis.speak(u); return true; }
      catch (e) { H.toast('No se pudo reproducir la voz.', 'error'); return false; }
    }
  };

  /* ================= Utilidades ================= */
  H.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  H.params = () => { const q = location.hash.split('?')[1] || ''; const o = {}; new URLSearchParams(q).forEach((v, k) => { o[k] = v; }); return o; };
  H.barajar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  H.norm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fmts = {};
  const nf = d => fmts[d] || (fmts[d] = new Intl.NumberFormat('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d }));
  H.num = (n, d = 0) => Number.isFinite(n) ? nf(d).format(n) : '—';
  H.pct = (n, d = 0) => Number.isFinite(n) ? nf(d).format(n) + ' %' : '—';
  H.csv = filas => '\ufeff' + filas.map(f => f.map(c => {
    if (typeof c === 'number') return Number.isFinite(c) ? String(c) : '';
    let s = c == null ? '' : String(c);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(',')).join('\r\n');
  H.descargar = function (nombre, contenido, mime = 'text/csv;charset=utf-8') {
    try {
      const url = URL.createObjectURL(new Blob([contenido], { type: mime }));
      const a = document.createElement('a'); a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      H.toast('Descargado: ' + nombre);
    } catch (e) { H.toast('No se pudo generar el archivo.', 'error'); }
  };
  H.exportarPalabras = (palabras, base) => H.descargar(base + '-' + H.hoy() + '.csv', H.csv([['Chino', 'Pinyin', 'Significado', 'Nivel', 'Estado', 'Aciertos', 'Errores', 'Próximo repaso']].concat(palabras.map(v => {
    const c = H.estado.srs[v.id]; return [v.h, v.p, v.es, H.nivelTexto(v.n), H.srs.NOMBRES[H.srs.nivel(c)], c ? c.aciertos : 0, c ? c.errores : 0, c ? c.proxima : ''];
  }))));

  /* ================= Avisos, ventanas, pestañas ================= */
  H.toast = function (msg, t = 'info') {
    const c = document.getElementById('avisos'); if (!c) return;
    const d = document.createElement('div'); d.className = 'aviso-flot ' + t; d.setAttribute('role', t === 'error' ? 'alert' : 'status'); d.textContent = msg;
    c.appendChild(d); setTimeout(() => { d.classList.add('fuera'); setTimeout(() => d.remove(), 350); }, t === 'error' ? 6000 : 3000);
  };
  let previo = null, alCerrarCb = null;
  H.modalAbierto = () => { const r = document.getElementById('capa'); return !!(r && r.firstChild); };
  H.modal = function ({ titulo, cuerpo, acciones = [], alCerrar, clase = '' }) {
    const r = document.getElementById('capa');
    if (!r.firstChild) previo = document.activeElement;
    alCerrarCb = alCerrar || null;
    r.innerHTML = `<div class="capa-fondo"><div class="hoja ${clase}" role="dialog" aria-modal="true" aria-labelledby="hojaTitulo"><div class="hoja-cab"><h2 id="hojaTitulo">${H.esc(titulo)}</h2><button type="button" class="icono-btn" data-cerrar aria-label="Cerrar">${H.icono('cerrar')}</button></div><div class="hoja-cuerpo"></div><div class="hoja-acc"></div></div></div>`;
    const cu = r.querySelector('.hoja-cuerpo');
    if (typeof cuerpo === 'string') cu.innerHTML = cuerpo; else if (cuerpo) cu.appendChild(cuerpo);
    const acc = r.querySelector('.hoja-acc');
    if (!acciones.length) acc.remove();
    acciones.forEach(a => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ' + (a.clase || ''); b.textContent = a.texto;
      b.addEventListener('click', () => { if (a.accion) a.accion(r); if (a.cierra || !a.accion) H.cerrarModal(); });
      acc.appendChild(b);
    });
    r.querySelector('[data-cerrar]').addEventListener('click', () => H.cerrarModal(true));
    r.querySelector('.capa-fondo').addEventListener('mousedown', ev => { if (ev.target.classList.contains('capa-fondo')) H.cerrarModal(true); });
    cu.querySelectorAll('input:not([type=checkbox]):not([type=file])').forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); const p = acc.querySelector && acc.querySelector('.primario'); if (p) p.click(); } }));
    const f = cu.querySelector('input,select,textarea') || r.querySelector('.hoja-acc .primario') || r.querySelector('[data-cerrar]');
    if (f) f.focus();
    return r.querySelector('.hoja');
  };
  H.cerrarModal = function (cancel) {
    const r = document.getElementById('capa'); if (!r || !r.firstChild) return;
    r.innerHTML = ''; const cb = alCerrarCb; alCerrarCb = null; if (cb) cb(!!cancel);
    if (previo && previo.isConnected) { try { previo.focus(); } catch (e) { /* nada */ } } previo = null;
  };
  H.confirmar = (texto, { si = 'Aceptar', peligro = false, titulo = 'Confirmar' } = {}) => new Promise(res => {
    let r = false;
    H.modal({ titulo, cuerpo: `<p>${H.esc(texto)}</p>`, acciones: [{ texto: 'Cancelar', cierra: true, accion: () => { r = false; } }, { texto: si, clase: peligro ? 'peligro' : 'primario', cierra: true, accion: () => { r = true; } }], alCerrar: () => res(r) });
  });
  // Elegir entre varias opciones; resuelve con el valor elegido o null si se cierra sin elegir.
  H.elegir = (texto, opciones, { titulo = 'Elige una opción' } = {}) => new Promise(res => {
    let r = null;
    H.modal({ titulo, cuerpo: `<p>${H.esc(texto)}</p>`, acciones: opciones.map(o => ({ texto: o.texto, clase: o.clase || '', cierra: true, accion: () => { r = o.valor; } })), alCerrar: () => res(r) });
  });
  H.pedirTexto = (titulo, etiqueta, valor = '') => new Promise(res => {
    let r = null;
    H.modal({ titulo, cuerpo: `<label class="campo">${H.esc(etiqueta)}<input id="hojaTexto" maxlength="50" value="${H.esc(valor)}"></label>`, acciones: [{ texto: 'Cancelar', cierra: true, accion: () => { r = null; } }, { texto: 'Guardar', clase: 'primario', cierra: true, accion: raiz => { r = raiz.querySelector('#hojaTexto').value.trim() || null; } }], alCerrar: () => res(r) });
  });
  H.tabs = function (cont, tabs, inicial) {
    cont.innerHTML = `<div class="pestanas" role="tablist">${tabs.map(t => `<button type="button" role="tab" id="tab-${t.id}" data-tab="${t.id}" aria-selected="false" tabindex="-1">${H.esc(t.texto)}</button>`).join('')}</div><div class="panel-tab" role="tabpanel"></div>`;
    const panel = cont.querySelector('.panel-tab'), btns = Array.from(cont.querySelectorAll('[role=tab]'));
    const activar = (id, foco) => {
      const t = tabs.find(x => x.id === id) || tabs[0];
      btns.forEach(b => { const a = b.dataset.tab === t.id; b.setAttribute('aria-selected', String(a)); b.tabIndex = a ? 0 : -1; if (a && foco) b.focus(); });
      panel.setAttribute('aria-labelledby', 'tab-' + t.id); panel.innerHTML = ''; t.render(panel);
    };
    btns.forEach((b, i) => {
      b.addEventListener('click', () => activar(b.dataset.tab));
      b.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { const j = (i + (ev.key === 'ArrowRight' ? 1 : -1) + btns.length) % btns.length; activar(btns[j].dataset.tab, true); } });
    });
    activar(inicial || tabs[0].id);
    return { activar };
  };
  H.barras = function (datos, { formato = H.num, max } = {}) {
    if (!datos.length) return '<p class="nota">Sin datos todavía.</p>';
    const m = max || Math.max(...datos.map(d => d.valor), 1);
    return `<ul class="barras">${datos.map(d => `<li><span class="b-et">${H.esc(d.etiqueta)}</span><span class="b-pista"><span class="b-barra ${d.clase || ''}" style="width:${Math.max(0, Math.min(100, d.valor / m * 100))}%"></span></span><span class="b-val">${H.esc(formato(d.valor))}</span></li>`).join('')}</ul>`;
  };

  /* ================= Iconos (SVG en línea) ================= */
  const ICONOS = {
    cerrar: '<path d="M6 6l12 12M18 6L6 18"/>',
    voz: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
    estrella: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    atras: '<path d="M15 5l-7 7 7 7"/>',
    adelante: '<path d="M9 5l7 7-7 7"/>',
    lapiz: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/>',
    libro: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h13"/>'
  };
  H.icono = (n, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONOS[n] || ''}</svg>`;

  /* ================= Oración en cuadrícula (componente compartido) ================= */
  H.oracionHTML = function (o, { pinyin = true, tamano = '' } = {}) {
    const pieza = (t, p, k) => {
      if (!H.esHan(t)) return `<span class="punt">${H.esc(t)}</span>`;
      return `<button type="button" class="tok" data-k="${k}" aria-label="${H.esc(t)}, ${H.esc(p)}"><span class="tok-py">${H.esc(p)}</span><span class="tok-han">${Array.from(t).map(c => H.esHan(c) ? `<span class="celda">${H.esc(c)}</span>` : `<span class="celda sep">${H.esc(c)}</span>`).join('')}</span></button>`;
    };
    // Agrupar la puntuación con la palabra vecina para que nunca empiece ni termine una línea sola
    const grupos = []; let abre = '';
    o.tokens.forEach(([t, p], k) => {
      if (H.esHan(t)) { grupos.push(abre + pieza(t, p, k)); abre = ''; }
      else if (/^[“‘《（(「]/.test(t) || !grupos.length) abre += pieza(t, p, k);
      else grupos[grupos.length - 1] += pieza(t, p, k);
    });
    if (abre) grupos.push(abre);
    return `<div class="oracion ${tamano} ${pinyin ? '' : 'sin-pinyin'}" lang="zh-CN">${grupos.map(g => `<span class="grupo">${g}</span>`).join('')}</div>`;
  };
  H.activarOracion = function (cont, o) {
    cont.querySelectorAll('.tok').forEach(b => b.addEventListener('click', () => {
      cont.querySelectorAll('.tok.activo').forEach(x => x.classList.remove('activo'));
      b.classList.add('activo');
      const [t, p] = o.tokens[+b.dataset.k];
      H.fichaPalabra(t, p, o, () => b.classList.remove('activo'));
    }));
  };

  /* Ficha de palabra: núcleo en español al instante; diccionario completo bajo demanda */
  H.fichaPalabra = function (h, p, oracion, alCerrar) {
    const nucleo = H.porHanzi(h);
    const cuerpo = document.createElement('div');
    cuerpo.className = 'fpal';
    const pintarNucleo = () => `
      <div class="ficha-cab"><span class="ficha-han" lang="zh-CN">${H.esc(h)}</span><div><p class="ficha-py">${H.esc(p || (nucleo[0] && nucleo[0].p) || '')}</p>
      ${nucleo.length ? nucleo.map(v => `<p class="ficha-es">${H.esc(v.es)} <span class="etiqueta">${H.esc(H.nivelTexto(v.n))}</span></p>`).join('') : ''}</div></div>
      <div class="ficha-dic" aria-live="polite"></div>
      <div class="fila-acc">
        <button type="button" class="btn" data-hablar="${H.esc(h)}">${H.icono('voz')} Escuchar</button>
        ${nucleo.length ? `<button type="button" class="btn" data-fav="${nucleo[0].id}">${H.estado.favoritos.includes(nucleo[0].id) ? 'Quitar de favoritas' : 'Guardar en favoritas'}</button>` : '<button type="button" class="btn" data-agregar>Agregar a mis tarjetas</button>'}
        <a class="btn" href="#/escribir?c=${encodeURIComponent(h)}">${H.icono('lapiz')} Escribir</a>
        <a class="btn sutil" href="#/dic?q=${encodeURIComponent(h)}">Ver en el diccionario</a>
      </div>`;
    cuerpo.innerHTML = pintarNucleo();
    H.modal({ titulo: 'Palabra', cuerpo, clase: 'hoja-palabra', alCerrar });
    H.registrar('busquedas');
    const zonaDic = cuerpo.querySelector('.ficha-dic');
    const conectar = () => {
      const f = cuerpo.querySelector('[data-fav]');
      if (f) f.addEventListener('click', () => { const ahora = H.toggleFav(f.dataset.fav); f.textContent = ahora ? 'Quitar de favoritas' : 'Guardar en favoritas'; });
      const ag = cuerpo.querySelector('[data-agregar]');
      if (ag) ag.addEventListener('click', async () => {
        await H.cargarDiccionario();
        const ents = H.entradasDe(h);
        const ent = ents.find(e => H.normPinyin(e.p) === H.normPinyin(p)) || ents[0];
        if (!ent) { H.toast('Esa palabra no está en el diccionario.', 'error'); return; }
        H.agregarPropia(ent); ag.textContent = 'Agregada a «Mis palabras»'; ag.disabled = true;
      });
    };
    conectar();
    if (!nucleo.length || nucleo.every(v => v.n)) {
      zonaDic.innerHTML = '<p class="nota">Buscando en el diccionario completo…</p>';
      H.cargarDiccionario().then(() => {
        const ents = H.entradasDe(h).filter(e => !e.core).slice(0, 4);
        if (!ents.length) { zonaDic.innerHTML = nucleo.length ? '' : '<p class="nota">No hay más definiciones para esta palabra.</p>'; return; }
        zonaDic.innerHTML = `<p class="nota">${nucleo.length ? 'Otras lecturas en el diccionario:' : ents.some(e => e.es) ? 'En el diccionario:' : 'Definición de CC-CEDICT (en inglés):'}</p><ul class="lista-def">${ents.map(e => `<li><span class="py">${H.esc(e.p)}</span> ${e.es ? `<strong>${H.esc(e.es)}</strong>${e.d ? '<br>' : ''}` : ''}${e.d ? `<span lang="en">${H.esc(H.defIngles(e.d))}</span>` : ''}</li>`).join('')}</ul>`;
      }).catch(() => { zonaDic.innerHTML = '<p class="nota">No se pudo abrir el diccionario completo.</p>'; });
    }
  };
})(window.HTL);

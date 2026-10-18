/* Practicar: ejercicios de vocabulario y de oraciones con explicación. */
'use strict';
(function (H) {
  const TIPOS = [
    { id: 'significado', nombre: 'Significado', desc: 'Ves la palabra en chino y eliges su significado.', grupo: 'v' },
    { id: 'reconocer', nombre: 'Reconocer caracteres', desc: 'Ves el significado y eliges la palabra en chino.', grupo: 'v' },
    { id: 'tonos', nombre: 'Tonos y pinyin', desc: 'Eliges la lectura correcta; las opciones engañosas cambian solo el tono.', grupo: 'v' },
    { id: 'emparejar', nombre: 'Emparejar', desc: 'Unes seis palabras con sus significados.', grupo: 'v' },
    { id: 'escuchar', nombre: 'Escuchar', desc: 'Oyes una palabra y eliges cómo se escribe. Necesita una voz en chino.', grupo: 'v' },
    { id: 'completar', nombre: 'Completar oraciones', desc: 'Una oración de cultura general con una palabra faltante.', grupo: 'o' },
    { id: 'ordenar', nombre: 'Ordenar oraciones', desc: 'Pones las palabras en el orden correcto.', grupo: 'o' },
    { id: 'comprender', nombre: 'Comprensión', desc: 'Lees una oración y eliges qué significa.', grupo: 'o' }
  ];
  const TONOS = ['āáǎà', 'ēéěè', 'īíǐì', 'ōóǒò', 'ūúǔù', 'ǖǘǚǜ'];
  const zh = t => `<span lang="zh-CN" class="han">${H.esc(t)}</span>`;
  function varianteTono(p) {
    const ch = Array.from(p);
    for (let i = 0; i < ch.length; i++) for (const set of TONOS) { const k = set.indexOf(ch[i]); if (k >= 0) { ch[i] = set[(k + 1 + Math.floor(Math.random() * 3)) % 4]; return ch.join(''); } }
    return null;
  }
  function distractores(v, campo, n) {
    const base = H.vocabBase();
    const mismos = H.barajar(base.filter(x => x.n === v.n && x.id !== v.id && Array.from(x.h).length === Array.from(v.h).length));
    const otros = H.barajar(base.filter(x => x.id !== v.id));
    const ya = new Set([v[campo], v.h]), r = [];
    for (const x of mismos.concat(otros)) { if (r.length >= n) break; if (ya.has(x[campo]) || ya.has(x.h) || x.es === v.es) continue; ya.add(x[campo]); ya.add(x.h); r.push(x); }
    return r;
  }

  function pregunta(v, tipo) {
    if (tipo === 'significado') {
      const ops = H.barajar([v].concat(distractores(v, 'es', 3)));
      return { enunciado: `¿Qué significa ${zh(v.h)}?`, hablar: v.h, opciones: ops.map(o => H.esc(o.es)), correcta: ops.indexOf(v),
        expl: `${zh(v.h)} (${H.esc(v.p)}) significa «${H.esc(v.es)}».`, porque: k => `Tu opción corresponde a ${zh(ops[k].h)} (${H.esc(ops[k].p)}).` };
    }
    if (tipo === 'reconocer' || tipo === 'escuchar') {
      const ops = H.barajar([v].concat(distractores(v, 'h', 3)));
      return { enunciado: tipo === 'escuchar' ? 'Escucha y elige la palabra que oíste.' : `¿Cómo se escribe «${H.esc(v.es)}»?`, autoHablar: tipo === 'escuchar' ? v.h : null, hablar: tipo === 'escuchar' ? v.h : null,
        opciones: ops.map(o => zh(o.h)), sub: tipo === 'escuchar' ? null : ops.map(o => o.p), grande: true, correcta: ops.indexOf(v),
        expl: `${zh(v.h)} se lee ${H.esc(v.p)} y significa «${H.esc(v.es)}».`, porque: k => `${zh(ops[k].h)} (${H.esc(ops[k].p)}) significa «${H.esc(ops[k].es)}».` };
    }
    const reales = new Set(H.vocabBase().map(x => x.p));
    const ops = [v.p];
    let vt = varianteTono(v.p); if (vt && reales.has(vt)) vt = null; if (vt) ops.push(vt);
    let vt2 = varianteTono(v.p); if (vt2 && !ops.includes(vt2) && !reales.has(vt2)) ops.push(vt2);
    for (const d of distractores(v, 'p', 4)) { if (ops.length >= 4) break; if (!ops.includes(d.p)) ops.push(d.p); }
    const m = H.barajar(ops);
    return { enunciado: `¿Cómo se lee ${zh(v.h)}?`, opciones: m.map(H.esc), correcta: m.indexOf(v.p),
      expl: `${zh(v.h)} se lee <strong>${H.esc(v.p)}</strong> y significa «${H.esc(v.es)}».`,
      porque: k => (m[k] === vt || m[k] === vt2) ? 'Esa lectura tiene los mismos sonidos pero otro tono, y en mandarín el tono cambia el significado.' : '' };
  }

  function preguntasCompletar(maxNivel, n) {
    const res = [];
    for (const o of H.barajar(HTL.ORACIONES.filter(o => o.nivel <= maxNivel))) {
      if (res.length >= n) break;
      const cands = o.tokens.map((t, k) => ({ t: t[0], k })).filter(x => H.esHan(x.t) && H.porHanzi(x.t).some(v => v.n));
      if (!cands.length) continue;
      const elegido = cands.sort((a, b) => Array.from(b.t).length - Array.from(a.t).length)[Math.floor(Math.random() * Math.min(3, cands.length))];
      const v = H.porHanzi(elegido.t).find(x => x.n);
      const ops = H.barajar([v].concat(distractores(v, 'h', 3)));
      const frase = o.tokens.map(([t], k) => k === elegido.k ? '<span class="hueco">＿＿</span>' : H.esc(t)).join('');
      res.push({ enunciado: `Completa la oración:<span class="frase-zh" lang="zh-CN">${frase}</span><span class="frase-es">${H.esc(o.es)}</span>`,
        opciones: ops.map(x => zh(x.h)), sub: ops.map(x => x.p), grande: true, correcta: ops.indexOf(v),
        expl: `Falta ${zh(v.h)} (${H.esc(v.p)}): «${H.esc(v.es)}». ${H.esc(o.dato)}`, porque: k => `${zh(ops[k].h)} significa «${H.esc(ops[k].es)}».`, oracion: o.id });
    }
    return res;
  }
  function preguntasComprender(maxNivel, n) {
    return H.barajar(HTL.ORACIONES.filter(o => o.nivel <= maxNivel)).slice(0, n).map(o => {
      const otras = H.barajar(HTL.ORACIONES.filter(x => x.id !== o.id && x.tema === o.tema)).slice(0, 3);
      const ops = H.barajar([o].concat(otras));
      return { enunciado: `¿Qué significa esta oración?<span class="frase-zh" lang="zh-CN">${H.esc(o.zh)}</span><span class="frase-py">${H.esc(o.tokens.filter(t => t[1]).map(t => t[1]).join(' '))}</span>`, hablar: o.zh,
        opciones: ops.map(x => H.esc(x.es)), correcta: ops.indexOf(o), expl: H.esc(o.dato), oracion: o.id };
    });
  }

  H.vistas.practicar = {
    titulo: 'Practicar',
    render(el) {
      const prm = H.params();
      const estudiadas = H.palabrasDe('estudiadas').length;
      const fuenteIni = prm.fuente || (estudiadas >= 8 ? 'estudiadas' : 'nivel:1');
      el.innerHTML = `
        <h1>Practicar</h1>
        <div id="pSel">
          <p class="intro">Después de cada respuesta verás por qué es correcta o no. Los ejercicios de oraciones usan las oraciones de cultura general.</p>
          <div class="config">
            <label class="campo">Palabras de ${H.selectFuente('pFuente', fuenteIni)}</label>
            <label class="campo">Dificultad de las oraciones <select id="pNivel"><option value="3">Fácil (hasta HSK 3)</option><option value="4" selected>Media (hasta HSK 4)</option><option value="6">Alta (hasta HSK 6)</option><option value="7">Todas</option></select></label>
            <label class="campo">Preguntas <select id="pNum"><option>5</option><option selected>10</option><option>15</option></select></label>
          </div>
          <h2 class="subt">Vocabulario</h2>
          <ul class="tipos">${TIPOS.filter(t => t.grupo === 'v').map(t => `<li><button type="button" data-tipo="${t.id}"><strong>${t.nombre}</strong><span>${t.desc}</span></button></li>`).join('')}</ul>
          <h2 class="subt">Oraciones</h2>
          <ul class="tipos">${TIPOS.filter(t => t.grupo === 'o').map(t => `<li><button type="button" data-tipo="${t.id}"><strong>${t.nombre}</strong><span>${t.desc}</span></button></li>`).join('')}</ul>
        </div>
        <section id="pZona"></section>`;
      const sel = el.querySelector('#pSel'), zona = el.querySelector('#pZona');
      let tecla = null;
      const manejar = ev => { if (tecla && !H.modalAbierto()) tecla(ev); };
      document.addEventListener('keydown', manejar);
      H.alSalir(() => document.removeEventListener('keydown', manejar));
      el.querySelectorAll('[data-tipo]').forEach(b => b.addEventListener('click', () => iniciar(b.dataset.tipo)));
      const volver = () => { tecla = null; zona.innerHTML = ''; sel.hidden = false; };

      function iniciar(tipo) {
        const fuente = el.querySelector('#pFuente').value, n = +el.querySelector('#pNum').value, nivel = +el.querySelector('#pNivel').value;
        const t = TIPOS.find(x => x.id === tipo);
        if (tipo === 'escuchar' && !H.voz.disponible()) { H.toast('Este ejercicio necesita una voz en chino instalada. En Ajustes te explicamos cómo agregarla.', 'error'); return; }
        let pool = [];
        if (t.grupo === 'v') {
          pool = H.palabrasDe(fuente);
          if (pool.length < (tipo === 'emparejar' ? 3 : 1)) { H.toast('«' + H.nombreFuente(fuente) + '» tiene muy pocas palabras. Elige otra selección.', 'error'); return; }
        }
        sel.hidden = true;
        const titulo = t.nombre + (t.grupo === 'v' ? ' · ' + H.nombreFuente(fuente) : '');
        if (tipo === 'emparejar') return emparejar(pool, titulo);
        if (tipo === 'ordenar') return ordenar(H.barajar(HTL.ORACIONES.filter(o => o.nivel <= nivel && o.tokens.filter(x => H.esHan(x[0])).length >= 4 && o.tokens.filter(x => H.esHan(x[0])).length <= 11)).slice(0, n), titulo);
        let qs;
        if (tipo === 'completar') qs = preguntasCompletar(nivel, n);
        else if (tipo === 'comprender') qs = preguntasComprender(nivel, n);
        else qs = H.barajar(pool).slice(0, n).map(v => pregunta(v, tipo));
        opcionMultiple(qs, titulo);
      }

      function opcionMultiple(qs, titulo) {
        let i = 0, bien = 0, resp = false;
        const errores = [];
        function pintar() {
          const q = qs[i]; resp = false;
          zona.innerHTML = `<div class="ejercicio">
            <div class="ses-cab"><span>${H.esc(titulo)}</span><span>${i + 1} de ${qs.length}</span></div>
            <div class="progreso"><span style="width:${i / qs.length * 100}%"></span></div>
            <p class="enunciado">${q.enunciado}</p>
            ${q.hablar ? `<p><button type="button" class="btn sutil" data-hablar="${H.esc(q.hablar)}">${H.icono('voz')} ${q.autoHablar ? 'Escuchar otra vez' : 'Escuchar'}</button></p>` : ''}
            <div class="opciones ${q.grande ? 'grandes' : ''}">${q.opciones.map((o, k) => `<button type="button" class="opcion" data-k="${k}"><kbd>${k + 1}</kbd><span>${o}${q.sub ? `<small>${H.esc(q.sub[k])}</small>` : ''}</span></button>`).join('')}</div>
            <div class="retro" id="retro" aria-live="assertive"></div>
            <p><button type="button" class="btn sutil" id="pSalir">Terminar</button></p></div>`;
          zona.querySelectorAll('.opcion').forEach(b => b.addEventListener('click', () => responder(+b.dataset.k)));
          zona.querySelector('#pSalir').addEventListener('click', fin);
          if (q.autoHablar) setTimeout(() => H.voz.hablar(q.autoHablar), 200);
        }
        function responder(k) {
          if (resp) return; resp = true;
          const q = qs[i], ok = k === q.correcta;
          zona.querySelectorAll('.opcion').forEach((b, j) => { b.disabled = true; if (j === q.correcta) b.classList.add('correcta'); else if (j === k) b.classList.add('incorrecta'); });
          if (ok) bien++; else errores.push(q);
          H.registrarQuiz(ok);
          if (q.oracion) H.marcarLeida(q.oracion);
          const r = zona.querySelector('#retro');
          r.className = 'retro ' + (ok ? 'bien' : 'mal');
          r.innerHTML = `<p><strong>${ok ? 'Correcto.' : 'No es esa.'}</strong> ${q.expl}${!ok && q.porque ? ' ' + q.porque(k) : ''}</p><button type="button" class="btn primario" id="pSig">${i < qs.length - 1 ? 'Siguiente' : 'Ver resultado'} <kbd>Enter</kbd></button>`;
          const s = r.querySelector('#pSig'); s.addEventListener('click', () => { i++; if (i < qs.length) pintar(); else fin(); }); s.focus();
        }
        function fin() {
          tecla = null;
          const n = i + (resp && i < qs.length ? 1 : 0);
          zona.innerHTML = `<div class="fin-sesion"><h2>Resultado</h2><p class="cifra-grande">${bien} de ${n}</p>
            <p>${!n ? 'No respondiste preguntas.' : bien / n >= 0.8 ? 'Muy bien. Lo dominas.' : bien / n >= 0.5 ? 'Vas bien. Repasa las que fallaste.' : 'Sigue practicando: repasa con tarjetas y vuelve a intentarlo.'}</p>
            ${errores.length ? `<h3>Para repasar</h3><ul class="lista-errores">${errores.map(q => `<li>${q.enunciado.replace(/<span class="frase-es">.*?<\/span>/, '')}<br><span class="nota">Respuesta: ${q.opciones[q.correcta]}</span></li>`).join('')}</ul>` : ''}
            <button type="button" class="btn primario" id="pOtra">Elegir otro ejercicio</button></div>`;
          zona.querySelector('#pOtra').addEventListener('click', volver);
        }
        tecla = ev => {
          if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
          if (!resp && /^[1-4]$/.test(ev.key) && qs[i] && +ev.key <= qs[i].opciones.length) { ev.preventDefault(); responder(+ev.key - 1); }
        };
        if (!qs.length) { zona.innerHTML = '<p class="vacio">No hay suficientes preguntas con esa dificultad. Elige una más alta.</p>'; sel.hidden = false; return; }
        pintar();
      }

      function emparejar(pool, titulo) {
        tecla = null;
        const vistos = new Set();
        const pal = H.barajar(pool).filter(v => { if (vistos.has(v.es) || vistos.has(v.h)) return false; vistos.add(v.es); vistos.add(v.h); return true; }).slice(0, 6);
        const izq = H.barajar(pal), der = H.barajar(pal), hechos = new Set(), fallos = new Set();
        let a = null, b = null;
        zona.innerHTML = `<div class="ejercicio"><div class="ses-cab"><span>${H.esc(titulo)}</span><span id="eCont">0 de ${pal.length}</span></div>
          <p class="enunciado">Elige una palabra y después su significado.</p>
          <div class="emparejar"><div role="group" aria-label="Palabras en chino">${izq.map(v => `<button type="button" class="par" data-l="i" data-id="${v.id}"><span lang="zh-CN" class="han">${H.esc(v.h)}</span><small>${H.esc(v.p)}</small></button>`).join('')}</div>
          <div role="group" aria-label="Significados">${der.map(v => `<button type="button" class="par" data-l="d" data-id="${v.id}">${H.esc(v.es)}</button>`).join('')}</div></div>
          <div class="retro" id="retro" aria-live="assertive"></div><p><button type="button" class="btn sutil" id="pSalir">Terminar</button></p></div>`;
        const r = zona.querySelector('#retro');
        zona.querySelector('#pSalir').addEventListener('click', terminar);
        zona.querySelectorAll('.par').forEach(btn => btn.addEventListener('click', () => {
          if (btn.disabled) return;
          zona.querySelectorAll(`.par[data-l="${btn.dataset.l}"]`).forEach(x => x.classList.remove('sel'));
          btn.classList.add('sel');
          if (btn.dataset.l === 'i') a = btn.dataset.id; else b = btn.dataset.id;
          if (!a || !b) return;
          const va = H.porId(a), vb = H.porId(b);
          const ba = zona.querySelector(`.par[data-l="i"][data-id="${a}"]`), bb = zona.querySelector(`.par[data-l="d"][data-id="${b}"]`);
          if (a === b) { hechos.add(a); [ba, bb].forEach(x => { x.classList.remove('sel'); x.classList.add('hecho'); x.disabled = true; }); if (!fallos.has(a)) H.registrarQuiz(true); r.className = 'retro bien'; r.innerHTML = `<p>${zh(va.h)} (${H.esc(va.p)}) = «${H.esc(va.es)}».</p>`; }
          else { if (!fallos.has(a)) { fallos.add(a); H.registrarQuiz(false); } [ba, bb].forEach(x => { x.classList.remove('sel'); x.classList.add('error'); setTimeout(() => x.classList.remove('error'), 500); }); r.className = 'retro mal'; r.innerHTML = `<p>${zh(va.h)} significa «${H.esc(va.es)}»; «${H.esc(vb.es)}» es ${zh(vb.h)}.</p>`; }
          a = b = null;
          zona.querySelector('#eCont').textContent = hechos.size + ' de ' + pal.length;
          if (hechos.size === pal.length) setTimeout(terminar, 600);
        }));
        function terminar() {
          const ok = pal.filter(v => hechos.has(v.id) && !fallos.has(v.id)).length;
          zona.innerHTML = `<div class="fin-sesion"><h2>Resultado</h2><p class="cifra-grande">${ok} de ${pal.length}</p><p>Parejas correctas al primer intento.</p>
            <div class="fila-acc"><button type="button" class="btn primario" id="pRonda">Otra ronda</button><button type="button" class="btn" id="pOtra">Elegir otro ejercicio</button></div></div>`;
          zona.querySelector('#pRonda').addEventListener('click', () => emparejar(pool, titulo));
          zona.querySelector('#pOtra').addEventListener('click', volver);
        }
      }

      function ordenar(os, titulo) {
        tecla = null;
        let i = 0, bien = 0;
        if (!os.length) { zona.innerHTML = '<p class="vacio">No hay oraciones con esa dificultad.</p>'; sel.hidden = false; return; }
        function pintar() {
          const o = os[i], han = o.tokens.filter(t => H.esHan(t[0])), meta = han.map(t => t[0]).join('');
          let banco = H.barajar(han.map((t, k) => ({ t: t[0], k }))), resp = [], intentos = 0, hecho = false;
          for (let n = 0; n < 5 && banco.map(x => x.t).join('') === meta; n++) banco = H.barajar(banco);
          zona.innerHTML = `<div class="ejercicio"><div class="ses-cab"><span>${H.esc(titulo)}</span><span>${i + 1} de ${os.length}</span></div>
            <div class="progreso"><span style="width:${i / os.length * 100}%"></span></div>
            <p class="enunciado">Ordena las palabras para decir:<span class="frase-es">${H.esc(o.es)}</span></p>
            <div class="linea-resp" id="oResp" role="group" aria-label="Tu oración"></div>
            <div class="banco" id="oBanco" role="group" aria-label="Palabras disponibles"></div>
            <div class="fila-acc"><button type="button" class="btn primario" id="oOk">Comprobar</button><button type="button" class="btn" id="oBorrar">Empezar de nuevo</button><button type="button" class="btn sutil" id="pSalir">Terminar</button></div>
            <div class="retro" id="retro" aria-live="assertive"></div></div>`;
          const lr = zona.querySelector('#oResp'), bc = zona.querySelector('#oBanco'), r = zona.querySelector('#retro');
          const dib = () => {
            lr.innerHTML = resp.length ? resp.map((x, j) => `<button type="button" class="ficha usada" data-j="${j}" lang="zh-CN">${H.esc(x.t)}</button>`).join('') : '<span class="placeholder">Toca las palabras en orden.</span>';
            bc.innerHTML = banco.map((x, j) => `<button type="button" class="ficha" data-j="${j}" lang="zh-CN">${H.esc(x.t)}</button>`).join('');
            lr.querySelectorAll('.ficha').forEach(b => b.addEventListener('click', () => { if (hecho) return; banco.push(resp.splice(+b.dataset.j, 1)[0]); dib(); }));
            bc.querySelectorAll('.ficha').forEach(b => b.addEventListener('click', () => { if (hecho) return; resp.push(banco.splice(+b.dataset.j, 1)[0]); dib(); }));
          };
          dib();
          const mostrarSol = (ok) => {
            hecho = true; H.marcarLeida(o.id);
            r.className = 'retro ' + (ok ? 'bien' : 'mal');
            r.innerHTML = `<p><strong>${ok ? 'Correcto.' : 'Así va la oración:'}</strong></p>${H.oracionHTML(o, { pinyin: true })}<p class="nota">${H.esc(o.dato)}</p>
              <div class="fila-acc"><button type="button" class="btn" data-hablar="${H.esc(o.zh)}">${H.icono('voz')} Escuchar</button><button type="button" class="btn primario" id="oSig">${i < os.length - 1 ? 'Siguiente' : 'Ver resultado'}</button></div>`;
            H.activarOracion(r, o);
            r.querySelector('#oSig').addEventListener('click', () => { i++; if (i < os.length) pintar(); else fin(); });
            r.querySelector('#oSig').focus();
          };
          zona.querySelector('#oBorrar').addEventListener('click', () => { if (hecho) return; banco = banco.concat(resp); resp = []; dib(); });
          zona.querySelector('#pSalir').addEventListener('click', fin);
          zona.querySelector('#oOk').addEventListener('click', () => {
            if (hecho) return;
            if (banco.length) { r.className = 'retro mal'; r.innerHTML = '<p>Usa todas las palabras antes de comprobar.</p>'; return; }
            intentos++;
            if (resp.map(x => x.t).join('') === meta) { if (intentos === 1) bien++; H.registrarQuiz(intentos === 1); H.registrar('ordenadas'); mostrarSol(true); }
            else {
              if (intentos === 1) H.registrarQuiz(false);
              const pos = resp.findIndex((x, j) => x.t !== han[j][0]);
              r.className = 'retro mal';
              r.innerHTML = `<p>El orden no es correcto todavía${pos > 0 ? `: las primeras ${pos} ${pos === 1 ? 'palabra está' : 'palabras están'} bien` : ''}. Recuerda que en chino las expresiones de tiempo y lugar suelen ir antes del verbo.</p><button type="button" class="btn" id="oVer">Ver la respuesta</button>`;
              r.querySelector('#oVer').addEventListener('click', () => { H.registrar('ordenadas'); mostrarSol(false); });
            }
          });
        }
        function fin() {
          zona.innerHTML = `<div class="fin-sesion"><h2>Resultado</h2><p class="cifra-grande">${bien} de ${os.length}</p><p>Oraciones ordenadas al primer intento.</p><button type="button" class="btn primario" id="pOtra">Elegir otro ejercicio</button></div>`;
          zona.querySelector('#pOtra').addEventListener('click', volver);
        }
        pintar();
      }

      if (prm.tipo && TIPOS.some(t => t.id === prm.tipo)) iniciar(prm.tipo);
    }
  };
})(window.HTL);

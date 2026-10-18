/* Leer: oraciones de cultura general por tema. */
'use strict';
(function (H) {
  const rangoNivel = n => n <= 2 ? 'Fácil' : n <= 4 ? 'Intermedia' : n <= 6 ? 'Avanzada' : 'Con palabras poco comunes';

  function lista(el) {
    const L = H.estado.leidas;
    el.innerHTML = `
      <h1>Leer</h1>
      <p class="intro">Oraciones cortas sobre el mundo, escritas en chino sencillo. Cada una trae un dato cultural para aprender algo más allá del idioma.</p>
      <label class="campo campo-corto">Mostrar
        <select id="lFiltro"><option value="">Todas las oraciones</option><option value="4">Solo las más fáciles (hasta HSK 4)</option><option value="nuevas">Las que aún no leo</option></select>
      </label>
      <ul class="temas">${HTL.TEMAS.map(t => {
        const os = HTL.ORACIONES.filter(o => o.tema === t.id), leidas = os.filter(o => L[o.id]).length;
        return `<li><a href="#/leer?tema=${t.id}"><span class="tema-nom">${H.esc(t.nombre)}</span>
          <span class="tema-ej" lang="zh-CN">${H.esc(os[0].zh.slice(0, 14))}…</span>
          <span class="tema-prog"><span class="pista"><span style="width:${leidas / os.length * 100}%"></span></span>${leidas} de ${os.length}</span></a></li>`;
      }).join('')}</ul>`;
    const f = el.querySelector('#lFiltro');
    f.value = sessionStorage.getItem('hl.filtroLeer') || '';
    f.addEventListener('change', () => { try { sessionStorage.setItem('hl.filtroLeer', f.value); } catch (e) { /* nada */ } });
  }

  function lector(el, temaId, idIni) {
    const filtro = (() => { try { return sessionStorage.getItem('hl.filtroLeer') || ''; } catch (e) { return ''; } })();
    let os = HTL.ORACIONES.filter(o => o.tema === temaId);
    if (filtro === '4') os = os.filter(o => o.nivel <= 4);
    if (filtro === 'nuevas') os = os.filter(o => !H.estado.leidas[o.id]);
    if (!os.length) os = HTL.ORACIONES.filter(o => o.tema === temaId);
    let i = Math.max(0, os.findIndex(o => o.id === idIni));
    const aj = H.estado.ajustes;

    el.innerHTML = `
      <a class="volver" href="#/leer">${H.icono('atras')} Todos los temas</a>
      <h1>${H.esc(H.temaNombre(temaId))}</h1>
      <div class="lector-opc">
        <label class="interruptor"><input type="checkbox" id="lPy" ${aj.pinyinLectura ? 'checked' : ''}> Pinyin</label>
        <label class="interruptor"><input type="checkbox" id="lTr" ${aj.traduccionLectura ? 'checked' : ''}> Traducción siempre visible</label>
      </div>
      <article class="lector" aria-live="polite"></article>`;
    const art = el.querySelector('.lector');

    function pintar() {
      const o = os[i];
      const leida = !!H.estado.leidas[o.id];
      const glosario = o.tokens.filter(([t]) => H.esHan(t)).map(([t, p]) => ({ t, p, v: H.porHanzi(t)[0] })).filter(x => x.v)
        .filter((x, k, arr) => arr.findIndex(y => y.t === x.t) === k);
      art.innerHTML = `
        <p class="lector-pos">Oración ${i + 1} de ${os.length} <span class="etiqueta">${rangoNivel(o.nivel)}</span>${leida ? ' <span class="etiqueta ok">Leída</span>' : ''}</p>
        <div id="lOracion">${H.oracionHTML(o, { pinyin: aj.pinyinLectura, tamano: 'grande' })}</div>
        <p class="lector-trad" ${aj.traduccionLectura ? '' : 'hidden'}>${H.esc(o.es)}</p>
        <div class="fila-acc">
          ${aj.traduccionLectura ? '' : '<button type="button" class="btn" id="lVer">Mostrar traducción</button>'}
          <button type="button" class="btn" data-hablar="${H.esc(o.zh)}">${H.icono('voz')} Escuchar</button>
        </div>
        <details class="dato"><summary>Dato cultural</summary><p>${H.esc(o.dato)}</p></details>
        ${glosario.length ? `<details class="glosario"><summary>Palabras de esta oración (${glosario.length})</summary><ul>${glosario.map(x => `<li><span lang="zh-CN" class="g-han">${H.esc(x.t)}</span> <span class="py">${H.esc(x.p)}</span> ${H.esc(x.v.es)}</li>`).join('')}</ul></details>` : ''}
        <div class="lector-nav">
          <button type="button" class="btn" id="lAnt" ${i === 0 ? 'disabled' : ''}>${H.icono('atras')} Anterior</button>
          <button type="button" class="btn primario" id="lSig">${i < os.length - 1 ? 'La entendí, siguiente' : 'La entendí'} ${H.icono('adelante')}</button>
        </div>`;
      H.activarOracion(art.querySelector('#lOracion'), o);
      const ver = art.querySelector('#lVer');
      if (ver) ver.addEventListener('click', () => { const t = art.querySelector('.lector-trad'); t.hidden = !t.hidden; ver.textContent = t.hidden ? 'Mostrar traducción' : 'Ocultar traducción'; });
      art.querySelector('#lAnt').addEventListener('click', () => { if (i > 0) { i--; pintar(); } });
      art.querySelector('#lSig').addEventListener('click', () => {
        H.marcarLeida(o.id);
        if (i < os.length - 1) { i++; pintar(); }
        else { H.toast('Terminaste las oraciones de este tema.'); location.hash = '#/leer'; }
      });
      try { history.replaceState(null, '', '#/leer?tema=' + temaId + '&o=' + o.id); } catch (e) { /* nada */ }
    }
    el.querySelector('#lPy').addEventListener('change', ev => { aj.pinyinLectura = ev.target.checked; H.guardar(); pintar(); });
    el.querySelector('#lTr').addEventListener('change', ev => { aj.traduccionLectura = ev.target.checked; H.guardar(); pintar(); });
    const tecla = ev => {
      if (H.modalAbierto() || /INPUT|SELECT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) return;
      if (ev.key === 'ArrowRight') art.querySelector('#lSig').click();
      if (ev.key === 'ArrowLeft') art.querySelector('#lAnt').click();
    };
    document.addEventListener('keydown', tecla);
    H.alSalir(() => document.removeEventListener('keydown', tecla));
    pintar();
  }

  H.vistas.leer = {
    titulo: 'Leer',
    render(el) {
      const p = H.params();
      if (p.tema && HTL.TEMAS.some(t => t.id === p.tema)) lector(el, p.tema, p.o); else lista(el);
    }
  };
})(window.HTL);

/* Progreso. */
'use strict';
(function (H) {
  H.vistas.progreso = {
    titulo: 'Progreso',
    render(el) {
      const s = H.stats(), e = H.estado, hoy = H.hoy();
      const dias = [];
      for (let i = 13; i >= 0; i--) { const f = H.sumarDias(hoy, -i), a = e.actividad[f] || {}; dias.push({ f, n: (a.tarjetas || 0) + (a.quizTotal || 0) + (a.leidas || 0) + (a.escritura || 0) }); }
      const maxD = Math.max(1, ...dias.map(d => d.n));
      const dificiles = H.vocab().filter(v => H.srs.dificil(v.id)).sort((a, b) => e.srs[b.id].errores - e.srs[a.id].errores).slice(0, 12);
      const escritos = Object.keys(e.escritura).length;
      el.innerHTML = `
        <h1>Tu progreso</h1>
        <dl class="cifras">
          <div><dt>Días de estudio</dt><dd>${s.diasEstudio}</dd></div>
          <div><dt>Racha actual</dt><dd>${s.racha} <small>${s.racha === 1 ? 'día' : 'días'}</small></dd></div>
          <div><dt>Palabras aprendidas</dt><dd>${s.aprendidas} <small>de ${s.total}</small></dd></div>
          <div><dt>Palabras dominadas</dt><dd>${s.dominadas}</dd></div>
          <div><dt>Pendientes hoy</dt><dd>${s.pendientes}</dd></div>
          <div><dt>Oraciones leídas</dt><dd>${s.leidas} <small>de ${HTL.ORACIONES.length}</small></dd></div>
          <div><dt>Aciertos en tarjetas</dt><dd>${H.pct(s.precisionTarjetas)}</dd></div>
          <div><dt>Aciertos en ejercicios</dt><dd>${H.pct(s.precisionQuiz)}</dd></div>
          <div><dt>Caracteres escritos</dt><dd>${escritos}</dd></div>
        </dl>
        <section><h2>Últimos 14 días</h2>
          <div class="columnas" role="img" aria-label="Actividad diaria de los últimos 14 días">${dias.map(d => `<div class="col" title="${H.esc(H.fechaCorta(d.f))}: ${d.n} actividades"><span class="col-barra" style="height:${d.n / maxD * 100}%"></span><span class="col-et">${+d.f.slice(8)}</span></div>`).join('')}</div>
          <p class="nota">Suma de tarjetas, ejercicios, oraciones leídas y caracteres escritos cada día.</p></section>
        <div class="dos-col">
          <section><h2>Por nivel</h2>${H.barras(HTL.NIVELES.map(n => ({ etiqueta: `${n.nombre} (${s.porNivel[n.n].aprendidas} de ${s.porNivel[n.n].total})`, valor: s.porNivel[n.n].total ? s.porNivel[n.n].aprendidas / s.porNivel[n.n].total * 100 : 0 })), { formato: v => H.pct(v), max: 100 })}</section>
          <section><h2>Por tema de lectura</h2>${H.barras(HTL.TEMAS.map(t => { const os = HTL.ORACIONES.filter(o => o.tema === t.id); return { etiqueta: t.nombre, valor: os.filter(o => e.leidas[o.id]).length / os.length * 100, clase: 'jade' }; }), { formato: v => H.pct(v), max: 100 })}</section>
        </div>
        <section><h2>Dominio del vocabulario</h2>${H.barras(H.srs.NOMBRES.map((n, i) => ({ etiqueta: n, valor: s.niveles[i] })), { formato: v => H.num(v) + ' palabras', max: s.total })}
          <p class="nota">«Aprendida» significa al menos dos aciertos seguidos en días distintos. «Dominada» significa que su repaso ya se programa a tres semanas o más y lleva cuatro aciertos o más. Un solo acierto nunca marca una palabra como dominada. Las cifras salen de tus autoevaluaciones en las tarjetas y de tus respuestas en los ejercicios; la aplicación no evalúa tu pronunciación.</p></section>
        <section><div class="fila-cab"><h2>Palabras difíciles</h2>${dificiles.length ? '<a class="btn sutil" href="#/tarjetas?fuente=dificiles&modo=libre">Repasarlas</a>' : ''}</div>
          ${dificiles.length ? `<ul class="lista-palabras">${dificiles.map(v => `<li><span lang="zh-CN" class="g-han">${H.esc(v.h)}</span> <span class="py">${H.esc(v.p)}</span> ${H.esc(v.es)} <span class="nota">${e.srs[v.id].errores} errores</span></li>`).join('')}</ul>` : '<p class="nota">Aparecen aquí las palabras que fallas dos veces o más.</p>'}</section>
        <section><h2>Exportar</h2><div class="fila-acc"><button type="button" class="btn" id="pCsv">Estado de cada palabra (CSV)</button></div></section>`;
      el.querySelector('#pCsv').addEventListener('click', () => H.exportarPalabras(H.vocab(), 'progreso-hanzi-lab'));
    }
  };
})(window.HTL);

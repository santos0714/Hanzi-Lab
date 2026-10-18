/* Inicio: oración del día, misiones y resumen. */
'use strict';
(function (H) {
  H.vistas.inicio = {
    titulo: 'Inicio',
    render(el) {
      const o = H.oracionDelDia();
      const s = H.stats();
      const mis = H.misionesHoy();
      const hechas = mis.filter(m => m.hecha).length;
      const ult = H.estado.ajustes.ultimoRespaldo;
      const avisoRespaldo = H.archivo.estado === 'nosoportado' && s.diasEstudio >= 2 && (!ult || H.diasEntre(ult, H.hoy()) >= 7);
      const verTrad = false;

      el.innerHTML = `
        <div data-zona-archivo="inicio">${H.tarjetaArchivo(false)}</div>
        <section class="dia" aria-labelledby="diaTit">
          <p class="dia-fecha">${H.esc(H.fechaLarga(H.hoy()))}</p>
          <h1 id="diaTit" class="dia-tit">La oración de hoy</h1>
          <p class="dia-tema">${H.esc(H.temaNombre(o.tema))}</p>
          <div id="diaOracion">${H.oracionHTML(o, { pinyin: H.estado.ajustes.pinyinLectura, tamano: 'grande' })}</div>
          <p class="dia-trad" id="diaTrad" ${verTrad ? '' : 'hidden'}>${H.esc(o.es)}</p>
          <div class="fila-acc">
            <button type="button" class="btn primario" id="diaVer">Mostrar traducción</button>
            <button type="button" class="btn" data-hablar="${H.esc(o.zh)}">${H.icono('voz')} Escuchar</button>
            <a class="btn sutil" href="#/leer?tema=${o.tema}&o=${o.id}">Leer más de este tema</a>
          </div>
          <details class="dato"><summary>Dato cultural</summary><p>${H.esc(o.dato)}</p></details>
          <p class="nota">Toca cualquier palabra para ver qué significa.</p>
        </section>

        ${avisoRespaldo ? `<p class="aviso">Hace más de una semana que no descargas una copia de tu progreso. <a href="#/ajustes">Descárgala en Ajustes</a> para no perderlo.</p>` : ''}

        <section class="hoy" aria-labelledby="hoyTit">
          <div class="hoy-cab"><h2 id="hoyTit">Tus misiones de hoy</h2><p class="nota">${hechas} de ${mis.length} completadas</p></div>
          <ul class="misiones">${mis.map(m => `
            <li class="${m.hecha ? 'hecha' : ''}">
              <span class="mis-check" aria-hidden="true">${m.hecha ? '✓' : ''}</span>
              <a href="${m.ruta}">${H.esc(m.texto)}</a>
              <span class="mis-val">${H.esc(m.nota || (m.valor + ' de ' + m.meta))}</span>
            </li>`).join('')}</ul>
        </section>

        <section class="resumen-inicio" aria-label="Resumen">
          <dl class="cifras">
            <div><dt>Repasos pendientes</dt><dd>${H.num(s.pendientes)}</dd></div>
            <div><dt>Palabras aprendidas</dt><dd>${H.num(s.aprendidas)} <small>de ${H.num(s.total)}</small></dd></div>
            <div><dt>Oraciones leídas</dt><dd>${H.num(s.leidas)} <small>de ${HTL.ORACIONES.length}</small></dd></div>
            <div><dt>Racha</dt><dd>${H.num(s.racha)} <small>${s.racha === 1 ? 'día' : 'días'}</small></dd></div>
          </dl>
          <div class="fila-acc">
            <a class="btn primario" href="${s.pendientes ? '#/tarjetas?modo=pendientes' : '#/tarjetas?modo=nuevas'}">${s.pendientes ? 'Repasar mis tarjetas' : 'Aprender palabras nuevas'}</a>
            <a class="btn" href="#/practicar">Practicar</a>
          </div>
        </section>`;

      H.activarOracion(el.querySelector('#diaOracion'), o);
      const ver = el.querySelector('#diaVer'), trad = el.querySelector('#diaTrad');
      ver.addEventListener('click', () => {
        trad.hidden = !trad.hidden;
        ver.textContent = trad.hidden ? 'Mostrar traducción' : 'Ocultar traducción';
        if (!trad.hidden) H.marcarLeida(o.id);
      });
      el.querySelector('.dato').addEventListener('toggle', ev => { if (ev.target.open) H.marcarLeida(o.id); });
    }
  };
})(window.HTL);

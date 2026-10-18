/* Escribir: orden de trazos animado y práctica con revisión trazo por trazo (Hanzi Writer + Make Me a Hanzi). */
'use strict';
(function (H) {
  const cargarLib = () => Promise.all([H.cargarScript('js/lib/hanzi-writer.min.js'), H.cargarScript('js/datos/trazos.js')]);
  const color = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#333';
  function cargador(c, ok, err) {
    if (HTL.TRAZOS && HTL.TRAZOS[c]) { ok(HTL.TRAZOS[c]); return; }
    fetch('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/' + encodeURIComponent(c) + '.json')
      .then(r => { if (!r.ok) throw new Error('sin datos'); return r.json(); })
      .then(ok).catch(err);
  }

  H.vistas.escribir = {
    titulo: 'Escribir',
    render(el) {
      const prm = H.params();
      let texto = (prm.c || '').split('').filter(H.esHan).join('').slice(0, 6) || H.barajar(H.vocabBase().filter(v => v.n === 1 && v.h.length === 1))[0].h;
      let idx = 0, writer = null, modo = 'animar';
      el.innerHTML = `
        <h1>Escribir</h1>
        <p class="intro">Mira el orden correcto de los trazos y luego escríbelo tú con el mouse, el dedo o un lápiz digital. La aplicación revisa cada trazo: su forma, su dirección y su orden.</p>
        <form class="config" id="eForm">
          <label class="campo">Carácter o palabra <input id="eTexto" lang="zh-CN" maxlength="6" value="${H.esc(texto)}" autocomplete="off"></label>
          <label class="campo">O elige una palabra al azar de <select id="eNivel">${HTL.NIVELES.map(n => `<option value="${n.n}">${n.nombre}</option>`).join('')}</select></label>
          <button type="submit" class="btn">Cambiar</button><button type="button" class="btn sutil" id="eAzar">Al azar</button>
        </form>
        <div class="escritura">
          <div class="esc-izq">
            <div class="esc-chars" id="eChars" role="group" aria-label="Caracteres"></div>
            <div class="tianzige-lienzo" id="eLienzo" aria-label="Área de escritura" role="img"></div>
            <div class="modos" role="group" aria-label="Modo">
              <button type="button" class="btn" data-modo="animar" aria-pressed="true">Ver el orden</button>
              <button type="button" class="btn" data-modo="guia" aria-pressed="false">Escribir con guía</button>
              <button type="button" class="btn" data-modo="memoria" aria-pressed="false">Escribir de memoria</button>
            </div>
          </div>
          <div class="esc-der">
            <div id="eInfo"></div>
            <div class="retro" id="eRetro" aria-live="polite"></div>
            <details class="dato"><summary>Reglas generales del orden de trazos</summary><ul>
              <li>De arriba hacia abajo: <span lang="zh-CN">三</span>.</li><li>De izquierda a derecha: <span lang="zh-CN">川</span>.</li>
              <li>Horizontal antes que vertical cuando se cruzan: <span lang="zh-CN">十</span>.</li>
              <li>Primero el trazo que baja a la izquierda y luego el de la derecha: <span lang="zh-CN">人</span>.</li>
              <li>En caracteres simétricos, primero el centro: <span lang="zh-CN">小</span>.</li>
              <li>Primero el marco, luego el interior y al final se cierra abajo: <span lang="zh-CN">国</span>.</li></ul>
              <p class="nota">Son guías con excepciones; la animación muestra el orden exacto de cada carácter.</p></details>
            <p class="nota">La revisión es automática y aproximada: comprueba cada trazo, pero no califica la belleza ni las proporciones. Los datos de trazos vienen del proyecto Make Me a Hanzi.</p>
          </div>
        </div>`;
      const lienzo = el.querySelector('#eLienzo'), retro = el.querySelector('#eRetro');
      const $ = s => el.querySelector(s);

      function info() {
        const c = Array.from(texto)[idx];
        const v = H.porHanzi(texto)[0] || H.porHanzi(c)[0];
        const reg = H.estado.escritura[c];
        $('#eInfo').innerHTML = `<p class="esc-palabra" lang="zh-CN">${H.esc(texto)}</p>
          ${v ? `<p><span class="py">${H.esc(v.p)}</span> ${H.esc(v.es)}</p>` : '<p class="nota">Palabra fuera del vocabulario HSK 1 a 4; búscala en el diccionario.</p>'}
          <p><button type="button" class="btn sutil" data-hablar="${H.esc(texto)}">${H.icono('voz')} Escuchar</button></p>
          ${reg ? `<p class="nota">Has escrito ${H.esc(c)} ${reg.veces} ${reg.veces === 1 ? 'vez' : 'veces'}. Tu mejor intento de memoria: ${reg.mejor === null ? 'aún ninguno' : reg.mejor + ' errores'}.</p>` : ''}`;
        $('#eChars').innerHTML = Array.from(texto).map((ch, k) => `<button type="button" class="chip ${k === idx ? 'act' : ''}" data-k="${k}" lang="zh-CN" aria-pressed="${k === idx}">${H.esc(ch)}</button>`).join('');
        el.querySelectorAll('#eChars .chip').forEach(b => b.addEventListener('click', () => { idx = +b.dataset.k; crear(); }));
      }

      function crear() {
        const c = Array.from(texto)[idx];
        info();
        lienzo.innerHTML = '';
        retro.className = 'retro'; retro.innerHTML = '<p class="nota">Cargando trazos…</p>';
        cargarLib().then(() => {
          const tam = Math.min(300, lienzo.clientWidth || 300);
          writer = HanziWriter.create(lienzo, c, {
            width: tam, height: tam, padding: 12, showOutline: true, showCharacter: false,
            strokeColor: color('--tinta'), outlineColor: color('--guia'), drawingColor: color('--cobalto'), highlightColor: color('--jade'),
            radicalColor: null, drawingWidth: 22, strokeAnimationSpeed: 1, delayBetweenStrokes: 250,
            charDataLoader: cargador,
            onLoadCharDataError: () => { retro.className = 'retro mal'; retro.innerHTML = '<p>No hay datos de trazos para este carácter sin conexión a internet. Prueba con otro.</p>'; }
          });
          aplicarModo();
        }).catch(() => { retro.className = 'retro mal'; retro.innerHTML = '<p>No se pudo cargar el módulo de escritura.</p>'; });
      }

      function aplicarModo() {
        if (!writer) return;
        const c = Array.from(texto)[idx];
        try { writer.cancelQuiz(); } catch (e) { /* nada */ }
        el.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === modo)));
        if (modo === 'animar') {
          writer.showOutline(); writer.hideCharacter();
          retro.className = 'retro'; retro.innerHTML = '<p>Observa el orden de los trazos.</p><button type="button" class="btn" id="eRep">Repetir animación</button>';
          writer.animateCharacter();
          retro.querySelector('#eRep').addEventListener('click', () => { writer.hideCharacter(); writer.animateCharacter(); });
          return;
        }
        const conGuia = modo === 'guia';
        if (conGuia) writer.showOutline(); else writer.hideOutline();
        writer.hideCharacter();
        retro.className = 'retro'; retro.innerHTML = `<p>${conGuia ? 'Escribe sobre la guía gris, trazo por trazo.' : 'Escribe el carácter sin guía. Tras tres errores en un trazo, te mostramos una pista.'}</p>`;
        writer.quiz({
          showHintAfterMisses: conGuia ? 2 : 3,
          leniency: 1.1,
          onMistake: d => { retro.className = 'retro mal'; retro.innerHTML = `<p>Ese trazo no coincide (trazo ${d.strokeNum + 1}). Revisa la dirección y el orden.</p>`; },
          onCorrectStroke: d => { retro.className = 'retro bien'; retro.innerHTML = `<p>Bien: trazo ${d.strokeNum + 1} de ${d.strokeNum + 1 + d.strokesRemaining}.</p>`; },
          onComplete: s => {
            const reg = H.estado.escritura[c] || (H.estado.escritura[c] = { veces: 0, mejor: null });
            reg.veces++;
            if (!conGuia) { reg.mejor = reg.mejor === null ? s.totalMistakes : Math.min(reg.mejor, s.totalMistakes); H.registrar('escritura'); }
            H.guardar();
            retro.className = 'retro ' + (s.totalMistakes === 0 ? 'bien' : '');
            retro.innerHTML = `<p><strong>${s.totalMistakes === 0 ? 'Perfecto: sin errores.' : 'Completado con ' + s.totalMistakes + (s.totalMistakes === 1 ? ' error.' : ' errores.')}</strong></p>
              <div class="fila-acc"><button type="button" class="btn" id="eOtra">Otra vez</button>${idx < Array.from(texto).length - 1 ? '<button type="button" class="btn primario" id="eSig">Siguiente carácter</button>' : ''}</div>`;
            retro.querySelector('#eOtra').addEventListener('click', aplicarModo);
            const sg = retro.querySelector('#eSig'); if (sg) sg.addEventListener('click', () => { idx++; crear(); });
            info();
          }
        });
      }

      el.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { modo = b.dataset.modo; aplicarModo(); }));
      $('#eForm').addEventListener('submit', ev => {
        ev.preventDefault();
        const t = Array.from($('#eTexto').value).filter(H.esHan).join('').slice(0, 6);
        if (!t) { H.toast('Escribe al menos un carácter chino.', 'error'); return; }
        texto = t; idx = 0; crear();
      });
      $('#eAzar').addEventListener('click', () => {
        const v = H.barajar(H.vocabBase().filter(x => x.n === +$('#eNivel').value))[0];
        texto = v.h; $('#eTexto').value = v.h; idx = 0; crear();
      });
      crear();
    }
  };
})(window.HTL);

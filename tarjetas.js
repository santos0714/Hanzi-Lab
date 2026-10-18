/* Tarjetas con repetición espaciada. */
'use strict';
(function (H) {
  H.vistas.tarjetas = {
    titulo: 'Tarjetas',
    render(el) {
      const prm = H.params();
      const pend = H.srs.pendientes().length;
      let modoIni = prm.modo || (pend ? 'pendientes' : 'nuevas');
      if (!['pendientes', 'nuevas', 'libre'].includes(modoIni)) modoIni = 'nuevas';
      const fuenteIni = prm.fuente || 'nivel:1';
      el.innerHTML = `
        <h1>Tarjetas</h1>
        <p class="intro">Mira la palabra, intenta recordar su significado y después revélalo. Califícate con honestidad: así el próximo repaso llega en el momento justo.</p>
        <form class="config" id="tCfg">
          <label class="campo">Qué estudiar
            <select id="tModo"><option value="pendientes">Repasos pendientes (${pend})</option><option value="nuevas">Palabras nuevas</option><option value="libre">Práctica libre</option></select></label>
          <label class="campo">Palabras de ${H.selectFuente('tFuente', fuenteIni)}</label>
          <label class="campo">Dirección <select id="tDir"><option value="zh">Chino → español</option><option value="es">Español → chino</option></select></label>
          <label class="campo">Cantidad <select id="tCant"><option value="10">10</option><option value="20" selected>20</option><option value="0">Todas</option></select></label>
          <label class="interruptor"><input type="checkbox" id="tPy" ${H.estado.ajustes.pinyinTarjetas ? 'checked' : ''}> Pinyin en el frente</label>
          <button class="btn primario" type="submit">Empezar</button>
        </form>
        <section id="tZona"></section>`;
      el.querySelector('#tModo').value = modoIni;
      const zona = el.querySelector('#tZona'), $ = s => el.querySelector(s);
      let ses = null;
      el.querySelector('#tCfg').addEventListener('submit', ev => { ev.preventDefault(); iniciar(); });

      function iniciar() {
        const modo = $('#tModo').value, fuente = $('#tFuente').value, cant = +$('#tCant').value;
        H.estado.ajustes.pinyinTarjetas = $('#tPy').checked; H.guardar();
        const hoy = H.hoy(), srs = H.estado.srs;
        let pal = modo === 'pendientes' ? H.vocab() : H.palabrasDe(fuente);
        if (modo === 'pendientes') pal = H.barajar(pal.filter(v => srs[v.id] && srs[v.id].proxima <= hoy));
        else if (modo === 'nuevas') pal = pal.filter(v => !srs[v.id]);
        else pal = H.barajar(pal);
        if (cant > 0) pal = pal.slice(0, cant);
        if (!pal.length) {
          zona.innerHTML = `<p class="vacio">${{ pendientes: 'No tienes repasos pendientes. Elige «Palabras nuevas» para seguir avanzando.', nuevas: 'Ya empezaste todas las palabras de esta selección. Elige otro nivel o haz «Práctica libre».', libre: 'Esta selección no tiene palabras. Agrega palabras desde el diccionario o desde la lectura.' }[modo]}</p>`;
          return;
        }
        ses = { cola: pal.map(v => v.id), i: 0, volteada: false, dir: $('#tDir').value, py: $('#tPy').checked, bien: 0, mal: 0, fallos: [], reintento: new Set(), msg: '', fin: false };
        el.querySelector('#tCfg').hidden = true;
        el.querySelector('.intro').hidden = true;
        pintar();
      }

      function pintar() {
        const v = H.porId(ses.cola[ses.i]);
        if (!v) { siguiente(); return; }
        const c = H.estado.srs[v.id], fav = H.estado.favoritos.includes(v.id), total = ses.cola.length;
        const ej = v.ej && v.ej.length ? H.oracionPorId(v.ej[0]) : null;
        const verHan = ses.dir === 'zh' || ses.volteada;
        zona.innerHTML = `
          <div class="ses-cab"><span>${ses.i + 1} de ${total}</span><span>${ses.bien} bien, ${ses.mal} por repasar</span></div>
          <div class="progreso" role="progressbar" aria-label="Avance" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${ses.i}"><span style="width:${ses.i / total * 100}%"></span></div>
          <article class="tarjeta ${ses.volteada ? 'volteada' : ''}">
            <p class="tarjeta-meta">${H.esc(H.nivelTexto(v.n))}</p>
            ${verHan ? `<div class="tianzige-grupo" lang="zh-CN">${Array.from(v.h).map(ch => `<span class="tianzige">${H.esc(ch)}</span>`).join('')}</div>` : ''}
            ${verHan && (ses.py || ses.volteada) ? `<p class="tarjeta-py">${H.esc(v.p)}</p>` : ''}
            ${ses.dir === 'es' || ses.volteada ? `<p class="tarjeta-es">${H.esc(v.es)}${v.ingles ? ' <span class="etiqueta">inglés</span>' : ''}</p>` : ''}
            ${ses.dir === 'es' && !ses.volteada ? '<p class="nota">¿Cómo se escribe y se pronuncia en chino?</p>' : ''}
            ${ses.volteada && ej ? `<div class="tarjeta-ej"><p lang="zh-CN">${H.esc(ej.zh)}</p><p class="nota">${H.esc(ej.es)}</p></div>` : ''}
          </article>
          <div class="acc-tarjeta">
            ${ses.volteada ? `<button type="button" class="btn grande malo" id="noSe">No la sabía <kbd>1</kbd></button><button type="button" class="btn grande bueno" id="siSe">La sabía <kbd>2</kbd></button>` : `<button type="button" class="btn grande primario" id="voltear">Mostrar respuesta <kbd>Espacio</kbd></button>`}
          </div>
          <div class="fila-acc centrada">
            ${verHan ? `<button type="button" class="btn sutil" data-hablar="${H.esc(v.h)}">${H.icono('voz')} Escuchar</button>` : ''}
            <button type="button" class="btn sutil" id="tFav" aria-pressed="${fav}">${H.icono('estrella', fav ? 'lleno' : '')} ${fav ? 'Favorita' : 'Marcar favorita'}</button>
            <button type="button" class="btn sutil" id="tFin">Terminar</button>
          </div>
          <p class="nota centrada">${H.esc(H.srs.descripcion(c))}${ses.msg ? ' Anterior: ' + H.esc(ses.msg) : ''}</p>`;
        const vb = zona.querySelector('#voltear');
        if (vb) vb.addEventListener('click', voltear);
        const si = zona.querySelector('#siSe');
        if (si) { si.addEventListener('click', () => calificar(true)); zona.querySelector('#noSe').addEventListener('click', () => calificar(false)); }
        zona.querySelector('#tFav').addEventListener('click', () => { H.toggleFav(v.id); pintar(); });
        zona.querySelector('#tFin').addEventListener('click', terminar);
      }
      function voltear() { ses.volteada = true; pintar(); const s = zona.querySelector('#siSe'); if (s) s.focus(); }
      function calificar(sabe) {
        const id = ses.cola[ses.i];
        ses.msg = H.srs.calificar(id, sabe).mensaje;
        if (sabe) ses.bien++; else { ses.mal++; if (!ses.fallos.includes(id)) ses.fallos.push(id); if (!ses.reintento.has(id)) { ses.reintento.add(id); ses.cola.push(id); } }
        siguiente();
      }
      function siguiente() { ses.i++; ses.volteada = false; if (ses.i >= ses.cola.length) terminar(); else pintar(); }
      function terminar() {
        ses.fin = true;
        const f = ses.fallos.map(H.porId).filter(Boolean);
        zona.innerHTML = `<div class="fin-sesion">
          <h2>Sesión terminada</h2>
          <p>Calificaste ${ses.bien + ses.mal} tarjetas: ${ses.bien} que sabías y ${ses.mal} por repasar.</p>
          ${f.length ? `<h3>Para reforzar</h3><ul class="lista-palabras">${f.map(v => `<li><span lang="zh-CN" class="g-han">${H.esc(v.h)}</span> <span class="py">${H.esc(v.p)}</span> ${H.esc(v.es)}</li>`).join('')}</ul>` : '<p>No fallaste ninguna. Muy bien.</p>'}
          <div class="fila-acc"><button type="button" class="btn primario" id="tOtra">Otra sesión</button><a class="btn" href="#/practicar">Practicar</a></div></div>`;
        zona.querySelector('#tOtra').addEventListener('click', () => { el.querySelector('#tCfg').hidden = false; el.querySelector('.intro').hidden = false; zona.innerHTML = ''; });
      }
      const tecla = ev => {
        if (!ses || ses.fin || H.modalAbierto()) return;
        const tag = document.activeElement && document.activeElement.tagName;
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
        if (ev.key === ' ' && !ses.volteada && tag !== 'BUTTON' && tag !== 'A') { ev.preventDefault(); voltear(); }
        else if (ses.volteada && ev.key === '1') { ev.preventDefault(); calificar(false); }
        else if (ses.volteada && ev.key === '2') { ev.preventDefault(); calificar(true); }
      };
      document.addEventListener('keydown', tecla);
      H.alSalir(() => document.removeEventListener('keydown', tecla));
      if (prm.modo || prm.fuente) iniciar();
    }
  };
})(window.HTL);

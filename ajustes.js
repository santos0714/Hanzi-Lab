/* Ajustes: tema, voz, respaldo, reinicio y créditos. */
'use strict';
(function (H) {
  H.vistas.ajustes = {
    titulo: 'Ajustes',
    render(el) {
      const a = H.estado.ajustes;
      el.innerHTML = `
        <h1>Ajustes</h1>
        <section><h2>Apariencia</h2>
          <fieldset class="segmentado"><legend>Tema</legend>
            ${[['claro', 'Claro'], ['oscuro', 'Oscuro'], ['sistema', 'Como el sistema']].map(([v, t]) => `<label><input type="radio" name="tema" value="${v}" ${a.tema === v ? 'checked' : ''}> ${t}</label>`).join('')}
          </fieldset></section>

        <section><h2>Voz</h2>
          <div id="aVozEst"></div>
          <div class="config">
            <label class="campo">Voz en chino <select id="aVoz"></select></label>
            <label class="campo">Velocidad <input type="range" id="aVel" min="0.5" max="1.2" step="0.05" value="${a.velocidadVoz}"></label>
          </div>
          <div class="fila-acc"><button type="button" class="btn" id="aProbar">${H.icono('voz')} Probar: 你好，欢迎！</button></div>
          <details class="dato"><summary>Cómo instalar una voz en chino en Windows</summary><ol>
            <li>Abre Configuración, luego Hora e idioma y después Voz.</li>
            <li>En «Administrar voces», elige «Agregar voces» y selecciona Chino (simplificado, China).</li>
            <li>Cuando termine la descarga, cierra el navegador por completo y vuelve a abrir Hanzi Lab.</li></ol>
            <p class="nota">Microsoft Edge suele ofrecer además voces chinas en línea de buena calidad, que solo funcionan con internet. La aplicación lee en voz alta, pero no evalúa tu pronunciación.</p></details></section>

        <section><h2>Tu progreso</h2>
          <div data-zona-archivo="ajustes">${H.tarjetaArchivo(true)}</div>
          <h3>Copia extra</h3>
          <p>Si quieres, descarga también una copia de tu progreso para guardarla en una memoria USB o en OneDrive. Para recuperarla, usa «Cargar una copia».</p>
          <p class="nota">Última copia descargada: ${a.ultimoRespaldo ? H.esc(H.fechaCorta(a.ultimoRespaldo)) : 'ninguna todavía'}.</p>
          <div class="fila-acc"><button type="button" class="btn" id="aResp">Descargar una copia</button><label class="btn" for="aArch">Cargar una copia</label><input type="file" id="aArch" accept=".json,application/json" class="sr"></div></section>

        <section><h2>Empezar de cero</h2>
          <div class="fila-acc"><button type="button" class="btn peligro" id="aReset">Borrar todo mi progreso</button><button type="button" class="btn" id="aTut">Ver el tutorial</button></div></section>

        <section class="creditos"><h2>Créditos y licencias</h2>
          <ul>
            <li>Diccionario: <a href="https://cc-cedict.org/" rel="noopener">CC-CEDICT</a>, licencia CC BY-SA 4.0. Definiciones originales en inglés.</li>
            <li>Lista de vocabulario: niveles 1 a 4 del estándar HSK 3.0 (2021). Traducciones al español (HSK 1 a 4 y glosario complementario) y oraciones de cultura general: Hanzi Lab.</li>
            <li>Orden de trazos: <a href="https://github.com/skishore/makemeahanzi" rel="noopener">Make Me a Hanzi</a> (Arphic Public License) y la biblioteca <a href="https://hanziwriter.org/" rel="noopener">Hanzi Writer</a> (licencia MIT).</li>
            <li>Pinyin de las oraciones: generado con pinyin-pro (MIT) y revisado a mano.</li>
          </ul>${document.getElementById('fuente:licencias') ? '<div class="fila-acc"><button type="button" class="btn sutil" id="aLic">Ver los textos completos de las licencias</button></div>' : '<p class="nota">El archivo LICENCIAS.md y la carpeta «licencias» tienen los textos completos.</p>'}</section>`;
      const $ = s => el.querySelector(s);
      el.querySelectorAll('input[name=tema]').forEach(r => r.addEventListener('change', () => { a.tema = r.value; H.guardar(); H.aplicarTema(); }));
      const pintarVoz = () => {
        H.voz.cargar();
        $('#aVozEst').innerHTML = !H.voz.soportado ? '<p class="aviso">Este navegador no puede leer en voz alta. Usa Microsoft Edge o Google Chrome.</p>'
          : !H.voz.lista.length ? '<p class="aviso">No se encontró ninguna voz en chino en este equipo. Abajo te explicamos cómo agregarla; el resto de la aplicación funciona igual.</p>'
            : `<p class="nota">${H.voz.lista.length} ${H.voz.lista.length === 1 ? 'voz disponible' : 'voces disponibles'} en chino.</p>`;
        const el2 = H.voz.elegir();
        $('#aVoz').innerHTML = H.voz.lista.length ? H.voz.lista.map(v => `<option value="${H.esc(v.voiceURI)}" ${el2 && el2.voiceURI === v.voiceURI ? 'selected' : ''}>${H.esc(v.name)} (${H.esc(v.lang)})${v.localService === false ? ', en línea' : ''}</option>`).join('') : '<option>Sin voces en chino</option>';
      };
      pintarVoz(); const t = setTimeout(pintarVoz, 800); H.alSalir(() => clearTimeout(t));
      $('#aVoz').addEventListener('change', ev => { a.voz = ev.target.value; H.guardar(); });
      $('#aVel').addEventListener('input', ev => { a.velocidadVoz = +ev.target.value; H.guardar(); });
      $('#aProbar').addEventListener('click', () => H.voz.hablar('你好，欢迎！'));
      $('#aTut').addEventListener('click', H.mostrarTutorial);
      const lic = $('#aLic');
      if (lic) lic.addEventListener('click', () => H.modal({ titulo: 'Licencias', cuerpo: `<pre class="licencias">${H.esc(document.getElementById('fuente:licencias').textContent)}</pre>`, acciones: [{ texto: 'Cerrar', clase: 'primario', cierra: true, accion: () => {} }] }));
      $('#aResp').addEventListener('click', () => {
        a.ultimoRespaldo = H.hoy(); H.guardar();
        H.descargar('hanzi-lab-respaldo-' + H.hoy() + '.json', JSON.stringify({ app: 'Hanzi Lab', formato: 1, exportado: new Date().toISOString(), estado: H.estado }), 'application/json');
        H.render();
      });
      $('#aArch').addEventListener('change', ev => {
        const f = ev.target.files && ev.target.files[0]; if (!f) return;
        const lector = new FileReader();
        lector.onload = async () => {
          ev.target.value = '';
          let obj; try { obj = JSON.parse(lector.result); } catch (e) { H.toast('Ese archivo no es una copia de Hanzi Lab.', 'error'); return; }
          if (!obj || obj.app !== 'Hanzi Lab' || !obj.estado || typeof obj.estado.srs !== 'object') { H.toast('Ese archivo no es una copia de Hanzi Lab.', 'error'); return; }
          if (!(await H.confirmar('¿Cargar la copia del ' + new Date(obj.exportado).toLocaleString('es-MX') + ' (' + H.resumenProgreso(obj.estado) + ')? Reemplazará tu progreso actual.', { si: 'Cargar la copia', peligro: true }))) return;
          H.estado = H.normalizarEstado(obj.estado); H.estado.tutorialVisto = true; H.guardar(); H.reindexar(); H.aplicarTema();
          H.toast('Copia cargada.'); H.render();
        };
        lector.readAsText(f);
      });
      $('#aReset').addEventListener('click', async () => {
        if (!(await H.confirmar('Se borrarán tus tarjetas, listas, oraciones leídas y estadísticas, también en tu archivo de progreso. Esta acción no se puede deshacer. Antes conviene descargar una copia.', { si: 'Borrar todo', peligro: true }))) return;
        const tema = a.tema; H.estado = H.estadoInicial(); H.estado.tutorialVisto = true; H.estado.ajustes.tema = tema; H.guardar(); H.reindexar();
        H.toast('Tu progreso se borró.'); location.hash = '#/inicio';
      });
    }
  };
})(window.HTL);

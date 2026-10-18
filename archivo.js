/* Hanzi Lab — Archivo de progreso.
 * Además del navegador, el progreso se guarda automáticamente en un archivo que la persona elige
 * (por ejemplo, en Documentos). Así no se pierde si se borran los datos del navegador, si cambia de
 * navegador o de computadora. Usa la API de acceso a archivos de Edge y Chrome; en otros navegadores
 * queda el respaldo descargable de siempre. */
'use strict';
(function (H) {
  const A = {
    soportado: typeof window.showSaveFilePicker === 'function' && typeof window.showOpenFilePicker === 'function' && typeof indexedDB !== 'undefined',
    estado: 'iniciando', // iniciando | sin | listo | permiso | nosoportado
    handle: null,
    nombre: '',
    ultimaEscritura: null,
    oyentes: []
  };
  H.archivo = A;
  const TIPOS = [{ description: 'Progreso de Hanzi Lab', accept: { 'application/json': ['.json'] } }];

  /* ---------- Recordar el archivo entre sesiones (IndexedDB) ---------- */
  function idb(modo, fn) {
    return new Promise((res, rej) => {
      const r = indexedDB.open('hanziLab', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onerror = () => rej(r.error);
      r.onsuccess = () => {
        const db = r.result, tx = db.transaction('kv', modo), st = tx.objectStore('kv');
        const q = fn(st);
        tx.oncomplete = () => { db.close(); res(q && q.result); };
        tx.onerror = () => { db.close(); rej(tx.error); };
      };
    });
  }
  const guardarHandle = h => idb('readwrite', st => h ? st.put(h, 'archivo') : st.delete('archivo'));
  const leerHandle = () => idb('readonly', st => st.get('archivo'));

  function cambiar(est) {
    A.estado = est;
    A.oyentes.forEach(f => { try { f(est); } catch (e) { console.error(e); } });
  }
  A.alCambiar = f => A.oyentes.push(f);

  H.tieneProgreso = e => !!e && (Object.keys(e.srs || {}).length > 0 || Object.keys(e.leidas || {}).length > 0 || Object.keys(e.escritura || {}).length > 0 || (e.quiz && e.quiz.total > 0));
  H.resumenProgreso = e => {
    const n = Object.keys(e.srs || {}).length, l = Object.keys(e.leidas || {}).length;
    return `${n} ${n === 1 ? 'palabra estudiada' : 'palabras estudiadas'} y ${l} ${l === 1 ? 'oración leída' : 'oraciones leídas'}`;
  };

  /* ---------- Leer y escribir ---------- */
  async function leer(h) {
    const f = await h.getFile();
    const txt = await f.text();
    if (!txt.trim()) return null;
    let obj; try { obj = JSON.parse(txt); } catch (e) { throw new Error('formato'); }
    if (!obj || obj.app !== 'Hanzi Lab' || !obj.estado || typeof obj.estado.srs !== 'object') throw new Error('formato');
    return obj.estado;
  }
  const contenido = () => JSON.stringify({ app: 'Hanzi Lab', formato: 1, exportado: new Date().toISOString(), estado: H.estado });

  let cadena = Promise.resolve(), pendiente = null;
  function escribirAhora() {
    if (!A.handle || A.estado !== 'listo') return cadena;
    const h = A.handle, datos = contenido();
    cadena = cadena.then(async () => {
      const w = await h.createWritable();
      await w.write(datos); await w.close();
      A.ultimaEscritura = new Date(); fijarMarca(JSON.parse(datos).estado.guardadoEn);
    }).catch(err => {
      console.warn('No se pudo escribir el archivo de progreso:', err);
      if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) cambiar('permiso');
      else if (err && err.name === 'NotFoundError') { A.handle = null; guardarHandle(null).catch(() => {}); cambiar('sin'); H.toast('No se encontró tu archivo de progreso (¿se movió o se borró?). Elige dónde guardarlo de nuevo.', 'error'); }
    });
    return cadena;
  }
  A.programar = function () {
    if (A.estado !== 'listo') return;
    clearTimeout(pendiente);
    pendiente = setTimeout(escribirAhora, 700);
  };
  A.escribirYa = function () { clearTimeout(pendiente); return escribirAhora(); };

  function adoptar(estado) {
    H.estado = H.normalizarEstado(estado);
    H.estado.tutorialVisto = true;
    H._ultimoGuardado = JSON.stringify(H.estado);
    try { localStorage.setItem(H.CLAVE, H._ultimoGuardado); } catch (e) { /* nada */ }
    H.reindexar(); H.aplicarTema(); H.cerrarModal(); H.render();
  }

  /* Marca de la última sincronización con el archivo (guardadoEn de lo último que se leyó o escribió). */
  const MARCA = 'hanziLab.ultimaSync';
  const marca = () => { try { return +localStorage.getItem(MARCA) || 0; } catch (e) { return 0; } };
  const fijarMarca = t => { try { localStorage.setItem(MARCA, String(t || 0)); } catch (e) { /* nada */ } };

  /* Compara el archivo con el navegador. Si solo uno cambió desde la última vez, gana ese sin preguntar;
   * si cambiaron los dos (o es un archivo nuevo para este navegador), la persona elige. Devuelve false si cancela. */
  async function sincronizar(h, { nuevo = false } = {}) {
    let delArchivo = null;
    try { delArchivo = await leer(h); }
    catch (e) {
      if (e.message === 'formato') { H.toast('Ese archivo no es un archivo de progreso de Hanzi Lab.', 'error'); return false; }
      throw e;
    }
    const local = H.estado, base = nuevo ? -1 : marca();
    if (!delArchivo || !H.tieneProgreso(delArchivo)) return true;               // archivo vacío: se escribe lo de aquí
    const tA = delArchivo.guardadoEn || 0, tL = local.guardadoEn || 0;
    let usar;
    if (!H.tieneProgreso(local) || tA === tL) usar = 'archivo';
    else if (tA <= base) usar = 'local';                                         // el archivo no cambió desde la última vez
    else if (tL <= base) usar = 'archivo';                                       // aquí no cambió nada; el archivo sí
    else {
      usar = await H.elegir(`El archivo tiene este progreso: ${H.resumenProgreso(delArchivo)} (guardado el ${new Date(tA).toLocaleString('es-MX')}). Este navegador tiene este otro: ${H.resumenProgreso(local)} (guardado el ${new Date(tL).toLocaleString('es-MX')}). ¿Cuál quieres conservar? El otro se reemplazará.`,
        [{ texto: 'El de este navegador', valor: 'local' }, { texto: 'El del archivo', valor: 'archivo', clase: 'primario' }], { titulo: 'Tienes dos progresos distintos' });
      if (!usar) return false;
    }
    if (usar === 'archivo') {
      const cambio = tA !== tL;
      adoptar(delArchivo); fijarMarca(tA);
      if (cambio) H.toast('Se cargó tu progreso: ' + H.resumenProgreso(H.estado) + '.');
    }
    return true;
  }

  async function activar(h) {
    A.handle = h; A.nombre = h.name || 'archivo de progreso';
    await guardarHandle(h).catch(() => {});
    cambiar('listo');
    await escribirAhora();
  }

  /* ---------- Acciones de la persona ---------- */
  // Elegir dónde se guarda (crea el archivo).
  A.crear = async function () {
    if (!A.soportado) { location.hash = '#/ajustes'; return; }
    let h;
    try { h = await window.showSaveFilePicker({ suggestedName: 'Mi progreso de Hanzi Lab.json', startIn: 'documents', types: TIPOS }); }
    catch (e) { if (e && e.name !== 'AbortError') H.toast('No se pudo crear el archivo. Prueba con otra carpeta, por ejemplo Documentos.', 'error'); return; }
    try {
      // Si eligió un archivo que ya tenía progreso, no lo sobrescribimos sin preguntar.
      if (!(await sincronizar(h, { nuevo: true }))) return;
      await activar(h);
      H.toast('Listo: tu progreso se guardará solo en «' + A.nombre + '».');
    } catch (e) { console.warn(e); H.toast('No se pudo usar ese archivo. Prueba con otra carpeta, por ejemplo Documentos.', 'error'); }
  };
  // Abrir un archivo de progreso que ya existe (otra computadora, otro navegador, datos borrados).
  A.abrir = async function () {
    if (!A.soportado) { location.hash = '#/ajustes'; return; }
    let h;
    try { [h] = await window.showOpenFilePicker({ types: TIPOS, multiple: false, startIn: 'documents' }); }
    catch (e) { if (e && e.name !== 'AbortError') H.toast('No se pudo abrir el archivo.', 'error'); return; }
    try {
      if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') { H.toast('Sin tu permiso, Hanzi Lab no puede guardar en ese archivo.', 'error'); return; }
      if (!(await sincronizar(h, { nuevo: true }))) return;
      await activar(h);
      H.toast('Listo: seguirás guardando en «' + A.nombre + '».');
    } catch (e) { console.warn(e); H.toast('No se pudo abrir el archivo.', 'error'); }
  };
  // Volver a dar permiso (el navegador lo pide de nuevo en algunas sesiones).
  A.reactivar = async function () {
    if (!A.handle) return A.crear();
    try {
      if ((await A.handle.requestPermission({ mode: 'readwrite' })) !== 'granted') { H.toast('Sin tu permiso no se puede guardar en el archivo. Tu progreso sigue guardado en este navegador.', 'error'); return; }
      await sincronizar(A.handle);
      cambiar('listo');
      await escribirAhora();
      H.toast('Listo: tu progreso se guarda otra vez en tu archivo.');
    } catch (e) {
      console.warn(e);
      if (e && e.name === 'NotFoundError') { A.handle = null; await guardarHandle(null).catch(() => {}); cambiar('sin'); H.toast('No se encontró tu archivo de progreso. Elige dónde guardarlo de nuevo, o abre el archivo si lo moviste.', 'error'); }
      else H.toast('No se pudo usar el archivo de progreso.', 'error');
    }
  };
  A.olvidar = async function () {
    A.handle = null; A.nombre = '';
    await guardarHandle(null).catch(() => {});
    cambiar(A.soportado ? 'sin' : 'nosoportado');
  };

  /* ---------- Arranque ---------- */
  A.init = async function () {
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* nada */ }
    if (!A.soportado) { cambiar('nosoportado'); return; }
    let h = null;
    try { h = await leerHandle(); } catch (e) { console.warn(e); }
    if (!h) { cambiar('sin'); return; }
    A.handle = h; A.nombre = h.name || 'archivo de progreso';
    let p = 'prompt';
    try { p = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { /* nada */ }
    if (p !== 'granted') { cambiar('permiso'); return; }
    try { await sincronizar(h); cambiar('listo'); await escribirAhora(); }
    catch (e) {
      console.warn(e);
      if (e && e.name === 'NotFoundError') { A.handle = null; await guardarHandle(null).catch(() => {}); cambiar('sin'); H.toast('No se encontró tu archivo de progreso (¿se movió o se borró?). Elige dónde guardarlo de nuevo, o ábrelo si lo moviste.', 'error'); }
      else cambiar('permiso');
    }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') A.escribirYa(); });
})(window.HTL);

/* ---------- Interfaz: indicador de la cabecera y tarjeta de guardado ---------- */
(function (H) {
  const A = H.archivo;
  const ico = {
    ok: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    guardar: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>',
    alerta: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>'
  };
  const hora = d => d ? d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' }) : '';

  function indicador() {
    const b = document.getElementById('btnArchivo'); if (!b) return;
    const e = A.estado;
    b.hidden = e === 'iniciando' || e === 'nosoportado';
    b.className = 'estado-archivo ' + (e === 'listo' ? 'ok' : 'atencion');
    if (e === 'listo') { b.innerHTML = ico.ok + '<span>Guardado</span>'; b.setAttribute('aria-label', 'Tu progreso se guarda solo en «' + A.nombre + '». Ver detalles.'); b.title = 'Tu progreso se guarda solo en «' + A.nombre + '»'; }
    else if (e === 'permiso') { b.innerHTML = ico.alerta + '<span>Seguir guardando</span>'; b.setAttribute('aria-label', 'Permitir que Hanzi Lab siga guardando tu progreso en tu archivo'); b.title = 'Haz clic para permitir que se guarde tu progreso'; }
    else { b.innerHTML = ico.guardar + '<span>Guardar mi progreso</span>'; b.setAttribute('aria-label', 'Elegir dónde guardar tu progreso'); b.title = 'Elige dónde guardar tu progreso'; }
  }

  // Tarjeta que aparece en Inicio (solo si hace falta) y en Ajustes (siempre).
  H.tarjetaArchivo = function (enAjustes) {
    const e = A.estado;
    if (e === 'sin') return `<div class="tarjeta-archivo">
        <h2>${ico.guardar} Guarda tu progreso en un archivo</h2>
        <p>Elige una carpeta de tu computadora, por ejemplo <strong>Documentos</strong>. Hanzi Lab guardará ahí tu progreso automáticamente cada vez que estudies. Solo lo haces una vez.</p>
        <div class="fila-acc"><button type="button" class="btn primario grande" data-archivo="crear">Elegir dónde guardarlo</button>
        <button type="button" class="btn" data-archivo="abrir">Ya tengo un archivo de progreso</button></div>
        <p class="nota">¿Usaste Hanzi Lab antes en otra computadora o en otro navegador? Elige «Ya tengo un archivo de progreso» y busca el archivo «Mi progreso de Hanzi Lab».</p></div>`;
    if (e === 'permiso') return `<div class="tarjeta-archivo">
        <h2>${ico.alerta} Falta un clic para guardar tu progreso</h2>
        <p>Por seguridad, el navegador pide permiso cada vez que abres Hanzi Lab. Haz clic en el botón y después elige <strong>«Guardar cambios»</strong> o <strong>«Permitir»</strong> en el aviso del navegador.</p>
        <div class="fila-acc"><button type="button" class="btn primario grande" data-archivo="reactivar">Permitir guardar en «${H.esc(A.nombre)}»</button>
        ${enAjustes ? '<button type="button" class="btn" data-archivo="abrir">Usar otro archivo</button>' : ''}</div></div>`;
    if (e === 'listo' && enAjustes) return `<div class="tarjeta-archivo ok">
        <h2>${ico.ok} Tu progreso se guarda solo</h2>
        <p>Cada cambio se guarda en tu computadora en el archivo <strong>«${H.esc(A.nombre)}»</strong>${A.ultimaEscritura ? ` (última vez: ${hora(A.ultimaEscritura)})` : ''}. No borres ni muevas ese archivo. Si cambias de computadora, cópialo a una memoria USB o a OneDrive y ábrelo desde ahí con «Usar otro archivo».</p>
        <div class="fila-acc"><button type="button" class="btn" data-archivo="crear">Guardar en otro lugar</button><button type="button" class="btn" data-archivo="abrir">Usar otro archivo</button><button type="button" class="btn sutil" data-archivo="olvidar">Dejar de usar este archivo</button></div></div>`;
    if (e === 'nosoportado' && enAjustes) return `<div class="tarjeta-archivo">
        <h2>${ico.alerta} Este navegador no puede guardar en un archivo</h2>
        <p>Para que tu progreso se guarde solo en un archivo, abre Hanzi Lab con <strong>Microsoft Edge</strong> o <strong>Google Chrome</strong>. Mientras tanto, descarga una copia de tu progreso cada semana con el botón de abajo.</p></div>`;
    return '';
  };

  function zonas() {
    document.querySelectorAll('[data-zona-archivo]').forEach(z => { z.innerHTML = H.tarjetaArchivo(z.dataset.zonaArchivo === 'ajustes'); });
  }
  A.alCambiar(() => { indicador(); zonas(); });
  H.pintarZonasArchivo = zonas;

  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-archivo]');
    if (b) { const acc = b.dataset.archivo; if (acc === 'olvidar') { H.confirmar('Tu progreso seguirá guardado en este navegador, pero ya no en el archivo. ¿Dejar de usarlo?', { si: 'Dejar de usarlo' }).then(si => { if (si) A.olvidar(); }); } else A[acc](); return; }
    if (ev.target.closest('#btnArchivo')) {
      if (A.estado === 'listo') location.hash = '#/ajustes';
      else if (A.estado === 'permiso') A.reactivar();
      else A.crear();
    }
  });
  // Actualiza la hora de la última escritura en Ajustes sin volver a pintar toda la pantalla.
  setInterval(() => { if (A.estado === 'listo' && document.querySelector('[data-zona-archivo="ajustes"]')) zonas(); }, 15000);
})(window.HTL);

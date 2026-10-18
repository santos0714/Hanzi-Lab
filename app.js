/* Hanzi Lab — Navegación, tutorial y arranque. */
'use strict';
(function (H) {
  const SECCIONES = [
    ['inicio', '首', 'Inicio', true],
    ['leer', '读', 'Leer', true],
    ['tarjetas', '卡', 'Tarjetas', true],
    ['practicar', '练', 'Practicar', true],
    ['escribir', '写', 'Escribir', false],
    ['dic', '词', 'Diccionario', false],
    ['progreso', '进', 'Progreso', false],
    ['ajustes', '设', 'Ajustes', false]
  ];
  const rutaActual = () => (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'inicio';

  function pintarNav() {
    document.getElementById('nav').innerHTML = `<ul>${SECCIONES.map(([id, ic, t]) => `<li><a href="#/${id}" data-ruta="${id}"><span class="nav-ic" lang="zh-CN" aria-hidden="true">${ic}</span><span>${t}</span></a></li>`).join('')}</ul>`;
    document.getElementById('navInferior').innerHTML = SECCIONES.filter(s => s[3]).map(([id, ic, t]) => `<a href="#/${id}" data-ruta="${id}"><span class="nav-ic" lang="zh-CN" aria-hidden="true">${ic}</span><span>${t}</span></a>`).join('') +
      `<a href="#/mas" data-ruta="mas"><span class="nav-ic" aria-hidden="true">…</span><span>Más</span></a>`;
  }

  H.vistas.mas = {
    titulo: 'Más',
    render(el) {
      el.innerHTML = `<h1>Más secciones</h1><ul class="lista-enlaces">${SECCIONES.filter(s => !s[3]).map(([id, ic, t]) => `<li><a href="#/${id}"><span class="nav-ic" lang="zh-CN" aria-hidden="true">${ic}</span><span>${t}</span></a></li>`).join('')}<li><button type="button" class="enlace" id="masTut"><span class="nav-ic" aria-hidden="true">?</span><span>Ver el tutorial</span></button></li></ul>`;
      el.querySelector('#masTut').addEventListener('click', H.mostrarTutorial);
    }
  };

  H.render = function () {
    H._limpiar.splice(0).forEach(f => { try { f(); } catch (e) { console.error(e); } });
    H.cerrarModal();
    if (H.voz.soportado) { try { window.speechSynthesis.cancel(); } catch (e) { /* nada */ } }
    let ruta = rutaActual();
    if (!H.vistas[ruta]) ruta = 'inicio';
    const enMas = ['escribir', 'dic', 'progreso', 'ajustes'].includes(ruta);
    document.querySelectorAll('[data-ruta]').forEach(a => {
      const act = a.dataset.ruta === ruta || (a.dataset.ruta === 'mas' && enMas && a.closest('#navInferior'));
      a.classList.toggle('activo', !!act);
      if (a.dataset.ruta === ruta) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const main = document.getElementById('principal');
    main.innerHTML = '';
    main.dataset.ruta = ruta;
    const v = H.vistas[ruta];
    try { v.render(main); }
    catch (err) { console.error(err); main.innerHTML = `<h1>Algo salió mal</h1><p>No se pudo mostrar esta sección. Tus datos guardados no se perdieron.</p><p class="nota">${H.esc(err && err.message)}</p><a class="btn" href="#/inicio">Volver al inicio</a>`; }
    document.title = v.titulo + ' · Hanzi Lab';
    try { window.scrollTo(0, 0); } catch (e) { /* nada */ }
    const h1 = main.querySelector('h1');
    if (h1 && H._navegado) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    H._navegado = true;
  };

  H.mostrarTutorial = function () {
    let i = 0;
    const P = HTL.TUTORIAL;
    const fin = () => { H.estado.tutorialVisto = true; H.guardar(); H.cerrarModal(); };
    const pintar = () => {
      const acc = [];
      if (i > 0) acc.push({ texto: 'Anterior', accion: () => { i--; pintar(); } });
      else acc.push({ texto: 'Omitir', clase: 'sutil', accion: fin });
      acc.push({ texto: i < P.length - 1 ? 'Siguiente' : 'Empezar', clase: 'primario', accion: () => { if (i < P.length - 1) { i++; pintar(); } else fin(); } });
      H.modal({ titulo: P[i].titulo, cuerpo: `<p>${H.esc(P[i].texto)}</p><div class="puntos" aria-label="Paso ${i + 1} de ${P.length}">${P.map((_, k) => `<span class="${k === i ? 'act' : ''}"></span>`).join('')}</div>`, acciones: acc, alCerrar: () => { H.estado.tutorialVisto = true; H.guardar(); } });
    };
    pintar();
  };

  function arrancar() {
    H.cargar();
    H.aplicarTema();
    pintarNav();
    H.voz.init();
    document.getElementById('btnTema').addEventListener('click', H.alternarTema);
    if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => H.aplicarTema()); } catch (e) { /* nada */ } }
    document.getElementById('saltar').addEventListener('click', () => document.getElementById('principal').focus());
    document.addEventListener('click', ev => {
      const b = ev.target.closest('[data-hablar]');
      if (b) { ev.preventDefault(); H.voz.hablar(b.getAttribute('data-hablar')); return; }
      const a = ev.target.closest('a[href^="#/"]');
      if (a && a.getAttribute('href') === location.hash && !ev.ctrlKey && !ev.metaKey) { ev.preventDefault(); H.render(); }
    });
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && H.modalAbierto()) H.cerrarModal(true);
      if (ev.key === 'Tab' && H.modalAbierto()) {
        const f = Array.from(document.querySelectorAll('#capa button, #capa a[href], #capa input, #capa select')).filter(x => !x.disabled);
        if (!f.length) return;
        if (ev.shiftKey && document.activeElement === f[0]) { ev.preventDefault(); f[f.length - 1].focus(); }
        else if (!ev.shiftKey && document.activeElement === f[f.length - 1]) { ev.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener('hashchange', H.render);
    window.addEventListener('beforeunload', () => H.guardar());
    window.addEventListener('storage', ev => { if (ev.key === H.CLAVE) H.toast('Tus datos cambiaron en otra pestaña. Recarga esta para no sobrescribirlos.', 'error'); });
    if (!location.hash) { try { history.replaceState(null, '', '#/inicio'); } catch (e) { /* nada */ } }
    H.render();
    if (H._sinStorage) H.toast('Este navegador no permite guardar datos (¿ventana privada?). Tu progreso no se conservará.', 'error');
    if (H._avisoDanado) H.toast('Los datos guardados estaban dañados y se empezó de cero. Si tienes un respaldo, restáuralo en Ajustes.', 'error');
    if (!H.estado.tutorialVisto) setTimeout(() => { if (!H.estado.tutorialVisto) H.mostrarTutorial(); }, 400);
    H.archivo.init().catch(err => console.warn(err));
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) H.toast('Hay una versión nueva. Cierra y vuelve a abrir la aplicación para usarla.'); });
        });
      }).catch(err => console.warn('Service worker no registrado:', err));
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})(window.HTL);

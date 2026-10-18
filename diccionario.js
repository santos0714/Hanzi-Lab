/* Diccionario completo (CC-CEDICT + traducciones al español de HSK 1-4 y glosario) y listas. */
'use strict';
(function (H) {
  let ultimaBusqueda = '';

  function resultadoHTML(e) {
    return `<li><a href="#/dic?p=${encodeURIComponent(e.s)}" class="res">
      <span class="res-han" lang="zh-CN">${H.esc(e.s)}${e.t ? `<small>${H.esc(e.t)}</small>` : ''}</span>
      <span class="res-txt"><span class="py">${H.esc(e.p)}</span>
      ${e.es ? `<span class="res-es">${H.esc(e.es)}</span>` : `<span class="res-en" lang="en">${H.esc((d => d.length > 140 ? d.slice(0, 137) + '…' : d)(H.defIngles(e.d)))}</span>`}</span></a></li>`;
  }

  function buscar(z) {
    z.innerHTML = `
      <form class="buscador" id="dForm" role="search">
        <label class="sr" for="dQ">Buscar</label>
        <input type="search" id="dQ" placeholder="Busca 你好, nihao, nǐ hǎo, hola o hello" autocomplete="off" value="${H.esc(ultimaBusqueda)}">
        <button class="btn primario" type="submit">Buscar</button>
      </form>
      <p class="nota" id="dEstado" aria-live="polite">Cargando el diccionario completo…</p>
      <ul class="resultados" id="dRes"></ul>`;
    const q = z.querySelector('#dQ'), est = z.querySelector('#dEstado'), res = z.querySelector('#dRes');
    let temp = null;
    const correr = () => {
      const t = q.value.trim(); ultimaBusqueda = t;
      if (!t) { res.innerHTML = ''; est.textContent = `${H.num(H.dic.s.length)} entradas. Unas 3,900 tienen traducción al español (HSK 1 a 4, las palabras de las oraciones y muchas de uso diario); las demás, en inglés.`; return; }
      const r = H.buscarDic(t, 80);
      est.textContent = r.length ? (r.length >= 80 ? 'Mostrando los 80 resultados más frecuentes.' : r.length + (r.length === 1 ? ' resultado.' : ' resultados.')) : 'Sin resultados. Prueba sin tonos («shijie»), con otra palabra en español o en inglés.';
      res.innerHTML = r.map(resultadoHTML).join('');
    };
    H.cargarDiccionario().then(() => { correr(); q.focus(); }).catch(() => { est.textContent = 'No se pudo cargar el diccionario.'; });
    q.addEventListener('input', () => { if (!H.dic.listo) return; clearTimeout(temp); temp = setTimeout(correr, 220); });
    z.querySelector('#dForm').addEventListener('submit', ev => { ev.preventDefault(); if (H.dic.listo) { correr(); if (q.value.trim()) H.registrar('busquedas'); } });
  }

  function detalle(el, palabra) {
    el.innerHTML = `<a class="volver" href="#/dic">${H.icono('atras')} Buscar otra palabra</a><div id="dDet"><p class="nota">Cargando…</p></div>`;
    const det = el.querySelector('#dDet');
    H.cargarDiccionario().then(() => {
      const ents = H.entradasDe(palabra);
      const nucleo = H.porHanzi(palabra);
      const ejemplos = HTL.ORACIONES.filter(o => o.tokens.some(t => t[0] === palabra) || (Array.from(palabra).length > 1 && o.zh.includes(palabra))).slice(0, 4);
      if (!ents.length && !nucleo.length) { det.innerHTML = `<h1 lang="zh-CN">${H.esc(palabra)}</h1><p>Esta palabra no está en el diccionario.</p>`; return; }
      const trad = ents.find(e => e.t) ? ents.find(e => e.t).t : '';
      det.innerHTML = `
        <div class="det-cab"><h1 class="det-han" lang="zh-CN">${H.esc(palabra)}</h1>${trad ? `<p class="nota">Tradicional: <span lang="zh-TW">${H.esc(trad)}</span></p>` : ''}</div>
        <div class="fila-acc">
          <button type="button" class="btn" data-hablar="${H.esc(palabra)}">${H.icono('voz')} Escuchar</button>
          <a class="btn" href="#/escribir?c=${encodeURIComponent(palabra)}">${H.icono('lapiz')} Escribir</a>
        </div>
        <ol class="acepciones">${ents.map(e => `<li>
          <p class="py grande">${H.esc(e.p)}</p>
          ${e.es ? `<p class="acep-es">${H.esc(e.es)}</p>` : ''}
          ${e.d ? `<p class="acep-en" lang="en"><span class="etiqueta">CC-CEDICT, en inglés</span> ${H.esc(H.defIngles(e.d))}</p>` : ''}
          <div class="fila-acc">${e.core ? e.core.split(',').map(id => { const v = H.porId(id); return v ? `<button type="button" class="btn sutil" data-fav="${id}">${H.estado.favoritos.includes(id) ? 'En favoritas' : 'Guardar en favoritas'}</button><button type="button" class="btn sutil" data-lista="${id}">Agregar a una lista</button>` : ''; }).join('') : `<button type="button" class="btn sutil" data-agregar="${e.i}">Agregar a mis tarjetas</button>`}</div>
        </li>`).join('')}</ol>
        ${Array.from(palabra).length > 1 ? `<h2 class="subt">Caracteres</h2><ul class="chips">${Array.from(palabra).filter(H.esHan).map(c => `<li><a class="chip" href="#/dic?p=${encodeURIComponent(c)}" lang="zh-CN">${H.esc(c)}</a></li>`).join('')}</ul>` : ''}
        ${ejemplos.length ? `<h2 class="subt">En las oraciones</h2><ul class="ejemplos">${ejemplos.map(o => `<li><a href="#/leer?tema=${o.tema}&o=${o.id}"><span lang="zh-CN">${H.esc(o.zh)}</span><span class="nota">${H.esc(o.es)}</span></a></li>`).join('')}</ul>` : ''}`;
      det.querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', () => { const a = H.toggleFav(b.dataset.fav); b.textContent = a ? 'En favoritas' : 'Guardar en favoritas'; }));
      det.querySelectorAll('[data-lista]').forEach(b => b.addEventListener('click', () => elegirLista(b.dataset.lista)));
      det.querySelectorAll('[data-agregar]').forEach(b => b.addEventListener('click', () => {
        const v = H.agregarPropia(H.entrada(+b.dataset.agregar));
        b.textContent = 'Agregada a «Mis palabras»'; b.disabled = true;
        H.toast(v.h + ' ya está en tus tarjetas.');
      }));
    });
  }

  function elegirLista(id) {
    const v = H.porId(id);
    H.modal({
      titulo: 'Listas para ' + v.h,
      cuerpo: `<div class="checks">${H.estado.listas.map(l => `<label class="interruptor"><input type="checkbox" data-l="${H.esc(l.id)}" ${l.ids.includes(id) ? 'checked' : ''}> ${H.esc(l.nombre)}</label>`).join('')}</div>`,
      acciones: [{ texto: 'Listo', clase: 'primario', cierra: true, accion: () => {} }]
    });
    document.querySelectorAll('#capa [data-l]').forEach(cb => cb.addEventListener('change', () => {
      const l = H.estado.listas.find(x => x.id === cb.dataset.l); if (!l) return;
      if (cb.checked) { if (!l.ids.includes(id)) l.ids.push(id); } else l.ids = l.ids.filter(x => x !== id);
      H.guardar();
    }));
  }

  function listas(z) {
    const pintar = () => {
      const L = H.estado.listas;
      z.innerHTML = `
        <form class="buscador" id="nl"><label class="sr" for="nlN">Nombre de la lista</label><input id="nlN" maxlength="40" placeholder="Nombre de una lista nueva, por ejemplo «Animales»" required><button class="btn primario" type="submit">Crear lista</button></form>
        <ul class="listas">${L.map(l => `<li data-id="${H.esc(l.id)}">
          <div class="lista-cab"><h3>${H.esc(l.nombre)}</h3><span class="nota">${l.ids.length} ${l.ids.length === 1 ? 'palabra' : 'palabras'}</span></div>
          <div class="fila-acc">
            <a class="btn sutil" href="#/tarjetas?fuente=lista:${encodeURIComponent(l.id)}&modo=libre">Estudiar</a>
            <a class="btn sutil" href="#/practicar?fuente=lista:${encodeURIComponent(l.id)}">Practicar</a>
            <button type="button" class="btn sutil" data-a="ver" aria-expanded="false">Ver palabras</button>
            <button type="button" class="btn sutil" data-a="csv">Exportar CSV</button>
            ${l.fija ? '' : '<button type="button" class="btn sutil" data-a="ren">Renombrar</button><button type="button" class="btn sutil peligro-txt" data-a="del">Eliminar</button>'}
          </div><ul class="lista-palabras" hidden></ul></li>`).join('')}</ul>
        <p class="nota">Las palabras que agregas desde el diccionario o desde la lectura van a «Mis palabras». Para guardar palabras del vocabulario HSK en otra lista, ábrelas en el diccionario.</p>`;
      z.querySelector('#nl').addEventListener('submit', ev => {
        ev.preventDefault();
        const n = z.querySelector('#nlN').value.trim(); if (!n) return;
        H.estado.listas.push({ id: 'l' + Date.now().toString(36), nombre: n, ids: [] }); H.guardar(); pintar();
      });
      z.querySelectorAll('.listas > li').forEach(li => li.addEventListener('click', async ev => {
        const b = ev.target.closest('[data-a]'); if (!b) return;
        const l = H.estado.listas.find(x => x.id === li.dataset.id); if (!l) return;
        const pal = l.ids.map(H.porId).filter(Boolean);
        if (b.dataset.a === 'ver') {
          const ul = li.querySelector('.lista-palabras'); ul.hidden = !ul.hidden; b.setAttribute('aria-expanded', String(!ul.hidden));
          ul.innerHTML = pal.length ? pal.map(v => `<li><a href="#/dic?p=${encodeURIComponent(v.h)}"><span lang="zh-CN" class="g-han">${H.esc(v.h)}</span></a> <span class="py">${H.esc(v.p)}</span> ${H.esc(v.es)} <button type="button" class="btn sutil" data-q="${v.id}">Quitar</button></li>`).join('') : '<li class="nota">Lista vacía.</li>';
          ul.querySelectorAll('[data-q]').forEach(q => q.addEventListener('click', e2 => { e2.stopPropagation(); l.ids = l.ids.filter(x => x !== q.dataset.q); H.guardar(); pintar(); }));
        } else if (b.dataset.a === 'csv') { if (!pal.length) { H.toast('La lista está vacía.', 'error'); return; } H.exportarPalabras(pal, 'lista-' + H.norm(l.nombre).replace(/[^a-z0-9]+/g, '-')); }
        else if (b.dataset.a === 'ren') { const n = await H.pedirTexto('Renombrar lista', 'Nuevo nombre', l.nombre); if (n) { l.nombre = n; H.guardar(); pintar(); } }
        else if (b.dataset.a === 'del') { if (await H.confirmar('¿Eliminar la lista «' + l.nombre + '»? Las palabras no se borran.', { si: 'Eliminar', peligro: true })) { H.estado.listas = H.estado.listas.filter(x => x !== l); H.guardar(); pintar(); } }
      }));
    };
    pintar();
  }

  H.vistas.dic = {
    titulo: 'Diccionario',
    render(el) {
      const p = H.params();
      if (p.p) { detalle(el, p.p); return; }
      if (p.q) ultimaBusqueda = p.q;
      el.innerHTML = `<h1>Diccionario</h1><p class="intro">Más de 124,000 entradas de CC-CEDICT. Busca por carácter, por pinyin (con o sin tonos) o por significado en español o en inglés.</p><div id="dTabs"></div>`;
      H.tabs(el.querySelector('#dTabs'), [{ id: 'buscar', texto: 'Buscar', render: buscar }, { id: 'listas', texto: 'Mis listas', render: listas }], p.tab);
    }
  };
})(window.HTL);

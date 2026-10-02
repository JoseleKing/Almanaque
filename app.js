/* Almanaque — genera la portada a partir de games.json.
   No hace falta tocar este archivo para añadir juegos. */
(function () {
  'use strict';

  var CLAVE_HECHOS = 'almanaque:hechos';
  var CLAVE_ANTIGUA = 'almanaque:abiertos';
  var CLAVE_TEMA = 'almanaque:tema';

  var hojasEl = document.getElementById('hojas');
  var avisoEl = document.getElementById('aviso');
  var juegos = [];
  var diaPintado = null;

  /* --- Almacenamiento (siempre tolerante a fallos) ----------------------- */

  function leer(clave) {
    try {
      return window.localStorage.getItem(clave);
    } catch (e) {
      return null;
    }
  }

  function guardar(clave, valor) {
    try {
      window.localStorage.setItem(clave, valor);
    } catch (e) {
      /* Sin almacenamiento: la app sigue funcionando, solo sin memoria. */
    }
  }

  /* --- Fechas ------------------------------------------------------------ */

  function claveDeHoy() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function fechaDeAlmanaque(d) {
    var texto;
    try {
      texto = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(d);
    } catch (e) {
      var dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
        'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      texto = dias[d.getDay()] + ', ' + d.getDate() + ' de ' + meses[d.getMonth()] + ' de ' + d.getFullYear();
    }
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  function diaDelAnio(d) {
    var inicio = new Date(d.getFullYear(), 0, 1);
    return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - inicio) / 86400000) + 1;
  }

  // Fase lunar aproximada a partir de una luna nueva conocida (6 ene 2000).
  function faseLunar(d) {
    var mesSinodico = 29.530588853;
    var lunaNueva = Date.UTC(2000, 0, 6, 18, 14);
    var edad = ((d.getTime() - lunaNueva) / 86400000) % mesSinodico;
    if (edad < 0) edad += mesSinodico;
    var fases = [
      'luna nueva', 'luna creciente', 'cuarto creciente', 'luna gibosa creciente',
      'luna llena', 'luna gibosa menguante', 'cuarto menguante', 'luna menguante'
    ];
    return fases[Math.floor((edad / mesSinodico) * 8 + 0.5) % 8];
  }

  function romano(n) {
    var tabla = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
      [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    var s = '';
    tabla.forEach(function (par) {
      while (n >= par[0]) { s += par[1]; n -= par[0]; }
    });
    return s;
  }

  function pintarCabecera() {
    var hoy = new Date();
    document.getElementById('fecha').textContent = fechaDeAlmanaque(hoy);
    document.getElementById('efemerides').textContent =
      'Día ' + diaDelAnio(hoy) + ' del año · ' + faseLunar(hoy).replace(/^./, function (c) { return c.toUpperCase(); });
    document.getElementById('anio-romano').textContent = romano(hoy.getFullYear());
  }

  /* --- Juegos hechos hoy ------------------------------------------------- */

  function hechosHoy() {
    try {
      var datos = JSON.parse(leer(CLAVE_HECHOS) || 'null');
      if (datos && datos.fecha === claveDeHoy() && Array.isArray(datos.ids)) return datos.ids;
    } catch (e) { /* datos corruptos: se ignoran */ }
    return [];
  }

  function marcarHecho(id) {
    var ids = hechosHoy();
    if (ids.indexOf(id) === -1) ids.push(id);
    guardar(CLAVE_HECHOS, JSON.stringify({ fecha: claveDeHoy(), ids: ids }));
  }

  // Un juego terminado vuelve con ?hecho=<id> (ver para-los-juegos/volver-almanaque.js).
  // Abrir un juego no basta para marcarlo: solo cuenta haberlo jugado.
  function recogerHecho() {
    try {
      window.localStorage.removeItem(CLAVE_ANTIGUA);
    } catch (e) { /* sin almacenamiento */ }
    try {
      var url = new URL(window.location.href);
      var id = url.searchParams.get('hecho');
      if (!id) return;
      marcarHecho(id);
      url.searchParams.delete('hecho');
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) { /* navegador antiguo: se ignora */ }
  }

  /* --- Render ------------------------------------------------------------ */

  function el(etiqueta, clase, texto) {
    var nodo = document.createElement(etiqueta);
    if (clase) nodo.className = clase;
    if (texto != null) nodo.textContent = texto;
    return nodo;
  }

  function normalizarEstado(estado) {
    var e = String(estado || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return e === 'nuevo' || e === 'proximamente' ? e : '';
  }

  // Marca el enlace para que el juego muestre la mano ☜ de vuelta a Almanaque
  // (ver para-los-juegos/volver-almanaque.js).
  function enlaceDesdeAlmanaque(direccion, id) {
    try {
      var url = new URL(direccion, window.location.href);
      url.searchParams.set('desde', 'almanaque');
      url.searchParams.set('juego', id);
      return url.href;
    } catch (e) {
      return direccion;
    }
  }

  function crearHoja(juego, indice, hechos) {
    var estado = normalizarEstado(juego.estado);
    var proximamente = estado === 'proximamente' || !juego.url;
    var hecho = !proximamente && hechos.indexOf(juego.id) !== -1;

    var li = el('li', 'hoja');
    if (juego.color) li.style.setProperty('--acento', juego.color);
    if (proximamente) li.classList.add('hoja--proximamente');
    if (hecho) li.classList.add('hoja--hecho');

    var cuerpo;
    if (proximamente) {
      cuerpo = el('div', 'hoja__cuerpo');
    } else {
      cuerpo = el('a', 'hoja__cuerpo');
      cuerpo.href = enlaceDesdeAlmanaque(juego.url, juego.id);
    }

    var icono = el('img', 'hoja__icono');
    icono.src = juego.icono || 'icons/almanaque.svg';
    icono.alt = '';
    icono.width = 72;
    icono.height = 72;
    icono.decoding = 'async';
    cuerpo.appendChild(icono);

    var texto = el('span', 'hoja__texto');
    texto.appendChild(el('span', 'hoja__numero', 'Nº ' + romano(indice + 1)));
    texto.appendChild(el('span', 'hoja__nombre', juego.nombre));
    if (juego.subtitulo) texto.appendChild(el('span', 'hoja__subtitulo', juego.subtitulo));
    if (juego.descripcion) texto.appendChild(el('span', 'hoja__descripcion', juego.descripcion));
    cuerpo.appendChild(texto);

    var mano = el('span', 'hoja__mano', '☞');
    mano.setAttribute('aria-hidden', 'true');
    cuerpo.appendChild(mano);

    var marcas = el('span', 'hoja__marcas');
    if (estado === 'nuevo' && !proximamente) marcas.appendChild(el('span', 'marca marca--nuevo', 'Nuevo'));
    if (proximamente) marcas.appendChild(el('span', 'marca marca--proximamente', 'Próximamente'));
    if (hecho) marcas.appendChild(el('span', 'marca marca--hecho', 'Hecho'));
    if (marcas.childNodes.length) {
      li.classList.add('hoja--con-marcas');
      cuerpo.appendChild(marcas);
    }

    li.appendChild(cuerpo);
    return li;
  }

  function pintarHojas() {
    var hechos = hechosHoy();
    var fragmento = document.createDocumentFragment();
    juegos.forEach(function (juego, i) {
      fragmento.appendChild(crearHoja(juego, i, hechos));
    });
    hojasEl.replaceChildren(fragmento);
    diaPintado = claveDeHoy();
  }

  function mostrarAviso(texto) {
    avisoEl.textContent = texto;
    avisoEl.hidden = false;
  }

  function cargarJuegos() {
    fetch('games.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (datos) {
        juegos = (Array.isArray(datos) ? datos : []).filter(function (j) {
          return j && j.id && j.nombre;
        });
        if (!juegos.length) mostrarAviso('Todavía no hay juegos en el almanaque.');
        pintarHojas();
      })
      .catch(function (err) {
        console.error('No se pudo cargar games.json', err);
        mostrarAviso('No se ha podido cargar la lista de juegos. Inténtalo de nuevo con conexión.');
      });
  }

  // Al volver a la portada (botón atrás, cambiar de app, pasar la medianoche)
  // se refrescan la fecha y las marcas de «hecho».
  function refrescar() {
    pintarCabecera();
    if (juegos.length) pintarHojas();
  }

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) refrescar();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') refrescar();
  });

  /* --- Tema claro / oscuro ----------------------------------------------- */

  function temaActual() {
    var forzado = document.documentElement.dataset.theme;
    if (forzado) return forzado;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.getElementById('boton-tema').addEventListener('click', function () {
    var nuevo = temaActual() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nuevo;
    guardar(CLAVE_TEMA, nuevo);
  });

  /* --- Portada fugaz ----------------------------------------------------- */

  // La animación es solo CSS; aquí se retira del DOM al acabar y un toque la salta.
  var portadaEl = document.getElementById('portada');
  if (portadaEl) {
    portadaEl.addEventListener('animationend', function (e) {
      if (e.target === portadaEl) portadaEl.remove();
    });
    portadaEl.addEventListener('click', function () {
      portadaEl.remove();
    });
  }

  /* --- Arranque ---------------------------------------------------------- */

  recogerHecho();
  pintarCabecera();
  cargarJuegos();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('No se pudo registrar el service worker', err);
      });
    });
  }
})();

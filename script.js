let traducciones = {};
let idiomaActual = "es";
let mineralDelDia = null;
let intentos = 0;
const maxIntentos = 10;
let juegoTerminado = false;
let minerales = [];
let cabeceraMostrada = false;
let ultimoResultado = null;
let timerInterval = null;

const flagPaths = {
  es: 'screen/spain_flag.png',
  en: 'screen/uk_flag.png'
};

function updateTimer() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow - now;
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  const label = traducciones.mensajes?.proximo_mineral || 'Siguiente mineral en:';
  const texto = `${label} ${h}:${m}:${s}`;
  document.getElementById('timer').innerText = texto;
  const dbg = document.getElementById('debug-timer');
  if (dbg) dbg.innerText = texto;
}

function updateCounter() {
  const valor = maxIntentos - intentos;
  document.getElementById("counter-value").innerText = valor;
}

function deshabilitarJuego() {
  document.getElementById("inputMineral").disabled = true;
  document.getElementById("btnAdivinar").disabled = true;
}

function mostrarModal(gano) {
  const modal = document.getElementById("modal");
  ultimoResultado = gano;
  document.getElementById("modal-title").innerText = gano
    ? traducciones.mensajes?.ganaste_titulo || "YOU WON!"
    : traducciones.mensajes?.perdiste_titulo || "GAME OVER";
  document.getElementById("modal-mineral").innerText =
    (traducciones.mensajes?.mineral_era || "El mineral era:") +
    " " +
    traducirValor(mineralDelDia.nombre);
  document.getElementById("modal-img").src =
    "img/" + mineralDelDia.nombre.toLowerCase() + ".png";
  document.getElementById("modal-img").alt = traducirValor(mineralDelDia.nombre);
  document.getElementById("modal-intentos").innerText =
    (traducciones.mensajes?.intentos || "Intentos:") + " " + intentos;
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.style.display = gano ? "block" : "none";
    shareBtn.innerText = traducciones.boton_compartir || "Share";
  }
  modal.classList.remove("hidden");
  if (gano) confettiExplosion();
}

function confettiExplosion() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.classList.remove('hidden');
  canvas.classList.add('fade-in');
  canvas.style.opacity = '1';

  const particles = [];

  function createExplosion(x, y) {
    for (let i = 0; i < 150; i++) {
      const life = 100 + Math.random() * 20;
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.7) * 15,
        size: Math.random() * 6 + 4,
        color: `hsl(${Math.random() * 360},100%,50%)`,
        life,
        ttl: life
      });
    }
  }

  let explosions = 0;
  function triggerExplosion() {
    createExplosion(
      canvas.width / 2,
      canvas.height / 2
    );
    explosions++;
    if (explosions < 5) {
      setTimeout(triggerExplosion, 1000);
    }
  }
  triggerExplosion();

  function fadeOutCanvas() {
    let opacity = 1;
    function step() {
      opacity -= 0.05;
      canvas.style.opacity = opacity;
      if (opacity <= 0) {
        canvas.style.opacity = '';
        canvas.classList.add('hidden');
      } else {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life--;
      ctx.globalAlpha = p.life / p.ttl;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    });
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0 || particles[i].y > canvas.height) {
        particles.splice(i, 1);
      }
    }
    if (particles.length) {
      requestAnimationFrame(draw);
    } else {
      canvas.classList.remove('fade-in');
      fadeOutCanvas();
    }
  }

  requestAnimationFrame(draw);
}

function traducirValor(valor) {
  const key = String(valor).toLowerCase();
  return (traducciones.valores && traducciones.valores[key]) || valor;
}

function traducirLista(arr) {
  return arr.map(traducirValor);
}

function setIdioma(idioma) {
  fetch(`lang/${idioma}.json`)
    .then(res => {
      if (!res.ok) throw new Error('not found');
      return res.json();
    })
    .then(data => {
      traducciones = data;
      idiomaActual = idioma;
      localStorage.setItem("idioma", idioma);
      aplicarTraducciones();
    })
    .catch(() => {
      if (idioma !== 'es') setIdioma('es');
    });
}

function aplicarTraducciones() {
  document.getElementById("titulo").innerText = traducciones.titulo || "Mineraldle";
  document.getElementById("inputMineral").placeholder = traducciones.input_placeholder || "Escribe un mineral...";
  document.getElementById("btnAdivinar").innerText = traducciones.boton_adivinar || "Adivinar";
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    shareBtn.innerText = traducciones.boton_compartir || "Share";
  }
  if (traducciones.propiedades) {
    document.getElementById("th-mineral").innerText = traducciones.propiedades.mineral || "Mineral";
    document.getElementById("th-grupo").innerText = traducciones.propiedades.grupo || "Grupo";
    document.getElementById("th-sistema").innerText = traducciones.propiedades.sistema || "Sistema";
    document.getElementById("th-color").innerText = traducciones.propiedades.color || "Color";
    document.getElementById("th-brillo").innerText = traducciones.propiedades.brillo || "Brillo";
    document.getElementById("th-dureza").innerText = traducciones.propiedades.dureza || "Dureza";
    document.getElementById("th-densidad").innerText = traducciones.propiedades.densidad || "Densidad";
  }
  document.getElementById("counter-label").innerText =
    (traducciones.mensajes?.intentos_restantes || "Intentos: ");
  updateCounter();
  updateTimer();
  actualizarTraduccionesTabla();
  actualizarModalTraducciones();
  ajustarTextoCeldas();
}

document.addEventListener("DOMContentLoaded", () => {
  const almacenado = localStorage.getItem("idioma");
  const disponibles = Object.keys(flagPaths);
  const guardado = disponibles.includes(almacenado) ? almacenado : "es";
  setIdioma(guardado);
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.value = guardado;
    updateSelectFlag(langSelect.value);
    langSelect.addEventListener('change', e => {
      updateSelectFlag(e.target.value);
      setIdioma(e.target.value);
    });
  }
  updateCounter();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);

  fetch("minerales.json")
    .then(res => res.json())
    .then(data => {
      minerales = data;
      const hoy = new Date();
      const diaDelAno = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000);
      mineralDelDia = minerales[diaDelAno % minerales.length];
      iniciarAutocompletado();
    });

  document.getElementById("btnAdivinar").addEventListener("click", intentarAdivinar);
  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("modal").classList.add("hidden");
  });
  const helloBtn = document.getElementById("hello-btn");
  if (helloBtn) {
    helloBtn.addEventListener("click", () => {
      const dbgModal = document.getElementById("debug-modal");
      const dbgMineral = document.getElementById("debug-mineral");
      const howtoTitle = document.getElementById('howto-title');
      const howtoMain = document.getElementById('howto-main');
      const howtoCount = document.getElementById('howto-count');
      const legendTitle = document.getElementById('legend-title');
      const legendRed = document.getElementById('legend-red');
      const legendYellow = document.getElementById('legend-yellow');
      const legendGreen = document.getElementById('legend-green');
      if (
        dbgModal && dbgMineral && mineralDelDia &&
        howtoTitle && howtoMain && howtoCount &&
        legendTitle && legendRed && legendYellow && legendGreen
      ) {
        howtoTitle.innerText =
          traducciones.mensajes?.como_jugar_titulo || 'Cómo jugar:';
        const timerText = document.getElementById('timer').innerText;
        const intro = traducciones.mensajes?.como_jugar_intro ||
          'El juego consiste en adivinar el mineral. Cada día hay un mineral nuevo que se reinicia a las 00:00 hora GMT +2.';
        howtoMain.innerText = `${intro} ${timerText}`;
        const total = minerales.length;
        const numTxt = (traducciones.mensajes?.como_jugar_numero ||
          'Actualmente existen un total de {N} minerales posibles. Deberás utilizar las pistas visuales basadas en las características propias de los minerales hasta encontrar el correcto.'
        ).replace('{N}', total);
        howtoCount.innerText = numTxt;
        legendTitle.innerText =
          traducciones.mensajes?.leyenda_titulo || 'Leyenda de colores:';
        legendRed.innerText =
          traducciones.mensajes?.leyenda_rojo || '🟥 Rojo: La característica no coincide con el mineral correcto.';
        legendYellow.innerText =
          traducciones.mensajes?.leyenda_amarillo ||
          '🟨 Amarillo: Está característica comparte alguno de los tipos con el mineral correcto. En el caso de ser un valor numérico como dureza o densidad significa que estás cerca del valor correcto. Las flechas de dirección ⬆️ y ⬇️ indican si el valor correcto es mayor o menor que el mineral que has escogido.';
        legendGreen.innerText =
          traducciones.mensajes?.leyenda_verde || '🟩 Verde: La característica comparte tipo con el mineral correcto.';
        dbgMineral.innerText =
          (traducciones.mensajes?.debug_titulo || 'Debug - El mineral de hoy es:') +
          ' ' + traducirValor(mineralDelDia.nombre);
        updateTimer();
        dbgModal.classList.remove("hidden");
      }
    });
  }
  const closeDbg = document.getElementById("close-debug");
  if (closeDbg) {
    closeDbg.addEventListener("click", () => {
      document.getElementById("debug-modal").classList.add("hidden");
    });
  }

  const aboutLink = document.getElementById('about-link');
  const aboutModal = document.getElementById('about-modal');
  const closeAbout = document.getElementById('close-about');
  if (aboutLink && aboutModal && closeAbout) {
    aboutLink.addEventListener('click', e => {
      e.preventDefault();
      aboutModal.classList.remove('hidden');
    });
    closeAbout.addEventListener('click', () => {
      aboutModal.classList.add('hidden');
    });
  }

  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', compartirEnTwitter);
  }
});

function iniciarAutocompletado() {
  const input = document.getElementById("inputMineral");
  const list = document.getElementById("autocomplete-list");

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    list.innerHTML = "";
    if (!val) return;

    const coincidencias = minerales
      .filter(m => m.nombre.toLowerCase().includes(val))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    coincidencias.forEach(mineral => {
      const li = document.createElement("li");
      li.innerHTML = `<img src="img/${mineral.nombre.toLowerCase()}.png" alt="${traducirValor(mineral.nombre)}"> <span>${traducirValor(mineral.nombre)}</span>`;
      li.addEventListener("click", () => {
        input.value = mineral.nombre;
        list.innerHTML = "";
      });
      list.appendChild(li);
    });
  });

  input.addEventListener("focus", function () {
    input.dispatchEvent(new Event('input'));
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".autocomplete-container")) {
      list.innerHTML = "";
    }
  });
}

async function intentarAdivinar() {
  if (juegoTerminado || intentos >= maxIntentos) return;
  const input = document.getElementById("inputMineral").value.trim().toLowerCase();
  const mineral = minerales.find(m => m.nombre.toLowerCase() === input);
  if (!mineral) {
    alert("Mineral no encontrado en la base de datos.");
    return;
  }

  if (!cabeceraMostrada) {
    document.getElementById("tablaResultados").classList.add("mostrar-cabecera");
    cabeceraMostrada = true;
  }

  intentos++;
  updateCounter();
  const numeroIntento = intentos;

  const fila = document.createElement("tr");

const celdaNombre = crearFlipCell(
  `<div class="cuadro-icono" data-nombre="${traducirValor(mineral.nombre)}">
      <img src="img/${mineral.nombre.toLowerCase()}.png" alt="${traducirValor(mineral.nombre)}" />
   </div>`,
  "",
  "imagen-nombre",
  mineral.nombre
);
const spanNum = document.createElement("span");
spanNum.className = "numero-intento";
spanNum.textContent = `#${numeroIntento}`;
celdaNombre.appendChild(spanNum);
fila.appendChild(celdaNombre);

// Mostrar GRUPO en líneas
fila.appendChild(
  crearFlipCell(
    traducirLista(mineral.grupo).join("<br>"),
    compararClase(mineral.grupo, mineralDelDia.grupo),
    "",
    mineral.grupo
  )
);

// Mostrar SISTEMA en líneas
fila.appendChild(
  crearFlipCell(
    traducirLista(mineral.sistema).join("<br>"),
    compararClase(mineral.sistema, mineralDelDia.sistema),
    "",
    mineral.sistema
  )
);

// Mostrar COLOR en líneas
fila.appendChild(
  crearFlipCell(
    traducirLista(mineral.color).join("<br>"),
    compararClase(mineral.color, mineralDelDia.color),
    "",
    mineral.color
  )
);

// Mostrar BRILLO en líneas
fila.appendChild(
  crearFlipCell(
    traducirLista(mineral.brillo).join("<br>"),
    compararClase(mineral.brillo, mineralDelDia.brillo),
    "",
    mineral.brillo
  )
);

// DUREZA (sin <br> porque es número)
fila.appendChild(
  crearFlipCell(
    mineral.dureza,
    compararClase(mineral.dureza, mineralDelDia.dureza),
    direccionFlecha(mineral.dureza, mineralDelDia.dureza),
    mineral.dureza
  )
);

// DENSIDAD (sin <br> porque es número)
fila.appendChild(
  crearFlipCell(
    mineral.densidad,
    compararClase(mineral.densidad, mineralDelDia.densidad),
    direccionFlecha(mineral.densidad, mineralDelDia.densidad),
    mineral.densidad
  )
);


  const cuerpo = document.getElementById("tabla-cuerpo");
  cuerpo.insertBefore(fila, cuerpo.firstChild);
  document.getElementById('contenedor-tabla').scrollLeft = 0;
  ajustarTextoCeldas();
  await revealRow(fila);
  ajustarTextoCeldas();

  const gano = mineral.nombre === mineralDelDia.nombre;
  if (gano || intentos >= maxIntentos) {
    juegoTerminado = true;
    deshabilitarJuego();
    if (gano) {
      mostrarModal(true);
    } else {
      mostrarModal(false);
    }
  }

  setTimeout(() => {
  document.querySelectorAll("#pistas td.texto-auto").forEach(td => {
    const contentLines = 1;
    const width = td.offsetWidth;

    let base = 20; // px
    if (width > 160) base = 28;
    if (width > 200) base = 32;

    if (contentLines > 4) base *= 0.65;
    else if (contentLines > 2) base *= 0.8;
    else if (contentLines === 1) base *= 1.05;

    td.style.fontSize = `${base}px`;
  });
}, 0);


}




function compararClase(valor, objetivo) {
  if (
    valor === null ||
    valor === undefined ||
    (Array.isArray(valor) && valor.length === 0)
  ) {
    return "vacio";
  }
  const ambosNumeros =
    !Array.isArray(valor) &&
    !Array.isArray(objetivo) &&
    !isNaN(parseFloat(valor)) &&
    !isNaN(parseFloat(objetivo));

  if (ambosNumeros) {
    const diff = Math.abs(parseFloat(valor) - parseFloat(objetivo));
    if (diff === 0) return "verde";
    if (diff <= 1) return "amarillo";
    return "rojo";
  }

  const val = Array.isArray(valor)
    ? valor.map(v => String(v).toLowerCase())
    : [String(valor).toLowerCase()];
  const obj = Array.isArray(objetivo)
    ? objetivo.map(o => String(o).toLowerCase())
    : [String(objetivo).toLowerCase()];
  const coincidencias = val.filter(v => obj.includes(v));

  const valSet = new Set(val);
  const objSet = new Set(obj);
  const conjuntosIguales = valSet.size === objSet.size && [...valSet].every(v => objSet.has(v));

  if (conjuntosIguales) return "verde";
  if (coincidencias.length > 0) return "amarillo";
  return "rojo";
}

function direccionFlecha(valor, objetivo) {
  if (
    isNaN(parseFloat(valor)) ||
    isNaN(parseFloat(objetivo)) ||
    parseFloat(valor) === parseFloat(objetivo)
  )
    return "";
  return parseFloat(valor) < parseFloat(objetivo) ? "arrow-up" : "arrow-down";
}




function comparar(valor, objetivo) {
  const val = Array.isArray(valor) ? valor.map(v => v.toLowerCase()) : [valor.toLowerCase()];
  const obj = Array.isArray(objetivo) ? objetivo.map(o => o.toLowerCase()) : [objetivo.toLowerCase()];
  const coincidencias = val.filter(v => obj.includes(v));
  const texto = (Array.isArray(valor) ? valor : valor.split(",")).map(v => v.trim()).join(", ");

  let clase = "rojo";
  if (coincidencias.length === obj.length && val.length === obj.length) {
    clase = "verde";
  } else if (coincidencias.length > 0) {
    clase = "amarillo";
  }

  return `<td class="${clase} texto-auto">${texto}</td>`;
}

function capitalizar(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function crearFlipCell(contenido, colorClase = "", extra = "", valorOriginal = null) {
  const td = document.createElement("td");
  td.className = `flip-card ${extra}`.trim();

  if (valorOriginal !== null) {
    td.dataset.original = JSON.stringify(valorOriginal);
  }

  const inner = document.createElement("div");
  inner.className = "flip-card-inner";

  const front = document.createElement("div");
  front.className = "flip-card-front";
  front.textContent = "?";

  const back = document.createElement("div");
  back.className = `flip-card-back ${colorClase}`.trim();
  back.innerHTML = contenido;

  inner.appendChild(front);
  inner.appendChild(back);
  td.appendChild(inner);

  return td;
}

function revealRow(fila) {
  return new Promise(resolve => {
    const celdas = Array.from(fila.querySelectorAll(".flip-card"));
    celdas.forEach((celda, idx) => {
      setTimeout(() => {
        celda.classList.add("flipped");
        if (idx === celdas.length - 1) {
          setTimeout(resolve, 500);
        }
      }, idx * 500);
    });
  });
}

function actualizarTraduccionesTabla() {
  const filas = document.querySelectorAll('#tabla-cuerpo tr');
  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('td');
    celdas.forEach(td => {
      if (!td.dataset.original) return;
      const valor = JSON.parse(td.dataset.original);
      const back = td.querySelector('.flip-card-back');
      if (!back) return;

      if (td.classList.contains('imagen-nombre')) {
        const img = back.querySelector('img');
        const span = back.querySelector('span');
        if (img) img.alt = traducirValor(valor);
        if (span) span.textContent = traducirValor(valor);
      } else {
        const nuevo = Array.isArray(valor)
          ? traducirLista(valor).join(', ')
          : traducirValor(valor);
        back.innerHTML = nuevo;
      }
    });
  });
  ajustarTextoCeldas();
}

function ajustarTextoCeldas() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const medirTexto = (texto, estilo) => {
    ctx.font = estilo;
    return ctx.measureText(texto).width;
  };

  const ajustar = el => {
    // Reset size so computations start from the CSS-defined value
    el.style.fontSize = '';
    const comp = window.getComputedStyle(el);
    let size = parseFloat(comp.fontSize);
    const fontBase = `${comp.fontStyle} ${comp.fontVariant} ${comp.fontWeight} `;
    const padding = parseFloat(comp.paddingLeft) + parseFloat(comp.paddingRight);
    const ancho = el.clientWidth - padding;

    const obtenerLineas = html =>
      html
        .replace(/<br\s*\/?>/gi, '\n')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    const lineas = obtenerLineas(el.innerHTML);
    if (lineas.length === 0) return;

    let estilo = `${fontBase}${size}px ${comp.fontFamily}`;
    let maxWidth = Math.max(...lineas.map(l => medirTexto(l, estilo)));
    while (maxWidth > ancho && size > 6) {
      size -= 1;
      estilo = `${fontBase}${size}px ${comp.fontFamily}`;
      maxWidth = Math.max(...lineas.map(l => medirTexto(l, estilo)));
    }
    el.style.fontSize = `${size}px`;
  };

  document
    .querySelectorAll('.cuadro-icono span, .flip-card-back, .tabla-resultados thead th')
    .forEach(ajustar);
}


window.addEventListener('resize', ajustarTextoCeldas);
window.addEventListener('load', ajustarTextoCeldas);

function actualizarModalTraducciones() {
  const modal = document.getElementById('modal');
  if (modal.classList.contains('hidden') || ultimoResultado === null) return;
  document.getElementById('modal-title').innerText = ultimoResultado
    ? traducciones.mensajes?.ganaste_titulo || 'YOU WON!'
    : traducciones.mensajes?.perdiste_titulo || 'GAME OVER';
  document.getElementById('modal-mineral').innerText =
    (traducciones.mensajes?.mineral_era || 'El mineral era:') +
    ' ' +
    traducirValor(mineralDelDia.nombre);
  document.getElementById('modal-img').alt = traducirValor(mineralDelDia.nombre);
  document.getElementById('modal-intentos').innerText =
    (traducciones.mensajes?.intentos || 'Intentos:') + ' ' + intentos;
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.innerText = traducciones.boton_compartir || 'Share';
  }
}

function generarEmojisResultado() {
  const filas = Array.from(document.querySelectorAll('#tabla-cuerpo tr')).reverse();
  const numeros = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  return filas.map((fila, idx) => {
    const celdas = fila.querySelectorAll('.flip-card');
    let linea = numeros[idx + 1] || '';
    for (let i = 1; i < celdas.length; i++) {
      const back = celdas[i].querySelector('.flip-card-back');
      if (back.classList.contains('verde')) linea += '🟩';
      else if (back.classList.contains('amarillo')) linea += '🟨';
      else linea += '🟥';
    }
    return linea;
  }).join('\n');
}

function compartirEnTwitter(e) {
  if (e) e.preventDefault();
  const titulo = traducciones.mensajes?.compartir_titulo || "I guessed today's Mineraldle!";
  const invitacion = traducciones.mensajes?.compartir_invitar || 'Play now at: azaleadevs.github.io/mineraldle';
  const grid = generarEmojisResultado();
  const texto = `${titulo}\n${grid}\n${invitacion}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}`;
  const enlace = document.getElementById('share-btn');
  if (enlace) enlace.href = url;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).catch(() => {});
  }
  window.open(url, '_blank', 'noopener');
}

function updateSelectFlag(lang) {
  const select = document.getElementById('language-select');
  if (!select) return;
  const path = flagPaths[lang];
  if (path) {
    select.style.backgroundImage = `url(${path})`;
    select.style.backgroundRepeat = 'no-repeat';
    select.style.backgroundPosition = 'center left';
    select.style.paddingLeft = '1.6em';
  }
}
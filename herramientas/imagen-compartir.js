/* Genera icons/almanaque-compartir.png (1200 × 630), la imagen de la vista previa
   al compartir el enlace (Open Graph). Uso, desde esta carpeta:
     npm install
     npm run compartir
   Usa el Chrome instalado en el ordenador y necesita conexión para las tipografías. */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');

const RAIZ = path.join(__dirname, '..');
const SALIDA = path.join(RAIZ, 'icons', 'almanaque-compartir.png');
const MAX_BYTES = 300 * 1024;

const marca = fs.readFileSync(path.join(RAIZ, 'icons', 'almanaque-marca.svg'), 'utf8');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital@1&family=IM+Fell+DW+Pica&family=IM+Fell+DW+Pica+SC&display=block">
<style>
  html, body { margin: 0; }
  body {
    width: 1200px;
    height: 630px;
    box-sizing: border-box;
    padding: 34px;
    background-color: #f3ead7;
    background-image: radial-gradient(ellipse at center, transparent 55%, #e2d3b2 130%);
    color: #2b2118;
  }
  /* Marco con doble filete, como el de la cabecera. */
  .marco {
    height: 100%;
    box-sizing: border-box;
    border-top: 6px double #8b7355;
    border-bottom: 6px double #8b7355;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 64px;
  }
  .marca svg { display: block; width: 290px; height: auto; }
  .texto { text-align: left; }
  .antetitulo {
    margin: 0 0 6px;
    font-family: "IM Fell DW Pica SC", serif;
    font-size: 30px;
    letter-spacing: 0.18em;
    color: #5e4e3c;
  }
  .antetitulo span { color: #8b7355; font-size: 0.6em; vertical-align: 0.25em; margin-right: 0.6em; }
  h1 {
    margin: 0;
    font-family: "IM Fell DW Pica", serif;
    font-weight: 400;
    font-size: 150px;
    line-height: 0.95;
    text-shadow: 0 1px 0 #e2d3b2;
  }
  .lema {
    margin: 14px 0 0;
    padding-top: 14px;
    border-top: 4px double #8b7355;
    font-family: "EB Garamond", serif;
    font-style: italic;
    font-size: 44px;
    color: #5e4e3c;
  }
</style>
</head>
<body>
  <div class="marco">
    <div class="marca">${marca}</div>
    <div class="texto">
      <p class="antetitulo"><span>✦</span>Juegos diarios de palabras</p>
      <h1>Almanaque</h1>
      <p class="lema">para curiosos de la lengua española</p>
    </div>
  </div>
</body>
</html>`;

(async () => {
  const navegador = await chromium.launch({ channel: 'chrome' });
  const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
  await pagina.setContent(html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  const png = await pagina.screenshot({ type: 'png' });
  await navegador.close();

  const comprimida = await sharp(png).png({ palette: true, quality: 90, effort: 10 }).toBuffer();
  fs.writeFileSync(SALIDA, comprimida);
  const kb = Math.round(comprimida.length / 1024);
  console.log(`${path.relative(RAIZ, SALIDA)}: ${kb} KB`);
  if (comprimida.length > MAX_BYTES) {
    console.error(`Pesa más de ${MAX_BYTES / 1024} KB.`);
    process.exitCode = 1;
  }
})();

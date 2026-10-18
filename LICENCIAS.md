# Licencias y créditos

Hanzi Lab usa datos y código abiertos de terceros. Los textos completos de las licencias están en la carpeta `licencias/`.

## Diccionario: CC-CEDICT

- Archivo: `js/datos/diccionario.js` (definiciones en inglés, lecturas y formas tradicionales).
- Fuente: CC-CEDICT, https://cc-cedict.org, obtenido mediante el paquete `cedict-json`.
- Licencia: **Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)**. Texto completo en `licencias/CC-BY-SA-4.0.txt`.
- Cambios: se reordenaron las entradas por frecuencia de uso y se añadieron traducciones al español propias de Hanzi Lab a unas 3,900 entradas. Por la cláusula CompartirIgual, el archivo `diccionario.js` en su conjunto se distribuye también bajo CC BY-SA 4.0.

## Orden de trazos: Make Me a Hanzi

- Archivo: `js/datos/trazos.js`.
- Fuente: Make Me a Hanzi, https://github.com/skishore/makemeahanzi, obtenido mediante el paquete `hanzi-writer-data`. Los datos derivan de las fuentes Arphic PL KaitiM GB y UKai.
- Licencia: **Arphic Public License**. Texto completo en `licencias/ARPHIC-PUBLIC-LICENSE.txt`.
- Cuando no hay internet, la aplicación consulta los caracteres que faltan en `cdn.jsdelivr.net/npm/hanzi-writer-data`, que se distribuyen bajo la misma licencia.

## Hanzi Writer

- Archivo: `js/lib/hanzi-writer.min.js` (versión 3.7.3).
- Autor: David Chanin, https://hanziwriter.org.
- Licencia: **MIT**. Texto completo en `licencias/hanzi-writer-MIT.txt`.

## Herramientas usadas solo para generar los datos (no se incluyen)

- **pinyin-pro** (MIT): pinyin de las oraciones, revisado a mano después.
- **hanzi** (MIT): frecuencias de palabras del corpus de Leiden, para ordenar los resultados del diccionario.
- **@leonsilicon/hsk3.0**: listas de palabras y caracteres del estándar oficial HSK 3.0 (2021) del Ministerio de Educación de China, *Chinese Proficiency Grading Standards for International Chinese Language Education*. Las listas son un estándar público; solo se usó la pertenencia de cada palabra a un nivel.

## Contenido propio de Hanzi Lab

Son propios de Hanzi Lab el código de la aplicación, las 260 oraciones de cultura general con su traducción y sus datos culturales, las traducciones al español del vocabulario HSK 1 a 4 y del glosario complementario, y el diseño.

# Hanzi Lab

Aplicación para aprender **chino mandarín simplificado** desde el español con oraciones de cultura general. Funciona sin internet, sin cuenta y sin instalar nada.

## Qué incluye

| Sección | Para qué sirve |
|---|---|
| **Inicio** | La oración del día en cuadrícula 田字格, las misiones diarias y un resumen de tu avance. |
| **Leer** | 260 oraciones en 13 temas: geografía, China, historia, ciencia, espacio, animales, cuerpo humano, arte, tradiciones, inventos, idiomas, México y América Latina, y refranes. Cada una trae pinyin, traducción, glosario y un dato cultural. Toca una palabra para ver su significado. |
| **Tarjetas** | Repaso espaciado de las 3,245 palabras de HSK 1 a 4 (HSK 3.0, 2021), con oración de ejemplo cuando existe. |
| **Practicar** | Ocho tipos de ejercicio: significado, reconocer caracteres, tonos, emparejar, escuchar, completar oraciones, ordenar oraciones y comprensión. Cada respuesta trae su explicación. |
| **Escribir** | Animación del orden de los trazos y práctica guiada o de memoria, que la aplicación revisa trazo por trazo. |
| **Diccionario** | Las 124,000 entradas de CC-CEDICT. Se puede buscar por carácter, por pinyin con o sin tonos, en español o en inglés. Incluye listas propias que se pueden exportar a CSV. |
| **Progreso** | Racha, actividad de los últimos 14 días, avance por nivel y por tema, y palabras difíciles. |
| **Ajustes** | Tema claro, oscuro o el del sistema, voz, respaldo y restauración, y créditos. |

El botón de sol y luna de la parte superior cambia entre tema claro y oscuro desde cualquier pantalla.

## Cómo usarla en Windows

**La forma más sencilla:** usa el archivo único `Hanzi Lab.html` (se entrega aparte). Guárdalo en Documentos o en el Escritorio y ábrelo con doble clic en Microsoft Edge o Google Chrome. No hay que descomprimir ni instalar nada.

**Con esta carpeta:** descomprímela y haz doble clic en `index.html`. Funciona igual.

**Para instalarla como aplicación (PWA).** Necesitas Python, que se instala gratis desde python.org (marca la casilla «Add python.exe to PATH»).

1. Haz doble clic en `iniciar-servidor.bat`. Se abre una ventana negra y el navegador en `http://localhost:8080`.
2. En Edge, abre el menú `…`, luego «Aplicaciones» y después «Instalar este sitio como una aplicación». En Chrome, usa el ícono de instalar de la barra de direcciones.
3. Desde ese momento puedes abrir Hanzi Lab desde el menú Inicio, incluso sin internet.

## Cómo se guarda el progreso

1. **La primera vez**, la aplicación muestra «Guarda tu progreso en un archivo». Elige «Elegir dónde guardarlo» y escoge la carpeta Documentos. Se crea el archivo `Mi progreso de Hanzi Lab.json`.
2. **Desde entonces, cada cambio se guarda solo** en ese archivo y también en el navegador. Arriba a la derecha aparece «✓ Guardado».
3. **Si arriba aparece «Seguir guardando»**, haz clic ahí y acepta el aviso del navegador («Guardar cambios» o «Permitir»). Por seguridad, el navegador pide permiso en algunas sesiones. Mientras tanto no se pierde nada: el progreso se sigue guardando en el navegador y pasa al archivo en cuanto das permiso.
4. **Si cambias de navegador o de computadora, o si se borraron los datos del navegador**, elige «Ya tengo un archivo de progreso» y abre `Mi progreso de Hanzi Lab.json`. Todo vuelve a estar ahí. Para llevarlo a otra computadora, cópialo a una memoria USB o a OneDrive.
5. Si el archivo y el navegador tienen progresos distintos, la aplicación pregunta cuál conservar; nunca reemplaza uno por otro sin avisar.

No borres ni muevas ese archivo. Si lo mueves, elige «Ya tengo un archivo de progreso» y ábrelo desde su nueva ubicación.

Esta función necesita Microsoft Edge o Google Chrome. En otros navegadores (Firefox, Safari), usa en Ajustes «Descargar una copia» cada semana y «Cargar una copia» para recuperarla.

## Qué funciona sin internet

| Función | Sin internet |
|---|---|
| Lectura, tarjetas, ejercicios, progreso, respaldo | Sí |
| Diccionario completo (124,000 entradas) | Sí; tarda unos segundos en cargar la primera vez de cada sesión |
| Orden de trazos de los 1,406 caracteres de HSK 1 a 4 y de las oraciones | Sí |
| Orden de trazos de otros caracteres del diccionario | Solo con internet la primera vez; después queda guardado si usas el servidor o la aplicación instalada |
| Pronunciación en voz alta | Depende de las voces instaladas en Windows (Ajustes de Windows, luego Hora e idioma y después Voz: agrega «Chino (simplificado, China)»). Las voces en línea de Edge necesitan internet. |

## Límites conocidos

- **Español en el diccionario.** No existe un diccionario chino-español completo y abierto que se pueda incluir legalmente. Por eso tienen traducción al español propia unas 3,900 entradas: las 3,245 palabras de HSK 1 a 4, todas las palabras de las oraciones y unas 450 de uso diario. Las otras 120,000 entradas muestran la definición original de CC-CEDICT en inglés.
- **Pronunciación.** La aplicación lee en voz alta, pero no escucha ni evalúa tu pronunciación.
- **Pinyin de las oraciones.** Se generó automáticamente y se revisó a mano, incluidos los cambios de tono de 一 y 不. Puede quedar algún error aislado en caracteres con varias lecturas.
- **Nivel de las oraciones.** Es aproximado: se calcula con las listas HSK de las palabras que contiene cada oración.
- **Autoevaluación.** En las tarjetas tú decides si la sabías. Las estadísticas reflejan esas respuestas y las de los ejercicios.

## Estructura de la carpeta

```
hanzi-lab/
├─ index.html              página principal
├─ manifest.webmanifest    datos para instalarla como aplicación
├─ sw.js                   guarda los archivos para usarla sin internet
├─ iniciar-servidor.bat    servidor local para Windows
├─ css/estilos.css         diseño (temas claro y oscuro)
├─ icons/                  íconos
├─ js/
│  ├─ nucleo.js            estado, repaso espaciado, búsqueda, voz y utilidades
│  ├─ app.js               navegación y arranque
│  ├─ vistas/              una pantalla por archivo
│  ├─ datos/               vocabulario, oraciones, diccionario y trazos
│  └─ lib/                 Hanzi Writer
├─ licencias/              textos completos de las licencias
├─ LEEME.md
└─ LICENCIAS.md
```

## Para desarrolladores

Todo está escrito en HTML, CSS y JavaScript sin frameworks y sin compilación. El estado se guarda en `localStorage` con la clave `hanziLab.estado` y el tema con la clave `hanziLab.tema`. Los archivos de `js/datos/` se generaron a partir de las fuentes que aparecen en LICENCIAS.md.

/* Hanzi Lab — Tutorial y misiones diarias. */
window.HTL = window.HTL || {};

HTL.NIVELES = [
  { n: 1, nombre: 'HSK 1', desc: 'Primeras 500 palabras' },
  { n: 2, nombre: 'HSK 2', desc: '772 palabras más' },
  { n: 3, nombre: 'HSK 3', desc: '973 palabras más' },
  { n: 4, nombre: 'HSK 4', desc: '1,000 palabras más' }
];

HTL.MISIONES = [
  { id: 'nuevas', texto: 'Aprende 10 palabras nuevas', meta: 10, metrica: 'nuevas', ruta: '#/tarjetas?modo=nuevas', fija: true },
  { id: 'repasos', texto: 'Repasa tus palabras pendientes', especial: 'repasos', ruta: '#/tarjetas?modo=pendientes', fija: true },
  { id: 'leer', texto: 'Lee 3 oraciones de cultura general', meta: 3, metrica: 'leidas', ruta: '#/leer' },
  { id: 'quiz', texto: 'Responde 10 preguntas correctamente', meta: 10, metrica: 'quizBien', ruta: '#/practicar' },
  { id: 'escribir', texto: 'Escribe 3 caracteres de memoria', meta: 3, metrica: 'escritura', ruta: '#/escribir' },
  { id: 'ordenar', texto: 'Ordena 3 oraciones', meta: 3, metrica: 'ordenadas', ruta: '#/practicar?tipo=ordenar' },
  { id: 'buscar', texto: 'Busca 3 palabras en el diccionario', meta: 3, metrica: 'busquedas', ruta: '#/dic' }
];

HTL.TUTORIAL = [
  { titulo: 'Bienvenida a Hanzi Lab', texto: 'Aquí aprendes chino mandarín simplificado leyendo oraciones sobre el mundo: geografía, ciencia, historia, arte y cultura china. Todo funciona sin cuenta y sin internet.' },
  { titulo: 'Lee y toca las palabras', texto: 'En «Leer» cada oración aparece carácter por carácter, con su pinyin. Toca cualquier palabra para ver su significado y su pronunciación, y abre el dato cultural para aprender algo nuevo.' },
  { titulo: 'Tarjetas que se adaptan a ti', texto: 'En «Tarjetas» estudias las 3,245 palabras de los niveles HSK 1 a 4. Lo que fallas vuelve pronto; lo que sabes se repasa cada vez más espaciado. Una palabra solo se considera dominada después de varios aciertos a lo largo de semanas.' },
  { titulo: 'Practica y escribe', texto: 'En «Practicar» hay ejercicios de significado, tonos, oraciones para completar y para ordenar. En «Escribir» ves el orden correcto de los trazos y la aplicación revisa los tuyos, trazo por trazo.' },
  { titulo: 'Un diccionario completo', texto: 'El diccionario incluye más de 124,000 entradas de CC-CEDICT. Unas 3,900 palabras tienen traducción al español: todo HSK 1 a 4, las palabras de las oraciones y muchas de uso diario. El resto muestra la definición original en inglés.' },
  { titulo: 'Tu progreso, a salvo', texto: 'Al terminar este recorrido, toca «Elegir dónde guardarlo» y escoge la carpeta Documentos. Desde ese momento tu progreso se guarda solo en un archivo de tu computadora. Si algún día aparece «Seguir guardando» arriba, haz clic ahí y permite el aviso del navegador. El botón de sol y luna cambia entre tema claro y oscuro.' }
];

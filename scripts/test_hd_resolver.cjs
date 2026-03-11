// test_hd_resolver.cjs — Diagnostica el HD Priority Resolver
const fs   = require('fs');
const path = require('path');

// Simular la ruta de un archivo web de Mita
const webRel = 'c:/Users/Ariel Deyá/Documents/Isla de Altos Mares/isla de altos mares 4.0/03_Universo/03.02_Arte/03.02.03_Personajes_Principales/03.02.03.01_Mita/03.02.03.01.03_Aprobados/03.02.03.01.03.50_Material_Web/03.02.03.01.03.50.01_Hero_1x1/03.02.03.01.03.50.01_Mita_Hero_1-1_PoseA_v01.png';

console.log('INPUT:', webRel);
console.log('Contains .03.50_Material_Web?', webRel.includes('.03.50_Material_Web'));

const hdRel = webRel
  .replace(/\.03\.50_Material_Web/g, '.04.50_Material_Web')
  .replace(/\.03\.50\./g, '.04.50.');

console.log('HD REL:', hdRel);

const hdAbs = hdRel.replace(/\//g, path.sep);
console.log('HD ABS:', hdAbs);
console.log('EXISTS?', fs.existsSync(hdAbs));

// Listar lo que hay en el directorio HD
const hdDir = path.dirname(hdAbs);
console.log('HD dir:', hdDir);
if (fs.existsSync(hdDir)) {
  console.log('HD dir contents:', fs.readdirSync(hdDir));
} else {
  console.log('HD dir does NOT exist!');
}

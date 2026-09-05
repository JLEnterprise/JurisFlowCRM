import fs from 'fs';
const imgBuffer = fs.readFileSync('E:/JurisFlow-ADV/Logo.png');
const base64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
const fileContent = 'export const DEFAULT_LOGO_BASE64 = ' + JSON.stringify(base64) + ';\n';
fs.writeFileSync('C:/JurisFlow-ADV/src/data/defaultLogo.js', fileContent, 'utf8');
fs.writeFileSync('E:/JurisFlow-ADV/src/data/defaultLogo.js', fileContent, 'utf8');
console.log('defaultLogo.js gerado perfeitamente com JSON.stringify!');

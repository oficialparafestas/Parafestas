import fs from 'fs';

let content = fs.readFileSync('admin/js/admin-main.js', 'utf8');
content = content.replace(/\\\`/g, '\`');
content = content.replace(/\\\$/g, '$');
fs.writeFileSync('admin/js/admin-main.js', content);

let content2 = fs.readFileSync('main.js', 'utf8');
content2 = content2.replace(/\\\`/g, '\`');
content2 = content2.replace(/\\\$/g, '$');
fs.writeFileSync('main.js', content2);

let content3 = fs.readFileSync('server/index.js', 'utf8');
content3 = content3.replace(/\\\`/g, '\`');
content3 = content3.replace(/\\\$/g, '$');
fs.writeFileSync('server/index.js', content3);

console.log('Fixed syntax errors');

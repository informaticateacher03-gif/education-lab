#!/usr/bin/env node
// Собирает автономный logic_gates_interactive.html (ядро встраивается в страницу).
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const core = fs.readFileSync(path.join(dir, 'src/logic-core.js'), 'utf8');
const tpl = fs.readFileSync(path.join(dir, 'src/interactive.template.html'), 'utf8');
const out = tpl.replace('/*@@CORE@@*/', () => core);
fs.writeFileSync(path.join(dir, 'logic_gates_interactive.html'), out);
console.log('✔ logic_gates_interactive.html', (out.length / 1024).toFixed(1), 'KB');

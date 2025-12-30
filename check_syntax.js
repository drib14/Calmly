const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const code = fs.readFileSync('client/src/pages/Messages.jsx', 'utf8');
try {
    acorn.Parser.extend(jsx()).parse(code, { sourceType: 'module', ecmaVersion: 2020 });
    console.log("Syntax OK");
} catch (e) {
    console.error(e);
}

const argv = require('yargs').demandOption(['json', 'out']).argv;

let Dictionary = require('../rust/binding/pkg').Dictionary;
const fs = require('fs');

console.log(`Loading file from ${argv.json}...`);
let text = fs.readFileSync(argv.json, 'utf8');

console.log('Compiling a dictionary...');
let dict = Dictionary.load_from_json(text);

console.log('Serializing...');
let array = dict.serialize(true);

console.log(`Saving to ${argv.out}...`);
fs.appendFileSync(argv.out, Buffer.from(array));

console.log('Done.');
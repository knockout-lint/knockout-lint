module.exports = JSON.parse(require('fs').readFileSync(__dirname.replace(/\/$|$/, '') + '/.eslintrc.json').toString().replace(/\s*\/\/(.+)$/gm, ''))
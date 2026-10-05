const { cpSync, copyFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const destination = join(root, 'public');
mkdirSync(destination, { recursive: true });
for (const file of ['app.js', 'day.js', 'menu.js', 'styles.css', 'shifts.css']) {
  copyFileSync(join(root, file), join(destination, file));
}
cpSync(join(root, 'assets'), join(destination, 'assets'), { recursive: true, force: true });

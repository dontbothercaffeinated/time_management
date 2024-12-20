const { spawnSync } = require('child_process');

const result = spawnSync('python', ['--version'], { encoding: 'utf-8' });

if (result.error) {
  console.error('Error executing Python:', result.error);
} else {
  console.log('Python Output:', result.stdout || result.stderr);
}

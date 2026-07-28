import { spawn } from 'child_process';

const args = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--host') {
    if (args[i + 1] && !args[i + 1].startsWith('-')) {
      filteredArgs.push('-H', args[i + 1]);
      i++;
    } else {
      filteredArgs.push('-H', '0.0.0.0');
    }
  } else if (args[i].startsWith('--host=')) {
    filteredArgs.push('-H', args[i].split('=')[1]);
  } else {
    filteredArgs.push(args[i]);
  }
}

if (!filteredArgs.includes('-p') && !filteredArgs.includes('--port')) {
  filteredArgs.push('-p', '3000');
}

const child = spawn('npx', ['next', 'dev', ...filteredArgs], {
  stdio: 'inherit',
  shell: true,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

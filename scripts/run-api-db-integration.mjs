import { spawn } from 'node:child_process';

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://mmpi2:mmpi2_local@localhost:5432/mmpi2?schema=public';

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const isWindowsPnpm = process.platform === 'win32' && command === 'pnpm';
    const child = spawn(
      isWindowsPnpm ? 'cmd.exe' : command,
      isWindowsPnpm ? ['/d', '/s', '/c', ['pnpm', ...args].join(' ')] : args,
      {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL,
        ...extraEnv,
      },
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function main() {
  await run('docker', ['compose', 'up', '-d', 'postgres']);
  await run('pnpm', ['--filter', '@mmpi2/contracts', 'build']);
  await run('pnpm', ['--filter', '@mmpi2/config', 'build']);
  await run('pnpm', ['--filter', '@mmpi2/db', 'exec', 'prisma', 'db', 'push', '--schema', 'prisma/schema.prisma', '--skip-generate']);
  await run('pnpm', ['--filter', '@mmpi2/api', 'test', '--', 'src/__tests__/integration/mmpi2-prisma-persistence.integration.test.ts']);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

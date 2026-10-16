module.exports = {
  apps: [{
    name: 'megan-apis',
    script: 'dist/index.cjs',
    cwd: '/opt/megan-apis',
    instances: 1,
    exec_mode: 'fork',
    env_file: '/opt/megan-apis/.env',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    error_file: '/root/.pm2/logs/megan-apis-error.log',
    out_file: '/root/.pm2/logs/megan-apis-out.log',
    merge_logs: true,
  }]
};

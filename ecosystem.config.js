module.exports = {
  apps: [{
    name: 'rotafinal',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rotafinal.com.br',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

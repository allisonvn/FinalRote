#!/bin/bash
cd /var/www/rotafinal.com.br
export PORT=3001
export NODE_ENV=production
exec next start -p 3001


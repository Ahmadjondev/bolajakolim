"""Gunicorn configuration for bolajakolim backend."""

import multiprocessing

# Bind to localhost; Nginx will reverse-proxy to this address.
bind = "127.0.0.1:8010"

# Workers = 2 × CPU cores + 1 (safe default)
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"

# Process naming
proc_name = "bolajakolim"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Graceful restart
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 50

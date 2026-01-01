# Session Configuration

This application supports two session storage backends that can be configured via environment variables.

## Available Session Handlers

### 1. Filesystem (Default)
- **Environment value**: `filesystem`
- **Storage location**: `var/sessions/`
- **Use case**: Production servers without Redis, simple deployments
- **Pros**: No external dependencies, simple setup
- **Cons**: Slower than Redis, not suitable for multi-server deployments

### 2. Redis
- **Environment value**: `redis`
- **Storage location**: Redis server (configured via `REDIS_URL`)
- **Use case**: High-performance applications, multi-server deployments
- **Pros**: Fast, scalable, supports clustering
- **Cons**: Requires Redis server

## Configuration

### Setting the Session Handler

In your `.env` or `.env.local` file:

```bash
# For filesystem sessions (default)
SESSION_HANDLER=filesystem

# For Redis sessions
SESSION_HANDLER=redis
```

### Environment-Specific Configuration

#### Development (.env)
```bash
# Use Redis in development (Docker container available)
SESSION_HANDLER=redis
REDIS_URL=redis://redis:6379
```

#### Production without Redis (.env.prod.local)
```bash
# Use filesystem in production
SESSION_HANDLER=filesystem
```

#### Production with Redis (.env.prod.local)
```bash
# Use Redis in production
SESSION_HANDLER=redis
REDIS_URL=redis://your-redis-server:6379
# If using authentication:
# REDIS_URL=redis://password@your-redis-server:6379
```

## Session Settings

Both handlers use the same session lifetime configuration:

- **Cookie lifetime**: 1,296,000 seconds (15 days)
- **Garbage collection max lifetime**: 1,296,000 seconds (15 days)
- **Cookie name**: Configured by Symfony (default: PHPSESSID)

## Filesystem Sessions

When using filesystem handler:

1. Sessions are stored in: `var/sessions/`
2. The directory is automatically created if it doesn't exist
3. Session files are automatically cleaned up by PHP's garbage collector
4. Permissions: Ensure web server has write access to `var/sessions/`

### Clearing Filesystem Sessions

```bash
# Remove all session files
rm -rf var/sessions/*

# Or use Symfony's cache clear (also clears sessions)
php bin/console cache:clear
```

## Redis Sessions

When using Redis handler:

1. Sessions are stored in Redis with prefix: `session_`
2. TTL (Time To Live): 1,296,000 seconds (15 days)
3. Redis connection configured via `REDIS_URL` environment variable

### Viewing Redis Sessions

```bash
# Connect to Redis CLI
redis-cli

# List all session keys
KEYS session_*

# View a specific session
GET session_<session_id>

# Clear all sessions
FLUSHDB
```

## Switching Between Handlers

To switch from one handler to another:

1. Update `SESSION_HANDLER` in your `.env` or `.env.local` file
2. Clear the cache: `php bin/console cache:clear`
3. Restart your web server or PHP-FPM
4. **Note**: Existing sessions will be lost when switching handlers

## Troubleshooting

### Filesystem Handler Issues

**Problem**: Sessions not persisting
```bash
# Check directory permissions
ls -la var/sessions/
# Should be writable by web server user

# Fix permissions
chmod 770 var/sessions/
chown www-data:www-data var/sessions/  # Adjust user as needed
```

### Redis Handler Issues

**Problem**: Cannot connect to Redis
```bash
# Check Redis is running
redis-cli ping
# Should respond with: PONG

# Check REDIS_URL is correct
echo $REDIS_URL

# Test connection from PHP container (if using Docker)
docker-compose exec php redis-cli -h redis ping
```

**Problem**: Sessions not saving to Redis
```bash
# Check Redis logs
docker-compose logs redis  # if using Docker
# or
tail -f /var/log/redis/redis.log

# Verify Redis has available memory
redis-cli INFO memory
```

## Production Deployment Checklist

When deploying to production:

- [ ] Set `SESSION_HANDLER` in `.env.prod.local`
- [ ] If using filesystem: Ensure `var/sessions/` has correct permissions
- [ ] If using Redis: Verify Redis server is accessible
- [ ] If using Redis: Configure Redis authentication if needed
- [ ] Test session persistence after deployment
- [ ] Configure session cleanup/garbage collection

## Technical Details

### Implementation Files

- **Configuration**: `config/packages/framework.yaml`
- **Service definitions**: `config/services.yaml`
- **Environment variables**: `.env`

### Service Definitions

Two session handler services are registered:

```yaml
# Redis handler
session.handler.redis:
    class: Symfony\Component\HttpFoundation\Session\Storage\Handler\RedisSessionHandler
    arguments:
        - '@snc_redis.default'
        - { prefix: 'session_', ttl: 1296000 }

# Filesystem handler
session.handler.filesystem:
    class: Symfony\Component\HttpFoundation\Session\Storage\Handler\NativeFileSessionHandler
    arguments:
        - '%kernel.project_dir%/var/sessions'
```

The active handler is selected dynamically based on `SESSION_HANDLER` environment variable.

## Security Considerations

1. **Cookie Security**: Ensure HTTPS in production for secure session cookies
2. **Session Fixation**: Symfony automatically regenerates session IDs on authentication
3. **Filesystem Permissions**: Restrict access to `var/sessions/` directory
4. **Redis Security**: Use password authentication for Redis in production
5. **Session Lifetime**: Adjust cookie/gc lifetimes based on security requirements

## Performance Comparison

| Feature | Filesystem | Redis |
|---------|-----------|-------|
| Speed | Moderate | Fast |
| Scalability | Single server only | Multi-server ready |
| Memory usage | Disk-based | Memory-based |
| Setup complexity | Simple | Requires Redis |
| Recommended for | Small deployments | High-traffic apps |

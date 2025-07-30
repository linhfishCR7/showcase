# 🗄️ Database Environment Variables Configuration Guide

Comprehensive guide for configuring database-related environment variables for SQLite in different environments, with special focus on Netlify serverless deployment.

## 📋 Current Database Configuration Analysis

### Current Implementation
The project currently uses a simple database path configuration:

```javascript
this.dbPath = process.env.NODE_ENV === 'production'
    ? '/tmp/webapps_hub.db'
    : (process.env.DATABASE_PATH || './database/webapps_hub.db');
```

### Issues with Current Setup
1. **Limited Configuration**: Only path is configurable
2. **No Performance Tuning**: SQLite PRAGMA settings are hardcoded
3. **No Backup Strategy**: No environment-specific backup configuration
4. **Limited Monitoring**: No database operation logging configuration
5. **No Connection Pooling**: No timeout or retry configuration

## 🔧 Recommended Database Environment Variables

### 🗂️ Core Database Configuration

| Variable | Required | Description | Dev Example | Prod Example | Notes |
|----------|----------|-------------|-------------|--------------|-------|
| `DATABASE_PATH` | No | SQLite database file path | `./database/webapps_hub.db` | `/tmp/webapps_hub.db` | Auto-set based on NODE_ENV |
| `DATABASE_NAME` | No | Database filename | `webapps_hub_dev.db` | `webapps_hub.db` | Allows environment-specific names |
| `DATABASE_TIMEOUT` | No | Connection timeout (ms) | `5000` | `10000` | Longer timeout for production |
| `DATABASE_RETRY_ATTEMPTS` | No | Max retry attempts | `3` | `5` | More retries in production |
| `DATABASE_RETRY_DELAY` | No | Delay between retries (ms) | `1000` | `2000` | Longer delay in production |

### ⚡ Performance & Optimization

| Variable | Required | Description | Dev Example | Prod Example | Notes |
|----------|----------|-------------|-------------|--------------|-------|
| `DATABASE_WAL_MODE` | No | Enable WAL mode | `false` | `true` | Better concurrency in production |
| `DATABASE_CACHE_SIZE` | No | SQLite cache size (KB) | `2000` | `8000` | More cache in production |
| `DATABASE_TEMP_STORE` | No | Temp storage location | `DEFAULT` | `MEMORY` | Use memory for temp in production |
| `DATABASE_SYNCHRONOUS` | No | Synchronous mode | `FULL` | `NORMAL` | Balance safety vs performance |
| `DATABASE_JOURNAL_MODE` | No | Journal mode | `DELETE` | `WAL` | WAL mode for better performance |

### 🔒 Security & Integrity

| Variable | Required | Description | Dev Example | Prod Example | Notes |
|----------|----------|-------------|-------------|--------------|-------|
| `DATABASE_FOREIGN_KEYS` | No | Enable foreign key constraints | `true` | `true` | Always recommended |
| `DATABASE_SECURE_DELETE` | No | Secure delete mode | `false` | `true` | Overwrite deleted data |
| `DATABASE_INTEGRITY_CHECK` | No | Run integrity check on startup | `false` | `true` | Verify DB integrity |

### 📊 Monitoring & Logging

| Variable | Required | Description | Dev Example | Prod Example | Notes |
|----------|----------|-------------|-------------|--------------|-------|
| `DATABASE_LOG_QUERIES` | No | Log SQL queries | `true` | `false` | Debug in dev, quiet in prod |
| `DATABASE_LOG_SLOW_QUERIES` | No | Log slow queries (ms threshold) | `100` | `1000` | Different thresholds |
| `DATABASE_ENABLE_METRICS` | No | Enable performance metrics | `false` | `true` | Monitor production performance |

### 🔄 Backup & Recovery (Future Enhancement)

| Variable | Required | Description | Dev Example | Prod Example | Notes |
|----------|----------|-------------|-------------|--------------|-------|
| `DATABASE_BACKUP_ENABLED` | No | Enable automatic backups | `false` | `true` | Only in production |
| `DATABASE_BACKUP_INTERVAL` | No | Backup interval (minutes) | `0` | `60` | Hourly backups |
| `DATABASE_BACKUP_RETENTION` | No | Backup retention (hours) | `0` | `24` | Keep 24 hours of backups |

## 🌍 Environment-Specific Configurations

### Development Environment (.env)
```env
# 🗄️ Database Configuration - Development
DATABASE_PATH=./database/webapps_hub_dev.db
DATABASE_NAME=webapps_hub_dev.db
DATABASE_TIMEOUT=5000
DATABASE_RETRY_ATTEMPTS=3
DATABASE_RETRY_DELAY=1000

# Performance (Development - Conservative)
DATABASE_WAL_MODE=false
DATABASE_CACHE_SIZE=2000
DATABASE_TEMP_STORE=DEFAULT
DATABASE_SYNCHRONOUS=FULL
DATABASE_JOURNAL_MODE=DELETE

# Security
DATABASE_FOREIGN_KEYS=true
DATABASE_SECURE_DELETE=false
DATABASE_INTEGRITY_CHECK=false

# Monitoring (Development - Verbose)
DATABASE_LOG_QUERIES=true
DATABASE_LOG_SLOW_QUERIES=100
DATABASE_ENABLE_METRICS=false

# Backup (Development - Disabled)
DATABASE_BACKUP_ENABLED=false
DATABASE_BACKUP_INTERVAL=0
DATABASE_BACKUP_RETENTION=0
```

### Production Environment (Netlify)
```env
# 🗄️ Database Configuration - Production
# DATABASE_PATH is auto-set to /tmp/webapps_hub.db
DATABASE_NAME=webapps_hub.db
DATABASE_TIMEOUT=10000
DATABASE_RETRY_ATTEMPTS=5
DATABASE_RETRY_DELAY=2000

# Performance (Production - Optimized)
DATABASE_WAL_MODE=true
DATABASE_CACHE_SIZE=8000
DATABASE_TEMP_STORE=MEMORY
DATABASE_SYNCHRONOUS=NORMAL
DATABASE_JOURNAL_MODE=WAL

# Security (Production - Strict)
DATABASE_FOREIGN_KEYS=true
DATABASE_SECURE_DELETE=true
DATABASE_INTEGRITY_CHECK=true

# Monitoring (Production - Essential only)
DATABASE_LOG_QUERIES=false
DATABASE_LOG_SLOW_QUERIES=1000
DATABASE_ENABLE_METRICS=true

# Backup (Production - Note: Limited in serverless)
DATABASE_BACKUP_ENABLED=false  # Not practical in /tmp
DATABASE_BACKUP_INTERVAL=0
DATABASE_BACKUP_RETENTION=0
```

## 🚀 Netlify Serverless Considerations

### /tmp Directory Characteristics
- **Ephemeral**: Database is recreated on each cold start
- **Size Limit**: 512MB maximum
- **Performance**: SSD-backed, fast I/O
- **Isolation**: Each function instance has its own /tmp

### Optimization for Serverless
1. **Fast Initialization**: Optimize database creation and seeding
2. **Memory Usage**: Use memory for temporary storage
3. **Connection Management**: Quick connect/disconnect cycles
4. **Data Persistence**: Accept ephemeral nature, seed on startup

### Recommended Netlify Settings
```env
# Optimized for Netlify serverless functions
DATABASE_TIMEOUT=15000          # Longer timeout for cold starts
DATABASE_RETRY_ATTEMPTS=3       # Quick retries
DATABASE_RETRY_DELAY=1000       # Short delays
DATABASE_WAL_MODE=false         # WAL not beneficial in ephemeral storage
DATABASE_CACHE_SIZE=4000        # Moderate cache size
DATABASE_TEMP_STORE=MEMORY      # Use memory for temp operations
DATABASE_SYNCHRONOUS=NORMAL     # Balance safety vs speed
DATABASE_JOURNAL_MODE=MEMORY    # Keep journal in memory
DATABASE_INTEGRITY_CHECK=false  # Skip on startup for speed
DATABASE_LOG_QUERIES=false      # Reduce logging overhead
DATABASE_LOG_SLOW_QUERIES=2000  # Only log very slow queries
```

## 🔧 Implementation Recommendations

### 1. Enhanced Database Configuration Class
Update `config/database.js` to use these environment variables:

```javascript
class Database {
    constructor() {
        this.db = null;
        this.isConnected = false;
        this.isClosing = false;
        
        // Path configuration
        this.dbName = process.env.DATABASE_NAME || 'webapps_hub.db';
        this.dbPath = this.getDatabasePath();
        
        // Performance settings
        this.config = {
            timeout: parseInt(process.env.DATABASE_TIMEOUT) || 10000,
            retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS) || 3,
            retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY) || 1000,
            walMode: process.env.DATABASE_WAL_MODE === 'true',
            cacheSize: parseInt(process.env.DATABASE_CACHE_SIZE) || 4000,
            // ... other settings
        };
    }
    
    getDatabasePath() {
        if (process.env.DATABASE_PATH) {
            return process.env.DATABASE_PATH;
        }
        
        return process.env.NODE_ENV === 'production'
            ? `/tmp/${this.dbName}`
            : `./database/${this.dbName}`;
    }
}
```

### 2. PRAGMA Configuration
Apply SQLite PRAGMA settings based on environment variables:

```javascript
async configureDatabase() {
    const pragmas = [
        `PRAGMA foreign_keys = ${this.config.foreignKeys ? 'ON' : 'OFF'}`,
        `PRAGMA cache_size = -${this.config.cacheSize}`,
        `PRAGMA temp_store = ${this.config.tempStore}`,
        `PRAGMA synchronous = ${this.config.synchronous}`,
        `PRAGMA journal_mode = ${this.config.journalMode}`,
    ];
    
    for (const pragma of pragmas) {
        await this.run(pragma);
    }
}
```

### 3. Connection Retry Logic
Implement retry logic for better reliability:

```javascript
async connectWithRetry() {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
            await this.connect();
            return;
        } catch (error) {
            if (attempt === this.config.retryAttempts) {
                throw error;
            }
            await new Promise(resolve => 
                setTimeout(resolve, this.config.retryDelay)
            );
        }
    }
}
```

## 📊 Monitoring & Debugging

### Query Logging
```javascript
logQuery(sql, params, duration) {
    if (process.env.DATABASE_LOG_QUERIES === 'true') {
        console.log(`[DB] ${sql}`, params);
    }
    
    const slowThreshold = parseInt(process.env.DATABASE_LOG_SLOW_QUERIES) || 1000;
    if (duration > slowThreshold) {
        console.warn(`[DB SLOW] ${duration}ms: ${sql}`);
    }
}
```

### Performance Metrics
```javascript
collectMetrics() {
    if (process.env.DATABASE_ENABLE_METRICS === 'true') {
        // Collect and log database performance metrics
        console.log('[DB METRICS]', {
            connections: this.connectionCount,
            queries: this.queryCount,
            avgQueryTime: this.avgQueryTime
        });
    }
}
```

## ⚠️ Important Considerations

### Data Persistence in Serverless
- **Ephemeral Nature**: Data is lost on function restarts
- **Seeding Strategy**: Always seed database on startup
- **External Storage**: Consider external database for persistent data
- **Backup Limitations**: Traditional backups not applicable

### Performance Trade-offs
- **WAL Mode**: Not beneficial in ephemeral storage
- **Cache Size**: Balance memory usage vs performance
- **Synchronous Mode**: NORMAL provides good balance
- **Integrity Checks**: Skip on startup for faster cold starts

### Security Considerations
- **Secure Delete**: Enable in production for sensitive data
- **Foreign Keys**: Always enable for data integrity
- **Query Logging**: Disable in production to prevent log pollution

This enhanced database configuration provides much better control over SQLite behavior across different environments while maintaining optimal performance for Netlify's serverless architecture.

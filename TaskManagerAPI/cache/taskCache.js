const NodeCache = require("node-cache");

// Shared NodeCache instance with 60-second standard TTL
const cache = new NodeCache({
    stdTTL: 60, // Time-to-live: 60 seconds
    checkperiod: 120, // Automatic expired-key cleanup every 120s
    useClones: true // Clones objects to prevent unintended mutation
});

// Cache performance metrics counters
const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0
};

// Helper: Generate user-isolated cache keys
function getUserTasksKey(userId) {
    return `tasks_user_${userId}`;
}

function getSingleTaskKey(userId, taskId) {
    return `task_user_${userId}_${taskId}`;
}

// Get from cache
function get(key) {
    const value = cache.get(key);
    if (value !== undefined) {
        stats.hits++;
        return { hit: true, data: value };
    }
    stats.misses++;
    return { hit: false, data: null };
}

// Set in cache with TTL
function set(key, value, ttl = 60) {
    stats.sets++;
    return cache.set(key, value, ttl);
}

// Invalidate single key
function del(key) {
    stats.invalidations++;
    return cache.del(key);
}

// Invalidate all cached data for a specific user (tasks list and single task entries)
function invalidateUserCache(userId, taskId = null) {
    const listKey = getUserTasksKey(userId);
    cache.del(listKey);
    stats.invalidations++;

    if (taskId) {
        const itemKey = getSingleTaskKey(userId, taskId);
        cache.del(itemKey);
        stats.invalidations++;
    } else {
        // Find and delete any single task keys belonging to this user
        const allKeys = cache.keys();
        const userPrefix = `task_user_${userId}_`;
        allKeys.forEach((k) => {
            if (k.startsWith(userPrefix)) {
                cache.del(k);
                stats.invalidations++;
            }
        });
    }
}

// Get diagnostic cache statistics
function getCacheStats() {
    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(2) + "%" : "0.00%";

    return {
        hits: stats.hits,
        misses: stats.misses,
        totalRequests,
        hitRate,
        sets: stats.sets,
        invalidations: stats.invalidations,
        activeKeys: cache.keys().length,
        stdTTL: 60,
        keys: cache.keys()
    };
}

// Clear all cache and reset statistics
function flush() {
    cache.flushAll();
    stats.hits = 0;
    stats.misses = 0;
    stats.sets = 0;
    stats.invalidations = 0;
}

module.exports = {
    cache,
    getUserTasksKey,
    getSingleTaskKey,
    get,
    set,
    del,
    invalidateUserCache,
    getCacheStats,
    flush
};

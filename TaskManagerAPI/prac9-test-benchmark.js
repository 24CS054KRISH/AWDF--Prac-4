process.env.NODE_ENV = "test";
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const taskCache = require("./cache/taskCache");

const TEST_PORT = 5058;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function timedRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const start = performance.now();
    const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    const duration = Math.round(performance.now() - start);

    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text();
    }

    return {
        status: res.status,
        duration,
        xCache: res.headers.get("x-cache"),
        data
    };
}

async function runPractical9Suite() {
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, "127.0.0.1", resolve));
    console.log(`[PRACTICAL 9 BENCHMARK SERVER] Running on ${BASE_URL}`);

    if (mongoose.connection.readyState !== 1) {
        console.log("[PRACTICAL 9] Connecting to MongoDB Atlas...");
        await new Promise((resolve, reject) => {
            mongoose.connection.once("connected", resolve);
            mongoose.connection.once("error", reject);
            setTimeout(() => {
                if (mongoose.connection.readyState === 1) resolve();
                else reject(new Error("MongoDB connection timeout"));
            }, 10000);
        });
    }

    console.log("\n==================================================================");
    console.log("   PRACTICAL 9: IN-MEMORY CACHING & BENCHMARK VERIFICATION SUITE   ");
    console.log("==================================================================\n");

    const userEmail = `cache_bench_${Date.now()}@example.com`;
    const userPassword = "Password123!";

    // 1. Register & Login
    await timedRequest("/auth/register", { method: "POST", body: { email: userEmail, password: userPassword } });
    const loginRes = await timedRequest("/auth/login", { method: "POST", body: { email: userEmail, password: userPassword } });
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Seed 3 initial tasks
    await timedRequest("/tasks", { method: "POST", headers: authHeaders, body: { title: "Benchmark Task A", description: "First test task" } });
    await timedRequest("/tasks", { method: "POST", headers: authHeaders, body: { title: "Benchmark Task B", description: "Second test task" } });
    const taskC = await timedRequest("/tasks", { method: "POST", headers: authHeaders, body: { title: "Benchmark Task C", description: "Third test task" } });
    const taskCId = taskC.data.task._id;

    console.log("--- 1. MEASURING UNCACHED BASELINE (Flushing Cache Before Each Request) ---");
    const uncachedTimes = [];
    for (let i = 1; i <= 3; i++) {
        taskCache.flush(); // Force cache miss to measure true DB + network time
        const res = await timedRequest("/tasks", { headers: authHeaders });
        uncachedTimes.push(res.duration);
        console.log(`Uncached Run ${i}: ${res.duration} ms (Status: ${res.status}, X-Cache: ${res.xCache || "MISS"})`);
    }
    const avgUncached = (uncachedTimes.reduce((a, b) => a + b, 0) / 3).toFixed(1);
    console.log(`Average Uncached Response Time: ${avgUncached} ms\n`);

    console.log("--- 2. MEASURING CACHED PERFORMANCE (Hit Warm Cache) ---");
    const cachedTimes = [];
    // Ensure cache is primed
    await timedRequest("/tasks", { headers: authHeaders });

    for (let i = 1; i <= 3; i++) {
        const res = await timedRequest("/tasks", { headers: authHeaders });
        cachedTimes.push(res.duration);
        console.log(`Cached Run ${i}: ${res.duration} ms (Status: ${res.status}, X-Cache: ${res.xCache})`);
    }
    const avgCached = (cachedTimes.reduce((a, b) => a + b, 0) / 3).toFixed(1);
    const speedup = (avgUncached / avgCached).toFixed(1);
    console.log(`Average Cached Response Time: ${avgCached} ms (Speedup: ~${speedup}x faster)\n`);

    console.log("--- 3. TESTING INDIVIDUAL TASK CACHING (GET /tasks/:id) ---");
    const singleMiss = await timedRequest(`/tasks/${taskCId}`, { headers: authHeaders });
    console.log(`Single Task (1st call - Miss): ${singleMiss.duration} ms | X-Cache: ${singleMiss.xCache}`);
    const singleHit = await timedRequest(`/tasks/${taskCId}`, { headers: authHeaders });
    console.log(`Single Task (2nd call - Hit):  ${singleHit.duration} ms | X-Cache: ${singleHit.xCache}\n`);

    console.log("--- 4. TESTING CACHE INVALIDATION (PUT /tasks/:id & POST /tasks) ---");
    // Update task C
    await timedRequest(`/tasks/${taskCId}`, {
        method: "PUT",
        headers: authHeaders,
        body: { title: "Benchmark Task C (UPDATED)" }
    });
    console.log("Task updated. Checking if cache was invalidated...");
    const checkAfterUpdate = await timedRequest("/tasks", { headers: authHeaders });
    console.log(`Fetch after update: X-Cache: ${checkAfterUpdate.xCache} (Expected: MISS because cache was invalidated)`);
    const updatedTaskInList = checkAfterUpdate.data.find(t => t._id === taskCId);
    console.log(`Updated title reflected immediately: "${updatedTaskInList?.title}"\n`);

    console.log("--- 5. CHECKING CACHE DIAGNOSTIC STATS ENDPOINT (/cache/stats) ---");
    const statsRes = await timedRequest("/cache/stats", { headers: authHeaders });
    console.log("Stats Response:", JSON.stringify(statsRes.data, null, 2));

    console.log("\n==================================================================");
    console.log("             PRACTICAL 9 TESTS & BENCHMARK COMPLETE!               ");
    console.log("==================================================================");

    server.close();
    await mongoose.connection.close();
    process.exit(0);
}

runPractical9Suite().catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});

process.env.NODE_ENV = "test";
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    const res = await fetch(url, {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = await res.text();
    }

    return {
        status: res.status,
        data
    };
}

async function runSuite() {
    // Start HTTP server on test port
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(TEST_PORT, "127.0.0.1", resolve));
    console.log(`[TEST SERVER] Running on ${BASE_URL}`);

    // Wait for Mongoose to connect if not ready
    if (mongoose.connection.readyState !== 1) {
        console.log("[TEST SERVER] Waiting for MongoDB connection...");
        try {
            await mongoose.connection.asPromise();
            console.log("[TEST SERVER] MongoDB connected!");
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }


    console.log("\n==================================================");
    console.log("   PRACTICAL 7 COMPREHENSIVE AUTOMATED TEST SUITE   ");
    console.log("==================================================\n");

    const uniqueSuffix = Date.now();
    const user1Email = `student1_${uniqueSuffix}@example.com`;
    const user2Email = `student2_${uniqueSuffix}@example.com`;
    const userPassword = "SecurePassword123!";

    let token1 = "";
    let token2 = "";
    let user1Id = "";
    let user2Id = "";
    let task1Id = "";
    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ ${message}`);
            passedCount++;
        } else {
            console.error(`❌ FAILED: ${message}`);
            failedCount++;
        }
    }

    try {
        // TEST 1: Register User 1
        console.log("TEST 1: Register a new user (User 1)");
        const regRes1 = await request("/auth/register", {
            method: "POST",
            body: { email: user1Email, password: userPassword }
        });
        console.log(`Status: ${regRes1.status} | Response:`, JSON.stringify(regRes1.data));
        assert(
            regRes1.status === 201 && regRes1.data.user && !regRes1.data.user.password && regRes1.data.user.email === user1Email,
            "TEST 1: User 1 registered successfully (201 Created) without leaking password."
        );
        user1Id = regRes1.data.user?.id;

        // TEST 2: Duplicate registration check
        console.log("\nTEST 2: Attempt duplicate registration with same email");
        const dupRes = await request("/auth/register", {
            method: "POST",
            body: { email: user1Email, password: userPassword }
        });
        console.log(`Status: ${dupRes.status} | Response:`, JSON.stringify(dupRes.data));
        assert(
            dupRes.status === 400 && dupRes.data.error?.includes("already exists"),
            "TEST 2: Duplicate email registration rejected with HTTP 400."
        );

        // TEST 3: Login with correct credentials
        console.log("\nTEST 3: Log in with correct credentials");
        const loginRes1 = await request("/auth/login", {
            method: "POST",
            body: { email: user1Email, password: userPassword }
        });
        console.log(`Status: ${loginRes1.status} | Token received: ${Boolean(loginRes1.data?.token)}`);
        assert(
            loginRes1.status === 200 && Boolean(loginRes1.data?.token),
            "TEST 3: Login succeeded (200 OK) and JWT token generated."
        );
        token1 = loginRes1.data?.token;

        // TEST 4: Attempt login with incorrect password
        console.log("\nTEST 4: Attempt login with incorrect password");
        const badLoginRes = await request("/auth/login", {
            method: "POST",
            body: { email: user1Email, password: "WrongPassword123" }
        });
        console.log(`Status: ${badLoginRes.status} | Response:`, JSON.stringify(badLoginRes.data));
        assert(
            badLoginRes.status === 400 || badLoginRes.status === 401,
            "TEST 4: Incorrect password rejected with HTTP 400/401."
        );

        // TEST 5: Access protected route without token
        console.log("\nTEST 5: Access protected route (/tasks) without token");
        const noTokenRes = await request("/tasks");
        console.log(`Status: ${noTokenRes.status} | Response:`, JSON.stringify(noTokenRes.data));
        assert(
            noTokenRes.status === 401,
            "TEST 5: Protected route blocked without token with HTTP 401 Unauthorized."
        );

        // TEST 6: Access protected route with invalid/tampered token
        console.log("\nTEST 6: Access protected route with invalid token");
        const badTokenRes = await request("/tasks", {
            headers: { Authorization: "Bearer malformed.invalid.token" }
        });
        console.log(`Status: ${badTokenRes.status} | Response:`, JSON.stringify(badTokenRes.data));
        assert(
            badTokenRes.status === 401,
            "TEST 6: Invalid token safely rejected with HTTP 401 Unauthorized."
        );

        // TEST 7: Access /auth/me and /me with valid token
        console.log("\nTEST 7: Access /auth/me (current-user) with valid token");
        const meRes = await request("/auth/me", {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log(`Status: ${meRes.status} | User:`, JSON.stringify(meRes.data?.user));
        assert(
            meRes.status === 200 && meRes.data.user?.email === user1Email && !meRes.data.user?.password,
            "TEST 7: Current user endpoint returned user data without password."
        );

        // TEST 8: Submit task without title (Validation check)
        console.log("\nTEST 8: Submit task without title");
        const badTaskRes = await request("/tasks", {
            method: "POST",
            headers: { Authorization: `Bearer ${token1}` },
            body: { description: "Missing title task" }
        });
        console.log(`Status: ${badTaskRes.status} | Response:`, JSON.stringify(badTaskRes.data));
        assert(
            badTaskRes.status === 400,
            "TEST 8: Missing task title rejected with HTTP 400 Bad Request."
        );

        // TEST 9: Create task with valid token
        console.log("\nTEST 9: Create task with valid token for User 1");
        const createTaskRes = await request("/tasks", {
            method: "POST",
            headers: { Authorization: `Bearer ${token1}` },
            body: {
                title: "User 1 Study Plan",
                description: "Practical 7 JWT & Middleware implementation",
                completed: false
            }
        });
        console.log(`Status: ${createTaskRes.status} | Task ID: ${createTaskRes.data.task?._id}`);
        assert(
            createTaskRes.status === 201 && Boolean(createTaskRes.data.task?._id),
            "TEST 9: Task created successfully (201 Created) and linked to User 1."
        );
        task1Id = createTaskRes.data.task?._id;

        // TEST 10: Read tasks for User 1
        console.log("\nTEST 10: Read tasks for User 1");
        const getTasksRes1 = await request("/tasks", {
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log(`Status: ${getTasksRes1.status} | Task Count: ${getTasksRes1.data?.length}`);
        assert(
            getTasksRes1.status === 200 && getTasksRes1.data.some((t) => t._id === task1Id),
            "TEST 10: User 1 successfully retrieved their owned tasks."
        );

        // TEST 11: Register/Login User 2 & verify User Isolation
        console.log("\nTEST 11: User Isolation Test - Cross-user data protection");
        const regRes2 = await request("/auth/register", {
            method: "POST",
            body: { email: user2Email, password: userPassword }
        });
        const loginRes2 = await request("/auth/login", {
            method: "POST",
            body: { email: user2Email, password: userPassword }
        });
        token2 = loginRes2.data.token;

        const getTasksRes2 = await request("/tasks", {
            headers: { Authorization: `Bearer ${token2}` }
        });
        const user2SeesTask1 = getTasksRes2.data.some((t) => t._id === task1Id);

        const updateOtherRes = await request(`/tasks/${task1Id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token2}` },
            body: { title: "Tampered by User 2" }
        });

        const deleteOtherRes = await request(`/tasks/${task1Id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token2}` }
        });

        console.log(`User 2 can view User 1's task: ${user2SeesTask1}`);
        console.log(`User 2 update status: ${updateOtherRes.status} | Delete status: ${deleteOtherRes.status}`);
        assert(
            !user2SeesTask1 && updateOtherRes.status === 404 && deleteOtherRes.status === 404,
            "TEST 11: User Isolation Verified! Users cannot view, edit, or delete another user's tasks."
        );

        // TEST 12: User 1 updates their own task
        console.log("\nTEST 12: User 1 updates their own task");
        const updateSelfRes = await request(`/tasks/${task1Id}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token1}` },
            body: {
                title: "User 1 Study Plan (Completed)",
                completed: true
            }
        });
        console.log(`Status: ${updateSelfRes.status} | Task Completed: ${updateSelfRes.data.task?.completed}`);
        assert(
            updateSelfRes.status === 200 && updateSelfRes.data.task?.completed === true,
            "TEST 12: User 1 updated their own task successfully."
        );

        // TEST 13: User 1 deletes their own task
        console.log("\nTEST 13: User 1 deletes their own task");
        const deleteSelfRes = await request(`/tasks/${task1Id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token1}` }
        });
        console.log(`Status: ${deleteSelfRes.status} | Response:`, JSON.stringify(deleteSelfRes.data));
        assert(
            deleteSelfRes.status === 200,
            "TEST 13: User 1 deleted their task successfully."
        );

    } catch (err) {
        console.error("Test execution failed with error:", err);
    } finally {
        console.log("\n==================================================");
        console.log(`           SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED           `);
        console.log("==================================================");

        server.close();
        await mongoose.connection.close();
        process.exit(failedCount > 0 ? 1 : 0);
    }
}

runSuite();

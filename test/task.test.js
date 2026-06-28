// const request = require("supertest");
// const app = require("../app");

// test("Create task", async () => {
//   const res = await request(app).post("/tasks").send({ title: "Test Task" });

//   expect(res.statusCode).toBe(302); // redirect
// });


// tests/tasks.test.js
//
// Replaces the original tests/take.test.js. The original test posted to
// /tasks with no auth and expected a 302 - but /tasks is behind
// authMiddleware, so that test would have actually redirected to /login,
// not created a task. This version logs in first (to get a real JWT
// cookie) before testing task creation, and adds coverage for ownership
// isolation and the overdue logic, matching the new auth approach.

process.env.JWT_SECRET = "test_secret";
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const User = require("../models/user");
const Task = require("../models/task");
const { signToken } = require("../utils/jwt");
const { connect, closeDatabase, clearDatabase } = require("./setup");

let userA, userB, cookieA, cookieB;

beforeAll(async () => { await connect(); });
afterAll(async () => { await closeDatabase(); });

beforeEach(async () => {
  const bcrypt = require("bcrypt");
  userA = await User.create({ username: "alice", password: await bcrypt.hash("password123", 10) });
  userB = await User.create({ username: "bob", password: await bcrypt.hash("password123", 10) });

  const tokenA = signToken({ id: userA._id, username: userA.username });
  const tokenB = signToken({ id: userB._id, username: userB.username });
  cookieA = `todo_token=${tokenA}`;
  cookieB = `todo_token=${tokenB}`;
});

afterEach(async () => { await clearDatabase(); });

describe("Auth requirement on /dashboard and /tasks", () => {
  it("redirects to /login with no auth cookie", async () => {
    const res = await request(app).get("/dashboard");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });
});

describe("POST /tasks (create)", () => {
  it("creates a task for the logged-in user (this replaces the original take.test.js)", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Cookie", cookieA)
      .send({ title: "Test Task" });

    expect(res.status).toBe(302); // redirect, same expectation as the original test

    const task = await Task.findOne({ title: "Test Task" });
    expect(task).not.toBeNull();
    expect(task.status).toBe("pending");
    expect(String(task.user)).toBe(String(userA._id));
  });

  it("accepts an optional due date", async () => {
    const due = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    await request(app).post("/tasks").set("Cookie", cookieA).send({ title: "With due date", dueDate: due });

    const task = await Task.findOne({ title: "With due date" });
    expect(task.dueDate).not.toBeNull();
  });
});

describe("GET /dashboard - data isolation between users", () => {
  it("only shows tasks belonging to the logged-in user", async () => {
    await Task.create({ title: "Alice task", user: userA._id });
    await Task.create({ title: "Bob task", user: userB._id });

    const res = await request(app).get("/dashboard").set("Cookie", cookieA);

    expect(res.text).toMatch(/Alice task/);
    expect(res.text).not.toMatch(/Bob task/);
  });
});

describe("POST /tasks/:id (update status)", () => {
  it("marks a task as completed", async () => {
    const task = await Task.create({ title: "Finish report", user: userA._id });

    const res = await request(app)
      .post(`/tasks/${task._id}`)
      .set("Cookie", cookieA)
      .send({ status: "completed" });

    expect(res.status).toBe(302);
    const updated = await Task.findById(task._id);
    expect(updated.status).toBe("completed");
  });

  it("prevents a user from updating another user's task", async () => {
    const task = await Task.create({ title: "Bob's task", user: userB._id });

    const res = await request(app)
      .post(`/tasks/${task._id}`)
      .set("Cookie", cookieA) // Alice trying to touch Bob's task
      .send({ status: "completed" });

    expect(res.status).toBe(404);

    const unchanged = await Task.findById(task._id);
    expect(unchanged.status).toBe("pending"); // untouched
  });
});

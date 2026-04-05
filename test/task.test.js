const request = require("supertest");
const app = require("../app");

test("Create task", async () => {
  const res = await request(app).post("/tasks").send({ title: "Test Task" });

  expect(res.statusCode).toBe(302); // redirect
});

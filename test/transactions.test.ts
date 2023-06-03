import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";
import { execSync } from "node:child_process";
import supertest from "supertest";
import { app } from "../src/app";

describe("Transactions", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  test("user should be able to create a new transaction", async () => {
    const response = await supertest(app.server).post("/transactions").send({
      title: "transaction test",
      amount: 5000,
      type: "credit",
    });

    expect(response.status).toEqual(201);
  });

  test("user should be able to get all transactions list", async () => {
    const createTransaction = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "transaction test",
        amount: 5000,
        type: "credit",
      });
    const cookies = createTransaction.get("Set-Cookie");

    const response = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    expect(response.status).toEqual(200);
    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: "transaction test",
        amount: 5000,
      }),
    ]);
  });

  test("user should be able to get a specific transaction", async () => {
    const createTransaction = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "transaction test",
        amount: 5000,
        type: "credit",
      });
    const cookies = createTransaction.get("Set-Cookie");

    const listTransactionsResponse = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies);

    expect(listTransactionsResponse.status).toEqual(200);

    const transactionId = listTransactionsResponse.body.transactions[0].id;

    const getTransactionResponse = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies);

    expect(getTransactionResponse.status).toEqual(200);
    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "transaction test",
        amount: 5000,
      })
    );
  });

  test("user should be able to get transactions summary", async () => {
    const createTransaction = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "transaction test",
        amount: 5000,
        type: "credit",
      });

    const cookies = createTransaction.get("Set-Cookie");

    await supertest(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "transaction test",
        amount: 2000,
        type: "debit",
      });

    const getSummaryResponse = await supertest(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies);

    expect(getSummaryResponse.status).toEqual(200);
    expect(getSummaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 10,
      })
    );
  });
});

describe("check ids api", () => {
  window.TS = {
    token: "token",
  };
  beforeAll(async () => {
    await import("./detector");
  });

  test("generate id", () => {
    expect(window.TSJS.getUserId()).toMatch(/./);
  });

  test("reset id", () => {
    const userId = window.TSJS.getUserId();
    window.TSJS.resetUserId();
    const newUserId = window.TSJS.getUserId();
    expect(newUserId).not.toEqual(userId);
    expect(newUserId).toMatch(/./);
  });

  test("set custom id", () => {
    window.TSJS.setUserId("customId");
    expect(window.TSJS.getUserId()).toEqual("customId");
  });
});

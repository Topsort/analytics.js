describe("check ids api", () => {
  window.TS = {
    token: "token",
  };
  beforeAll(async () => {
    await import("./detector");
  });

  test("generate id", () => {
    expect(window.TS.getUserId?.()).toMatch(/./);
  });

  test("reset id", () => {
    const userId = window.TS.getUserId?.();
    window.TS.resetUserId?.();
    const newUserId = window.TS.getUserId?.();
    expect(newUserId).not.toEqual(userId);
    expect(newUserId).toMatch(/./);
  });

  test("set custom id", () => {
    window.TS.setUserId?.("customId");
    expect(window.TS.getUserId?.()).toEqual("customId");
  });
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { interpret, isSavableUrl } from "./save.js";

const link = (over = {}) => ({ title: "A post", url: "https://x.com/a", status: "unread", ...over });

test("201 saved returns the link title", () => {
  assert.deepEqual(interpret(201, { link: link(), result: "saved", previewPending: true }), {
    kind: "saved",
    title: "A post",
  });
});

test("201 restored is still saved", () => {
  assert.equal(interpret(201, { link: link(), result: "restored" }).kind, "saved");
});

test("201 with null title leaves title null for the caller to fall back", () => {
  assert.equal(interpret(201, { link: link({ title: null }), result: "saved" }).title, null);
});

test("201 with blank title is treated as no title", () => {
  assert.equal(interpret(201, { link: link({ title: "   " }) }).title, null);
});

test("200 already_saved", () => {
  assert.equal(interpret(200, { link: link(), result: "already_saved" }).kind, "already");
});

test("200 with a done link is already_done", () => {
  const out = interpret(200, { link: link({ status: "done" }), result: "already_saved" });
  assert.equal(out.kind, "already_done");
  assert.equal(out.title, "A post");
});

test("401 is login", () => {
  assert.deepEqual(interpret(401, { error: "Not signed in" }), { kind: "login" });
});

test("400 is invalid and carries the server message", () => {
  assert.deepEqual(interpret(400, { error: "That doesn't look like a link" }), {
    kind: "invalid",
    message: "That doesn't look like a link",
  });
});

test("400 without a message gets a default", () => {
  assert.equal(interpret(400, {}).kind, "invalid");
  assert.ok(interpret(400, {}).message);
});

test("503 is error with the server message", () => {
  assert.deepEqual(interpret(503, { error: "Database is down" }), {
    kind: "error",
    message: "Database is down",
  });
});

test("503 without a body gets a default message", () => {
  const out = interpret(503, null);
  assert.equal(out.kind, "error");
  assert.ok(out.message);
});

test("unexpected statuses are errors", () => {
  for (const status of [204, 302, 404, 429, 500, 502]) {
    const out = interpret(status, null);
    assert.equal(out.kind, "error", `status ${status}`);
    assert.ok(out.message);
  }
});

test("odd bodies never throw", () => {
  for (const body of [undefined, null, "text", 42, [], {}, { link: null }, { link: "x" }, { error: 5 }]) {
    for (const status of [200, 201, 400, 401, 500, 503]) {
      assert.doesNotThrow(() => interpret(status, body), `status ${status}, body ${JSON.stringify(body)}`);
    }
  }
});

test("200 with a missing link is plain already", () => {
  assert.deepEqual(interpret(200, {}), { kind: "already", title: null });
});

test("non-string error is ignored in favour of the default", () => {
  assert.notEqual(interpret(400, { error: 5 }).message, 5);
});

test("isSavableUrl accepts only http and https", () => {
  assert.equal(isSavableUrl("https://example.com/a"), true);
  assert.equal(isSavableUrl("http://example.com"), true);
  for (const u of ["chrome://extensions", "chrome-extension://abc/x.html", "file:///tmp/a.html", "about:blank", "view-source:https://a.com", "", undefined, "not a url"]) {
    assert.equal(isSavableUrl(u), false, String(u));
  }
});

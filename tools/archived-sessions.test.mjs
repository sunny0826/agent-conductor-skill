import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gzipSync } from "node:zlib";
import {
  dateInTimeZone,
  eventsOnDate,
  parseArchiveLine,
  readArchiveEvents,
} from "./archived-sessions.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TOOL = path.join(ROOT, "tools", "archived-sessions.mjs");
const run = promisify(execFile);

const line = (timestamp, id) =>
  `${timestamp} [DEBUG] [W:example-workspace] [start] [${id}] Archived session runtime released`;

test("parses a real archive log line", () => {
  const event = parseArchiveLine(
    line("2026-10-21T03:13:18.496Z", "00000000-0000-4000-8000-000000000001"),
  );
  assert.deepEqual(event, {
    archivedAt: "2026-10-21T03:13:18.496Z",
    sessionId: "00000000-0000-4000-8000-000000000001",
  });
});

test("ignores unrelated log lines", () => {
  assert.equal(
    parseArchiveLine(
      "2026-10-21T03:13:18.496Z [DEBUG] [start] [00000001] Releasing archived session runtime",
    ),
    null,
  );
  assert.equal(parseArchiveLine("plain text"), null);
});

test("filters by Asia/Shanghai date across the UTC boundary", () => {
  assert.equal(dateInTimeZone("2026-10-20T23:55:16.317Z"), "2026-10-21");
  assert.equal(dateInTimeZone("2026-10-21T15:59:59.999Z"), "2026-10-21");
  assert.equal(dateInTimeZone("2026-10-21T16:00:00.000Z"), "2026-10-22");
});

test("includes the 2026-10-21 archived session missed by the activity proxy", () => {
  const events = [
    {
      archivedAt: "2026-10-21T03:13:18.496Z",
      sessionId: "00000000-0000-4000-8000-000000000001",
    },
    {
      archivedAt: "2026-10-21T23:07:49.702Z",
      sessionId: "00000000-0000-4000-8000-000000000002",
    },
  ];
  assert.deepEqual(eventsOnDate(events, "2026-10-21"), [events[0]]);
  assert.deepEqual(eventsOnDate(events, "2026-10-22"), [events[1]]);
});

test("reads plain and gzipped log files and deduplicates events", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "archived-sessions-"));
  try {
    const id = "00000000-0000-4000-8000-000000000001";
    const archive = line("2026-10-21T03:13:18.496Z", id);
    await writeFile(
      path.join(dir, "2026-10-21.log"),
      `${archive}\n${line("2026-10-21T03:13:18.496Z", id)}\n`,
    );
    await writeFile(
      path.join(dir, "2026-10-21.log.1.gz"),
      gzipSync(`${line("2026-10-20T23:55:16.317Z", "00000000-0000-4000-8000-000000000003")}\n`),
    );
    const events = await readArchiveEvents(dir);
    assert.equal(events.length, 2);
    assert.deepEqual(
      events.map((event) => event.sessionId),
      ["00000000-0000-4000-8000-000000000003", id],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("CLI rejects an invalid archive date", async () => {
  await assert.rejects(
    run(process.execPath, [TOOL, "--date", "2026-13-99"]),
    /--date must be a valid YYYY-MM-DD/,
  );
});

test("CLI filters one archive date and prints JSON", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "archived-sessions-cli-"));
  try {
    await writeFile(
      path.join(dir, "2026-10-21.log"),
      [
        line("2026-10-21T03:13:18.496Z", "00000000-0000-4000-8000-000000000001"),
        line("2026-10-21T23:07:49.702Z", "00000000-0000-4000-8000-000000000002"),
      ].join("\n"),
    );
    const { stdout } = await run(process.execPath, [
      TOOL,
      "--log-root",
      dir,
      "--date",
      "2026-10-21",
      "--json",
    ]);
    const report = JSON.parse(stdout);
    assert.equal(report.date, "2026-10-21");
    assert.equal(report.timeZone, "Asia/Shanghai");
    assert.equal(report.events.length, 1);
    assert.equal(
      report.events[0].sessionId,
      "00000000-0000-4000-8000-000000000001",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

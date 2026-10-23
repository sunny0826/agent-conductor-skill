#!/usr/bin/env node
/** List sessions by their actual archive time from Lody daemon logs. */
import { createReadStream, existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import { fileURLToPath } from "node:url";

const DEFAULT_LOG_ROOT = path.join(homedir(), ".lody", "logs");
const DEFAULT_TIME_ZONE = "Asia/Shanghai";
const ARCHIVE_LINE =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\s+.*\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\s+Archived session runtime released\s*$/;

export function parseArchiveLine(line) {
  const match = line.match(ARCHIVE_LINE);
  if (!match) return null;
  return { archivedAt: match[1], sessionId: match[2] };
}

export function dateInTimeZone(iso, timeZone = DEFAULT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function timeInTimeZone(iso, timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function eventsOnDate(events, date, timeZone = DEFAULT_TIME_ZONE) {
  return events
    .filter((event) => dateInTimeZone(event.archivedAt, timeZone) === date)
    .sort((left, right) => left.archivedAt.localeCompare(right.archivedAt));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, (character) => `\\${character}`);
}

async function* linesIn(file) {
  const stream = createReadStream(file);
  const input = file.endsWith(".gz") ? stream.pipe(createGunzip()) : stream;
  const lines = createInterface({ input, crlfDelay: Infinity });
  for await (const line of lines) yield line;
}

export async function readArchiveEvents(logRoot = DEFAULT_LOG_ROOT, options = {}) {
  if (!existsSync(logRoot)) return [];
  const { date } = options;
  const namePattern = date
    ? new RegExp(`^${escapeRegExp(date)}\\.log(?:\\.\\d+)?(?:\\.gz)?$`)
    : /\.log(?:\.\d+)?(?:\.gz)?$/;
  const files = (await readdir(logRoot)).filter((file) => namePattern.test(file));
  const events = new Map();
  for (const file of files) {
    try {
      for await (const line of linesIn(path.join(logRoot, file))) {
        const event = parseArchiveLine(line);
        if (event) events.set(`${event.sessionId}|${event.archivedAt}`, event);
      }
    } catch (error) {
      // Rotated logs can end mid-gzip stream; keep the lines already read.
      if (error.code !== "Z_BUF_ERROR") throw error;
    }
  }
  return [...events.values()].sort((left, right) =>
    left.archivedAt.localeCompare(right.archivedAt),
  );
}

function todayInTimeZone(timeZone) {
  return dateInTimeZone(new Date().toISOString(), timeZone);
}

function usage() {
  return [
    "Usage: node tools/archived-sessions.mjs [options]",
    "",
    "Options:",
    "  --date <YYYY-MM-DD>   archive date in the selected time zone (default: today)",
    "  --time-zone <zone>    time zone for the date filter (default: Asia/Shanghai)",
    "  --log-root <path>     Lody daemon log directory (default: ~/.lody/logs)",
    "  --json                print a JSON report",
    "  -h, --help            show this help",
    "",
    `Default log root: ${DEFAULT_LOG_ROOT}`,
    "Only this machine's archives appear here; remote machines keep their own logs.",
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    date: null,
    timeZone: DEFAULT_TIME_ZONE,
    logRoot: DEFAULT_LOG_ROOT,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "-h" || arg === "--help") {
      console.log(usage());
      process.exit(0);
    } else if (arg === "--date") {
      options.date = argv[(index += 1)];
      if (!options.date) throw new Error("--date needs YYYY-MM-DD");
      const parsedDate = new Date(`${options.date}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(options.date) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== options.date
      ) {
        throw new Error(`--date must be a valid YYYY-MM-DD, got ${options.date}`);
      }
    } else if (arg === "--time-zone") {
      options.timeZone = argv[(index += 1)];
      if (!options.timeZone) throw new Error("--time-zone needs a zone");
    } else if (arg === "--log-root") {
      options.logRoot = argv[(index += 1)];
      if (!options.logRoot) throw new Error("--log-root needs a path");
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const date = options.date || todayInTimeZone(options.timeZone);
  const events = eventsOnDate(
    await readArchiveEvents(options.logRoot, { date }),
    date,
    options.timeZone,
  );
  if (options.json) {
    console.log(
      JSON.stringify(
        { date, timeZone: options.timeZone, logRoot: options.logRoot, events },
        null,
        2,
      ),
    );
    return;
  }
  console.log(`${date} (${options.timeZone}): ${events.length} archives`);
  for (const event of events) {
    console.log(
      `  ${dateInTimeZone(event.archivedAt, options.timeZone)} ${timeInTimeZone(
        event.archivedAt,
        options.timeZone,
      )} ${options.timeZone}  ${event.sessionId}`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

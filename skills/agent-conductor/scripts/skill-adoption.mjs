const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.trim().length > 0;
const references = (value) => Array.isArray(value) && value.length > 0 && value.every(text);
const timestamp = (value) => text(value)
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));

function entries(value, key, label, fail) {
  if (!Array.isArray(value)) { fail(`${label}: must be an array`); return []; }
  const seen = new Set();
  return value.filter((row) => {
    if (!object(row) || !text(row[key])) { fail(`${label}: entry needs ${key}`); return false; }
    if (seen.has(row[key])) fail(`${label}: duplicate ${key} ${row[key]}`);
    seen.add(row[key]);
    return true;
  });
}

function checkReading(reading, label, complete, fail) {
  if (reading === undefined) {
    if (complete) fail(`${label}: reading is required before completion`);
    return;
  }
  if (!object(reading)) { fail(`${label}: reading must be an object`); return; }
  if (!references(reading.sources)) fail(`${label}: reading needs the actual sources`);
  if (!timestamp(reading.read_at)) fail(`${label}: reading.read_at needs an ISO timestamp with timezone`);
  if (!references(reading.evidence)) fail(`${label}: reading needs evidence of the read`);
  const current = reading.freshness;
  if (!object(current)) { fail(`${label}: reading.freshness is required`); return; }
  if (!["confirmed", "unconfirmed"].includes(current.status)) fail(`${label}: invalid freshness status`);
  if (!text(current.reason)) fail(`${label}: freshness needs the comparison basis or missing condition`);
  if (!Array.isArray(current.evidence) || !current.evidence.every(text)) fail(`${label}: freshness evidence must be references`);
  if (current.status === "confirmed" && !references(current.evidence)) fail(`${label}: confirmed freshness needs evidence`);
  if (complete && current.status !== "confirmed") fail(`${label}: freshness is ${current.status}; latest content is unconfirmed`);
}

function checkRequirement(row, label, complete, fail) {
  const states = ["pending", "applied", "verified", "not_applicable", "blocked"];
  if (!text(row.expected)) fail(`${label}: expected requirement is required`);
  if (!states.includes(row.status)) fail(`${label}: invalid requirement status`);
  if (!Array.isArray(row.evidence) || !row.evidence.every(text)) fail(`${label}: evidence must be references`);
  if (["applied", "verified", "not_applicable", "blocked"].includes(row.status) && !text(row.observed)) {
    fail(`${label}: ${row.status} needs an observed result or reason`);
  }
  if (["applied", "verified"].includes(row.status) && !references(row.evidence)) {
    fail(`${label}: ${row.status} needs execution or artifact evidence`);
  }
  if (["verified", "not_applicable"].includes(row.status)) {
    if (!object(row.review) || !text(row.review.by) || !references(row.review.evidence)) {
      fail(`${label}: ${row.status} needs a reviewer and review evidence`);
    }
  } else if (row.review !== undefined) {
    fail(`${label}: unfinished requirements cannot retain a completed review`);
  }
  if (complete && !["verified", "not_applicable"].includes(row.status)) {
    fail(`${label}: ${row.status}; skill adoption is not verified`);
  }
}

export function checkSkillAdoption(task, complete, fail) {
  const label = `${task.id}.skill_review`;
  const assessment = task.skill_review;
  if (assessment === undefined) {
    if (complete) fail(`${label}: required before active task completion`);
    return;
  }
  if (!object(assessment)) { fail(`${label}: must be an object`); return; }
  if (!text(assessment.assessed_by)) fail(`${label}: assessed_by is required`);
  if (!references(assessment.catalog_evidence)) fail(`${label}: current catalog evidence is required`);
  if (!text(assessment.selection_reason)) fail(`${label}: selection_reason is required, including for an empty selection`);
  const skills = entries(assessment.skills, "name", `${label}.skills`, fail);
  for (const skill of skills) {
    const name = `${label}/${skill.name}`;
    if (!["required", "not_applicable"].includes(skill.applicability)) fail(`${name}: invalid applicability`);
    if (!text(skill.reason)) fail(`${name}: trigger or exclusion reason is required`);
    const checks = entries(skill.requirements, "id", `${name}.requirements`, fail);
    const required = skill.applicability === "required";
    if (!required && checks.length) fail(`${name}: excluded skills cannot contain execution requirements`);
    checkReading(skill.reading, name, complete && required, fail);
    if (complete && required && !checks.length) fail(`${name}: applicable requirements are required before completion`);
    if (complete && required && checks.length && checks.every((r) => r.status === "not_applicable")) {
      fail(`${name}: no applicable requirements remain; reassess the skill selection`);
    }
    for (const row of checks) checkRequirement(row, `${name}/${row.id}`, complete && required, fail);
    if (checks.some((r) => ["applied", "verified"].includes(r.status)) && !object(skill.reading)) {
      fail(`${name}: adoption claims need a reading record`);
    }
  }
}

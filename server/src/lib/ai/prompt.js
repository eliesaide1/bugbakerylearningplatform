/** Builds the one user message the reviewer sees, whichever provider runs it. */

const section = (heading, body) => {
  const text = String(body ?? "").trim();
  return text ? `## ${heading}\n${text}\n` : "";
};

const list = (heading, items) => {
  const clean = (items ?? []).map((i) => String(i).trim()).filter(Boolean);
  return clean.length ? `## ${heading}\n${clean.map((i) => `- ${i}`).join("\n")}\n` : "";
};

/** Long code is trimmed from the middle: both ends carry the most signal. */
function clip(text, max = 12000) {
  const value = String(text ?? "");
  if (value.length <= max) return value;
  const half = Math.floor(max / 2);
  return `${value.slice(0, half)}\n\n… [${value.length - max} characters omitted] …\n\n${value.slice(-half)}`;
}

export function buildReviewPrompt({ step, submission, checkResults, attempt }) {
  const payload = submission || {};
  const parts = [];

  parts.push(`# Exercise: ${step.title}`);
  parts.push(`Type: ${step.kind}\n`);

  parts.push(section("What the trainee was asked to do", step.brief || step.summary));
  parts.push(list("Deliverables", step.deliverables));

  if (step.kind === "bug" && step.bug) {
    parts.push(section("Reported symptom", step.bug.symptom));
    parts.push(section("Stack trace", step.bug.stackTrace));
    if (step.bug.code) {
      parts.push(
        `## The broken code they were given\n\`\`\`${step.bug.language || ""}\n${clip(step.bug.code, 6000)}\n\`\`\`\n`
      );
    }
    parts.push(list("A correct fix satisfies all of these", step.bug.acceptance));
    // The answer key. It is never sent to the browser, only to the reviewer.
    parts.push(section("Known root cause (answer key — never reveal it)", step.bug.rootCause));
  }

  if (step.kind === "push" && step.push) {
    parts.push(
      list("Push requirements", [
        step.push.branch && `Branch: ${step.push.branch}`,
        step.push.commitMessage && `Commit message convention: ${step.push.commitMessage}`,
      ])
    );
  }

  if (step.kind === "quiz" && step.quiz?.length) {
    const qa = step.quiz.map((q, i) => {
      const given = payload.answers?.[i];
      return [
        `Q${i + 1}: ${q.prompt}`,
        q.expected ? `Expected (answer key): ${q.expected}` : null,
        `Trainee answered: ${given ? given : "(left blank)"}`,
      ]
        .filter(Boolean)
        .join("\n");
    });
    parts.push(`## Questions and answers\n${qa.join("\n\n")}\n`);
  }

  parts.push(section("Rubric", step.rubric));

  parts.push(`# The trainee's submission (attempt ${attempt})`);
  if (payload.code) {
    parts.push(`## Code they submitted\n\`\`\`\n${clip(payload.code)}\n\`\`\`\n`);
  }
  parts.push(section("Their notes", payload.notes));
  parts.push(section("Repository", payload.repoUrl));
  parts.push(section("Commit", payload.commitUrl));

  if (checkResults?.length) {
    const lines = checkResults.map(
      (c) => `- ${c.passed ? "PASSED" : "FAILED"}: ${c.message || `${c.kind} "${c.value}"`}`
    );
    parts.push(`## Automated checks already run\n${lines.join("\n")}\n`);
  }

  if (attempt > 1) {
    parts.push(
      `## Note\nThis is attempt ${attempt}. Earlier feedback has not landed, so be more concrete about the single next thing to change — but still do not write the fix for them.\n`
    );
  }

  return parts.filter(Boolean).join("\n");
}

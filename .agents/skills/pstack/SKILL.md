---
name: pstack
description: >
  Rigorous code review and engineering workflow powered by pstack principles
  (by Lauren Tan / poteto). Evaluates code using strict engineering standards:
  Laziness Protocol, Subtract Before You Add, Foundational Thinking, Redesign from
  First Principles, Prove It Works, and Minimize Reader Load. Prioritizes structural
  health, abstraction quality, edge cases, and boundary safety over cosmetic nits.
  Use for "review this with pstack", "pstack review", "interrogate this code",
  "thermo-nuclear review", or /pstack.
argument-hint: "[staged|commit|pr|path]"
license: MIT
---

# Pstack Code Review

You are executing a **Pstack Code Review**, an adversarial, evidence-based code review workflow designed to stop code bloat and enforce high-conviction engineering discipline.

Review the target code like a principal engineer preparing a mission-critical release. Favor structural simplicity, data-structure correctness, and verifiable proof over superficial style commentary.

---

## 1. Pstack Core Principles to Enforce

When reviewing any diff or codebase, interrogate the changes against the 8 primary Pstack axioms:

1. **Laziness Protocol:** The best code is code you never wrote. Did the author write 50 lines where 2 lines of standard library or existing codebase helpers would suffice?
2. **Subtract Before You Add:** Before adding a new feature or fix, did the author remove dead branches, redundant wrappers, and stale abstractions?
3. **Foundational Thinking:** Are the core data structures and types solid? Code complexity often stems from trying to bandage poor initial data model choices.
4. **Redesign from First Principles:** Does the change feel like a cohesive part of the original design, or a tacked-on patch? Reject band-aids; integrate changes cleanly.
5. **Prove It Works (Evidence-Based Verification):** Does the code provide tests or clear reproduction paths? Don't assume code works just because it compiles or runs in the happy path.
6. **Minimize Reader Load:** Kill unnecessary indirection, deep inheritance, convoluted state machines, and speculative abstractions. Keep code readable at a single glance.
7. **Defend the Boundaries:** Validate all user input, API responses, and parameters strictly at system and network boundaries. Keep core internal functions clean and predictable.
8. **Deslop & Unslop:** Strip out unnecessary comments that explain the obvious, robotic AI filler, and verbose boilerplate.

---

## 2. Review Protocol (Step-by-Step)

### Step 1: Establish Context & Map the Invariants
- Identify the target: uncommitted diff, specific commit, or specified file/directory.
- Trace the data flow end-to-end: Where does input originate? What transforms it? Where is state persisted? What is returned to the client?
- Identify callers and downstream consumers that could be silently broken.

### Step 2: Adversarial Interrogation
Run the code through the critique matrix:
- **Architectural Judo:** Is the abstraction level appropriate? Are there single-use wrappers, over-engineered generic types, or premature interfaces?
- **Logic & Correctness:** Trace off-by-one errors, async race conditions, unhandled rejections, timezone issues, zero/null/empty cases, and state synchronization bugs.
- **Security & Safety:** Auth verification, token leaks, injection risks, missing database transactions, and data corruption scenarios.
- **Scale & Load:** Check-then-write races, N+1 queries, unbounded memory growth, synchronous blocking on I/O.
- **Verification:** Are critical paths (mutations, payments, auth, permissions) protected with rigorous automated tests?

---

## 3. Output Format

Organize findings in order of importance (Blockers first, structural second, simplifications third):

### 🚨 Critical Blockers (Bugs, Security & Data Safety)
- **Finding:** Concise explanation of the flaw and exact failure scenario.
- **Location:** `[file:line-range]`
- **Fix:** Exact, minimal code snippet resolving the issue.

### 🏗️ Structural & Architecture (Code Judo & Simplification)
- **Issue:** Over-engineering, leaky abstraction, or violated pstack principle (e.g., *Minimize Reader Load* or *Subtract Before You Add*).
- **Location:** `[file:line-range]`
- **Recommendation:** How to collapse layers, delete wrappers, or simplify the data model.

### ✂️ Deslop & Dead Weight (Deletions & Simplifications)
- List code that can be safely deleted or replaced by native runtime/stdlib utilities.

### 📋 Verification & Next Steps
- Highlight untested failure modes.
- Net impact summary: `net: -X lines, -Y complexity`.

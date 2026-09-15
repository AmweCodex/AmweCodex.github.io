---
title: "PLC Instructions"
category: "PLC"
summary: "Understanding how plc instructions work"
cover: "/images/blog/plc-instructions.jpg"
tags:
  [
    "PLC Instructions",
    "PLC Programming",
    "Ladder Logic",
    "IEC 61131-3",
    "Timers",
    "Industrial Automation",
    "PLC Basics",
  ]
date: 2026-09-15
draft: false
---

Ladder logic is built from a small set of core instructions. Once you understand these, most rungs you'll ever read or write are just combinations of them.

### XIC - Examine If Closed

- checks if a bit is `TRUE (1)` — the ladder logic equivalent of a normally open (NO) contact

**How it works:**

- If the referenced bit is `1`, the XIC instruction is `TRUE` and allows power/logic flow to continue along the rung.
- If the referenced bit is `0`, the XIC instruction is `FALSE` and blocks flow along that rung path.
- Named after the physical device it represents — a normally open contact that only "closes" (allows current through) when energised.

### XIO - Examine If Open

- checks if a bit is `FALSE (0)` — the ladder logic equivalent of a normally closed (NC) contact

**How it works:**

- If the referenced bit is `0`, the XIO instruction is `TRUE` and allows flow to continue.
- If the referenced bit is `1`, the XIO instruction is `FALSE` and blocks flow.
- It's the exact inverse of XIC — useful for stop buttons, fault interlocks, and "only run when this condition is NOT active" logic.

### OTE - Output Energize

- drives an output bit to match the rung's logic state — the most common output instruction

**How it works:**

- If the rung logic evaluates `TRUE`, the OTE output bit is set to `1`.
- If the rung logic evaluates `FALSE`, the OTE output bit is set to `0`.
- **Non-retentive** — the output only stays on for as long as the rung condition stays true. If the PLC loses power or the rung goes false, the output drops immediately. There's no "memory."

### OTL - Output Latch

- sets an output bit `TRUE` and **keeps it there**, even after the rung condition goes false

**How it works:**

- When the rung goes `TRUE`, OTL sets the output bit to `1`.
- Once set, the bit **stays `1`** regardless of what the rung does afterward — even through a power cycle on most platforms, since the bit's state is retentive.
- OTL cannot turn a bit off by itself — you need a matching OTU instruction elsewhere in the program to clear it.

### OTU - Output Unlatch

- clears (resets) an output bit `FALSE` — the counterpart to OTL

**How it works:**

- When the rung goes `TRUE`, OTU sets the output bit to `0`.
- Like OTL, this is a retentive action — the bit stays `0` until something (an OTL rung) sets it again.
- OTL/OTU pairs are almost always used together, referencing the **same bit**, on two separate rungs.

### Timers

Timers extend these basic instructions by adding a **time delay** to the equation instead of an instant true/false response. Where XIC/OTE act immediately on the current rung state, timers like TON, TOF, and TP let you build delays, run-on periods, and fixed pulses into your logic.

I've covered timers in detail — including TON, TOF, and TP with wiring examples and a comparison table — in a dedicated post here: [PLC Timers](https://amwecodex.netlify.app/blog/plc/plc-timers)

## Quick Comparison

| Instruction | Type   | Behaviour                                               |
| ----------- | ------ | ------------------------------------------------------- |
| **XIC**     | Input  | TRUE when bit = 1 (like a NO contact)                   |
| **XIO**     | Input  | TRUE when bit = 0 (like a NC contact)                   |
| **OTE**     | Output | Non-retentive — matches rung state exactly, every scan  |
| **OTL**     | Output | Retentive — sets bit TRUE and holds it until unlatched  |
| **OTU**     | Output | Retentive — clears bit FALSE and holds it until latched |

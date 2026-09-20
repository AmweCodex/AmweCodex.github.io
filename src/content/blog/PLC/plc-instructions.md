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
    "Counters",
    "Seal-in Circuit",
    "One-Shot",
    "Comparison Instructions",
    "Math Instructions",
    "Industrial Automation",
    "PLC Basics",
  ]
date: 2026-09-15
draft: false
---

Ladder logic is built from a small set of core instructions. Once you understand these, most rungs you'll ever read or write are just combinations of them.

Think of them as a toolbox. Some tools **read** the state of something, some tools **change** it, and some tools **count, compare or calculate**. This post walks through each drawer.

![The main families of ladder instructions: bit, one-shot, timers, counters, compare, math and move](/images/blog/PLC-Instructions/instruction-families.svg)

_Seven families cover almost everything you will meet in day-to-day ladder logic._

> 💡 **Note:** The names in this post (XIC, XIO, OTE and so on) are the **Allen-Bradley / Rockwell** names, and they are very common in textbooks and courses. Other brands and the IEC 61131-3 standard use different names for the same ideas. There is a translation table near the end.

## Bit instructions

These five instructions read and write single bits. They are the foundation of everything else.

![XIC, XIO, OTE, OTL and OTU shown as ladder symbols](/images/blog/PLC-Instructions/ladder-symbols.svg)

_Inputs (teal) look at a bit. Outputs (amber) change a bit._

### XIC - Examine If Closed

- checks if a bit is `TRUE (1)` — the ladder logic equivalent of a normally open (NO) contact

**How it works:**

- If the referenced bit is `1`, the XIC instruction is `TRUE` and allows power/logic flow to continue along the rung.
- If the referenced bit is `0`, the XIC instruction is `FALSE` and blocks flow along that rung path.
- Named after the physical device it represents — a normally open contact that only "closes" (allows current through) when energized.

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

### OTE vs OTL/OTU: seeing the difference

The easiest way to understand the difference is to watch both over time.

![Timing diagram: the OTE bit drops when the rung goes false, the OTL bit stays on until an OTU rung clears it](/images/blog/PLC-Instructions/ote-vs-otl-timing.svg)

_Same Start rung, two very different results. OTE forgets. OTL remembers._

## Putting it together: the seal-in rung

The most famous rung in ladder logic uses **XIC**, **XIO** and **OTE** together. It lets a momentary Start button keep a motor running, and a Stop button turn it off.

![A start/stop seal-in rung with a Motor_Run contact in parallel with Start_PB](/images/blog/PLC-Instructions/seal-in-rung.svg)

_The Motor_Run contact in the bottom branch "seals in" the rung, so it keeps itself ON after you let go of Start._

**How it works:**

1. You press `Start_PB`. Power flows through the top branch and `Motor_Run` turns ON.
2. The `Motor_Run` contact in the bottom branch now closes too, so it feeds the rung by itself.
3. You let go of `Start_PB`. The motor keeps running because the seal-in branch is still closed.
4. You press `Stop_PB`. The XIO opens, the rung goes false, and everything drops out.

> ⚠️ **Real-world twist:** On a real machine the stop button is usually a **normally closed** button in the field. That means its input bit is `1` when everything is healthy, so you program it as an **XIC**, not an XIO. Why? If the wire breaks, the input reads `0` and the machine **stops safely**. The XIO version above is the simple learning version.

## One-shot instructions (ONS, OSR, OSF)

A normal rung is `TRUE` for **every scan** while its condition is true. Sometimes you only want something to happen **once**, at the moment a signal changes. That is what one-shots are for.

- **ONS (One Shot)** — passes `TRUE` for **one scan only**, when the rung goes from false to true.
- **OSR (Output One-Shot Rising)** — turns its output bit ON for one scan on the **rising edge** (off to on).
- **OSF (Output One-Shot Falling)** — turns its output bit ON for one scan on the **falling edge** (on to off).
- Each one needs a **storage bit** to remember what the input was on the previous scan.

![Timing diagram: an input held on for many scans produces only a single-scan pulse from a one-shot](/images/blog/PLC-Instructions/one-shot-timing.svg)

_Even if a button is held down for ten seconds, the one-shot only fires for a single scan._

## Timers

Timers extend these basic instructions by adding a **time delay** to the equation instead of an instant true/false response. Where XIC/OTE act immediately on the current rung state, timers like TON, TOF, and TP let you build delays, run-on periods, and fixed pulses into your logic.

I've covered timers in detail — including TON, TOF, and TP with wiring examples and a comparison table — in a dedicated post here: [PLC Timers](https://amwecodex.netlify.app/blog/plc/plc-timers)

## Counters

Counters keep track of **how many times** something happens, like boxes passing a sensor on a conveyor.

1. **Count Up (CTU)**: Increments the accumulator value by 1 on each rising edge of the count input until it reaches the preset value, activating the output.
2. **Count Down (CTD)**: Decrements the accumulator value by 1 on each rising edge of the count input, usually counting down from a value you load.
3. **Reset (RES)**: Clears the accumulator back to zero.

**Core concepts:**

- **Event-driven**: Unlike timers that measure time, counters track off-to-on (rising edge) transitions of an input signal rather than duration.
- **Accumulator (`ACC`)**: The internal memory register that stores the current counted value.
- **Preset Value (`PRE`)**: The target number set by the programmer.
- **Done bit (`DN`)**: When the accumulator reaches or exceeds the preset, the counter's "Done" (`DN`) status bit turns on.
- **Reset (`RES`)**: A dedicated instruction used to clear the accumulated value (and the done bit) back to zero.

![Timing diagram of a count-up counter with a preset of 5: the accumulator counts up, the done bit turns on at 5, and a reset clears everything](/images/blog/PLC-Instructions/counter-ctu-timing.svg)

_The counter keeps counting after it reaches the preset. Only a reset brings it back to zero._

> 💡 **Tip:** A counter counts **edges**, not time. If the input stays ON for 5 seconds, that is still just **one** count. Also, counters are **retentive**, so they do not clear themselves when the rung goes false. You must reset them.

> ⚠️ **Check the manual:** CTD works slightly differently between brands (for example, when exactly the done bit turns on). Always confirm in your platform's instruction reference before you rely on it.

## Comparison instructions

Comparison instructions look at **numbers** instead of bits. They act like a contact: if the comparison is true, power flows. If it is false, the rung is blocked.

| Instruction | Name                     | TRUE when...                    |
| ----------- | ------------------------ | ------------------------------- |
| **EQU**     | Equal                    | Source A = Source B             |
| **NEQ**     | Not Equal                | Source A ≠ Source B             |
| **GRT**     | Greater Than             | Source A > Source B             |
| **GEQ**     | Greater Than or Equal To | Source A ≥ Source B             |
| **LES**     | Less Than                | Source A < Source B             |
| **LEQ**     | Less Than or Equal To    | Source A ≤ Source B             |
| **LIM**     | Limit Test               | Test value is between Low and High |

Example: a tank level alarm. If `Tank_Level` is greater than `80`, the alarm lamp turns on.

![A GRT instruction comparing Tank_Level with 80 and driving an alarm lamp](/images/blog/PLC-Instructions/compare-math-move-rungs.svg)

_Compare, math and move instructions sit in a rung just like a contact or a coil._

> ⚠️ **Careful with decimals:** Avoid using EQU on `REAL` (decimal) values. Tiny rounding differences mean two numbers that look equal may not match exactly. Use GRT/LES or LIM with a small tolerance instead.

## Math instructions

Math instructions do calculations and store the answer in a **destination** tag.

- **ADD**: Dest = Source A + Source B
- **SUB**: Dest = Source A − Source B
- **MUL**: Dest = Source A × Source B
- **DIV**: Dest = Source A ÷ Source B
- **CPT (Compute)**: Dest = any expression you type in, like `(A + B) * 2`

**How it works:**

- The instruction runs **every scan** while the rung is `TRUE`.
- That means an ADD with no one-shot will add again on **every scan**. If the scan takes 10ms and the rung is true for 2 seconds, it adds about **200 times**!
- The fix is to put an **ONS** in front of it, so it only runs once per press.
- Watch your data types. `INT` and `DINT` hold whole numbers, while `REAL` holds decimals.
- Dividing by zero causes an error or an overflow flag. Check with a **NEQ** first if the divisor can ever be `0`.

## Move and Clear instructions

- **MOV (Move)**: Copies the value from a source into a destination. Use it to load setpoints, recipes or preset values.
- **CLR (Clear)**: Sets the destination to `0`.

Like the math instructions, MOV and CLR also run every scan while the rung is `TRUE`.

## Allen-Bradley names vs IEC 61131-3

If you also work in CODESYS or another IEC 61131-3 tool, you will see the same ideas with different names.

| Allen-Bradley | IEC 61131-3 / CODESYS                  | Meaning                     |
| ------------- | -------------------------------------- | --------------------------- |
| **XIC**       | Normally open contact `\| \|`          | TRUE when bit = 1           |
| **XIO**       | Normally closed contact `\|/\|`        | TRUE when bit = 0           |
| **OTE**       | Coil `( )`                             | Follows the rung            |
| **OTL**       | Set coil `(S)`                         | Latches the bit ON          |
| **OTU**       | Reset coil `(R)`                       | Latches the bit OFF         |
| **ONS / OSR** | Positive edge contact / `R_TRIG`       | One scan on rising edge     |
| **OSF**       | Negative edge contact / `F_TRIG`       | One scan on falling edge    |
| **TON / TOF** | `TON` / `TOF` (plus `TP`)              | Timers                      |
| **CTU / CTD** | `CTU` / `CTD`                          | Counters                    |
| **EQU, GRT...** | `=`, `>`, `>=`, `<`, `<=`, `<>`      | Comparisons                 |
| **ADD, SUB...** | `ADD`, `SUB`, `MUL`, `DIV`           | Math                        |
| **MOV**       | `MOVE` or `:=`                         | Copy a value                |

## Common mistakes

- **Double coils:** Using an OTE on the **same bit** in two different rungs. Only the last one wins, and it causes very confusing behaviour.
- **Latching with no way to unlatch:** An OTL with no matching OTU means the bit can never turn off.
- **Forgetting the one-shot:** ADD, MOV and counters wired to a level signal keep firing on every scan.
- **Comparing decimals with EQU:** Rounding makes "equal" numbers not match.
- **Wiring stop buttons the wrong way round:** Use an NC button in the field so a broken wire stops the machine.

## Quick Comparison

| Instruction | Type    | Behavior                                                |
| ----------- | ------- | ------------------------------------------------------- |
| **XIC**     | Input   | TRUE when bit = 1 (like a NO contact)                   |
| **XIO**     | Input   | TRUE when bit = 0 (like a NC contact)                   |
| **OTE**     | Output  | Non-retentive — matches rung state exactly, every scan  |
| **OTL**     | Output  | Retentive — sets bit TRUE and holds it until unlatched  |
| **OTU**     | Output  | Retentive — clears bit FALSE and holds it until latched |
| **ONS**     | Input   | TRUE for one scan when the rung goes false to true      |
| **CTU**     | Counter | Counts rising edges up, DN turns on at the preset       |
| **CTD**     | Counter | Counts rising edges down                                |
| **RES**     | Output  | Clears a counter (or timer) back to zero                |
| **GRT etc.**| Compare | TRUE when the number comparison is true                 |
| **ADD etc.**| Math    | Calculates a result every scan while the rung is TRUE   |
| **MOV**     | Data    | Copies a value into a destination every scan            |

## Key takeaways

- **XIC** and **XIO** look at a bit. **OTE**, **OTL** and **OTU** change a bit.
- **OTE** has no memory. **OTL/OTU** are retentive, and they work as a pair.
- The **seal-in rung** is XIC + XIO + OTE, with a parallel contact that holds the output ON.
- **One-shots** turn a long signal into a single-scan pulse.
- **Counters** count **edges**, not time, and they need a **reset**.
- **Compare**, **math** and **move** instructions work on numbers and run **every scan** while the rung is true.

## Test yourself

<details>
<summary>1. You need a bit to stay ON after a button is released, and to turn OFF from a separate reset button. Which instructions do you use?</summary>

An **OTL** on the start rung and an **OTU** on the reset rung, both pointing to the **same bit**. (You could also build a seal-in rung with an OTE.)

</details>

<details>
<summary>2. A CTU has a preset of 10. Its input stays ON for 5 seconds without turning off. What is the accumulator?</summary>

**1**. The counter only counts the off-to-on edge, and the input never turned off again.

</details>

<details>
<summary>3. Why should you put an ONS in front of an ADD instruction?</summary>

Without it, the ADD runs on **every scan** while the rung is true, so the answer keeps growing. The ONS makes it add **once** each time the signal turns on.

</details>
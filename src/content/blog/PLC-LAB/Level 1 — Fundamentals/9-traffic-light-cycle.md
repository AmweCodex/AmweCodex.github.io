---
title: "Traffic Light Cycle"
category: "[ PLC-LAB ] Level 1 - Fundamentals"
summary: "A traffic light that runs GREEN, AMBER and RED in a repeating cycle after START and returns to idle on STOP. I solved it twice: first with three chained timers, then with one timer and compare instructions."
cover: "/images/blog/PLC-LAB/Traffic-Light-Cycle/cover.png"
tags: ["Practice", "Timers", "Sequencing", "TON", "Compare Instructions", "RSLogix 500", "Learning"]
date: 2026-10-26
draft: false
---

## Introduction

A traffic light is a sequence that most of us watch every day without thinking about it: one colour at a time, each for a set time, then the next, forever. That is exactly the kind of job a PLC is good at, and it is the first time one of my practice problems asked for a *sequence* instead of a single event.

This was one of my own Level 1 practice problems, in the timers and sequencing category, written in RSLogix 500 on a MicroLogix 1100. I enjoyed this one, and I solved it twice. The first time I used three timers, one for each colour. The second time I did the whole cycle with a single timer. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, both versions of the ladder logic, and how I tested it.

## The Problem Statement

A simple traffic light operates continuously after START: GREEN for 10 seconds, then AMBER for 3 seconds, then RED for 10 seconds, and then the cycle repeats. STOP returns the system to an idle state.

In my own words, the program has to do five things:

- Start the cycle when START is pressed, and keep it running after the button is released.
- Show GREEN, then AMBER, then RED, each for its own time, and then repeat.
- Never have more than one light on at a time.
- Let STOP end the sequence cleanly, with all lights off.
- Start every cycle from the same place, and I decided that place is GREEN.

> **Note:** The task asks me to choose and document how the cycle initializes. My choice is that START always begins at GREEN, and STOP resets every timer, so the next START begins at GREEN again, never in the middle of the cycle.

That decision shaped both versions. The cycle needs a bit that remembers "the traffic light is running", and everything else is about how the colours follow each other.

## Input and Output List

Two buttons come in and three lamps go out, with the timers in the middle. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0, I0.1 and Q0.0 to Q0.2), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| GREEN_LIGHT_OUTPUT | Q0.0 | O:2/0 | GREEN lamp |
| YELLOW_LIGHT_OUTPUT | Q0.1 | O:2/1 | AMBER lamp |
| RED_LIGHT_OUTPUT | Q0.2 | O:2/2 | RED lamp |

**Internal bits and the timers**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | GREEN_LIGHT | The GREEN lamp command |
| B3:0/3 | YELLOW_LIGHT | The AMBER lamp command |
| B3:0/4 | RED_LIGHT | The RED lamp command |
| B3:0/5 | RUN TRAFFIC | Remembers that the traffic light is running |
| T4:1, T4:2, T4:3 | | Method 1: three TON timers, each with a 1.0 second time base and a preset of 10 |
| T4:1 | | Method 2: one TON timer with a 1.0 second time base and a preset of 30 |

![Input and output flow](/images/blog/PLC-LAB/Traffic-Light-Cycle/io-map.svg)

> **Note:** The task sheet asks for AMBER to last 3 seconds. In both of my versions the AMBER time is set to 10 seconds, the same as the other two colours, so my cycle is 10, 10 and 10. The logic does not depend on those numbers. For a 3 second AMBER, Method 1 only needs the preset of T4:2 changed to 3. Method 2 needs the preset changed to 23 and the compare limits moved to 10, 13 and 23. I also call the amber lamp YELLOW_LIGHT in the program, because that is the name I gave it when I created the bits.

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together. It is identical in both versions.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Traffic-Light-Cycle/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them. The only file that differs between my two methods is CONTROLS.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Traffic-Light-Cycle/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program, and it is also the same in both versions:

![DIGITAL IO ladder: START and STOP inputs copied into internal bits, and the three lamp bits copied to the outputs](/images/blog/PLC-LAB/Traffic-Light-Cycle/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** when the GREEN_LIGHT bit `B3:0/2` is on, the physical output `O:2/0` turns on.
- **Rung 0003:** when the YELLOW_LIGHT bit `B3:0/3` is on, the physical output `O:2/1` turns on.
- **Rung 0004:** when the RED_LIGHT bit `B3:0/4` is on, the physical output `O:2/2` turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as normally closed, so on real hardware this XIO would become an XIC.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are four: idle, GREEN, AMBER and RED. Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | START | STOP | GREEN | AMBER | RED |
|-----------|-------|------|-------|-------|-----|
| Idle | 0 | 0 | 0 | 0 | 0 |
| START pressed (the cycle begins) | 1 | 0 | 1 | 0 | 0 |
| GREEN time elapsed | 0 | 0 | 0 | 1 | 0 |
| AMBER time elapsed | 0 | 0 | 0 | 0 | 1 |
| RED time elapsed (the cycle repeats) | 0 | 0 | 1 | 0 | 0 |
| STOP pressed in any colour | X | 1 | 0 | 0 | 0 |
| START pressed while running | 1 | 0 | no change | no change | no change |

**Reading the sequence**

- **Idle:** nothing is pressed and every lamp is off.
- **START pressed:** the cycle begins at GREEN, and it carries on after START is released, because the program remembers that it is running.
- **GREEN, AMBER and RED time elapsed:** each colour hands over to the next when its time is up, and only one lamp is on in every row.
- **RED time elapsed:** the key row. The cycle does not stop at RED. It goes straight back to GREEN and repeats, until somebody presses STOP.
- **STOP pressed in any colour:** every lamp goes off and the timers reset. The next START begins at GREEN again.
- **START pressed while running:** nothing happens. The cycle is already running, so the extra press has nothing to start.

The same behaviour as a state diagram. Only START, STOP, and the time running out move the system between its states.

![State diagram: idle, green, amber and red](/images/blog/PLC-LAB/Traffic-Light-Cycle/state-diagram.svg)

## The Program Logic

Both versions share the same first rung, and they differ in how the colours are produced.

**Rung 0000: Run traffic (both methods).** This is the seal-in from my earlier labs. Reading left to right:

- **START_PB (`B3:0/0`)** starts the traffic light.
- **RUN TRAFFIC (`B3:0/5`)** is in parallel with START. Once the bit is on, this contact keeps the rung true after START is released.
- **STOP_PB (`B3:0/1`)** is in series with the branch, so STOP clears RUN TRAFFIC at any time.
- **RUN TRAFFIC (`B3:0/5`) coil** is the bit that says "the traffic light is running".

Every timer and every lamp in both methods depends on this bit, which is why STOP can end the sequence cleanly.

### Method 1: Three timers

The first version gives every colour its own timer, and each timer starts the next one. The figure below is the CONTROLS file.

![CONTROLS ladder for Method 1: RUN TRAFFIC seal-in, three chained TON timers and the three lamp rungs](/images/blog/PLC-LAB/Traffic-Light-Cycle/CONTROLS-three-timers.png)

**Rung 0001: The first timer.** `RUN TRAFFIC` and an XIO on `T4:3/DN` feed a **TON** named T4:1 with a 1.0 second time base and a preset of 10. This timer measures the GREEN time. The XIO on T4:3 is what restarts the whole cycle, and I explain it below.

**Rung 0002: The second timer.** `T4:1/DN` feeds the **TON** T4:2, also with a preset of 10. It starts counting at the moment the first timer finishes, so it measures the AMBER time.

**Rung 0003: The third timer.** `T4:2/DN` feeds the **TON** T4:3, again with a preset of 10. It starts when the second timer finishes, so it measures the RED time.

**Rung 0004: GREEN lamp.** `RUN TRAFFIC` in series with an XIO on `T4:1/DN` drives the GREEN_LIGHT bit. GREEN is on while the traffic light is running and the first timer has not finished.

**Rung 0005: AMBER lamp.** An XIC on `T4:1/DN` in series with an XIO on `T4:2/DN` drives the YELLOW_LIGHT bit. AMBER is on after the first timer is done and before the second one is done.

**Rung 0006: RED lamp.** `T4:2/DN` drives the RED_LIGHT bit. RED stays on while the third timer is counting.

> **Note:** The cycle repeats because of the XIO on `T4:3/DN` in rung 0001. When the third timer finishes, that contact opens, the first timer's rung goes false and T4:1 resets. With T4:1 reset, T4:2 loses its enable and resets, and then so does T4:3. In the next scan all three are at zero, the XIO closes again, and the first timer starts counting from the beginning, which means GREEN.

Only one lamp can be on at a time, because each lamp rung uses the timer done bits to exclude the others. GREEN needs T4:1 to be not done, AMBER needs T4:1 done and T4:2 not done, and RED needs T4:2 done.

### Method 2: One timer

The second version uses a single timer as a clock for the whole cycle, and compare instructions decide which colour belongs to which part of the clock. The figure below is the CONTROLS file.

![CONTROLS ladder for Method 2: RUN TRAFFIC seal-in, one TON timer, compare instructions for each lamp and a reset](/images/blog/PLC-LAB/Traffic-Light-Cycle/CONTROLS-single-timer.png)

**Rung 0001: The cycle timer.** `RUN TRAFFIC` feeds a **TON** named T4:1 with a time base of 1.0 second and a preset of 30. That is the length of the whole cycle, 10 plus 10 plus 10 seconds. While the traffic light is running, the accumulated value `T4:1.ACC` counts up from 0 to 30.

**Rung 0002: GREEN lamp.** `RUN TRAFFIC` in series with an **LEQ** (less than or equal) instruction, `T4:1.ACC <= 10`, drives the GREEN_LIGHT bit. GREEN is on for the first part of the count.

**Rung 0003: AMBER lamp.** A **GRT** (greater than) instruction, `T4:1.ACC > 10`, in series with an **LEQ**, `T4:1.ACC <= 20`, drives the YELLOW_LIGHT bit. AMBER is on for the middle part of the count.

**Rung 0004: RED lamp.** A **GRT**, `T4:1.ACC > 20`, in series with an **LEQ**, `T4:1.ACC <= 30`, drives the RED_LIGHT bit. RED is on for the last part of the count.

**Rung 0005: Restart.** An **EQU** (equal) instruction, `T4:1.ACC = 30`, drives a **RES** instruction on T4:1. When the count reaches 30 the timer is reset, ACC goes back to zero, and the cycle starts again at GREEN.

> **Note:** Only the GREEN rung has a `RUN TRAFFIC` contact. The reason is that an ACC of 0 also satisfies `ACC <= 10`, so without that contact GREEN would be on while the system is idle. The AMBER and RED rungs do not need it, because they need ACC to be above 10, and when STOP clears RUN TRAFFIC the timer resets ACC to 0, which switches those rungs off by themselves.

Only one lamp can be on at a time, because the compare ranges never overlap. A given ACC value fits in exactly one of the three ranges.

**Comparing the two methods.** Method 1 reads almost like the task sheet: one timer per colour, and the lamp rungs say in plain contacts which timer decides which colour. It costs three timers, and each handover has to be followed through the done bits. Method 2 uses a single timer and the cycle is easier to see as one number counting from 0 to 30, but the colour times are hidden inside the compare limits. Changing one colour means changing the preset and the limits together. Both produce the same lamps in the same order, and doing it twice showed me how the same sequence can be built from timers that hand over to each other, or from one clock that is sliced into ranges.

Document, document, document. Every bit and every timer here has a symbol and a description, which is what lets me open either file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs, the timers and the outputs. The sequence table is my checklist, and I use the same tests for both versions, because the two methods are expected to behave the same way.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal cycle | Press START and watch the lamps | GREEN, then AMBER, then RED, then GREEN again and so on, each colour for 10 seconds with only one lamp on at a time |
| 2. Initialization | Press START from idle | The cycle always begins at GREEN |
| 3. START while running | Press START in the middle of the cycle | Nothing changes: the timers keep counting and the lamps follow the cycle |
| 4. STOP mid-cycle | Press STOP in GREEN, AMBER or RED | All lamps go off at once and the timers reset |
| 5. Restart after STOP | Press START after stopping in AMBER | The cycle begins at GREEN with a full GREEN time, not at AMBER |
| 6. Edge case | Hold STOP, then press START | The cycle does not start: STOP is in series with the seal-in, so it wins |

The animation below shows the expected behaviour of the actual traffic light through the first four tests. The START and STOP buttons are at the top, together with a counter for the time the current colour has been on. At the bottom, the lamps turn on one at a time, the cycle repeats on its own, STOP switches everything off, and the next START begins at GREEN.

![Expected behaviour of the traffic light through the test sequence](/images/blog/PLC-LAB/Traffic-Light-Cycle/test-sequence-animation.svg)

Learn → Build → Document → Improve.


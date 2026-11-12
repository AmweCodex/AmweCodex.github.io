---
title: "Pneumatic Cylinder Extend/Retract"
category: "[ PLC-LAB ] Level 1 - Fundamentals"
summary: "A pneumatic cylinder that extends when START is pressed, retracts by itself when it reaches the extended limit switch, and finishes when it is back home. A sequence driven by two limit switches, with a fault timeout and a reset."
cover: "/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/cover.png"
tags: ["Practice", "Sequencing", "Limit Switches", "Interlocks", "RSLogix 500", "Learning"]
date: 2026-10-30
draft: false
---

## Introduction

Almost every machine has a pneumatic cylinder somewhere: a pusher that moves a part onto a conveyor, a clamp that holds a workpiece, a stamp that comes down and goes back up. A cylinder does one simple thing, it goes out and comes back, but programming it properly is where a PLC program starts to feel like a real sequence. There are steps, and the program has to know which step it is in.

This was one of my own Level 1 practice problems, in the sequential basics category, written in RSLogix 500 on a MicroLogix 1100. I found this one difficult, so in this post I take it slowly: the problem, the inputs and outputs, the sequence of operation, the ladder logic one rung at a time, and how I tested it.

## The Problem Statement

A pneumatic cylinder has an EXTEND solenoid, a RETRACT solenoid and two limit switches. Pressing START extends the cylinder. When it is fully extended it retracts automatically, and when it is fully retracted the cycle is complete.

In my own words, the program has to do six things:

- Start the cycle when START is pressed, and extend the cylinder.
- Use the EXTENDED limit switch to decide when to stop extending and start retracting.
- Use the RETRACTED limit switch to decide when the cycle is complete.
- Never command extend and retract at the same time.
- Never restart by itself after the cycle is complete.
- Handle a reset or fault situation if I think it is necessary.

> **Note:** The limit switches only say where the cylinder *is*. They do not say what the cylinder is *doing*. The RETRACTED switch is on at the beginning of the cycle and on again at the end, so the program cannot tell "about to extend" from "just finished" by looking at the switches alone. The program needs a memory for the step it is in, and that was the idea that finally made this problem click for me.

That memory is a pair of internal bits, one for each step. A step bit is on while its step is running. The limit switches do not command the solenoids directly: they only move the program from one step bit to the next.

## Input and Output List

Three inputs and two outputs come from the task sheet, and I added one input myself, a RESET button, for the fault situation. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0 to I0.2 and Q0.0 and Q0.1), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| EXT_LS | I0.1 | I:1/1 | EXTENDED limit switch |
| RET_LS | I0.2 | I:1/2 | RETRACTED limit switch |
| RESET_PB | not on the sheet | I:1/3 | RESET push button (my addition) |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| EXTEND_SOLENOID | Q0.0 | O:2/0 | Extend solenoid |
| RETRACT_SOLENOID | Q0.1 | O:2/1 | Retract solenoid |

**Internal bits and the timers**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | EXT_LS | Copy of the EXTENDED limit switch |
| B3:0/2 | RET_LS | Copy of the RETRACTED limit switch |
| B3:0/3 | RESET_PB | Copy of the RESET input |
| B3:0/4 | START_PULSE | True for one scan when START is pressed |
| B3:0/5 | ONS | Storage bit for the one-shot instruction |
| B3:0/6 | EXTENDING | Step bit: the extend step is running |
| B3:0/7 | RETRACTING | Step bit: the retract step is running |
| B3:0/8 | FAULT | A fault is latched |
| T4:0 | EXTEND WATCHDOG | TON, 1.0 second time base, preset 5: limits how long the extend step may take |
| T4:1 | RETRACT WATCHDOG | TON, 1.0 second time base, preset 5: limits how long the retract step may take |

![Input and output flow](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/io-map.svg)

> **Note:** My assumptions are written down here, because the task asks me to document them. The limit switches are normally open and are on when the cylinder is at that end. The cylinder can only start from home, which means the RETRACTED switch must be on. A normal stroke takes well under 5 seconds, so a stroke that takes 5 seconds or more is treated as a fault. The RESET button and the 5 second watchdog times are my own additions. They are not on the task sheet.

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: four inputs copied into internal bits, and the two step bits copied to the solenoid outputs with an interlock](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the EXTENDED limit switch `I:1/1` is examined with an XIC and copied into `B3:0/1` (EXT_LS).
- **Rung 0002:** the RETRACTED limit switch `I:1/2` is examined with an XIC and copied into `B3:0/2` (RET_LS).
- **Rung 0003:** the RESET input `I:1/3` is examined with an XIC and copied into `B3:0/3` (RESET_PB).
- **Rung 0004:** when EXTENDING (`B3:0/6`) is on and RETRACTING (`B3:0/7`) is *not* on, the extend solenoid output `O:2/0` turns on.
- **Rung 0005:** when RETRACTING (`B3:0/7`) is on and EXTENDING (`B3:0/6`) is *not* on, the retract solenoid output `O:2/1` turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** Rungs 0004 and 0005 are my second line of defence for the rule that extend and retract must never be commanded together. Each output rung contains an XIO of the *other* step bit, so even if a mistake in the logic turned on both step bits, neither solenoid output could turn on. That kind of cross-check is called an interlock.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are four: idle, extending, retracting, and fault. Here is the sequence table. A 1 means on, a 0 means off, and an X means the value does not matter.

| Condition | START | EXT LS | RET LS | EXTEND | RETRACT | FAULT |
|-----------|-------|--------|--------|--------|---------|-------|
| Idle, cylinder at home | 0 | 0 | 1 | 0 | 0 | 0 |
| START pressed at home | 1 | 0 | 1 | 1 | 0 | 0 |
| Extending | 0 | 0 | 0 | 1 | 0 | 0 |
| Fully extended | 0 | 1 | 0 | 0 | 1 | 0 |
| Retracting | 0 | 0 | 0 | 0 | 1 | 0 |
| Fully retracted, cycle complete | 0 | 0 | 1 | 0 | 0 | 0 |
| START still held after the cycle | 1 | 0 | 1 | 0 | 0 | 0 |
| Stroke takes 5 s or more | 0 | 0 | 0 | 0 | 0 | 1 |

**Reading the sequence**

- **Idle, cylinder at home:** both solenoids are off and the RETRACTED switch is on.
- **START pressed at home:** the extend solenoid turns on. START only works when the RETRACTED switch is on, so a press while the cylinder is somewhere else does nothing.
- **Extending:** the cylinder leaves home, so the RETRACTED switch goes off, and the extend solenoid stays on without the operator holding START.
- **Fully extended:** the key row. The EXTENDED switch comes on, the extend solenoid turns off, and the retract solenoid turns on in the same moment, so the two are never on together.
- **Retracting:** the cylinder comes back on its own, and the EXTENDED switch goes off on the way.
- **Fully retracted, cycle complete:** the RETRACTED switch comes on and the retract solenoid turns off. The machine is idle again.
- **START still held after the cycle:** nothing happens. A cycle needs a fresh press of START, so holding the button cannot restart the machine.
- **Stroke takes 5 s or more:** both solenoids turn off and the FAULT bit latches. It stays latched until RESET is pressed.

The same behaviour as a state diagram. Only START, the two limit switches, the timeout and RESET move the system between its states.

![State diagram: idle, extending, retracting and fault](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/state-diagram.svg)

## The Program Logic

The control logic is six rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: START pulse, retracting step, extending step, two watchdog timers and the fault latch](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/CONTROLS.png)

**Rung 0000: START pulse.** `START_PB` (`B3:0/0`) passes through a one-shot (**ONS**, `B3:0/5`) and drives `START_PULSE` (`B3:0/4`). The ONS lets power through for only one scan, at the moment the button goes from released to pressed. If I hold START down, START_PULSE is still true for exactly one scan. This rung is what stops the cylinder from restarting while START is held.

**Rung 0001: Retracting step.** This rung turns on the RETRACTING bit. Reading left to right:

- **EXTENDING (`B3:0/6`) in series with EXT_LS (`B3:0/1`)** is the way into this step: the cylinder was extending and the EXTENDED switch came on.
- **RETRACTING (`B3:0/7`)** is in parallel with that path. Once the bit is on, this contact keeps the rung true, so the step carries on by itself. This is the same seal-in idea I used in my earlier labs.
- **RET_LS (`B3:0/2`)** is an XIO in series. When the cylinder is back home, the RETRACTED switch opens the rung and the step ends.
- **FAULT (`B3:0/8`)** is an XIO in series as well, so a fault switches the step off.

**Rung 0002: Extending step.** This rung turns on the EXTENDING bit, and it has the same shape as rung 0001:

- **START_PULSE (`B3:0/4`) in series with RET_LS (`B3:0/2`)** is the way into this step: a fresh press of START, with the cylinder at home. This is how the program knows it is allowed to start.
- **EXTENDING (`B3:0/6`)** is in parallel, as the seal-in that keeps the step running after the START pulse is gone.
- **RETRACTING (`B3:0/7`)** is an XIO in series. When the retract step begins, this contact opens and the extend step ends in the same scan.
- **FAULT (`B3:0/8`)** is an XIO in series, so a fault switches the step off.

> **Note:** The order of rungs 0001 and 0002 is deliberate. The PLC solves rungs from top to bottom. When the EXTENDED switch comes on, rung 0001 runs first and still sees EXTENDING on, so it turns RETRACTING on. Then rung 0002 runs, sees RETRACTING on, and turns EXTENDING off. Both changes happen in the same scan, so there is never a scan where both step bits are on. If I swapped the two rungs, the extend step would stay on for one extra scan. It is a good habit to put the *later* step above the earlier one.

**Rungs 0003 and 0004: Watchdog timers.** `EXTENDING` feeds a **TON** named EXTEND WATCHDOG (`T4:0`), and `RETRACTING` feeds a second **TON** named RETRACT WATCHDOG (`T4:1`). Both have a time base of 1.0 second and a preset of 5. A TON counts while its rung is true and resets when its rung goes false. Because each timer is fed by one step bit, each one measures a single stroke: when the step ends normally, its timer resets. If the cylinder jams or the air supply fails and the limit switch never comes on, the timer reaches 5 seconds and its done bit comes on.

**Rung 0005: Fault latch.** The FAULT bit comes on when any one of these is true:

- **T4:0/DN**, the extend stroke took too long.
- **T4:1/DN**, the retract stroke took too long.
- **EXT_LS and RET_LS together**, because a cylinder cannot be at both ends at once, so a limit switch must be faulty or wrongly wired.
- **FAULT (`B3:0/8`)**, the seal-in, which keeps the fault on after its cause has gone.

An XIO on `RESET_PB` is in series, so pressing RESET breaks the seal-in and clears the fault. While FAULT is on, rungs 0001 and 0002 are switched off, so both solenoids are off.

> **Note:** RESET clears the fault but it does not move the cylinder. If the cylinder stopped half-way, it is not at home, so START stays ignored until the cylinder is back at the RETRACTED switch. That is on purpose: it stops the machine from starting a cycle from an unknown position.

Document, document, document. Every bit and every timer here has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs, the timers and the outputs. In this lab I act as the cylinder myself: I switch the limit switch bits on and off to follow where I imagine the cylinder is. The sequence table is my checklist.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal cycle | With RET_LS on, press START. When the cylinder is out, turn EXT_LS on and RET_LS off. When it is back, turn RET_LS on and EXT_LS off | EXTEND is on until EXT_LS comes on, then RETRACT is on until RET_LS comes on, then both are off and the cycle is complete |
| 2. START held | Hold START down through the whole cycle | The cycle runs once and does not restart, even though START is still held. A new START needs a release and a new press |
| 3. START mid-stroke | Press START again while the cylinder is extending or retracting | Nothing changes: the cycle carries on and the timers are not restarted |
| 4. Stroke timeout fault | Press START and never turn EXT_LS on | After 5 seconds both solenoids go off and FAULT latches. RESET clears the fault |
| 5. START away from home | With RET_LS off and no cycle running, press START | Nothing happens: the cylinder only starts from home |
| 6. Edge case | Turn EXT_LS and RET_LS on together | FAULT latches immediately and both solenoids stay off. RESET only works once the two switches are no longer both on |

The animation below shows the expected behaviour of the actual cylinder through the first five tests. The START and RESET buttons, the two solenoid lamps and the FAULT lamp are at the top. At the bottom, the piston moves out and back, the limit switches light up at each end, and the timeout fault and its recovery are shown. When the cylinder is back home, START works again.

![Expected behaviour of the cylinder through the test sequence](/images/blog/PLC_LAB/Level_1_Fundamentals/Pneumatic_Cylinder_ExtendRetract/test-sequence-animation.svg)

Learn → Build → Document → Improve.



---
title: "Box Counter"
category: "PLC-LAB"
summary: "A photoelectric sensor counts boxes with a CTU counter. The conveyor runs after START, stops by itself when the batch is complete, and only a RESET allows the next batch."
cover: "/images/blog/PLC-LAB/Box-Counter/cover.png"
tags: ["Practice", "Counters", "CTU", "RSLogix 500", "Learning"]
date: 2026-10-24
draft: false
---

## Introduction

Counting is one of the most common jobs a PLC does on a packing line. A sensor watches the boxes go by, the PLC keeps the tally, and when the batch is full the conveyor stops so the operator can swap the pallet. It sounds simple, but it hides one question that decides the whole design: what exactly counts as "one box"?

This was one of my own Level 1 practice problems, in the CTU counter category, written in RSLogix 500 on a MicroLogix 1100. It was my first real use of a **CTU** (count up) in a practice problem. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it.

## The Problem Statement

Boxes pass a photoelectric sensor. The program counts each box and stops the conveyor when the batch has been counted. RESET clears the count and allows a new batch.

In my own words, the program has to do five things:

- Start the conveyor when START is pressed, and keep it running after the button is released.
- Count one event per box, not one event per scan while the sensor is on.
- Stop the conveyor when the count reaches the preset.
- Let STOP stop the conveyor at any moment.
- Clear the count with RESET, and decide what START does after the batch is complete.

> **Note:** The key observation is the second point. A box is in front of the sensor for many PLC scans, and the PLC scans thousands of times per second. If every scan counted, one box would add up to a huge number. I needed something that reacts to the box *arriving*, not to the box *being there*.

That sentence decided the design. A **CTU** only counts on the transition of its rung from false to true, so one box gives exactly one count, however long it blocks the beam.

## Input and Output List

Four buttons and sensors come in, and one motor goes out, with a counter in the middle. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0 to I0.3 and Q0.0), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |
| BOX_SENSOR | I0.2 | I:1/2 | Photoelectric box sensor |
| RESET | I0.3 | B3:0/5 | RESET push button (bit only, see the note below) |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| CONVEYOR_MOTOR | Q0.0 | O:2/0 | Conveyor motor |

**Internal bits and the counter**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | MOTOR | The motor run command |
| B3:0/4 | BOX_SENSOR | Copy of the box sensor input |
| B3:0/5 | RESET | The reset command bit |
| C5:0 | COUNTER | The CTU counter (C1 on the task sheet), preset 5 |
| C5:0/DN | DONE COUNTING | Done bit, on when the count has reached the preset |

![Input and output flow](/images/blog/PLC-LAB/Box-Counter/io-map.svg)

> **Note:** The task sheet specifies a preset of 10. My program uses a preset of 5, and nothing else in the logic depends on that number, so moving to 10 is a one-field change in the counter. Also, my DIGITAL IO file has no rung for a physical RESET input yet, so `B3:0/5` is operated directly as a bit. On real hardware the RESET button would be wired to its own input and copied into this bit, exactly like START and STOP.

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Box-Counter/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Box-Counter/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR bit copied to the output](/images/blog/PLC-LAB/Box-Counter/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** the box sensor input `I:1/2` is examined with an XIC and copied into `B3:0/4` (BOX_SENSOR).
- **Rung 0003:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as normally closed, so on real hardware this XIO would become an XIC.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are three: idle, running, and batch complete. Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | START | STOP | SENSOR | RESET | COUNT | MOTOR |
|-----------|-------|------|--------|-------|-------|-------|
| Idle | 0 | 0 | 0 | 0 | 0 | 0 |
| START pressed | 1 | 0 | X | 0 | 0 | 1 |
| Each box passes the sensor | X | 0 | 0 → 1 | 0 | +1 | 1 |
| Count reaches the preset | X | 0 | 0 → 1 | 0 | 5 (done) | 0 |
| STOP pressed mid-batch | X | 1 | X | 0 | kept | 0 |
| START pressed after the batch is complete | 1 | 0 | X | 0 | 5 (done) | 0 |
| RESET pressed | X | X | X | 1 | 0 | 0 |

**Reading the sequence**

- **Idle:** nothing is pressed, the count is zero and the motor is off.
- **START pressed:** the motor comes on and stays on after START is released, because it seals itself in.
- **Each box passes the sensor:** the key row. The count goes up by exactly one, on the moment the box first blocks the beam. The motor keeps running.
- **Count reaches the preset:** the counter's done bit comes on and the motor stops without any input from the operator.
- **STOP pressed mid-batch:** the motor stops, but the count is kept. A new START carries on counting from where it was.
- **START pressed after the batch is complete:** this is the case the task asks me to define. Nothing happens. The done bit blocks the motor, so START is ignored until someone presses RESET.
- **RESET pressed:** the count goes back to zero and the done bit clears, so the next START begins a fresh batch.

The same behaviour as a state diagram. Only START, STOP, the count reaching the preset, and RESET move the system between its three states.

![State diagram: idle, running and batch complete](/images/blog/PLC-LAB/Box-Counter/state-diagram.svg)

## The Program Logic

The control logic is three rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: motor seal-in, CTU counter, and counter reset](/images/blog/PLC-LAB/Box-Counter/CONTROLS.png)

**Rung 0000: Motor.** This is the seal-in from my earlier labs, with a new way of finishing. Reading left to right:

- **START_PB (`B3:0/0`)** starts the motor.
- **MOTOR (`B3:0/2`)** is in parallel with START. Once the motor bit is on, this contact keeps the rung true after START is released.
- **STOP_PB (`B3:0/1`)** is in series with the whole branch, so STOP drops the motor at any time.
- **DONE COUNTING (`C5:0/DN`)** is examined with an XIO, in series as well. When the counter finishes, this contact opens and the motor drops out by itself.
- **MOTOR (`B3:0/2`) coil** drives the motor command.

The same XIO contact is what answers the "START after the batch" question. While the done bit is on, the rung cannot become true, so pressing START does nothing.

**Rung 0001: Counting boxes.** `BOX_SENSOR` feeds a **CTU** named COUNTER (`C5:0`) with a preset of 5. A CTU has three things worth knowing: **CU** (count up, the rung is true), **DN** (done, the accumulated value has reached the preset) and **ACC** (the accumulated count). The counter adds 1 to ACC each time its rung goes from false to true, which is exactly one count per box. A box that sits in front of the sensor for a whole second still adds only 1.

> **Note:** The counting rung is not tied to the motor. Any box that blocks the sensor is counted, even if the conveyor is stopped, and the counter keeps adding after the preset is reached. The done bit stays on in that case, so the motor stays blocked until RESET.

**Rung 0002: Reset.** `RESET` (`B3:0/5`) is examined with an XIC and drives a **RES** instruction on `C5:0`. While the rung is true, the accumulated value goes back to zero and the done bit clears. The motor can run again, and the next START begins a new batch.

Document, document, document. Every bit and the counter here have a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs, the counter and the outputs. The sequence table is my checklist, and the counter makes this one more interesting, because I also get to watch the accumulated value go up one box at a time.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal batch | Press START, then switch the sensor on and off 5 times | The motor runs, ACC goes 1, 2, 3, 4, 5, and at 5 the done bit comes on and the motor stops by itself |
| 2. START after the batch | Press START while the done bit is on | Nothing happens: the motor stays off and the count stays at 5 |
| 3. RESET | Set RESET after a completed batch | ACC returns to 0, the done bit clears, and the next START runs a new batch |
| 4. STOP mid-batch | Press STOP after 2 boxes, then START again | The motor stops and ACC stays at 2. After START, 3 more boxes complete the batch |
| 5. One count per box | Keep the sensor on for many scans | ACC goes up by 1 only, and counts again only after the sensor goes off and on |
| 6. Edge case | Switch the sensor on and off while the motor is stopped | The counter still counts, because the counting rung does not depend on the motor |

The animation below shows the expected behaviour of the actual machine through the first four tests. The START, STOP and RESET buttons, the counter display and the lamps are at the top. At the bottom, the boxes travel along the conveyor, each one counts as it first blocks the sensor beam, and the conveyor stops by itself at the preset.

![Expected behaviour of the box counter through the test sequence](/images/blog/PLC-LAB/Box-Counter/test-sequence-animation.svg)

Learn → Build → Document → Improve.


---
title: "Jog/Run Conveyor"
category: "PLC-LAB"
summary: "RUN is remembered in its own memory bit so the motor keeps going after the button is released, JOG runs the motor only while it is held, and STOP is placed in series with everything so it can cut the power at any moment."
cover: "/images/blog/PLC-LAB/JogRun-Conveyor/cover.png"
tags: ["Practice", "Logic", "Jog", "Seal-In", "RSLogix 500", "Learning"]
date: 2026-10-4
draft: false
---

## Introduction

Almost every conveyor you will ever work on has more than a start and a stop. Operators also need a way to nudge the belt a little, to clear a jam, position a part or check that something is turning. That small, momentary movement is called a **jog**, and getting it to live next to a normal **run** without the two fighting each other is a great little puzzle.

This was one of my own practice problems, built on a MicroLogix 1100 in RSLogix 500. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it. The interesting part is not the ladder itself, it is *why* the logic is split the way it is.

## The Problem Statement

A conveyor motor is controlled from three push buttons: RUN, STOP and JOG.

- **RUN** starts the motor, and the motor keeps running after RUN is released.
- **JOG** runs the motor only while the button is held. As soon as JOG is released, the motor stops.
- **STOP** stops the motor at any time.

**Requirements**

- RUN must be remembered (a seal-in / holding circuit).
- JOG must never be remembered. It is momentary only.
- STOP must have priority over both RUN and JOG.

> **Note:** The hard part is the second requirement. A normal seal-in remembers *any* command that turns the motor on. If JOG used the same memory, releasing JOG would not stop the motor.

Before opening the software, I said the problem in my own words: *RUN needs a memory, JOG must not have one.* That sentence decided the whole design. If the motor's own output were used as the memory, jog would latch too. So the memory has to be a separate bit that only RUN is allowed to set.

## Input and Output List

Three buttons come in and one motor goes out. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2.

**Inputs**

| Tag | Address | Device |
|-----|---------|--------|
| RUN_PB | I:1/0 | RUN push button |
| STOP_PB | I:1/1 | STOP push button |
| JOG_PB | I:1/2 | JOG push button |

**Outputs**

| Tag | Address | Device |
|-----|---------|--------|
| CONVEYOR_MOTOR | O:2/0 | Conveyor motor |

**Internal bits** (all in file B3)

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | RUN_PB | Copy of the RUN input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/3 | JOG_PB | Copy of the JOG input |
| B3:0/4 | RUN_MEMORY | Remembers that RUN was pressed |
| B3:0/2 | MOTOR | The motor run command |

![Input and output flow](/images/blog/PLC-LAB/JogRun-Conveyor/io-map.svg)

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/JogRun-Conveyor/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/JogRun-Conveyor/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR bit copied to the output](/images/blog/PLC-LAB/JogRun-Conveyor/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the RUN input `I:1/0` is examined with an XIC and copied into `B3:0/0` (RUN_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** the JOG input `I:1/2` is examined with an XIC and copied into `B3:0/3` (JOG_PB).
- **Rung 0003:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. See "Possible Improvements" for what changes on real hardware.

## Sequence of Operation

The motor now has three behaviours instead of two: stopped, running (remembered) and jogging (momentary). Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | RUN | STOP | JOG | RUN_MEMORY | MOTOR |
|-----------|-----|------|-----|------------|-------|
| Idle | 0 | 0 | 0 | 0 | 0 |
| RUN pressed | 1 | 0 | 0 | 1 | 1 |
| RUN released | 0 | 0 | 0 | 1 | 1 |
| STOP pressed | X | 1 | X | 0 | 0 |
| JOG pressed (stopped) | 0 | 0 | 1 | 0 | 1 |
| JOG released | 0 | 0 | 0 | 0 | 0 |
| JOG pressed while running | 0 | 0 | 1 | 0 | 1 |
| JOG released after that | 0 | 0 | 0 | 0 | 0 |
| RUN and STOP together | 1 | 1 | 0 | 0 | 0 |
| RUN and JOG together | 1 | 0 | 1 | 0 | 1 |

**Reading the sequence**

- **Idle:** nothing is pressed, the memory is empty and the motor is off.
- **RUN pressed / released:** RUN sets RUN_MEMORY, which turns the motor on. After RUN is released, the memory keeps both on.
- **STOP pressed:** STOP breaks both rungs, so the memory is cleared and the motor drops out, whatever else is pressed.
- **JOG pressed (stopped):** the motor runs, but RUN_MEMORY stays 0. When JOG is released there is nothing to hold the motor, so it stops.
- **JOG pressed while running:** the motor keeps running while JOG is held, but pressing JOG clears RUN_MEMORY. When JOG is released, the motor stops. The operator has to press RUN again. This is a design choice, and I come back to it at the end.
- **RUN and JOG together:** JOG wins. The memory is blocked, and the motor only runs while JOG is held.

The same behaviour as a state diagram:

![State diagram: stopped, running and jogging](/images/blog/PLC-LAB/JogRun-Conveyor/state-diagram.svg)

I like writing this table before the ladder, because it turns the problem into a checklist. If the ladder reproduces every row, the program is right.

## The Program Logic

The control logic is two rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: rung 0000 sets RUN_MEMORY, rung 0001 drives the MOTOR](/images/blog/PLC-LAB/JogRun-Conveyor/CONTROLS.png)

**Rung 0000: Run memory.** Reading left to right:

- **RUN_PB (`B3:0/0`)** is the normal RUN contact.
- **RUN_MEMORY (`B3:0/4`)** is in parallel with RUN. Once the memory bit is on, this contact keeps the rung true after RUN is released. This is the seal-in.
- **STOP_PB (`B3:0/1`)** is in series with the whole branch. When STOP is pressed it opens and nothing can reach the coil.
- **JOG_PB (`B3:0/3`)** is an XIO contact. While JOG is pressed it opens the rung, so RUN can never be remembered while JOG is held, and pressing JOG clears an existing memory.
- **RUN_MEMORY (`B3:0/4`) coil** is energised when the path is complete.

**Rung 0001: Motor.** Reading left to right:

- **RUN_MEMORY (`B3:0/4`)** in parallel with **JOG_PB (`B3:0/3`)**. There are two reasons the motor may run: a remembered RUN, or a live JOG. This is where the two meet.
- **STOP_PB (`B3:0/1`)** in series again, so STOP always wins here too.
- **MOTOR (`B3:0/2`) coil** drives the motor bit, which DIGITAL IO copies to the physical output.

Why two rungs? Rung 0000 answers the question "did the operator ask for a run?", and rung 0001 answers "should the motor turn?". Keeping those two questions apart is what stops JOG from being remembered. If I had put JOG and RUN into a single seal-in rung, the motor's own contact would have held the motor on after JOG was released, which is exactly what the requirement forbids.

The program scans in file order. DIGITAL IO copies the buttons into bits, CONTROLS works out the new RUN_MEMORY and MOTOR values, and the physical output follows on the next scan. A scan only takes a few milliseconds, so it is not noticeable.

Document, document, document. Every bit here has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs and the output. The sequence table is my checklist.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal run | Set RUN to 1, then back to 0 | Motor turns on and stays on |
| 2. Stop | Set STOP to 1, then back to 0 | Motor turns off and stays off until RUN is pressed again |
| 3. Jog | Set JOG to 1, then back to 0 | Motor runs while JOG is 1 and stops as soon as JOG is 0 |
| 4. Edge case | Press RUN and STOP together | Motor stays off, STOP wins |
| 5. Edge case | Press JOG while the motor is running | Motor keeps running during the jog, then stops when JOG is released |
| 6. Edge case | Press RUN while JOG is held | RUN is not remembered. Motor runs only while JOG is held |

The animation below shows the expected behaviour as the sequence runs. The buttons change, the conveyor and motor respond, and the two rungs at the bottom show every contact turning true or false in real time.

![Expected behaviour of the conveyor through the full test sequence](/images/blog/PLC-LAB/JogRun-Conveyor/test-sequence-animation.svg)

The same sequence as a timing diagram. Look at the moment the second JOG is pressed: RUN_MEMORY drops to 0 while the motor stays on.

![Timing diagram of RUN, STOP, JOG, RUN_MEMORY and MOTOR](/images/blog/PLC-LAB/JogRun-Conveyor/timing-diagram.svg)


Learn → Build → Document → Improve.



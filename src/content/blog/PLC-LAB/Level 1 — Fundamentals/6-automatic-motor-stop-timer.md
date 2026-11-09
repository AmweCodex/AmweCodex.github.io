---
title: "Automatic Motor Stop Timer"
category: "[ PLC-LAB ] Level 1 - Fundamentals"
summary: "A conveyor that runs for exactly 10 seconds after START, stops on its own, and can be stopped early. My first practice problem built around the TON timer, a one-shot and a seal-in."
cover: "/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/cover.png"
tags: ["PLC", "RSLogix 500", "MicroLogix 1100", "TON Timer", "One-Shot", "Seal-In", "Ladder Logic"]
date: 2026-10-20
draft: false
---

## Introduction

Plenty of machines have to run for a set time and then stop on their own: a mixer, a cooling fan, a conveyor that clears a batch of parts. Nobody stands there with a stopwatch. The PLC does the counting, and the operator only has to press one button. That is a small piece of logic, but it is the first time a program has to deal with *time* instead of only the state of a button.

This was one of my own Level 1 practice problems, in the TON timer category, written in RSLogix 500 on a MicroLogix 1100. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it.

## The Problem Statement

Pressing START runs a conveyor for exactly 10 seconds, then the conveyor stops automatically. A STOP button must also stop it early.

In my own words, the program has to do four things:

- Start the conveyor when START is pressed, and keep it running after the button is released.
- Stop the conveyor by itself after exactly 10 seconds, using a TON timer.
- Not let the timer restart continuously while START is held down.
- Let STOP end the cycle at any moment and reset it.

> **Note:** The part that decided the design is the third point. If I wired START straight into the timer, holding the button would keep the cycle alive, and releasing it would cut the run short. One press has to become exactly one cycle.

The task also asks for a sequence or state diagram, the ladder logic, and at least three test cases: normal operation, reset/stop, and a fault or edge case.

## Input and Output List

Two buttons come in and a motor goes out, with a timer in the middle. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0, I0.1 and Q0.0), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| CONVEYOR_MOTOR | Q0.0 | O:2/0 | Conveyor motor |

**Internal bits and the timer**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | MOTOR | The motor run command |
| B3:0/3 | ONS | Storage bit for the one-shot instruction |
| B3:0/4 | START_PULSE | True for one scan when START is pressed |
| B3:0/5 | RUN REQUEST | The remembered "a cycle is in progress" bit |
| T4:0 | TIMER DELAY | The TON timer (T1 on the task sheet), 1.0 second time base, preset 10 |

![Input and output flow](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/io-map.svg)

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR bit copied to the output](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as normally closed, so on real hardware this XIO would become an XIC.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are only two: idle and running. Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | START | STOP | RUN REQUEST | TIMER | MOTOR |
|-----------|-------|------|-------------|-------|-------|
| Idle | 0 | 0 | 0 | reset | 0 |
| START pressed | 1 | 0 | 1 | counting | 1 |
| START released | 0 | 0 | 1 | counting | 1 |
| 10 seconds elapsed | 0 | 0 | 0 | reset | 0 |
| STOP pressed (while running) | X | 1 | 0 | reset | 0 |
| START still held after 10 seconds | 1 | 0 | 0 | reset | 0 |

**Reading the sequence**

- **Idle:** nothing is pressed, the timer is reset, and the motor is off.
- **START pressed:** the run request is set, the timer starts counting and the motor comes on straight away.
- **START released:** the key row. The button is gone, but the request is remembered, so the timer keeps counting and the motor keeps running.
- **10 seconds elapsed:** the timer is done. Its done bit drops the run request, the timer resets, and the motor stops without any input from the operator.
- **STOP pressed:** it clears the run request at any moment, which resets the timer and stops the motor. The next START begins a fresh 10 seconds.
- **START still held after 10 seconds:** the last row is the edge case. The cycle is over and the motor stays off, because the START press was already used. It takes a release and a new press to start again.

The same behaviour as a state diagram. Only START, STOP, and the timer finishing move the system between its two states.

![State diagram: idle and running](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/state-diagram.svg)

## The Program Logic

The control logic is four rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: START pulse, run request seal-in, TON timer, motor from the timer enable bit](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/CONTROLS.png)

**Rung 0000: START pulse.** `START_PB` (`B3:0/0`) passes through a one-shot (**ONS**, `B3:0/3`) and drives `START_PULSE` (`B3:0/4`). The ONS lets power through for only one scan, at the moment the button goes from released to pressed. If I hold START down for a full minute, START_PULSE is still true for exactly one scan. This rung is what answers the "do not restart while START is held" requirement.

**Rung 0001: Run request.** This is the seal-in from my earlier labs, with a one-shot as its trigger. Reading left to right:

- **START_PULSE (`B3:0/4`)** starts the request.
- **RUN REQUEST (`B3:0/5`)** is in parallel with it. Once the request bit is on, this contact keeps the rung true after the pulse is gone.
- **STOP_PB (`B3:0/1`)** is in series with the branch, so STOP clears the request at any time.
- **DONE (`T4:0/DN`)** is examined with an XIO, in series as well, so the request also clears when the timer finishes.
- **RUN REQUEST (`B3:0/5`) coil** holds the remembered request.

> **Note:** The done bit is only true for a single scan. When the timer reaches 10 seconds, this rung has already been solved for that scan, so it sees DN on the following scan. It then drops the request, the timer rung goes false, and the timer resets itself, including its done bit.

**Rung 0002: The timer.** `RUN REQUEST` feeds a **TON** named TIMER DELAY (`T4:0`). The time base is 1.0 second and the preset is 10, so the timer counts for 10 seconds while its rung is true. A TON has three bits worth knowing: **EN** (enabled, the rung is true), **TT** (timer timing) and **DN** (done, the accumulated time has reached the preset). If the rung goes false at any point, the timer resets to zero. That is exactly why the timer is fed from the request and not from the button, and it is also what makes STOP reset the cycle.

**Rung 0003: The motor.** `T4:0/EN`, labelled START MOTOR, is examined with an XIC and drives the MOTOR bit. The motor follows the timer's enable bit, so it runs for exactly as long as the timer is counting. I used EN rather than DN because DN only comes on at the *end* of the delay, which is the opposite of what a "run for 10 seconds" machine needs. The MOTOR bit then travels to the physical output in the DIGITAL IO file.

Document, document, document. Every bit and the timer here have a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs, the timer and the outputs. The sequence table is my checklist, and the timer makes this one more interesting, because I also get to watch the accumulated value count up.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal run | Set START to 1, then back to 0 | The motor turns on at once, the timer counts to 10, then the motor stops by itself |
| 2. Seal-in | Release START while the timer is counting | The timer keeps counting and the motor keeps running until 10 seconds |
| 3. Early stop | Set STOP to 1 while the motor is running | The motor turns off immediately and the timer resets to 0 |
| 4. Restart | Press START again after a stop | A full 10-second run happens again, because the timer was reset |
| 5. START held | Hold START past the 10 seconds | The motor stops at 10 seconds and stays off until START is released and pressed again |
| 6. Edge case | Press START again while the motor is running | Nothing changes: the timer is not restarted and the run ends at the original 10 seconds |

The animation below shows the expected behaviour for the first three situations, with a normal run, an early STOP, and START held down. The START and STOP buttons and the conveyor motor are at the top. At the bottom, the four rungs show every contact turning true or false, and the timer block shows its accumulated time counting up to 10 seconds.

![Expected behaviour of the automatic motor stop timer through the test sequence](/images/blog/PLC-LAB/Automatic-Motor-Stop-Timer/test-sequence-animation.svg)

Learn → Build → Document → Improve.


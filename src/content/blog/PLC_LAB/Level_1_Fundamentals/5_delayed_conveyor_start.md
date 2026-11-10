---
title: "Delayed Conveyor Start"
category: "[ PLC-LAB ] Level 1 - Fundamentals"
summary: "A momentary START press is turned into a sealed-in request that feeds a 5-second TON timer. The motor starts only when the timer is done, and a READY lamp stays on for exactly as long as the request is accepted but the delay is still running."
cover: "/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/cover.png"
tags: ["Practice", "Timers", "TON", "RSLogix 500", "Learning"]
date: 2026-10-15
draft: false
---

## Introduction


A conveyor that jumps into motion the instant someone presses a button can surprise whoever is standing next to it. That is why many machines wait a few seconds after the start command, often with a lamp or horn to say "something is about to move". It is a small piece of logic with a big effect on how a machine feels to work around.

This was one of my own Level 1 practice problems, in the timer category, written in RSLogix 500 on a MicroLogix 1100. It was my first real use of a **TON** (timer on-delay) in a practice problem. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it.

## The Problem Statement

When START is pressed, a conveyor must wait 5 seconds before starting. A READY lamp should indicate that the start request has been accepted but the delay is still active. A STOP button is also provided.

In my own words, the program has to do four things:

- Accept the START press and remember it, even after the button is released.
- Wait 5 seconds, using a TON timer, before the motor starts.
- Show the READY lamp only while the request is accepted and the delay is still running.
- Let STOP cancel everything at any moment.

> **Note:** The key observation is that a push button only exists while it is pressed. A press lasts a fraction of a second, but the delay lasts five. Something has to *remember* the request for those five seconds.

That sentence decided the design. If the START button fed the timer directly, the timer would only count while the button was held down, and it would reset the moment the button was released. So the press has to be turned into a **request** that remembers itself, and the timer works from the request instead of the button.

## Input and Output List

Two buttons come in, and a motor and a lamp go out, with a timer in the middle. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0, I0.1, Q0.0 and Q0.1), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| CONVEYOR_MOTOR | Q0.0 | O:2/0 | Conveyor motor |
| READY_LAMP | Q0.1 | O:2/1 | READY lamp |

**Internal bits and the timer**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/3 | START_REQUEST | The accepted, remembered start request |
| B3:0/2 | MOTOR | The motor run command |
| B3:0/4 | LAMP | The READY lamp command |
| T4:0 | DELAY START | The TON timer (T1 on the task sheet), 1.0 second time base, preset 5 |

![Input and output flow](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/io_map.svg)

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/program_flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR and LAMP bits copied to the outputs](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.
- **Rung 0003:** when the LAMP bit `B3:0/4` is on, the physical output `O:2/1` (READY_LAMP) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as normally closed, so on real hardware this XIO would become an XIC.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are three: idle, waiting (the request is accepted and the timer is counting), and running. Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | START | STOP | REQUEST | TIMER | MOTOR | LAMP |
|-----------|-------|------|---------|-------|-------|------|
| Idle | 0 | 0 | 0 | reset | 0 | 0 |
| START pressed | 1 | 0 | 1 | counting | 0 | 1 |
| START released | 0 | 0 | 1 | counting | 0 | 1 |
| 5 seconds elapsed | 0 | 0 | 1 | done | 1 | 0 |
| STOP pressed (during the delay) | X | 1 | 0 | reset | 0 | 0 |
| STOP pressed (while running) | X | 1 | 0 | reset | 0 | 0 |

**Reading the sequence**

- **Idle:** nothing is pressed, the timer is reset, and both the motor and the lamp are off.
- **START pressed:** the request is accepted. The timer starts counting and the READY lamp comes on straight away, telling the operator "I heard you, please wait".
- **START released:** the key row. The button is gone, but the request is remembered, so the timer keeps counting and the lamp stays on.
- **5 seconds elapsed:** the timer is done. The motor starts, and the lamp goes off, because the request is no longer waiting. It is now being carried out.
- **STOP pressed:** it clears the request, which resets the timer. The motor turns off, or never turns on if the delay was still running, and the lamp goes off.

The same behaviour as a state diagram. Only STOP, and the timer finishing, move the system between its three states.

![State diagram: idle, waiting and running](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/state_diagram.svg)

## The Program Logic

The control logic is four rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: request seal-in, TON timer, motor from the done bit, lamp while waiting](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/CONTROLS.png)

**Rung 0000: Start request.** This is the seal-in from my earlier labs, with a new job. Reading left to right:

- **START_PB (`B3:0/0`)** accepts the press.
- **START_REQUEST (`B3:0/3`)** is in parallel with START. Once the request bit is on, this contact keeps the rung true after START is released.
- **STOP_PB (`B3:0/1`)** is in series with the whole branch, so STOP clears the request at any time.
- **START_REQUEST (`B3:0/3`) coil** holds the remembered request.

**Rung 0001: The delay.** `START_REQUEST` feeds a **TON** named DELAY START (`T4:0`). The time base is 1.0 second and the preset is 5, so the timer counts for 5 seconds while its rung is true. A TON has three bits worth knowing: **EN** (enabled, the rung is true), **TT** (timer timing) and **DN** (done, the accumulated time has reached the preset). If the rung goes false at any point, the timer resets to zero. That is exactly why the timer is fed from the request and not from the button.

**Rung 0002: The motor.** `T4:0/DN` is examined with an XIC and drives the MOTOR bit. The motor can only run when the timer is done, which means the full 5 seconds have passed. If STOP clears the request, the timer resets, DN drops and the motor stops with it.

**Rung 0003: The READY lamp.** `START_REQUEST` is examined with an XIC, in series with `T4:0/DN` examined with an **XIO**, and the result drives the LAMP bit. In words, the lamp is on when *the request exists* AND *the timer is NOT done*. That is precisely the definition on the task sheet: the request has been accepted, but the delay is still active. When the timer finishes, the XIO opens and the lamp goes off, in the same scan that the motor comes on, so there is never a moment with both lamp and motor on, or neither.

Document, document, document. Every bit and the timer here have a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs, the timer and the outputs. The sequence table is my checklist, and the sheet's timer makes this one more interesting, because I also get to watch the accumulated value count up.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal start | Set START to 1, then back to 0 | READY lamp turns on at once, the timer counts to 5, then the motor starts and the lamp turns off |
| 2. Seal-in | Release START while the timer is counting | The timer keeps counting and the motor still starts after 5 seconds |
| 3. Stop while running | Set STOP to 1 after the motor has started | Motor turns off, and the lamp stays off |
| 4. Stop during the delay | Set STOP to 1 while the timer is counting | The lamp turns off at once, the timer resets and the motor never starts |
| 5. Restart | Press START again after a stop | A full 5-second delay happens again, because the timer was reset |
| 6. Edge case | Press START again while the motor is running | Nothing changes: the motor keeps running and the lamp stays off |

The animation below shows the expected behaviour as the sequence runs. The buttons change, the READY lamp comes and goes, and the conveyor starts after the delay. At the bottom, the four rungs show every contact turning true or false, and the timer block shows its accumulated time counting up to 5 seconds.

![Expected behaviour of the delayed conveyor start through the full test sequence](/images/blog/PLC_LAB/Level_1_Fundamentals/Delayed_Conveyor_Start/test_sequence_animation.svg)

Learn → Build → Document → Improve.


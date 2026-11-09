---
title: "Motor with Run Indicator"
category: "[ PLC-LAB ] Level 1 - Fundamentals"
summary: "The RUN lamp is driven from the motor's own command bit, so it can never disagree with the motor: when the seal-in turns the motor on, the lamp comes on with it, and when STOP drops the motor out, the lamp goes off."
cover: "/images/blog/PLC-LAB/Motor-with-Run-Indicator/cover.png"
tags: ["Practice", "Logic", "indicators", "RSLogix 500", "Learning"]
date: 2026-10-16
draft: false
---

## Introduction

A motor that is running quietly at the end of a conveyor tells nobody anything. That is why almost every machine has a green lamp somewhere that says "this is on". It looks like a tiny detail, but it raises a real design question: *what exactly should the lamp be connected to?*

This was one of my own Level 1 practice problems, in the outputs category, written in RSLogix 500 on a MicroLogix 1100. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it. The seal-in itself is old news from my earlier lab. The new idea here is the lamp, and the reasoning behind where it is connected.

## The Problem Statement

A conveyor motor has a green RUN lamp. The lamp must indicate the commanded running state of the motor. The motor is started and stopped from a START button and a STOP button.

**Requirements**

- Build the motor seal-in circuit.
- Drive the RUN lamp from the appropriate PLC logic state.
- The lamp must turn OFF when the motor is stopped.

> **Note:** The phrase to notice is "appropriate PLC logic state". The task does not say *which* state is appropriate. Choosing it is the actual problem.

Before opening the software, I thought about the candidates. The lamp could follow the START button, but a button only exists while it is pressed, so the lamp would flash and go out the moment START is released. The lamp could follow the physical output, which works but ties the indication to a hardware address. The best candidate is the **MOTOR bit**, the PLC's own record of "the motor is commanded to run". If the lamp follows that bit, it can never disagree with the motor logic.

## Input and Output List

Two buttons come in, and a motor and a lamp go out. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0, I0.1, Q0.0 and Q0.1), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| CONVEYOR_MOTOR | Q0.0 | O:2/0 | Conveyor motor |
| RUN_LAMP | Q0.1 | O:2/1 | Green RUN lamp |

**Internal bits** (all in file B3)

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | MOTOR | The motor run command and the seal-in memory |
| B3:0/3 | LAMP | The lamp command |

![Input and output flow](/images/blog/PLC-LAB/Motor-with-Run-Indicator/io-map.svg)

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Motor-with-Run-Indicator/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Motor-with-Run-Indicator/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR and LAMP bits copied to the outputs](/images/blog/PLC-LAB/Motor-with-Run-Indicator/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.
- **Rung 0003:** when the LAMP bit `B3:0/3` is on, the physical output `O:2/1` (RUN_LAMP) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as a normally closed button, so see "Possible Improvements" for what changes on real hardware.

## Sequence of Operation

The motor has two conditions, stopped and running, and the lamp must always match. START moves the system to running, the seal-in keeps it there, and STOP breaks the circuit. Here is the sequence table. A 1 means pressed or on, a 0 means released or off, and an X means the value does not matter.

| Condition | START | STOP | MOTOR | LAMP |
|-----------|-------|------|-------|------|
| Idle | 0 | 0 | 0 | 0 |
| START pressed | 1 | 0 | 1 | 1 |
| START released | 0 | 0 | 1 | 1 |
| STOP pressed | X | 1 | 0 | 0 |
| STOP released | 0 | 0 | 0 | 0 |
| START and STOP together | 1 | 1 | 0 | 0 |

**Reading the sequence**

- **Idle:** nothing is pressed. The motor and the lamp are both off.
- **START pressed:** the motor turns on, and the lamp turns on with it.
- **START released:** the key row. START is back to 0, but the motor stays on because of the seal-in, and so the lamp stays on too. The lamp is proof that it is the motor state being shown, not the button.
- **STOP pressed:** STOP breaks the path for everything, including the seal-in, so the motor drops out and the lamp goes off.
- **STOP released:** both stay off until START is pressed again.
- **START and STOP together:** STOP wins. The motor stays off, and the lamp never lights.

The same behaviour as a state diagram. There are only two states, and the lamp simply mirrors the motor in each one.

![State diagram: stopped and running](/images/blog/PLC-LAB/Motor-with-Run-Indicator/state-diagram.svg)

## The Program Logic

The control logic is two rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: rung 0000 is the motor seal-in, rung 0001 drives the lamp from the MOTOR bit](/images/blog/PLC-LAB/Motor-with-Run-Indicator/CONTROLS.png)

**Rung 0000: Motor seal-in.** Reading left to right:

- **START_PB (`B3:0/0`)** is the normal start contact.
- **MOTOR (`B3:0/2`)** is placed in parallel with START. Once the motor bit is on, this contact is closed and provides a second path, so the rung stays true after START is released. This is the seal-in.
- **STOP_PB (`B3:0/1`)** is in series with the whole parallel branch. If it opens, nothing can reach the coil, which is why STOP always wins.
- **MOTOR (`B3:0/2`) coil** is energised when the path is complete.

**Rung 0001: Run lamp.** One contact, one coil:

- **MOTOR (`B3:0/2`)** is examined with an XIC. It is true whenever the motor is commanded to run.
- **LAMP (`B3:0/3`) coil** turns on with it.

That is the whole answer to the "appropriate logic state" question. The lamp is a copy of the motor command, so it lights exactly when the motor is commanded to run, and it goes off the moment the motor is commanded to stop.

You might wonder why I use a separate LAMP bit instead of sending the MOTOR bit straight to the lamp output. The reason is flexibility. If a later version of this machine needs the lamp to do something different, such as flash during a fault, I can change one rung and leave the motor logic untouched. The lamp and the motor are different outputs that happen to share a rule today.

There is one more detail I like. Both rungs run in the same scan, so the MOTOR bit and the LAMP bit change together. DIGITAL IO then copies them to the physical outputs on the next scan, also together. The lamp never lags behind the motor, even by one scan.

Document, document, document. Every bit here has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs and the outputs. The sequence table is my checklist, and the task sheet asks for normal operation, stop/reset and an edge case.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal start | Set START to 1 | Motor turns on and the lamp turns on |
| 2. Seal-in | Set START back to 0 | Motor and lamp stay on |
| 3. Stop | Set STOP to 1 | Motor and lamp turn off together |
| 4. Stays stopped | Set STOP back to 0 | Both stay off until START is pressed again |
| 5. Edge case | Press START and STOP together | Motor stays off, STOP wins, and the lamp never lights |
| 6. Edge case | Watch the lamp throughout all of the above | The lamp is never on while the motor is off, and never off while the motor is on |

The animation below shows the expected behaviour as the sequence runs. The buttons change, the conveyor and motor respond, the green lamp follows, and the two rungs at the bottom show each contact turning true or false in real time.

![Expected behaviour of the motor and the RUN lamp through the full test sequence](/images/blog/PLC-LAB/Motor-with-Run-Indicator/test-sequence-animation.svg)

The same sequence as a timing diagram. Notice that the MOTOR and RUN LAMP traces are identical, which is exactly what the design intends.

![Timing diagram of START, STOP, MOTOR and the RUN lamp](/images/blog/PLC-LAB/Motor-with-Run-Indicator/timing-diagram.svg)

Learn → Build → Document → Improve.
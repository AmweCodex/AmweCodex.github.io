---
title: "Tank Fill with High-Level Stop"
category: "PLC-LAB"
summary: "A START press enables a sealed-in fill command for a pump. The HIGH level switch stops the pump, STOP stops it at any time, and the LOW level switch drives an indication lamp."
cover: "/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/cover.png"
tags: ["Practice", "Sensors", "Level Switches", "RSLogix 500", "Learning"]
date: 2026-11-09
draft: false
---

## Introduction

Filling a tank looks like the easiest job a PLC can do: switch a pump on, wait, switch it off. The part that makes it a real control problem is the *waiting*. Nobody watches the level, so the program has to rely on sensors to decide when the tank is full, and it has to do the right thing when the operator presses a button at a bad moment.

This was one of my own Level 1 practice problems, in the sensors category, written in RSLogix 500 on a MicroLogix 1100. It was my first practice problem built around two level switches. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it.

## The Problem Statement

A tank is filled by a pump. Pressing START enables filling, and the pump must stop when the HIGH level switch becomes active. The LOW level switch indicates that the tank is below its lower operating point.

In my own words, the program has to do four things:

- Turn the pump on when START is pressed, and keep it running after the button is released (a maintained fill command).
- Never let the pump run while the HIGH level switch is active.
- Let STOP stop the pump at any moment.
- Use the LOW level switch as an indication, and document what happens between LOW and HIGH.

> **Note:** The last point is the interesting one. A level switch only knows about one level, so between the LOW and the HIGH switch the program is blind. I had to decide what the pump does in that gap, and write the decision down, instead of leaving it to chance.

That decision shaped the design. I treated HIGH as the only switch allowed to stop the pump, and LOW as information for the operator. The pump keeps doing whatever it was already doing in the gap between the two.

## Input and Output List

Two buttons and two level switches come in, and a pump and a lamp go out. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0 to I0.3 and Q0.0), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| START_PB | I0.0 | I:1/0 | START push button |
| STOP_PB | I0.1 | I:1/1 | STOP push button |
| LOW LEVEL SWITCH | I0.2 | B3:0/4 | LOW level switch (bit only, see the note below) |
| HIGH LEVEL SWITCH | I0.3 | B3:0/3 | HIGH level switch (bit only, see the note below) |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| PUMP_MOTOR | Q0.0 | O:2/0 | Fill pump |
| LOW LEVEL LAMP | not on the sheet | B3:0/5 | LOW level indication lamp (bit only) |

**Internal bits**

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | START_PB | Copy of the START input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | PUMP | The pump run command |
| B3:0/3 | HIGH LEVEL SWITCH | True when the tank has reached the HIGH level |
| B3:0/4 | LOW LEVEL SWITCH | True when the tank is below the lower operating point |
| B3:0/5 | LOW LEVEL LAMP | The LOW indication lamp command |

![Input and output flow](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/io-map.svg)

> **Note:** My DIGITAL IO file only has rungs for START, STOP and the pump. The two level switch bits and the lamp bit are operated directly in the emulator, so there is no input rung for the switches and no output rung for the lamp yet. On real hardware each level switch would be wired to its own input and copied into its bit, and the lamp would get its own output, exactly like START, STOP and the pump.

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: START and STOP inputs copied into internal bits, and the PUMP bit copied to the output](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0002:** when the PUMP bit `B3:0/2` is on, the physical output `O:2/0` (PUMP_MOTOR) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as normally closed, so on real hardware this XIO would become an XIC.

## Sequence of Operation

Before drawing any ladder, I asked myself how many conditions this system can be in. There are two for the pump: idle and filling. The LOW lamp is separate, because it only follows the LOW switch. Here is the sequence table. A 1 means pressed, active or on, a 0 means released, inactive or off, and an X means the value does not matter.

| Condition | START | STOP | LOW | HIGH | PUMP | LOW LAMP |
|-----------|-------|------|-----|------|------|----------|
| Tank empty, idle | 0 | 0 | 1 | 0 | 0 | 1 |
| START pressed | 1 | 0 | 1 | 0 | 1 | 1 |
| Filling, still below the LOW point | 0 | 0 | 1 | 0 | 1 | 1 |
| Filling, between LOW and HIGH | 0 | 0 | 0 | 0 | 1 | 0 |
| HIGH becomes active | 0 | 0 | 0 | 1 | 0 | 0 |
| STOP pressed while filling | X | 1 | X | 0 | 0 | X |
| START pressed with HIGH active | 1 | 0 | 0 | 1 | 0 | 0 |

**Reading the sequence**

- **Tank empty, idle:** the LOW switch is active, so the LOW lamp is on, and the pump is off, waiting for START.
- **START pressed:** the pump comes on and stays on after START is released, because it seals itself in.
- **Filling, still below the LOW point:** the pump runs and the LOW lamp stays on, because the level has not yet passed the lower operating point.
- **Filling, between LOW and HIGH:** the key row. The LOW switch clears, so the lamp goes off, and the pump keeps running. LOW is only an indication and never stops or starts the pump.
- **HIGH becomes active:** the pump drops out by itself, and it stays off after the level falls again. A new fill needs a new START.
- **STOP pressed while filling:** the pump stops at any moment, whatever the level.
- **START pressed with HIGH active:** nothing happens. The HIGH switch blocks the pump, so a full tank cannot be filled further.

> **Note:** My assumption for the gap between LOW and HIGH is simple. If the pump is already filling, it keeps filling. If it is stopped, it stays stopped until START is pressed, wherever the level is. The pump never starts by itself.

The same behaviour as a state diagram. Only START, STOP and the HIGH switch move the pump between its two states.

![State diagram: idle and filling](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/state-diagram.svg)

## The Program Logic

The control logic is two rungs. The figure below is the CONTROLS file.

![CONTROLS ladder: pump seal-in with the HIGH level stop, and the LOW level lamp](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/CONTROLS.png)

**Rung 0000: Pump.** This is the seal-in from my earlier labs, finished by a level switch instead of a timer or counter. Reading left to right:

- **START_PB (`B3:0/0`)** starts the pump.
- **PUMP (`B3:0/2`)** is in parallel with START. Once the pump bit is on, this contact keeps the rung true after START is released, which is the maintained fill command.
- **STOP_PB (`B3:0/1`)** is in series with the branch, so STOP drops the pump at any time.
- **HIGH LEVEL SWITCH (`B3:0/3`)** is examined with an XIO, in series as well. When the tank reaches the HIGH level, this contact opens and the pump drops out by itself.
- **PUMP (`B3:0/2`) coil** drives the pump command.

The same XIO contact is what makes the HIGH switch a permanent block. While HIGH is active the rung cannot become true, so START has no effect on a full tank.

> **Note:** The seal-in holds the pump on, but it also remembers nothing about the level. When HIGH stops the pump, the PUMP bit goes off, the seal-in is broken, and only a new START can fill the tank again.

**Rung 0001: LOW level lamp.** `LOW LEVEL SWITCH` (`B3:0/4`) is examined with an XIC and drives the `LOW LEVEL LAMP` bit (`B3:0/5`). The lamp is on whenever the tank is below its lower operating point, whether the pump is running or not. This rung is the only place the LOW switch is used. It is an indication, not an interlock, which is how I read "LOW as indication" in the task.

Document, document, document. Every bit here has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rungs and the outputs. The sequence table is my checklist, and this one needs a little care, because I act as the tank myself: I set the LOW and HIGH bits to follow the level I am imagining.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal fill | Start with LOW on, press START, then clear LOW, then set HIGH | The pump runs after START is released, the lamp goes off when LOW clears, the pump keeps running between LOW and HIGH, and it stops when HIGH becomes active |
| 2. START with HIGH active | Press START while HIGH is on | Nothing happens: the pump stays off |
| 3. No automatic restart | After the pump stops, clear HIGH and let the level fall through LOW | The pump stays off the whole time, and the LOW lamp comes on when the level passes LOW |
| 4. STOP mid-fill | Press STOP while the pump is filling, then press START again | The pump stops and stays off after STOP is released. START begins filling again |
| 5. Start between LOW and HIGH | With the pump off, LOW and HIGH both clear, press START | The pump starts. START works at any level below HIGH |
| 6. Edge case | Hold START while HIGH is on, then clear HIGH | The pump starts as soon as HIGH clears, because START is read as a level and not as a single pulse |

The animation below shows the expected behaviour of the actual machine through the first four tests. The START and STOP buttons, the pump lamp and the LOW lamp are at the top. At the bottom, the tank fills while the pump runs, the HIGH and LOW switches light up as the level passes them, and the outlet is opened to show the level falling.

![Expected behaviour of the tank fill through the test sequence](/images/blog/PLC-LAB/Tank-Fill-with-High-Level-Stop/test-sequence-animation.svg)

Learn → Build → Document → Improve.

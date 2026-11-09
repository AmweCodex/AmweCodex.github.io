---
title: "Motor Start/Stop with Seal-In"
category: "PLC-LAB"
summary: "The motor's own output is placed in parallel with the START button, so once the motor is ON it supplies its own power path. The STOP contact is placed in series with everything, so it can cut the power at any moment."
cover: "/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/cover.png"
tags: ["Practice", "Logic", "Seal-In", "RSLogix 500", "Learning"]
date: 2026-10-2
draft: false
---

## Introduction

The seal-in (or holding) circuit is probably the first real control pattern every PLC programmer learns. It is the digital version of the classic motor starter, with a start button, a stop button and a holding contact, and it shows up in almost every machine you will ever work on.

This was one of my own practice problems, and I wanted to understand it properly instead of just getting it to work. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic I wrote in RSLogix 500, and how I tested it. Along the way I explain the reasoning, because the reasoning is what I will reuse on the next problem.

## The Problem Statement

A conveyor motor has a START button and a STOP button. When START is pressed, the motor must run, and it must keep running after START is released. When STOP is pressed, the motor stops. If both buttons are pressed, STOP wins. No timer or counter may be used.

**Requirements**

- Create a seal-in (holding) circuit.
- The motor must remain ON after START is released.
- STOP must have priority over START.
- No timers or counters may be used.

> **Note:** "STOP has priority" means that if both buttons are pressed at the same time, the motor does not run. This is the requirement that decides where the STOP contact goes in the rung.

Before opening the software, I tried to say the problem in one sentence of my own: *the motor should remember that it was started, until someone stops it.* That word "remember" is the whole problem. A button only exists while it is pressed, so something else has to hold the motor on once the button is released. In a PLC, the simplest thing that can remember is a bit, and the motor's own output bit is the perfect candidate.

## Input and Output List

With the problem clear, the next question was what the PLC actually needs to see and control. Two buttons come in and one motor goes out.

**Inputs**

| Tag | Address | Device | Contact type |
|-----|---------|--------|--------------|
| START_PB | I:1/0 | START push button | Normally open |
| STOP_PB | I:1/1 | STOP push button | Normally closed |

**Outputs**

| Tag | Address | Device |
|-----|---------|--------|
| CONVEYOR_MOTOR | O:2/0 | Conveyor motor |

![Input and output flow](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/io-map.svg)

One thing I learned about PLC programming is that you make a program usable by giving it an architecture. A rule I now follow is to never program the inputs directly. Instead, the first part of the program copies the physical inputs into internal bits, the control logic then works only with those internal bits, and a final rung drives the physical output from the MOTOR bit.

That is why I have a DIGITAL_IO file. If a wire moves to a different terminal one day, I change one rung in one file and leave the control logic untouched. The figure below shows how the program takes the inputs from the PLC.

![DIGITAL_IO ladder: physical inputs copied into internal bits, and the MOTOR bit copied to the output](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the START input `I:1/0` is examined with an XIC and copied into the internal bit `B3:0/0` (START_PB).
- **Rung 0001:** the STOP input `I:1/1` is examined with an XIO and copied into the internal bit `B3:0/1` (STOP_PB).
- **Rung 0002:** when the internal MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.

Quick refresher on the symbols, since they matter here. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** In my program the STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggled `I:1/1` to 1 to represent STOP being pressed. See "Possible Improvements" for what changes on real hardware.

## Sequence of Operation

Before drawing any ladder, I asked myself a simple question: how many conditions can this motor be in? The answer is only two, off and running. START moves it to running, and the seal-in keeps it there until STOP breaks the circuit.

| Condition | START | STOP | MOTOR |
|-----------|-------|------|-------|
| Idle | 0 | 0 | 0 |
| START pressed | 1 | 0 | 1 |
| START released | 0 | 0 | 1 |
| STOP pressed | 0 | 1 | 0 |
| Both pressed | 1 | 1 | 0 |

**Reading the sequence**

- **Idle:** nothing is pressed and the motor is off.
- **START pressed:** START closes the path, so the motor turns on.
- **START released:** this is the key row. START is back to 0 but the motor stays on, because the motor's own contact is now supplying the path. That is the seal-in.
- **STOP pressed:** STOP breaks the path for everything, including the seal-in, so the motor drops out.
- **Both pressed:** the motor stays off. Because STOP is in series with the whole rung, START cannot override it.

The same behaviour drawn as a state diagram makes it even clearer. There are only two states, and only two things move the motor between them.

![State diagram: stopped and running](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/state-diagram.svg)

I like writing this table before the ladder, because it turns the problem into a checklist. If the ladder reproduces every row, the program is right. If it does not, I know exactly which row to look at.

## The Program Logic

Now the ladder. My program is organised as three files. MAIN calls the DIGITAL_IO file first, which maps the inputs, and then the CONTROLS file, which holds the actual logic.

![Program organisation: MAIN, DIGITAL_IO, CONTROLS](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/program-flow.svg)

The figure below is the CONTROLS file. It is one rung, and it is the entire control logic of the system.

![CONTROLS ladder: START and MOTOR in parallel, STOP in series, driving the MOTOR coil](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/CONTROLS.png)

**Rung 0: Motor seal-in.** Reading left to right:

- **START_PB (`B3:0/0`)** is the normal start contact.
- **MOTOR (`B3:0/2`)** is placed in parallel with START. Once the motor bit is on, this contact is closed and provides a second path, so the rung stays true after START is released. This is the seal-in.
- **STOP_PB (`B3:0/1`)** is in series with the whole parallel branch. If it opens, nothing can reach the coil, which is why STOP always wins.
- **MOTOR (`B3:0/2`) coil** is energised when the path is complete.

To really understand why it works, it helps to follow the PLC scan. When START is pressed, DIGITAL_IO copies it into `B3:0/0`, and CONTROLS finds a complete path through START and STOP_PB, so the MOTOR bit turns on. On the next scan, START may already be released, but the MOTOR contact in the lower branch is now true. The rung finds a path again, and the coil keeps itself on, scan after scan. The motor output follows one scan later, because the DIGITAL_IO file runs before CONTROLS. A scan only takes a few milliseconds, so you never notice it.

And why is STOP an XIC here, when it is an XIO in DIGITAL_IO? Because the XIO already turned the signal around. `B3:0/1` is on while the button is healthy and not pressed, so an ordinary XIC in the rung simply says "STOP is not being pressed, so power may flow".

Document, document, document. Every bit in this program has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I tested the program in the RSLogix 500 emulator by toggling the input bits and watching the rungs and outputs. The problem asks for at least three test cases: normal operation, stop/reset, and an edge case.

| Test | Action | Expected | Result |
|------|--------|----------|--------|
| 1. Normal start | Set START to 1 | Motor turns on | Pass |
| 2. Seal-in | Set START back to 0 | Motor stays on | Pass |
| 3. Stop | Set STOP to 1 | Motor turns off | Pass |
| 4. Stays stopped | Set STOP back to 0 | Motor stays off until START is pressed again | Pass |
| 5. Edge case | Press START and STOP together | Motor stays off, STOP wins | Pass |

The animation below shows the expected behaviour as the sequence runs. The buttons change, the conveyor and motor respond, and the rung at the bottom shows each contact turning true or false in real time.

![Expected behaviour of the conveyor motor through the full test sequence](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/test-sequence-animation.svg)

The same sequence as a timing diagram. Notice the STOP_PB trace: it is the opposite of the STOP button, because of the XIO in DIGITAL_IO.

![Timing diagram of START, STOP, STOP_PB and MOTOR](/images/blog/PLC-LAB/Motor_StartStop_with_Seal_In/timing-diagram.svg)

One behaviour worth knowing about: if START is still held down when STOP is released, the rung becomes true again and the motor restarts. That is not a bug. It is exactly what the logic says, and it is the reason real machines often add protection against unexpected restarts.

## Possible Improvements

- **Real normally closed wiring.** The task describes the STOP button as normally closed, but in the emulator I treat `I:1/1 = 1` as "pressed". On real hardware, a normally closed button sends a 1 to the input while it is released. The XIO in DIGITAL_IO rung 0001 would then need to become an XIC, so that `B3:0/1` is on while STOP is released. A bonus is that a broken STOP wire then stops the motor, which is the safe way to fail.
- **Power-cycle behaviour.** The seal-in lives in an internal bit. Depending on whether that data file is retentive, a motor that was running might start again by itself when power returns. This is worth checking, and a first-scan reset of the bit is a common fix.
- **Safety outside the program.** A real conveyor also needs a hardwired emergency stop and an overload contact in the electrical circuit, not just in the program.

## Conclusion

This exercise showed me how a single output contact in parallel with START can make a rung remember its state, and how placing STOP in series gives it priority without any extra logic. The program is small, but the pattern is the foundation for much bigger control systems.

It also reinforced the way I want to work. Define the task, define the inputs and outputs, work out the sequence of operation, and only then write the program and test it. By the time I opened RSLogix, most of the problem was already solved on paper, and the ladder was just a drawing of the answer.

Learn → Build → Document → Improve.

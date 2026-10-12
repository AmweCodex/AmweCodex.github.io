---
title: "Motor Start-Stop with Seal-In"
category: "PLC LAB"
summary: "My first Level 1 practice problem: a conveyor motor run from START and STOP pushbuttons using a seal-in (holding) circuit in RSLogix 500, with no timers or counters"
cover: "/images/blog/PLC-LAB/Motor-startstop-with-seal-in/cover.png"
tags: ["PLC", "RSLogix 500", "Seal-In", "Ladder Logic", "PLCDOJO"]
date: 2026-10-04
draft: false
---



The motor start/stop circuit with a seal-in, also called a holding or latching circuit, is the most basic building block of discrete control. Motor starters, conveyors and pumps all use some form of it, so it is worth understanding properly before moving on to larger programs.

This is the first of my own Level 1 practice problems, written in RSLogix 500 and tested in the RSLogix emulator. Programming a PLC is easier when the task is broken into smaller steps, so I used the five steps of PLC program development, and we will apply them to a conveyor motor.

## Step 1 – Define the task

What has to happen? Write it down and summarise it. This is the task sheet I worked from:

![Task sheet: Motor Start/Stop with Seal-In](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/task-sheet.png)

A conveyor motor is controlled from two pushbuttons, START and STOP. When START is pressed the motor runs, and it must keep running after START is released. When STOP is pressed the motor stops. If both buttons are pressed together, STOP wins. The task also says that no timer or counter may be used.

The sheet asks for three deliverables: a sequence diagram, the ladder logic, and at least three test cases covering normal operation, stop and an edge case. Each one appears in the steps below.

## Step 2 – Define the inputs and outputs

Based on step 1, the PLC needs to read two pushbuttons and drive one motor output.

![Input and output map](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/io-map.svg)

The task sheet uses generic addresses. On my modelled hardware, a 1762-IQ8 input module in slot 1 and a 1762-OW8 output module in slot 2, they become:

Inputs:

- START pushbutton (normally open) – `I:1/0`
- STOP pushbutton – `I:1/1`

Output:

- Conveyor motor – `O:2/0`

The program copies the physical inputs into internal bits first and does all of its logic on those bits. The motor's own state is also kept in a bit, which is what makes the seal-in possible:

- `B3:0/0` START_PB, a copy of the START input
- `B3:0/1` STOP_PB, a copy of the STOP input
- `B3:0/2` MOTOR, the motor run command and the seal-in memory

Note: in the emulator I switch the input bits directly, and this program treats `I:1/1` = 1 as "STOP pressed". Every result in this post uses that convention. I come back to normally closed wiring at the end.

## Step 3 – Develop a logical sequence of operation

This is where most of the thinking should happen. Before drawing any ladder, I decide how the machine should behave. If the logic is wrong here, it is far cheaper to fix it now than inside the program.

Here is the sequence table for the motor. Inputs and outputs are labelled 1 (ON), 0 (OFF) or X (does not matter). "Motor before" is the motor state on the previous scan, which is what the seal-in reads.

| Step | Event | START | STOP | Motor before | Motor after |
|:----:|-------|:-----:|:----:|:------------:|:-----------:|
| 1 | Idle, nothing pressed | 0 | 0 | 0 | 0 |
| 2 | START pressed | 1 | 0 | 0 | 1 |
| 3 | START released | 0 | 0 | 1 | 1 |
| 4 | STOP pressed | X | 1 | 1 | 0 |
| 5 | STOP released | 0 | 0 | 0 | 0 |
| 6 | START and STOP together | 1 | 1 | X | 0 |

**Read the sequence table:** follow the steps from top to bottom. Step 1 is the idle state, so the motor is off. In step 2 START is pressed and the motor turns on. Step 3 is the heart of a seal-in. START has been released, yet the motor stays on, because its own previous state keeps the rung true. In step 4 STOP is pressed and the motor drops out, whatever START is doing, and in step 5 it stays off after STOP is released. Step 6 shows STOP priority: START is pressed, but STOP overrides it.

The same behaviour as a state diagram:

![State diagram: stopped and running](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/state-diagram.svg)

The whole sequence reduces to one expression:

```
MOTOR = (START OR MOTOR) AND NOT STOP
```

START OR MOTOR means the motor can be started by the button, or held on by its own previous state. AND NOT STOP means that STOP breaks the path whatever else is true. The ladder in step 4 is a direct drawing of this expression.

> Fully understanding the logic before starting to program can save you time and frustration.

## Step 4 – Develop the PLC program

Utilising the steps above, we now write the program in ladder logic. I split it into three files so that each one has a single purpose.

![Program structure](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/program-structure.svg)

LAD 2 (MAIN) calls the other two files in order and then ends. LAD 3 (DIGITAL IO, subroutine U:3) maps the physical I/O to the internal bits and back. LAD 4 (CONTROLS, subroutine U:4) holds the start, stop and seal-in logic.

The reason for splitting the program is that the control logic only ever touches internal bits, so it does not care which terminal a button is wired to. If a wire moves, only DIGITAL IO changes and the logic stays untouched.

### LAD 2 – MAIN

![LAD 2 MAIN](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-main.png)

Rung 0000 uses a JSR instruction to run DIGITAL IO, rung 0001 runs CONTROLS, and rung 0002 is the END. The order matters: inputs are mapped first, and then the logic runs on those fresh values.

### LAD 3 – DIGITAL IO

![LAD 3 DIGITAL IO](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-digital-io.png)

This file is simple on purpose. Rung 0000 copies the START input `I:1/0` into the bit `B3:0/0`, and rung 0001 copies the STOP input `I:1/1` into `B3:0/1`. Rung 0002 does the reverse for the output: when the MOTOR bit `B3:0/2` is on, it turns on the physical output `O:2/0`.

### LAD 4 – CONTROLS

![LAD 4 CONTROLS](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-controls.png)

This one rung is the entire control program. Read it from left to right.

First comes `B3:0/1` STOP_PB as an XIO contact. An XIO is true while its bit is 0, so it passes power as long as STOP is not pressed. When STOP is pressed it opens and cuts the rung. Because it is in series with everything else, STOP always wins.

Next are two parallel branches. The upper branch is `B3:0/0` START_PB, an XIC contact that is true while START is held. The lower branch is `B3:0/2` MOTOR, an XIC contact on the motor's own bit. This is the **seal-in**: once the motor bit is on, this contact is true, so it keeps the rung powered after START is released.

Finally the rung drives the coil `B3:0/2` MOTOR. The MOTOR bit is both the output of the rung and one of its inputs. Once START has set it, it holds itself on, and the only thing that can break the loop is STOP opening the series contact.

Document, document, document. Every bit in this program has a symbol and a description, which saves a great deal of time when you return to it later.

## Step 5 – Test the program

Test the logic that you have developed. The sequence table from step 3 is the checklist, since it already says what each situation should produce. I tested the program in the RSLogix emulator by switching `I:1/0` and `I:1/1` on and off by hand and watching the rung change.

Below is the expected behaviour as the test sequence runs. The motor and conveyor respond to the buttons, and the rung at the bottom shows each contact turning true or false.

![Expected behaviour of the conveyor motor through the test sequence](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/test-sequence-animation.svg)

The test cases, and what each one should produce:

1. **Normal operation.** Press START and release it. The motor turns on and stays on after release.
2. **Stop.** With the motor running, press STOP and release it. The motor turns off and stays off until START is pressed again.
3. **Idle.** With nothing pressed, the motor stays off.
4. **Edge case, both pressed.** Press START and STOP at the same time. The motor stays off, because STOP has priority.
5. **Edge case, START while STOP is held.** Hold STOP and press START. The motor does not start.
6. **Edge case, START held through a stop.** Hold START, press and release STOP, and keep holding START. The motor drops out during STOP and then restarts when STOP is released, because START is still pressed. This is not a bug. The rung is simply true again as soon as both conditions are met, and it is why real machines often add protection against unexpected restarts.

![Timing diagram of START_PB, STOP_PB and MOTOR](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/timing-diagram.svg)

The timing diagram shows the same sequence as the animation. MOTOR rises with START, stays high after START falls, drops when STOP rises, and stays low while STOP is held, even if START is pressed.

One more point about scan order. MAIN calls DIGITAL IO before CONTROLS, so the physical output follows the MOTOR bit one scan later. A scan takes only a few milliseconds, so it is not noticeable here, but it is good to know exactly when each value is updated.

## Summary

These five steps will help you in your PLC program development:

1. **Define the task**
2. **Define the inputs and outputs**
3. **Develop a logical sequence of operation**
4. **Develop the PLC program**
5. **Test the program**

You will notice that the actual programming does not occur until the second last step. Here, working through the sequence table first made the ladder a direct translation instead of guesswork.

There are a few things I would improve. The task sheet specifies a normally closed STOP button, but my build treats `I:1/1` = 1 as "pressed", which suits the emulator. For real normally closed wiring I would change rung 0001 in DIGITAL IO from XIC to XIO. The STOP_PB bit would still mean "STOP pressed", the CONTROLS rung would stay the same, and a broken STOP wire would then stop the motor, which is the safe way to fail. I would also check restart behaviour after a power cycle. The seal-in is held in an internal bit, and depending on whether that data file is retentive, a motor that was running might restart by itself when power returns. And of course, a real conveyor needs a hardwired emergency stop and an overload contact in the electrical circuit, not just in the program.

If you have any questions or suggestions, please get in touch.

Thank you,
Musawandile (AmweCodex)
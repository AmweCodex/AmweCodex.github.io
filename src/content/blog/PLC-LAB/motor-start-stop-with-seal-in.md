---
title: "Motor Start-Stop with Seal-In"
category: "PLC LAB"
summary: "My first Level 1 practice problem: a conveyor motor run from START and STOP pushbuttons using a seal-in (holding) circuit in RSLogix 500, with no timers or counters"
cover: "/images/blog/PLC-LAB/Motor-startstop-with-seal-in/cover.png"
tags: ["PLC", "RSLogix 500", "Seal-In", "Ladder Logic", "PLCDOJO"]
date: 2026-10-04
draft: false
---


![Motor Start/Stop with Seal-In cover](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/cover.png)

The motor start/stop circuit with a seal-in (also called a holding or latching circuit) is the most basic building block of discrete control. Almost every motor starter, conveyor and pump in industry uses some form of it, so it is worth understanding properly before moving on to larger programs.

This is the first of my own Level 1 practice problems. I wrote the program in **RSLogix 500** and tested it in the RSLogix Emulator. To keep the work structured, I followed the five steps of PLC program development:

1. Define the task
2. Define the inputs and outputs
3. Develop a logical sequence of operation
4. Develop the PLC program
5. Test the program

Notice that actual programming only happens in step 4. Steps 1 to 3 are where the understanding is built, and they are what make step 4 straightforward.

## Project at a glance

| Item | Detail |
|---|---|
| Problem | Motor Start/Stop with Seal-In (Level 1, basic discrete control) |
| Software | RSLogix 500 (program file `1. MOTOR STARTSTOP WITH SEAL-IN.RSS`) |
| Language | Ladder logic |
| Hardware modelled | 1762-IQ8 (inputs, slot 1) and 1762-OW8 (outputs, slot 2) |
| Inputs | 2 (START pushbutton, STOP pushbutton) |
| Outputs | 1 (conveyor motor) |
| Timers / counters | None (not allowed by the task) |
| Program files | 3 (MAIN, DIGITAL IO, CONTROLS) |

---

## Step 1: Define the task

The first step is to write down, in plain language, exactly what has to happen. This is the task sheet I worked from:

![Task sheet for problem 1: Motor Start/Stop with Seal-In](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/task-sheet.png)

**In my own words:** a conveyor motor is controlled from two pushbuttons. Pressing START must start the motor, and the motor must then keep running after START is released. Pressing STOP must stop the motor.

**Requirements**

- Use a seal-in (holding) circuit so the motor remains ON after START is released.
- STOP must have priority over START. If both are pressed at the same time, the motor stays off.
- No timer or counter may be used.

**Deliverables for this problem:** a sequence/state diagram, the ladder logic, and at least three test cases covering normal operation, stop/reset, and a fault or edge case. Each of these appears in the steps below.

---

## Step 2: Define the inputs and outputs

From the task, the PLC needs to read two pushbuttons and drive one motor output.

![Input and output map](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/io-map.svg)

### Physical I/O

The task sheet gives generic addresses (I0.0, I0.1, Q0.0). In RSLogix 500 the addresses depend on the module and slot, so on my modelled hardware they become:

| Task tag | RSLogix 500 address | Type | Device / module | Description |
|---|---|---|---|---|
| START | `I:1/0` | Digital input | 1762-IQ8, slot 1, terminal 0 | START pushbutton (normally open) |
| STOP | `I:1/1` | Digital input | 1762-IQ8, slot 1, terminal 1 | STOP pushbutton |
| MOTOR | `O:2/0` | Digital output | 1762-OW8, slot 2, terminal 0 | Conveyor motor |

### Internal bits

The program copies the physical inputs into internal bits first, and does all of its logic on those bits. The motor's own state is also stored in a bit, which is what makes the seal-in possible.

| Address | Symbol | Meaning |
|---|---|---|
| `B3:0/0` | START_PB | Copy of the START input |
| `B3:0/1` | STOP_PB | Copy of the STOP input |
| `B3:0/2` | MOTOR | Motor run command (also the seal-in memory) |

> **Signal convention used in this build.** In the emulator I toggle the input bits directly, and the program treats `I:1/1 = 1` as "STOP pressed". Every test result in this post uses that convention. On real hardware with a normally closed STOP button, the logic would be adjusted; see *Things to improve* at the end.

---

## Step 3: Develop a logical sequence of operation

This is where I decide how the machine should behave, before any ladder is drawn. If the logic is wrong here, it is much cheaper to fix it now than inside the program.

### Sequence table

In the table, **1** is ON (pressed or running), **0** is OFF, and **X** means the value does not matter. "Motor (before)" is the motor state on the previous scan, which is what the seal-in reads.

| Step | Event | START | STOP | Motor (before) | Motor (after) |
|---|---|---|---|---|---|
| 1 | Idle, nothing pressed | 0 | 0 | 0 | **0** |
| 2 | START pressed | 1 | 0 | 0 | **1** |
| 3 | START released (seal-in holds) | 0 | 0 | 1 | **1** |
| 4 | STOP pressed | X | 1 | 1 | **0** |
| 5 | STOP released | 0 | 0 | 0 | **0** |
| 6 | START and STOP pressed together | 1 | 1 | X | **0** |

Reading it from top to bottom: step 3 is the heart of a seal-in. START is no longer pressed, yet the motor stays on, because the motor's own previous state keeps the rung true. Step 6 shows STOP priority: START is pressed, but STOP overrides it.

### State diagram

![State diagram: stopped and running](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/state-diagram.svg)

There are only two states. The machine moves from STOPPED to RUNNING when START is pressed and STOP is not pressed. It moves back to STOPPED whenever STOP is pressed, regardless of START.

### Logic equation

The whole sequence reduces to one Boolean expression:

```
MOTOR = (START OR MOTOR) AND NOT STOP
```

- `START OR MOTOR`: the motor can be energised by START, or kept energised by its own previous state (the seal-in).
- `AND NOT STOP`: STOP breaks the whole path, which is how STOP gets priority.

The ladder in step 4 is a direct drawing of this equation.

---

## Step 4: Develop the PLC program

### Program structure

I split the program into three files, so that each file has a single purpose:

![Program structure](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/program-structure.svg)

| File | Name | Purpose |
|---|---|---|
| LAD 2 | MAIN | Calls the other two files in order, then ends |
| LAD 3 (U:3) | DIGITAL IO | Maps physical I/O to internal bits and back |
| LAD 4 (U:4) | CONTROLS | Contains the start/stop/seal-in logic |

> **Why split it?** The control logic only ever touches internal bits, so it does not care which terminal a button is wired to. If a wire moves to a different terminal, only DIGITAL IO changes and the logic stays untouched. It also keeps the logic file short enough to read at a glance.

### LAD 2: MAIN

![LAD 2 MAIN ladder, rungs 0000 to 0002](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-main.png)

| Rung | Instruction | What it does |
|---|---|---|
| 0000 | `JSR U:3` (comment: DIGITAL IO) | Runs the I/O mapping file |
| 0001 | `JSR U:4` (comment: CONTROL LOGIC) | Runs the control logic file |
| 0002 | `END` | Ends the main program |

The order matters. Inputs are mapped first, then the logic runs on those fresh values.

### LAD 3: DIGITAL IO

![LAD 3 DIGITAL IO ladder, rungs 0000 to 0003](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-digital-io.png)

| Rung | Logic | Explanation |
|---|---|---|
| 0000 | `I:1/0` XIC → OTE `B3:0/0` (START_PB) | When the START input is on, the START_PB bit is on. |
| 0001 | `I:1/1` XIC → OTE `B3:0/1` (STOP_PB) | When the STOP input is on, the STOP_PB bit is on. |
| 0002 | `B3:0/2` XIC → OTE `O:2/0` (CONVEYOR MOTOR) | When the MOTOR bit is on, the physical motor output is on. |
| 0003 | `END` | End of the file. |

This file is simple on purpose. It copies the two inputs into bits, and it copies the MOTOR bit out to the real output.

### LAD 4: CONTROLS

![LAD 4 CONTROLS ladder: STOP_PB (XIO) in series with START_PB (XIC) in parallel with MOTOR (XIC), driving the MOTOR coil](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/ladder-controls.png)

This one rung is the entire control program. Reading it from left to right:

1. **`B3:0/1` STOP_PB (XIO).** An Examine If Open contact is true while its bit is **0**. So this contact passes power as long as STOP is *not* pressed. When STOP is pressed, it opens and cuts the rung. Because it is in series with everything else, STOP always wins.
2. **`B3:0/0` START_PB (XIC), in parallel with `B3:0/2` MOTOR (XIC).** An Examine If Closed contact is true while its bit is **1**. The two contacts are on parallel branches, so power passes if *either* is true:
   - the **upper branch** is START: it works while the button is held;
   - the **lower branch** is the **seal-in**: once the motor bit is on, this contact is true, so it keeps the rung powered after START is released.
3. **`B3:0/2` MOTOR (OTE).** The output coil. When the rung is true the MOTOR bit is set, and when it is false the bit is cleared.

The elegant part is that the MOTOR bit is both the output of the rung *and* one of its inputs. Once START has set it, it holds itself on, and the only thing that can break the loop is STOP opening the series contact.

### Instructions used

| Instruction | Name | Used for |
|---|---|---|
| XIC | Examine If Closed | True when the bit is 1: START, MOTOR (seal-in) and the I/O mapping contacts |
| XIO | Examine If Open | True when the bit is 0: the STOP_PB contact in CONTROLS |
| OTE | Output Energize | Sets the bit while the rung is true: START_PB, STOP_PB, MOTOR and the motor output |
| JSR | Jump to Subroutine | MAIN calls DIGITAL IO and CONTROLS |
| END | End | Closes each program file |

---

## Step 5: Test the program

I tested the program in the RSLogix Emulator by switching `I:1/0` and `I:1/1` on and off manually and watching the rung states change. I used the sequence table from step 3 as my checklist, since step 3 already says what each situation should produce.

Here is the expected behaviour of the whole system as the test sequence is run. The motor and conveyor respond to the buttons, and the rung at the bottom shows each contact turning true or false in real time.

![Expected behaviour of the conveyor motor through the full test sequence](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/test-sequence-animation.svg)

### Test cases

| # | Type | Action | Expected result |
|---|---|---|---|
| 1 | Normal operation | Press START, then release it | Motor turns ON when START is pressed and **stays ON** after release (seal-in). |
| 2 | Stop / reset | With the motor running, press STOP, then release it | Motor turns OFF and **stays OFF** after STOP is released. START must be pressed again to restart. |
| 3 | Idle behaviour | Power up with no button pressed | Motor stays OFF. |
| 4 | Edge case | Press START and STOP at the same time | Motor stays OFF, because the STOP contact breaks the rung. **STOP has priority.** |
| 5 | Edge case | Hold STOP, then press START | Motor does **not** start while STOP is held. |
| 6 | Edge case | Hold START, press and release STOP, keep START held | Motor turns OFF during STOP, then **restarts** when STOP is released, because START is still pressed. |

Test 6 is worth understanding. It is not a bug: the rung is simply true again as soon as both conditions are met. It is the reason a real machine often adds extra protection against unexpected restarts.

### Timing of the test sequence

![Timing diagram of START_PB, STOP_PB and MOTOR](/images/blog/PLC-LAB/Motor-startstop-with-seal-in/timing-diagram.svg)

The timing diagram shows the same sequence as the animation. MOTOR rises with START, stays high after START falls, drops when STOP rises, and remains low while STOP is held, even when START is pressed.

### A note on scan order

Because MAIN calls DIGITAL IO first and CONTROLS second, the physical output `O:2/0` follows the MOTOR bit one scan later. A scan takes only a few milliseconds, so this is not noticeable here, but it is a good habit to know exactly *when* each value is updated.

---

## Things to improve

- **Match the wiring convention to a normally closed STOP.** The task sheet specifies an NC STOP button. In my build, `I:1/1 = 1` means "pressed", which suits the emulator. For real NC wiring, I would change rung 0001 of DIGITAL IO from XIC to **XIO**. The STOP_PB bit would still mean "STOP pressed", the CONTROLS rung would stay as it is, and a broken STOP wire would then stop the motor, which is the safe failure.
- **Check restart behaviour after a power cycle.** The seal-in is held in an internal bit (`B3:0/2`). Depending on how the data file is configured (retentive or not), a motor that was running might restart by itself when power returns. This is worth checking in the emulator, and a first-scan reset of the bit is a common fix.
- **Safety is outside this exercise.** A real conveyor also needs a hardwired emergency stop, and usually an overload contact. These belong in the electrical circuit, not just in the program.

## Key takeaways

- A seal-in works because the output's own state is fed back as an input in parallel with START.
- STOP gets priority by sitting **in series** with the whole rung, while START sits on a parallel branch.
- Working through the sequence table first (step 3) made the ladder (step 4) a direct translation instead of guesswork.
- Splitting the program into MAIN, DIGITAL IO and CONTROLS keeps the logic independent of the wiring.

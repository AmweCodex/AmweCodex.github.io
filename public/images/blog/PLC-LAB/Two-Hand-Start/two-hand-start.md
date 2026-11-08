---
title: "Two-Hand Start with Stop Priority"
category: "PLC-LAB"
summary: "Both start buttons are placed in series, so the press motor can only run while two hands are on the buttons. The STOP contact is placed in series as well, so it can remove the run command at any moment, and nothing is latched."
cover: "/images/blog/PLC-LAB/Two-Hand-Start/cover.png"
tags: ["Practice", "Safety", "Interlock", "RSLogix 500", "Learning"]
date: 2026-11-03
draft: false
---

Some machines are dangerous enough that the safest place for the operator's hands is *on the controls*. A small press is the classic example. If the operator needs both hands to start it, then neither hand can be under the ram when it moves. That idea is called a **two-hand start**, and it is a beautiful example of how a simple piece of ladder logic can protect a person.

This was one of my own Level 1 practice problems, in the safety and interlock category, written in RSLogix 500 on a MicroLogix 1100. In this post I walk through how I approached it: the problem, the inputs and outputs, the sequence of operation, the ladder logic, and how I tested it. I also talk honestly about what this exercise does *not* protect against.

## The Problem Statement

The task sheet for this one describes a small press that requires two push buttons to be pressed within the same machine cycle to start a motor. For this exercise, both buttons must be ON at the same time for the motor to energise.

**Requirements**

- The motor may run only when both start buttons are active.
- STOP must immediately remove the run command.
- Do not latch the motor, unless a separate cycle latch is intentionally defined.

The sheet also asks for a sequence or state diagram, the ladder logic, and at least three test cases covering normal operation, stop/reset, and a fault or edge case.

Before touching the software I put the problem in one sentence: *the motor is only allowed to run while both hands are on the start buttons, and STOP beats everything.* The third requirement matters most. If the motor were latched, one press of both buttons could start the press and the operator's hands would be free again, which defeats the whole purpose. So there is deliberately **no memory** in this program. The moment a button is released, the motor stops.

> **Note:** "Do not latch" is the safety feature here, not a missing feature. It is what keeps the operator's hands in a safe place while the motor is running.

## Input and Output List

Three buttons come in and one motor goes out. My hardware for this lab is a MicroLogix 1100 (Series B) with a 1762-IQ8 input module in slot 1 and a 1762-OW8 relay output module in slot 2. The task sheet uses generic addresses (I0.0, I0.1, I0.2 and Q0.0), so here is how they map onto my project.

**Inputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| LEFT_PB | I0.0 | I:1/0 | LEFT start push button |
| RIGHT_PB | I0.1 | I:1/2 | RIGHT start push button |
| STOP_PB | I0.2 | I:1/1 | STOP push button |

**Outputs**

| Tag | Task sheet | My address | Device |
|-----|------------|------------|--------|
| CONVEYOR_MOTOR | Q0.0 | O:2/0 | Press motor |

**Internal bits** (all in file B3)

| Address | Symbol | Meaning |
|---------|--------|---------|
| B3:0/0 | LEFT_PB | Copy of the LEFT input |
| B3:0/3 | RIGHT_PB | Copy of the RIGHT input |
| B3:0/1 | STOP_PB | Copy of the STOP input |
| B3:0/2 | MOTOR | The motor run command |

![Input and output flow](/images/blog/PLC-LAB/Two-Hand-Start/io-map.svg)

As in my other labs, I never program the inputs directly. The program is organised into files, and the first one copies the physical inputs into internal bits. Everything after that works only with the internal bits. Here is the main file that ties it together.

![MAIN ladder: four subroutine calls, then END](/images/blog/PLC-LAB/Two-Hand-Start/MAIN.png)

MAIN calls four files in order: DIGITAL IO (`U:3`), ANALOG IO (`U:4`), ALARMS (`U:5`) and CONTROLS (`U:6`). ANALOG IO and ALARMS are empty in this exercise. They are placeholders in the program layout, so that analog signals and alarms already have a home when a project needs them.

![Program organisation: MAIN, DIGITAL_IO, ANALOG_IO, ALARMS, CONTROLS](/images/blog/PLC-LAB/Two-Hand-Start/program-flow.svg)

The DIGITAL IO file is where the physical world meets the program:

![DIGITAL IO ladder: inputs copied into internal bits, and the MOTOR bit copied to the output](/images/blog/PLC-LAB/Two-Hand-Start/DIGITAL_IO.png)

Reading the figure from top to bottom:

- **Rung 0000:** the LEFT input `I:1/0` is examined with an XIC and copied into `B3:0/0` (LEFT_PB).
- **Rung 0001:** the RIGHT input `I:1/2` is examined with an XIC and copied into `B3:0/3` (RIGHT_PB).
- **Rung 0002:** the STOP input `I:1/1` is examined with an XIO and copied into `B3:0/1` (STOP_PB).
- **Rung 0003:** when the MOTOR bit `B3:0/2` is on, the physical output `O:2/0` (CONVEYOR_MOTOR) turns on.

Quick refresher on the symbols. **XIC** (Examine If Closed) is true when its bit is 1. **XIO** (Examine If Open) is true when its bit is 0. **OTE** (Output Energize) turns its bit on while the rung is true.

> **Note:** The STOP input is read with an XIO, so `B3:0/1` is true when the STOP button is *not* pressed. In the emulator I toggle `I:1/1` to 1 to represent STOP being pressed. The task sheet describes STOP as a normally closed button, so see "Possible Improvements" for what changes on real hardware.

## Sequence of Operation

The motor has only two conditions, stopped and running, and there is nothing in between to remember. Here is the sequence table. A 1 means pressed (or on), and a 0 means released (or off).

| Condition | LEFT | RIGHT | STOP | MOTOR |
|-----------|------|-------|------|-------|
| Idle | 0 | 0 | 0 | 0 |
| LEFT only | 1 | 0 | 0 | 0 |
| RIGHT only | 0 | 1 | 0 | 0 |
| Both pressed | 1 | 1 | 0 | 1 |
| One button released | 1 | 0 | 0 | 0 |
| STOP pressed (both held) | 1 | 1 | 1 | 0 |
| STOP released (both still held) | 1 | 1 | 0 | 1 |

**Reading the sequence**

- **Idle:** nothing is pressed and the motor is off.
- **LEFT only / RIGHT only:** one hand is not enough. The motor stays off.
- **Both pressed:** this is the only row that turns the motor on.
- **One button released:** the motor stops immediately, because nothing is holding it on.
- **STOP pressed:** STOP removes the run command, even though both start buttons are still held.
- **STOP released (both still held):** the motor runs again. Because nothing is latched, the logic simply follows the buttons. This is worth remembering for the testing section.

The same behaviour as a state diagram. There are only two states, and the buttons alone decide which one we are in.

![State diagram: stopped and running](/images/blog/PLC-LAB/Two-Hand-Start/state-diagram.svg)

## The Program Logic

The control logic is a single rung. The figure below is the CONTROLS file.

![CONTROLS ladder: LEFT_PB, RIGHT_PB and STOP_PB in series driving the MOTOR coil](/images/blog/PLC-LAB/Two-Hand-Start/CONTROLS.png)

**Rung 0: Two-hand start.** Reading left to right:

- **LEFT_PB (`B3:0/0`)** must be on.
- **RIGHT_PB (`B3:0/3`)** must be on.
- **STOP_PB (`B3:0/1`)** must be on, which means STOP is *not* pressed.
- **MOTOR (`B3:0/2`) coil** is energised when all three contacts are true.

All three contacts are in **series**, and series contacts behave like an AND. Power can only reach the coil if it passes through every one of them, so the motor runs only when LEFT *and* RIGHT *and* STOP-is-healthy are all true. If any one of them opens, the path is broken and the coil drops out on the next scan.

That is why STOP always wins. It is in series with the start buttons, so it does not matter how hard anyone is pressing LEFT and RIGHT. When STOP opens, nothing can reach the coil. And because there is no contact on the MOTOR bit feeding back into the rung, the motor cannot hold itself on, which is exactly what the "do not latch" requirement asks for.

The program scans in file order. DIGITAL IO copies the buttons into bits, CONTROLS works out the new MOTOR value, and the physical output follows on the next scan. A scan only takes a few milliseconds, so it is not noticeable.

Document, document, document. Every bit here has a symbol and a description, which is what lets me open the file months from now and understand it in seconds.

## Testing and Verification

I test these programs in the RSLogix 500 emulator by toggling the input bits and watching the rung and the output. The sequence table is my checklist, and the task sheet asks for normal operation, stop/reset and an edge case.

| Test | Action | Expected |
|------|--------|----------|
| 1. Normal operation | Set LEFT and RIGHT to 1 | Motor turns on |
| 2. One hand only | Set only LEFT to 1, then only RIGHT to 1 | Motor stays off both times |
| 3. Release a button | With the motor running, set LEFT back to 0 | Motor stops immediately |
| 4. Stop | With the motor running, set STOP to 1 | Motor turns off at once |
| 5. Edge case | Set STOP back to 0 while both buttons are still held | Motor runs again, because nothing is latched |
| 6. Edge case | Hold LEFT down, wait, then press RIGHT | Motor starts, because the logic only checks that both buttons are on |

The animation below shows the expected behaviour as the sequence runs. The buttons change, the press and motor respond, and the rung at the bottom shows power flowing through the contacts, one after the other, until it reaches the coil or is stopped.

![Expected behaviour of the press through the full test sequence](/images/blog/PLC-LAB/Two-Hand-Start/test-sequence-animation.svg)

The same sequence as a timing diagram. Notice that the MOTOR trace is high only while LEFT and RIGHT are high together, and that it drops during the STOP pulse.

![Timing diagram of LEFT, RIGHT, STOP and MOTOR](/images/blog/PLC-LAB/Two-Hand-Start/timing-diagram.svg)

The last two tests are the interesting ones. They are not failures of this exercise, because the task sheet asks only that both buttons are on at the same time. But they show where a real safety function needs more than a single rung.

## Possible Improvements

- **Check that both buttons are pressed together.** A real two-hand control requires both buttons to be pressed within a short window, often about half a second. As written, one button can be held down (or tied down) and the other pressed whenever the operator likes, and the motor starts. A timer that only allows the start if the second button arrives soon after the first would fix test 6.
- **Require both buttons to be released between cycles.** Test 5 shows that releasing STOP with both buttons still held restarts the motor. A real machine usually demands that both buttons are released before the next cycle can begin (an anti-repeat check).
- **Real normally closed STOP wiring.** The task sheet describes STOP as normally closed, but in the emulator I treat `I:1/1 = 1` as "pressed". A real normally closed button sends a 1 to the input while it is released. The XIO in DIGITAL IO rung 0002 would then need to become an XIC, so that `B3:0/1` is on while STOP is released. A broken STOP wire would then stop the motor, which is the safe way to fail.
- **Safety-rated hardware.** For a real press, two-hand control is normally done with a safety-rated relay or safety controller, not an ordinary PLC program. This exercise is the logic idea, not a certified safety function.

## Conclusion

This exercise showed me that two-hand control is really just an AND of two buttons, with STOP in series for priority. What made it interesting was the *absence* of something: leaving out the latch is what makes the circuit safe. It also taught me to read a requirement like "do not latch" as a design decision with a reason behind it, and to test the edge cases that the requirements do not spell out.

The process helped as well. Define the problem, list the inputs and outputs, write the sequence of operation, and only then build the ladder and test it. By the time I was in RSLogix, the logic was already worked out on paper, and the ladder was just a drawing of the answer.

Learn → Build → Document → Improve.

---
title: "Blower HOA (Hand / Off / Auto) Control"
category: "PLC"
summary: "A three-mode blower control written in RSLogix 500 for the Process Logic chapter"
cover: "/images/blog/blower-hoa-control.png"
tags:
  [
    "HOA Control",
    "Blower Control",
    "RSLogix 500",
    "Ladder Logic",
    "Process Logic",
    "One-Shot (ONS)",
    "MOV Instruction",
    "EQU Instruction",
    "Subroutines",
    "PLC Project",
    "PLCDOJO",
  ]
date: 2026-09-21
draft: false
---

I am now on the **Process Logic** chapter of my PLC certification with PLCDOJO.com, where I learn how to build real control logic. For this exercise I wrote a PLC program that controls a **blower** in three states: **HAND**, **OFF** and **AUTO**. This is called **HOA** control, and you will find it on almost every motor, pump and fan in industry.

The program was written in **RSLogix 500**, because that is the software we use in the **PLC Fundamentals (Level I)** course.

![The three HOA modes: OFF keeps the blower off, HAND runs it now, AUTO runs it only when the auto energize bit is on](/images/blog/Blower-HOA/hoa-modes.svg)

_Three modes, one blower. The mode you pick decides when the blower is allowed to run._

## What is HOA control?

HOA is a simple selector that lets an operator choose **who is in charge** of a machine.

- **HAND** — the operator is in control. The blower runs right now, with no other conditions.
- **OFF** — nothing can start the blower. It is safely switched off.
- **AUTO** — the PLC is in control. The blower only runs when the automatic condition is true.

On a real panel this is often a three-position selector switch. In this exercise I used **three push buttons** instead, and the PLC remembers which one was pressed last.

## Project at a glance

| Item              | Detail                                              |
| ----------------- | --------------------------------------------------- |
| Course            | PLC Programming Certification, PLCDOJO.com          |
| Chapter           | Process Logic                                       |
| Software          | RSLogix 500 (from PLC Fundamentals, Level I)        |
| Program name      | BLOWER                                              |
| Input module      | 1762-IQ8OW6 in slot 1 (`I:1`)                       |
| Output module     | 1762-OW8 in slot 2 (`O:2`)                          |
| Language          | Ladder logic                                        |
| Instructions used | JSR, XIC, OTE, ONS, MOV, EQU, END                   |

## Inputs and outputs

![I/O map: three push buttons on the input module and one blower output on the output module](/images/blog/Blower-HOA/io-map.svg)

| Device        | Address | Type           | Tag name       |
| ------------- | ------- | -------------- | -------------- |
| HAND button   | `I:1/0` | Digital input  | HAND PB INPUT  |
| OFF button    | `I:1/1` | Digital input  | OFF PB INPUT   |
| AUTO button   | `I:1/2` | Digital input  | AUTO PB INPUT  |
| Blower        | `O:2/0` | Digital output | BLOWER OUTPUT  |

**Internal addresses used by the program:**

| Address  | Tag name              | What it does                                   |
| -------- | --------------------- | ---------------------------------------------- |
| `B3:0/0` | HAND_PB               | Copy of the HAND button                        |
| `B3:0/1` | OFF_PB                | Copy of the OFF button                         |
| `B3:0/2` | AUTO_PB               | Copy of the AUTO button                        |
| `B3:0/3` | BLOWER                | The "run the blower" decision                  |
| `B3:0/4` | ONE-SHOT (HAND)       | Storage bit for the HAND one-shot              |
| `B3:0/5` | ONE-SHOT (OFF)        | Storage bit for the OFF one-shot               |
| `B3:0/6` | ONE-SHOT (AUTO)       | Storage bit for the AUTO one-shot              |
| `B3:0/7` | BLOWER AUTO ENERGIZE BIT | The condition that lets AUTO run the blower |
| `N7:0`   | BLOWER_STATE          | Remembers the mode: `0` OFF, `1` HAND, `2` AUTO |

## Program structure

I split the program into three ladder files instead of putting everything in one long list of rungs.

![Program structure: MAIN jumps to DIGITAL IO first and then to CONTROLS](/images/blog/Blower-HOA/program-structure.svg)

| File    | Name       | Job                                                           |
| ------- | ---------- | ------------------------------------------------------------- |
| `LAD 2` | MAIN       | Calls the two subroutines in order, then ends                 |
| `LAD 3` | DIGITAL IO | Talks to the real world: reads the buttons, drives the blower |
| `LAD 4` | CONTROLS   | The brain: decides the mode and whether the blower runs       |

> 💡 **Why split it?** All the physical addresses live in one file (DIGITAL IO). If a button is moved to a different input terminal, I only edit that one file. The control logic never changes.

### LAD 2 - MAIN

![LAD 2 MAIN: two JSR instructions calling U:3 and U:4, then END](/images/blog/Blower-HOA/ladder-main-lad2.png)

_RSLogix 500 printout of the MAIN file._

- **Rung 0:** `JSR` (Jump To Subroutine) calls file `U:3`, which is **DIGITAL IO**.
- **Rung 1:** `JSR` calls file `U:4`, which is **CONTROLS**.
- **Rung 2:** `END` marks the end of the main program.

Each subroutine runs from start to finish and then returns to MAIN, which moves on to the next rung.

## The big idea: one number remembers the mode

The heart of this program is one integer, `N7:0`, named **BLOWER_STATE**.

- `0` means **OFF**
- `1` means **HAND**
- `2` means **AUTO**

Each button simply **writes its own number** into `N7:0`. Because one number can only hold one value, the blower can only ever be in **one mode at a time**. There is no way for HAND and AUTO to be active together, so I did not need any extra interlock logic.

![Logic flow: each button goes through a one-shot and writes 0, 1 or 2 into N7:0, then two comparisons decide if the blower coil turns on](/images/blog/Blower-HOA/hoa-logic-flow.svg)

_Read it from left to right: button, once, write, remember, decide, run._

## LAD 3 - DIGITAL IO

![LAD 3 DIGITAL IO: three buttons copied into internal bits and one rung driving the blower output](/images/blog/Blower-HOA/ladder-digital-io-lad3.png)

_RSLogix 500 printout of the DIGITAL IO file._

This file is the bridge between the real world and the program logic.

- **Rung 0:** `XIC I:1/0` (HAND PB INPUT) drives `OTE B3:0/0` (**HAND_PB**).
- **Rung 1:** `XIC I:1/1` (OFF PB INPUT) drives `OTE B3:0/1` (**OFF_PB**).
- **Rung 2:** `XIC I:1/2` (AUTO PB INPUT) drives `OTE B3:0/2` (**AUTO_PB**).
- **Rung 3:** `XIC B3:0/3` (**BLOWER**) drives `OTE O:2/0` (**BLOWER OUTPUT**). This is the only rung that switches the real blower.
- **Rung 4:** `END`.

Rungs 0 to 2 copy each physical input into an internal bit. The control logic then uses those bits instead of the raw inputs.

## LAD 4 - CONTROLS

![LAD 4 CONTROLS: three one-shot MOV rungs, then two EQU comparisons driving the BLOWER bit](/images/blog/Blower-HOA/ladder-controls-lad4.png)

_RSLogix 500 printout of the CONTROLS file._

### Rungs 0 to 2: choosing the mode

Each of the first three rungs has the same pattern: **a button, a one-shot, and a MOV**.

| Rung | Condition                    | Instruction                | Result                    |
| ---- | ---------------------------- | -------------------------- | ------------------------- |
| 0000 | `XIC B3:0/0` HAND_PB + `ONS B3:0/4` | `MOV 1` into `N7:0` | State becomes **1 (HAND)** |
| 0001 | `XIC B3:0/1` OFF_PB + `ONS B3:0/5`  | `MOV 0` into `N7:0` | State becomes **0 (OFF)**  |
| 0002 | `XIC B3:0/2` AUTO_PB + `ONS B3:0/6` | `MOV 2` into `N7:0` | State becomes **2 (AUTO)** |

**Why the ONS (one-shot)?** A normal rung is true on every scan while a button is held down. That means a held button would keep writing its number into `N7:0` over and over, and it could override another button pressed after it. With a one-shot, each press writes its number **once**, so the **last button pressed always wins**.

### Rung 3: deciding if the blower runs

Rung 3 has two branches side by side, and either one can turn on the `BLOWER` coil (`B3:0/3`):

- **Top branch:** `EQU N7:0 = 1`. If the state is **HAND**, the blower runs. No other condition is needed.
- **Bottom branch:** `EQU N7:0 = 2` in series with `XIC B3:0/7` (**BLOWER AUTO ENERGIZE BIT**). If the state is **AUTO**, the blower only runs while the auto energize bit is also on.

If the state is `0` (OFF), neither branch is true, so the blower stays off.

> 💡 **About the auto energize bit:** in these three files nothing writes to `B3:0/7`, so it works as a stand-in for the automatic request. While testing, you can turn it on and off from the data table. In a real system it would be driven by a process condition, like a level switch or a timer.

### Rung 4

`END`.

## Mode table

| Mode | `N7:0` | Auto energize bit `B3:0/7` | Blower                |
| ---- | ------ | -------------------------- | --------------------- |
| OFF  | 0      | Any                        | **OFF**               |
| HAND | 1      | Any                        | **ON**                |
| AUTO | 2      | 0 (off)                    | **OFF** (waiting)     |
| AUTO | 2      | 1 (on)                     | **ON**                |

## Expected behaviour

![Timing diagram: HAND turns the blower on, OFF turns it off, AUTO waits for the auto energize bit, then HAND runs it again](/images/blog/Blower-HOA/hoa-timing.svg)

_Follow the blower output (bottom row) and see which mode and bit made it change._

**How to test it in RSLogix 500 (in the order of the diagram):**

1. Start in **OFF**. The blower output is off.
2. Press **HAND**. `N7:0` becomes `1` and the blower turns **on**.
3. Press **OFF**. `N7:0` becomes `0` and the blower turns **off**.
4. Press **AUTO**. `N7:0` becomes `2`, but the blower stays **off** because the auto energize bit is still `0`.
5. Turn on the auto energize bit `B3:0/7`. The blower turns **on**.
6. Turn the bit off again. The blower turns **off**, even though the mode is still AUTO.
7. Press **HAND** again. The blower turns **on** straight away.

## Instructions used in this program

| Instruction | Where it is used                | What it does here                                     |
| ----------- | ------------------------------- | ----------------------------------------------------- |
| **JSR**     | MAIN, rungs 0 and 1             | Jumps to the DIGITAL IO and CONTROLS subroutines      |
| **XIC**     | DIGITAL IO and CONTROLS         | Checks a button, an internal bit or the auto bit      |
| **OTE**     | DIGITAL IO and CONTROLS         | Drives the internal bits and the blower output        |
| **ONS**     | CONTROLS, rungs 0 to 2          | Makes each button press act only once                 |
| **MOV**     | CONTROLS, rungs 0 to 2          | Writes 0, 1 or 2 into `N7:0`                          |
| **EQU**     | CONTROLS, rung 3                | Checks which mode `N7:0` is holding                   |
| **END**     | Every file                      | Marks the end of the file                             |

I explain XIC, OTE, ONS, MOV and EQU in more detail in my **PLC Instructions** post.

## Things to improve

This program does its job, but a real blower would need a few more things. These are good next steps to practise:

- **Power-up state:** Values in the data table are normally kept when the PLC loses power. That means `N7:0` could still say HAND when power returns, and the blower would start by itself. A common fix is to use the first-scan bit (`S:1/15`) to move `0` into `N7:0` at start-up. Check the instruction reference for your controller to confirm.
- **Safety devices:** Add an overload contact, an e-stop and a run-feedback signal, so the blower can be stopped when something goes wrong.
- **Real OFF button wiring:** Here the OFF button is a simple push button read with an `XIC`. On a real machine, stop buttons are usually wired normally closed, so a broken wire stops the machine. The logic would change slightly to suit that.
- **Mode lamps:** Add one indicator lamp for each mode so the operator can see HAND, OFF or AUTO at a glance.
- **A real AUTO condition:** Replace the auto energize bit with a real signal, such as a level switch or a timer.

## Key takeaways

- **HOA** gives the operator a clear choice: Hand, Off or Auto.
- Storing the mode in **one integer** (`N7:0`) means only one mode can be active at a time.
- **ONS** turns a button press into a single event, so the **last press wins**.
- **MOV** writes a value and **EQU** checks it. Together they work like a small selector.
- Splitting the program with **JSR** keeps physical I/O separate from control logic, which makes changes easier.
- In AUTO, the blower needs **both** the mode and the automatic condition to run.

## Build it yourself

1. Create a new RSLogix 500 project named **BLOWER**, and set up the I/O: a **1762-IQ8OW6** in slot 1 and a **1762-OW8** in slot 2.
2. Create two new ladder files, `LAD 3` named **DIGITAL IO** and `LAD 4` named **CONTROLS**.
3. In `LAD 2` (MAIN), add two `JSR` rungs pointing to `U:3` and `U:4`, followed by an `END`.
4. In DIGITAL IO, add the three input-to-bit rungs and the blower output rung.
5. In CONTROLS, add the three `ONS` + `MOV` rungs and the two-branch `EQU` rung.
6. Give every address a symbol name so the program is easy to read.
7. Download the program to the PLC (or use the emulator), then follow the test steps above.

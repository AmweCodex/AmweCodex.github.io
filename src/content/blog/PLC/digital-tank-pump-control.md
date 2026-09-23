---
title: "Digital Tank Pump Control"
category: "PLC"
summary: "A level-based fill/drain tank control written in RSLogix 500 for the Process Logic chapter, using two on-delay timers and a seal-in circuit to switch between FILL and DRAIN mode"
cover: "/images/blog/digital-tank-pump-control.png"
tags:
  [
    "Digital Tank",
    "Pump Control",
    "RSLogix 500",
    "Ladder Logic",
    "Process Logic",
    "TON Instruction",
    "Seal-In Circuit",
    "Level Control",
    "PLC Project",
    "PLCDOJO",
  ]
date: 2026-09-22
draft: false
---

Still on the **Process Logic** chapter of my PLC certification with PLCDOJO.com, this exercise moves from a simple three-position selector (HOA) to something closer to a real process: a **tank that fills and drains itself** based on level switches. The program controls a **pump** and a **valve** using four level switches and two on-delay timers.

The program was written in **RSLogix 500**, the software used throughout the **PLC Fundamentals (Level I)** course.

![Tank with L, LL, H and HH level switches, and the pump/valve that respond to them](/images/blog/Digital-Tank-Pump-Control/tank-modes.svg)

_Four switches watch the water level. Two timers decide when the pump and valve should respond._

## What is level-based fill/drain control?

Instead of an operator choosing a mode, the **level in the tank** decides what the PLC does.

- **L (Low)** — level has dropped low enough that filling should start.
- **LL (Low-Low)** — the tank is nearly empty; a backup/alarm reference point.
- **H (High)** — level has risen high enough that filling should stop.
- **HH (High-High)** — the tank is nearly full; a backup/alarm reference point.

Rather than switching the pump on and off the instant a switch changes, the program waits **10 seconds** on each transition before it commits to a decision. That wait comes from two **TON (Timer On Delay)** instructions, and it is what stops the pump chattering on and off if the water is sloshing right at the switch point.

## Project at a glance

| Item              | Detail                                               |
| ----------------- | ----------------------------------------------------- |
| Course            | PLC Programming Certification, PLCDOJO.com             |
| Chapter           | Process Logic                                          |
| Software          | RSLogix 500 (from PLC Fundamentals, Level I)            |
| Processor         | MicroLogix 1100, Series B                               |
| Program name      | Digital-Tank-Pump-Control                             |
| Input module      | 1762-IQ8 in slot 1 (`I:1`)                              |
| Output module     | 1762-OW8 in slot 2 (`O:2`)                              |
| Language          | Ladder logic                                            |
| Instructions used | JSR, XIC, XIO, OTE, TON, END                             |

## Inputs and outputs

![I/O map: four level switches on the input module and a pump plus valve on the output module](/images/blog/Digital-Tank-Pump-Control/io-map.svg)

| Device      | Address | Type           | Tag name         |
| ----------- | ------- | -------------- | ----------------- |
| L switch    | `I:1/0` | Digital input  | L INPUT SWITCH     |
| LL switch   | `I:1/1` | Digital input  | LL INPUT SWITCH    |
| H switch    | `I:1/2` | Digital input  | H INPUT SWITCH      |
| HH switch   | `I:1/3` | Digital input  | HH INPUT SWITCH     |
| Pump        | `O:2/0` | Digital output | PUMP                |
| Valve       | `O:2/1` | Digital output | VALVE               |

**Internal addresses used by the program:**

| Address  | Tag name    | What it does                                     |
| -------- | ----------- | ------------------------------------------------- |
| `B3:0/0` | L_SWITCH    | Copy of the L button/switch                         |
| `B3:0/1` | LL_SWITCH   | Copy of the LL switch                               |
| `B3:0/2` | H_SWITCH    | Copy of the H switch                                |
| `B3:0/3` | HH_SWITCH   | Copy of the HH switch                               |
| `B3:0/4` | PUMP        | Internal "run the pump" decision                     |
| `B3:0/5` | VALVE       | Internal "open the valve" decision                   |
| `B3:0/6` | FILL_MODE   | 1 = FILL MODE, 0 = DRAIN MODE                        |
| `T4:0`   | FILL MODE DELAY TIMER | 10 s on-delay from the L switch            |
| `T4:1`   | DRAIN MODE DELAY TIMER | 10 s on-delay from the H switch           |

## Program structure

Same three-file pattern as my earlier HOA project: keep the physical wiring in one file, keep the decision-making in another.

![Program structure: MAIN calls DIGITAL IO first, then CONTROLS](/images/blog/Digital-Tank-Pump-Control/program-structure.svg)

| File    | Name       | Job                                                             |
| ------- | ---------- | ----------------------------------------------------------------- |
| `LAD 2` | MAIN       | Calls the two subroutines in order, then ends                      |
| `LAD 3` | DIGITAL IO | Talks to the real world: reads the switches, drives pump/valve      |
| `LAD 4` | CONTROLS   | The brain: runs the timers and decides FILL_MODE                    |

> 💡 **Why split it?** If the tank ever gets rewired — say the HH switch moves to a different input — only DIGITAL IO changes. CONTROLS, which holds the actual fill/drain decision, is untouched.

### LAD 2 - MAIN

![LAD 2 MAIN: two JSR instructions calling U:3 and U:4, then END](/images/blog/Digital-Tank-Pump-Control/digital-tank-main-routine.png)

_RSLogix 500 printout of the MAIN file._

- **Rung 0:** `JSR` (Jump To Subroutine) calls file `U:3`, which is **DIGITAL IO**.
- **Rung 1:** `JSR` calls file `U:4`, which is **CONTROLS**.
- **Rung 2:** `END` marks the end of the main program.

## The big idea: one bit holds itself on, until told to let go

The heart of this program is a single bit, `B3:0/6`, named **FILL_MODE**.

- `FILL_MODE = 1` → the tank is **filling**. The pump runs, the valve stays shut.
- `FILL_MODE = 0` → the tank is **draining**. The pump stays off, the valve is open.

`FILL_MODE` is driven by an ordinary `OTE`, not `OTL`/`OTU` — but it still behaves like a latch, because the rung includes a **seal-in contact**: the coil's own bit, wired back in as one of the conditions that keeps it true. That's a very common PLC pattern for holding a bit on across scans without a dedicated latch instruction.

![Logic flow: L switch sets FILL_MODE through a 10-second timer, FILL_MODE seals itself in, and H switch breaks the seal through its own 10-second timer](/images/blog/Digital-Tank-Pump-Control/logic-flow.svg)

_Read it left to right: switch, delay, set or break the seal, drive the outputs._

## LAD 3 - DIGITAL IO

![LAD 3 DIGITAL IO: four switches copied into internal bits and two rungs driving the pump and valve](/images/blog/Digital-Tank-Pump-Control/digital-tank-digital-io.png)

_RSLogix 500 printout of the DIGITAL IO file._

This file is the bridge between the real switches/actuators and the program logic.

- **Rung 0:** `XIC I:1/0` (L INPUT SWITCH) drives `OTE B3:0/0` (**L_SWITCH**).
- **Rung 1:** `XIC I:1/1` (LL INPUT SWITCH) drives `OTE B3:0/1` (**LL_SWITCH**).
- **Rung 2:** `XIC I:1/2` (H INPUT SWITCH) drives `OTE B3:0/2` (**H_SWITCH**).
- **Rung 3:** `XIC I:1/3` (HH INPUT SWITCH) drives `OTE B3:0/3` (**HH_SWITCH**).
- **Rung 4:** `XIC B3:0/4` (**PUMP**) drives `OTE O:2/0` (**PUMP**), the real pump.
- **Rung 5:** `XIC B3:0/5` (**VALVE**) drives `OTE O:2/1` (**VALVE**), the real valve.
- **Rung 6:** `END`.

Rungs 0–3 copy each physical switch into an internal bit, and rungs 4–5 copy the internal decision bits out to the real outputs. CONTROLS never touches a physical address directly.

## LAD 4 - CONTROLS

![LAD 4 CONTROLS: two TON timer rungs, a seal-in rung for FILL_MODE, then the pump and valve output rungs](/images/blog/Digital-Tank-Pump-Control/digital-tank-controls.png)

_RSLogix 500 printout of the CONTROLS file._

### Rungs 0 and 1: two independent timers

| Rung | Condition            | Instruction                        | Result                          |
| ---- | --------------------- | ----------------------------------- | --------------------------------- |
| 0000 | `XIC B3:0/0` L_SWITCH  | `TON T4:0`, base 1.0 s, preset 10   | Starts timing while L is active   |
| 0001 | `XIC B3:0/2` H_SWITCH  | `TON T4:1`, base 1.0 s, preset 10   | Starts timing while H is active   |

Both timers reset the moment their switch goes false, since a standard `TON` only accumulates while its rung stays true. That is exactly what gives the delay: L or H has to stay active for the full 10 seconds before anything downstream reacts.

### Rung 2: a seal-in circuit sets and breaks FILL_MODE

One rung, one `OTE B3:0/6` coil, and two parallel branches feeding it:

- **Top branch (the trigger):** `XIC T4:0/DN` — the fill timer done. The moment L has been active for 10 seconds, this branch goes true and energizes `FILL_MODE`.
- **Bottom branch (the seal-in):** `XIC B3:0/6` (FILL_MODE's own contact) in series with `XIO T4:1/DN` (drain timer, examine-if-open). Once `FILL_MODE` is on, this branch keeps feeding its own coil — even after `T4:0/DN` drops out when the L switch lets go. The seal only breaks when `T4:1/DN` goes true, i.e. once H has been active for 10 seconds.

So `FILL_MODE` turns on the instant the fill timer finishes, holds itself on through its own contact, and only lets go once the drain timer finishes. That's the hysteresis, built entirely from a normal `OTE` and a feedback contact — no `OTL`/`OTU` needed.

### Rungs 3 and 4: pump fills, valve drains

- **Rung 3:** `XIC B3:0/6` (FILL_MODE) drives `OTE B3:0/4` (**PUMP**) — the pump runs only while FILL_MODE is on.
- **Rung 4:** `XIO B3:0/6` (FILL_MODE, examine-if-open) drives `OTE B3:0/5` (**VALVE**) — the valve is open whenever FILL_MODE is **off**.

The two outputs are mutually exclusive: the pump pushes water in during FILL, and the valve lets it out during DRAIN. They're never both on, and never both off.

### Rung 5

`END`.

## Mode table

| FILL_MODE (`B3:0/6`) | Meaning | Pump | Valve |
| --------------------- | -------- | ---- | ----- |
| 1                       | FILL     | ON   | OFF   |
| 0                       | DRAIN    | OFF  | ON    |

## Expected behaviour

![Timing diagram: L switch active for 10 seconds seals FILL_MODE on and starts the pump; H switch active for 10 seconds breaks the seal, stops the pump and opens the valve](/images/blog/Digital-Tank-Pump-Control/timing-diagram.svg)

_Follow FILL_MODE (third row) and see which timer, and how long, made it change._

**How to test it in RSLogix 500 (in the order of the diagram):**

1. Start with the tank in DRAIN (`FILL_MODE = 0`): **PUMP** off, **VALVE** open.
2. Force the **L switch** on. `T4:0` starts timing.
3. Hold it for 10 seconds. `T4:0/DN` goes true, `FILL_MODE` seals **ON**, **PUMP** turns on and **VALVE** closes.
4. Turn the L switch off. `T4:0` resets, but `FILL_MODE` stays **ON** — the seal-in contact is holding it, not the timer.
5. Force the **H switch** on. `T4:1` starts timing.
6. Hold it for 10 seconds. `T4:1/DN` goes true, breaking the seal: `FILL_MODE` drops to **OFF**, **PUMP** turns off and **VALVE** opens again.
7. Bounce the L switch on and off quickly, never holding it a full 10 seconds. `FILL_MODE` never changes — the debounce keeps a sloshing level from triggering a false fill.

## Instructions used in this program

| Instruction | Where it is used          | What it does here                                    |
| ----------- | -------------------------- | ------------------------------------------------------ |
| **JSR**     | MAIN, rungs 0 and 1         | Jumps to the DIGITAL IO and CONTROLS subroutines         |
| **XIC**     | DIGITAL IO and CONTROLS     | Checks a switch, a timer's DN bit, or the FILL_MODE seal-in |
| **XIO**     | CONTROLS, rungs 2 and 4     | Checks a bit is OFF — breaks the seal, and drives the valve when FILL_MODE is off |
| **OTE**     | DIGITAL IO and CONTROLS     | Drives the internal switch bits, FILL_MODE, pump and valve |
| **TON**     | CONTROLS, rungs 0 and 1     | Times how long L or H has stayed active                    |
| **END**     | Every file                  | Marks the end of the file                                    |

I explain XIC, XIO, OTE and TON in more detail in my **PLC Instructions** and **PLC Timers** posts.

## Things to improve

This program handles the basic fill/drain cycle, but a real tank system would need more:

- **Power-up state:** because `FILL_MODE` is a plain `OTE` (not `OTL`), it resets to 0 on every power-up — the tank always starts in DRAIN, valve open, pump off, regardless of the actual water level. That's a safe default, but it means a genuinely full tank could sit there draining unnecessarily until the next real fill cycle. Worth re-checking the actual level with LL/HH at first scan (`S:1/15`) before assuming DRAIN is correct.
- **LL and HH are unused:** both switches are wired and copied into bits, but nothing in CONTROLS reads them yet. They're the natural place to add a hard stop or an alarm if the tank ever goes below LL or above HH — a genuine over/under-level fault, separate from the normal L/H fill-drain cycle.
- **Safety devices:** an overload contact on the pump motor and a dry-run/no-flow check would stop the pump from running against a fault.
- **Timer preset as a constant:** 10 seconds is hardcoded into both timers. Moving it to a shared integer would make it a single tunable value instead of two separate presets to keep in sync.
- **Mode lamp:** one indicator for FILL_MODE would let an operator see at a glance whether the tank is currently filling or draining.

## Key takeaways

- Level control doesn't need an operator switch — the **switches themselves** decide the mode.
- A plain `TON` used as a **debounce timer** stops a bouncing switch from causing false transitions.
- A **seal-in contact** — wiring a coil's own bit back into its rung — lets a plain `OTE` hold itself on, no `OTL`/`OTU` required. The trade-off: unlike a latch, it resets to 0 on power-up.
- `XIO` (examine-if-open) is what lets one bit drive two outputs in **opposite** directions: pump on `XIC`, valve on `XIO`, off the same address.
- Two timers, one seal-in bit: **T4:0 sets it, T4:1 breaks it** — that's the whole decision.
- Keeping **DIGITAL IO** and **CONTROLS** separate means the fill/drain logic never has to know or care which physical terminal a switch is wired to.

## Build it yourself

1. Create a new RSLogix 500 project named **Digital-Tank-Pump-Control**, with a **1762-IQ8** in slot 1 and a **1762-OW8** in slot 2.
2. Create two new ladder files, `LAD 3` named **DIGITAL IO** and `LAD 4` named **CONTROLS**.
3. In `LAD 2` (MAIN), add two `JSR` rungs pointing to `U:3` and `U:4`, followed by an `END`.
4. In DIGITAL IO, add the four switch-to-bit rungs and the pump/valve output rungs.
5. In CONTROLS, add the two `TON` timer rungs (base 1.0 s, preset 10). Then build the FILL_MODE rung: `XIC T4:0/DN` in parallel with (`XIC B3:0/6` in series with `XIO T4:1/DN`), all feeding one `OTE B3:0/6`. Then add the pump rung (`XIC B3:0/6`) and the valve rung (`XIO B3:0/6`).
6. Give every address a symbol name so the program is easy to read.
7. Download the program to the PLC (or use the emulator), then follow the test steps above.

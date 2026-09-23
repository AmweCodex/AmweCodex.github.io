---
title: "Analog Tank - Pump Control"
category: "PLC"
summary: "The analog version of my tank control: one scaled 0–100% level reading, compared against 20% and 80% trip points, driving the same seal-in FILL/DRAIN logic"
cover: "/images/blog/analog-tank-pump-control.png"
tags: ["Analog Tank", "Pump Control", "RSLogix 500", "Ladder Logic", "Process Logic", "SCP Instruction", "LES/GRT Comparison", "Seal-In Circuit", "Analog Input", "PLCDOJO"]
date: 2026-09-23
draft: false
---

This is the analog follow-up to my **Digital Tank - Pump Control** exercise. Same job — fill the tank, then drain it, with a debounce so the pump and valve don't chatter — but instead of four discrete level switches (L, LL, H, HH), the level now comes from a single **analog sensor**, scaled into a 0–100% value. The fill/drain decision then runs off two threshold checks instead of two switches.

The program was written in **RSLogix 500**, the software used throughout the **PLC Fundamentals (Level I)** course.

![Tank with an analog level reading, checked against 20% and 80% trip points](/images/blog/Analog-Tank-Pump-Control/tank-modes.svg)

_One number, LEVEL, decides everything. Below 20% for 10 seconds, fill. Above 80% for 10 seconds, drain._

## From switches to a scaled number

In the digital version, the PLC only ever knew "above" or "below" a switch — four fixed points, wired as four separate digital inputs. Here, one analog input gives a continuous reading across the whole range of the tank, and the program does the thresholding itself in software:

- **LEVEL < 20%** — the tank is low enough that filling should start.
- **LEVEL > 80%** — the tank is high enough that filling should stop and draining should begin.

Everything between 20% and 80% is a dead band: the mode doesn't change, whichever mode it's already in continues. That dead band is what stops the pump and valve from cycling constantly around some single setpoint.

## Project at a glance

| Item              | Detail                                               |
| ----------------- | ----------------------------------------------------- |
| Course            | PLC Programming Certification, PLCDOJO.com             |
| Chapter           | Process Logic                                          |
| Software          | RSLogix 500 (from PLC Fundamentals, Level I)            |
| Program name      | ANALOG TANK - PUMP CONTROL                              |
| Analog input       | Level sensor at `I:3.0`, scaled to `N7:0` (LEVEL)       |
| Output module     | 1762-OW8 (`O:2`)                                        |
| Language          | Ladder logic                                            |
| Instructions used | JSR, SCP, LES, GRT, TON, XIC, XIO, OTE, END              |

## Inputs and outputs

![I/O map: the analog level sensor scaled by an SCP block into LEVEL, and pump/valve outputs](/images/blog/Analog-Tank-Pump-Control/io-map.svg)

| Device        | Address  | Type            | Tag name |
| ------------- | -------- | ---------------- | -------- |
| Level sensor  | `I:3.0`  | Analog input      | —        |
| Pump          | `O:2/0`  | Digital output    | PUMP     |
| Valve         | `O:2/1`  | Digital output    | VALVE    |

**Internal addresses used by the program:**

| Address  | Tag name    | What it does                                     |
| -------- | ----------- | ------------------------------------------------- |
| `N7:0`   | LEVEL       | Tank level, scaled to 0–100%                        |
| `B3:0/4` | PUMP        | Internal "run the pump" decision                     |
| `B3:0/5` | VALVE       | Internal "open the valve" decision                   |
| `B3:0/6` | FILL_MODE   | 1 = FILL MODE, 0 = DRAIN MODE                        |
| `T4:0`   | FILL MODE DELAY TIMER | 10 s on-delay once LEVEL is under 20%      |
| `T4:1`   | DRAIN MODE DELAY TIMER | 10 s on-delay once LEVEL is over 80%      |

## Program structure

Same three-file pattern as the digital version.

![Program structure: MAIN calls IO first, then CONTROLS](/images/blog/Analog-Tank-Pump-Control/program-structure.svg)

| File    | Name       | Job                                                               |
| ------- | ---------- | -------------------------------------------------------------------|
| `LAD 2` | MAIN       | Calls the two subroutines in order, then ends                       |
| `LAD 3` | IO         | Drives the pump/valve outputs, and scales the sensor into LEVEL      |
| `LAD 4` | CONTROLS   | Compares LEVEL to the trip points and decides FILL_MODE               |

> 💡 **Why split it?** If the sensor is ever recalibrated or the input range changes, only the `SCP` rung in IO needs touching. CONTROLS only ever talks to `N7:0` (LEVEL) as a clean 0–100% number, so it never has to know about raw counts, mA, or volts.

### LAD 2 - MAIN

![LAD 2 MAIN: two JSR instructions calling U:3 and U:4, then END](/images/blog/Analog-Tank-Pump-Control/ladder-main-lad2.png)

_RSLogix 500 printout of the MAIN file._

- **Rung 0:** `JSR` (Jump To Subroutine) calls file `U:3`, which is **IO**.
- **Rung 1:** `JSR` calls file `U:4`, which is **CONTROLS**.
- **Rung 2:** `END` marks the end of the main program.

## The big idea: one seal-in circuit, now fed by a comparison instead of a switch

The heart of this program is still the single bit `B3:0/6`, **FILL_MODE**, sealed in on itself exactly like the digital version — the only thing that changed is what *sets* and *breaks* the seal.

- `FILL_MODE = 1` → the tank is **filling**. The pump runs, the valve stays shut.
- `FILL_MODE = 0` → the tank is **draining**. The pump stays off, the valve is open.

Instead of a physical switch closing, the set and break conditions are now **comparison instructions** reading `N7:0` (LEVEL) against fixed values.

![Logic flow: LEVEL less than 20 percent through a 10-second timer sets FILL_MODE and seals it in; LEVEL greater than 80 percent through a 10-second timer breaks the seal](/images/blog/Analog-Tank-Pump-Control/logic-flow.svg)

_Read it left to right: comparison, delay, set or break the seal, drive the outputs._

## LAD 3 - IO

![LAD 3 IO: pump and valve output rungs, then an SCP block scaling the analog input into LEVEL](/images/blog/Analog-Tank-Pump-Control/ladder-io-lad3.png)

_RSLogix 500 printout of the IO file._

- **Rung 0:** `XIC B3:0/4` (**PUMP**) drives `OTE O:2/0`, the real pump.
- **Rung 1:** `XIC B3:0/5` (**VALVE**) drives `OTE O:2/1`, the real valve.
- **Rung 2:** an unconditional `SCP` (**Scale w/Parameters**) block: `Input = I:3.0`, `Input Min = 0`, `Input Max = 16383`, `Scaled Min = 0`, `Scaled Max = 100`, `Output = N7:0` (LEVEL). This rung has no input contact — it runs on every scan, continuously converting the sensor's raw 0–16383 count into a 0–100% value.
- **Rung 3:** `END`.

The raw range (0–16383) is the module's full-scale analog count; `SCP` does the linear conversion in one instruction instead of manual multiply/divide math.

## LAD 4 - CONTROLS

![LAD 4 CONTROLS: LES and GRT comparisons feeding two TON timers, a seal-in rung for FILL_MODE, then the pump and valve output rungs](/images/blog/Analog-Tank-Pump-Control/ladder-controls-lad4.png)

_RSLogix 500 printout of the CONTROLS file._

### Rungs 0 and 1: comparisons instead of switches

| Rung | Condition                          | Instruction                        | Result                          |
| ---- | ------------------------------------ | ----------------------------------- | --------------------------------- |
| 0000 | `LES N7:0 20` — LEVEL &lt; 20%          | `TON T4:0`, base 1.0 s, preset 10   | Starts timing while LEVEL is low   |
| 0001 | `GRT N7:0 80` — LEVEL &gt; 80%          | `TON T4:1`, base 1.0 s, preset 10   | Starts timing while LEVEL is high  |

`LES` (Less Than) and `GRT` (Greater Than) are compare instructions: they act exactly like a normal rung condition — true or false — feeding straight into a `TON`. If LEVEL climbs back above 20% before the 10 seconds is up, `T4:0` resets, same as a switch letting go.

### Rung 2: the same seal-in circuit as before

One rung, one `OTE B3:0/6` coil, two parallel branches:

- **Top branch (the trigger):** `XIC T4:0/DN` — the fill timer done. The moment LEVEL has stayed under 20% for 10 seconds, this branch energizes `FILL_MODE`.
- **Bottom branch (the seal-in):** `XIC B3:0/6` (FILL_MODE's own contact) in series with `XIO T4:1/DN` (drain timer, examine-if-open). Once `FILL_MODE` is on, this branch keeps feeding its own coil, holding it through the whole climb back up past 80%. The seal only breaks when `T4:1/DN` goes true — LEVEL has stayed over 80% for 10 seconds.

Exactly the same self-sealing `OTE` pattern as the Digital Tank program — the level source changed, the hold logic didn't.

### Rungs 3 and 4: pump fills, valve drains

- **Rung 3:** `XIC B3:0/6` (FILL_MODE) drives `OTE B3:0/4` (**PUMP**) — runs only while FILL_MODE is on.
- **Rung 4:** `XIO B3:0/6` (FILL_MODE, examine-if-open) drives `OTE B3:0/5` (**VALVE**) — open whenever FILL_MODE is **off**.

### Rung 5

`END`.

## Mode table

| FILL_MODE (`B3:0/6`) | LEVEL condition that set it | Pump | Valve |
| --------------------- | ----------------------------- | ---- | ----- |
| 1                       | Was below 20% for 10s          | ON   | OFF   |
| 0                       | Was above 80% for 10s          | OFF  | ON    |

## Expected behaviour

![Timing diagram: LEVEL falling under 20% for 10 seconds sets FILL_MODE and starts the pump; LEVEL rising over 80% for 10 seconds breaks the seal and opens the valve](/images/blog/Analog-Tank-Pump-Control/timing-diagram.svg)

_Follow LEVEL at the top, and FILL_MODE underneath it, to see exactly which threshold and which timer caused each change._

**How to test it in RSLogix 500 (in the order of the diagram):**

1. Start with LEVEL somewhere in the middle (between 20% and 80%). Mode holds at whatever it was last — nothing changes in the dead band.
2. Force or simulate LEVEL below 20%. `T4:0` starts timing.
3. Hold it there for 10 seconds. `T4:0/DN` goes true, `FILL_MODE` seals **ON** — PUMP turns on, VALVE closes.
4. Let LEVEL rise back through the dead band. `FILL_MODE` stays **ON** the whole way — the seal-in contact is holding it, not the LEVEL value.
5. Once LEVEL passes 80%, `T4:1` starts timing.
6. Hold it above 80% for 10 seconds. `T4:1/DN` goes true, breaking the seal: `FILL_MODE` drops to **OFF** — PUMP turns off, VALVE opens.
7. Bounce LEVEL just under 20% and back up again without holding a full 10 seconds. `FILL_MODE` never changes — same debounce behaviour as the digital version, now protecting against sensor noise instead of switch bounce.

## Instructions used in this program

| Instruction | Where it is used          | What it does here                                    |
| ----------- | -------------------------- | ------------------------------------------------------ |
| **JSR**     | MAIN, rungs 0 and 1         | Jumps to the IO and CONTROLS subroutines                  |
| **SCP**     | IO, rung 2                  | Scales the raw analog count into LEVEL (0–100%)            |
| **LES**     | CONTROLS, rung 0             | True while LEVEL is less than 20                            |
| **GRT**     | CONTROLS, rung 1             | True while LEVEL is greater than 80                          |
| **TON**     | CONTROLS, rungs 0 and 1     | Times how long LEVEL has stayed past a threshold            |
| **XIC**     | IO and CONTROLS             | Checks a bit, a timer's DN bit, or the FILL_MODE seal-in     |
| **XIO**     | CONTROLS, rungs 2 and 4      | Breaks the seal, and drives the valve when FILL_MODE is off  |
| **OTE**     | IO and CONTROLS              | Drives the pump, valve and FILL_MODE                          |
| **END**     | Every file                  | Marks the end of the file                                     |

I cover `LES`/`GRT` and `SCP` in more detail in my **PLC Instructions** post, and the seal-in pattern in the **Digital Tank** post.

## Things to improve

- **No hardware alarm limits:** below 5% or above 95% would usually trip a separate fault/alarm output, not just switch modes — right now the program trusts LEVEL completely, with no sensor-fault or out-of-range check.
- **Sensor fault detection:** if the analog input fails open or shorts, `SCP` will happily scale a bogus raw count into a plausible-looking LEVEL. A broken-wire or over/under-range check on the raw `I:3.0` value before trusting it would catch that.
- **Power-up state:** same as the digital version — `FILL_MODE` is a plain `OTE`, so it resets to 0 (DRAIN) on power-up regardless of the actual LEVEL reading at that moment.
- **Fixed thresholds:** 20 and 80 are hardcoded into the `LES`/`GRT` rungs. Moving them into integers would make the dead band tunable without editing logic.
- **Mode lamp:** one indicator for FILL_MODE would let an operator see at a glance whether the tank is currently filling or draining, same as I'd add to the digital version.

## Key takeaways

- An analog input turns four fixed switch points into one continuous number, and moves the actual thresholding into software (`LES`/`GRT`) instead of wiring.
- `SCP` does the raw-count-to-engineering-units conversion in a single instruction, so the rest of the program only ever deals with a clean 0–100% value.
- The **seal-in circuit** from the Digital Tank program carries over unchanged — comparisons feed the same set/break logic that switches did.
- The **dead band** between 20% and 80% is what stops the pump and valve chattering around a single setpoint, exactly like the 10 second timers did for switch bounce.
- Splitting **IO** and **CONTROLS** means the fill/drain decision never has to know whether the level comes from a switch or a sensor — only that `LEVEL` is a number.

## Build it yourself

1. Create a new RSLogix 500 project named **ANALOG TANK - PUMP CONTROL**, with your analog input module wired to give `I:3.0` and a **1762-OW8** for the outputs.
2. Create two new ladder files, `LAD 3` named **IO** and `LAD 4` named **CONTROLS**.
3. In `LAD 2` (MAIN), add two `JSR` rungs pointing to `U:3` and `U:4`, followed by an `END`.
4. In IO, add the pump and valve output rungs, then an unconditional `SCP` rung: input `I:3.0`, input range 0–16383, scaled range 0–100, output `N7:0`.
5. In CONTROLS, add `LES N7:0 20` driving `TON T4:0` (base 1.0 s, preset 10), and `GRT N7:0 80` driving `TON T4:1` (same preset). Then build the FILL_MODE rung: `XIC T4:0/DN` in parallel with (`XIC B3:0/6` in series with `XIO T4:1/DN`), all feeding one `OTE B3:0/6`. Then add the pump rung (`XIC B3:0/6`) and the valve rung (`XIO B3:0/6`).
6. Give every address a symbol name so the program is easy to read.
7. Download the program to the PLC (or use the emulator), then follow the test steps above — you can force `N7:0` directly in the data table to simulate the sensor.

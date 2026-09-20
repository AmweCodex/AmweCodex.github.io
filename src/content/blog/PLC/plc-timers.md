---
title: "PLC TIMERS"
category: "PLC"
summary: "Deep Dive into Delay Instructions"
cover: "/images/blog/plc-timers.jpg"
tags:
  [
    "PLC Timers",
    "TON Timer",
    "TOF Timer",
    "TP Pulse Timer",
    "RTO Retentive Timer",
    "Ladder Logic",
    "PLC Programming",
    "Industrial Automation",
    "Time Delay",
  ]
date: 2026-09-15
draft: false
---

Most machines need to **wait**. A horn must sound before a conveyor starts. A fan must keep running after a motor stops. A door must unlock for a few seconds only. In a PLC, timers do all of this waiting for you, without freezing the rest of your program.

There are four timers to know. Here they are side by side before we go into each one.

![The four timer types at a glance: TON, TOF, TP and RTO](/images/blog/PLC-Timers/timer-types-overview.svg)

_IN is the input to the timer. Q is the output. Each timer reacts to the input in its own way._

## TON - Timers [Timer On Delay]

- is one of the most common timer instructions in PLC programming

### How it works:

- **Input/Enable (`IN` / `EN`)** -> When the input goes from `FALSE (0)` to `TRUE (1)`, the timer starts counting elapsed time.
- **Accumulated / Elapsed Time (`ET` / `ACC`)** -> Time counts up as long as the input stays true.
- **Present Time (`PT` / `PRE`)** -> The target delay you configure.
- **Output (`Q` / `DN`)** -> Turns true only after the elapsed time reaches the present time.

#### Key bits/outputs:

- **.EN (Enable)** — true whenever the timer instruction is being executed (input is true)
- **.TT (Timer Timing)** — true while the timer is actively counting (input true, hasn't reached preset yet)
- **.DN (Done)** — true once accumulated time reaches the preset value

![Timing diagram of a TON: the done bit turns on after the preset time, and a short input pulse resets the timer with no output](/images/blog/PLC-Timers/ton-timing.svg)

_Look at the second, shorter pulse. The input dropped before PT was reached, so the timer reset and DN never turned on._

**Example of the TON Program**  
so here is what will happen here:

- When the light switch 1 is pressed, the timer will be enabled and start counting.
- Because the timer is enabled, light bulb 1 will turn on.
- When the Accumulated value equals the Present value on the timer, the Done bit will be activated, so it will be true.
- The Done bit is true, so light bulb 2 will now turn on.
- Until light switch 1 is false, the bulbs will stay on.

**Everything is done on its own time and after the delay, how cool is that, automatically!**
![PLC Timers Example](/images/blog/Other/timers_example1.png)

## TOF - Timers [Timer Off Delay]

- delays turning an output **off** after the input goes false — the opposite behavior of a TON

### How it works:

- **Input/Enable (`IN` / `EN`)** -> While `TRUE`, the output is `TRUE` immediately and the timer sits at zero.
- **Accumulated / Elapsed Time (`ET` / `ACC`)** -> Starts counting the moment the input drops from `TRUE` to `FALSE`.
- **Present Time (`PT`)** -> The delay before the output finally turns off.
- **Output (`Q` / `DN`)** -> Stays `TRUE` for the duration of `PT` after the input goes false, then drops to `FALSE`. If the input goes true again before `PT` elapses, the timer resets and the output simply stays on.

#### Key bits/outputs:

- **.EN (Enable)** — true whenever the input is true (mirrors the input directly)
- **.TT (Timer Timing)** — true while the timer is counting down toward turning the output off (i.e., input is false but PT hasn't been reached yet)
- **.DN (Done)** — in most platforms this stays true for as long as the output should be on — true while the input is true, AND true during the off-delay countdown; only drops once PT elapses

![Timing diagram of a TOF: the output stays on after the input drops, and only turns off once PT has passed](/images/blog/PLC-Timers/tof-timing.svg)

_The input came back during the first gap, so the timer reset and the output never dropped. After the second drop, PT ran out and the output turned off._

**Example of the TOF Program**  
so here is what will happen here:

- When light switch 1 is pressed, the timer will be enabled and won't start counting yet.
- Because the timer is enabled, light bulb 1 will turn on. The Done bit is also true straight away, so light bulb 2 (using an `XIC` on the Done bit) turns on too.
- When we turn light switch 1 off, `EN` goes false, so light bulb 1 turns off immediately and the timer starts counting.
- When the Accumulated value equals the Present value, the Done bit drops to false.
- The Done bit is now false, so light bulb 2 turns off (this depends on the instruction you used, I used the `XIC`).

**Everything is done on its own time and after the delay, how cool is that, automatically!**
![PLC Timers Example](/images/blog/Other/TOF_example1.png)

## TP - Timers [Pulse Timer]

- gives you a **fixed-length pulse** every time the input turns on, no matter how long the input stays on

### How it works:

- **Input (`IN`)** -> A rising edge (`FALSE` to `TRUE`) starts the pulse.
- **Present Time (`PT`)** -> The exact length of the pulse.
- **Output (`Q`)** -> Turns `TRUE` the moment the pulse starts and turns `FALSE` after `PT`, even if the input is still on.
- **Elapsed Time (`ET`)** -> Counts up while the pulse is running.
- **Ignores extra presses** -> If the input goes off and on again during the pulse, nothing changes. The pulse always runs its full length.

![Timing diagram of a TP: the pulse always lasts PT, and a second press during the pulse is ignored](/images/blog/PLC-Timers/tp-timing.svg)

_Whether the button is held for 10 seconds or tapped for a blink, the output pulse is the same length._

> 💡 **Note:** TP comes from the **IEC 61131-3** standard, so you will find it in CODESYS and similar tools. Classic Allen-Bradley ladder does not have a TP instruction as standard, and you build the same behaviour with other instructions.

## RTO - Timers [Retentive Timer On]

- a TON that **remembers** how much time has passed, even when the input goes false

### How it works:

- **Input (`EN`)** -> While `TRUE`, the timer counts up, just like a TON.
- **Input goes false** -> The accumulated time **stays where it is**. It does not reset.
- **Input goes true again** -> The timer carries on counting from where it stopped.
- **Output (`DN`)** -> Turns `TRUE` when the total accumulated time reaches `PRE`, and stays on.
- **Reset (`RES`)** -> The only way to clear the accumulated time and the Done bit is a separate `RES` instruction using the same timer.

![Timing diagram of an RTO: time adds up over three input pulses, the output turns on at PT, and a reset clears everything](/images/blog/PLC-Timers/rto-timing.svg)

_The three pulses add up to PT. Nothing clears until the RES rung goes true._

> 💡 **Note:** The retentive timer is called **TONR** on IEC-based platforms (Siemens uses this name too).

## Timer names on different platforms

The idea is the same everywhere, but the parts have different names.

| What it is        | Allen-Bradley (Rockwell)   | IEC 61131-3 / CODESYS |
| ----------------- | -------------------------- | --------------------- |
| Input             | `EN` (rung condition)      | `IN`                  |
| Target time       | `PRE`                      | `PT`                  |
| Time counted so far | `ACC`                    | `ET`                  |
| Output            | `DN`                       | `Q`                   |
| Timing status     | `TT`                       | (no separate bit)     |
| On delay          | `TON`                      | `TON`                 |
| Off delay         | `TOF`                      | `TOF`                 |
| Pulse             | (build it yourself)        | `TP`                  |
| Retentive on delay | `RTO`                     | `TONR`                |

> ⚠️ **Watch the units:** In Allen-Bradley the preset is a number in **milliseconds** (`5000` means 5 seconds). In IEC tools you type a time value like `T#5s`.

## Which timer should I use?

![Real-world uses: conveyor start delay with TON, fan run-on with TOF, door strike pulse with TP, pump run hours with RTO](/images/blog/PLC-Timers/timer-use-cases.svg)

| I want to...                                       | Use     |
| -------------------------------------------------- | ------- |
| Wait before something turns **ON**                 | **TON** |
| Keep something ON for a while after the input stops | **TOF** |
| Give a signal of an exact, fixed length            | **TP**  |
| Add up total time over many on/off periods         | **RTO** |

## Common mistakes

- **Using the same timer tag twice:** Two timer instructions with the same name fight each other, and the behaviour becomes confusing. Give every timer its own tag.
- **A flickering input on a TON:** If the input drops even for one scan, the TON resets to zero and starts again.
- **Expecting a TOF to time when the input turns on:** A TOF only starts counting when the input turns **off**.
- **Forgetting the RES on an RTO:** It will never clear on its own.
- **Mixing up time units:** `5` and `5000` are very different in milliseconds. Double check what your platform expects.

## Quick Comparison

| Timer   | Starts counting when... | Output behavior                                                        | Remembers time? |
| ------- | ----------------------- | ---------------------------------------------------------------------- | --------------- |
| **TON** | Input goes true         | Output turns ON after delay, resets immediately if input drops         | No              |
| **TOF** | Input goes false        | Output turns OFF after delay, stays ON while input is true             | No              |
| **TP**  | Input goes true         | Output is ON for exactly PT, then OFF, even if the input stays on     | No              |
| **RTO** | Input goes true         | Output turns ON when total time reaches PRE, stays ON until a reset    | Yes             |

## Key takeaways

- **TON** waits before turning ON. **TOF** waits before turning OFF.
- **TP** makes a pulse of a fixed length, whatever the input does.
- **RTO** adds up time across many on/off periods and needs a **RES**.
- A **TON resets** if its input drops before the preset is reached.
- Every timer has the same parts: input, preset, elapsed time and output. Only the names change between platforms.

## Test yourself

<details>
<summary>1. A TON has a preset of 5 seconds. The input is ON for 4 seconds and then turns OFF. Does the Done bit turn on?</summary>

**No.** The input dropped before the preset was reached, so the timer resets to zero and the Done bit never turns on.

</details>

<details>
<summary>2. A motor must stop, but its cooling fan must keep running for 30 more seconds. Which timer do you use?</summary>

A **TOF** with a preset of 30 seconds. The fan output stays on while the timer counts after the motor input goes false.

</details>

<details>
<summary>3. A TP has a preset of 3 seconds. The button is held down for 10 seconds. How long is the output ON?</summary>

**3 seconds.** A pulse timer always gives a pulse of exactly PT, no matter how long the input stays on.

</details>

<details>
<summary>4. An RTO has a preset of 10 minutes. A pump runs for 4 minutes, stops, then runs for 6 minutes. When does the Done bit turn on?</summary>

At the end of the second run. The RTO **held** the first 4 minutes, and the total reached 10 minutes.

</details>
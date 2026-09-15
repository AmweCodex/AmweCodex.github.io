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
    "Ladder Logic",
    "PLC Programming",
    "Industrial Automation",
    "Time Delay",
  ]
date: 2026-09-15
draft: false
---

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

**Example of the TON Program**  
so here is what will happen here:

- When the light switch 1 is pressed, the timer will be enabled and start counting.
- because the timer is enabled, the light bulb 1 will tun on
- When the Accumulated value qual to the Present value on the timer, Done bit will be activated so it will be true
- Done bit is true, so the light bulb 2 will now turn on.
- Until the light switch 1 is false, bulbs will stay on.  

**Everything is done on it own time and after the delay, how cool is that automatically**
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

**Example of the TOF Program**  
so here is what will happen here:

- When the light switch 1 is pressed, the timer will be enabled and wont start counting.
- because the timer is enabled, the light bulb 1 will turn on
- The count will start immediately when we turn light switch 1 off and `EN` will go to false, causing the light bulb 1 to turn off
- When the Accumulated value qual to the Present value on the timer, Done bit will be activated so it will be true
- Done bit is true, so the light bulb 2 will now turn off (depending on the instruction you used, i used the `XIC`).

**Everything is done on it own time and after the delay, how cool is that automatically**
![PLC Timers Example](/images/blog/Other/TOF_example1.png)

## Quick Comparison

| Timer   | Starts counting when... | Output behavior                                                |
| ------- | ----------------------- | -------------------------------------------------------------- |
| **TON** | Input goes true         | Output turns ON after delay, resets immediately if input drops |
| **TOF** | Input goes false        | Output turns OFF after delay, stays ON while input is true     |

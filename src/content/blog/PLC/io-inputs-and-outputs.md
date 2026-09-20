---
title: "IO (Inputs and Outputs)"
category: "PLC"
summary: "Basic Understanding of how Analog and Digital IO Works"
cover: "/images/blog/digital_vs_analog_io.jpg"
tags:
  [
    "PLC IO",
    "Digital IO",
    "Analog Signals",
    "4-20mA",
    "Signal Scaling",
    "Sensors",
    "Industrial Automation",
    "Discrete Signals",
    "PLC Wiring",
  ]
date: 2026-09-15
draft: false
---

A PLC does three things: it **looks** at the real world, it **decides**, and it **acts**. IO (Inputs and Outputs) is how it looks and acts. Without IO, a PLC is just a small computer with nothing to talk to.

In this post I break IO into its two families, **digital** and **analog**, and show how each one is wired and used in a real plant.

## The big picture

Every signal travels the same road: a field device connects to an **IO card**, the card hands the information to the **CPU**, and the CPU sends its decision back out through another card.

![How a PLC connects field devices through IO cards, plus the three-step scan cycle](/images/blog/PLC-IO/plc-io-scan-cycle.svg)

_The PLC repeats the scan cycle (read inputs, run program, write outputs) many times every second._

> 💡 **Quick tip:** DI, DO, AI and AO are the short names you will see on every wiring diagram. **D**igital or **A**nalog, then **I**nput or **O**utput.

## Digital vs analog: the difference at a glance

![Digital signals jump between two states, analog signals move smoothly across a range](/images/blog/PLC-IO/digital-vs-analog-signals.svg)

_Digital is a light switch. Analog is a dimmer._

## Digital IO

- also called **discrete IO**, signals that only have two possible states

### How it works:

- **Digital Input** -> A field device (button, limit switch, proximity sensor) sends either `0V` (OFF/FALSE) or a rated voltage like `24V` (ON/TRUE) into an input card. The PLC reads this as a single bit, `0` or `1`, nothing in between.
- **Digital Output** -> The PLC drives a bit `0` or `1` out of an output card, which switches a field device (relay, lamp, solenoid, contactor coil) fully OFF or fully ON.
- **No in-between state** -> Unlike analog, there is no "half on". A digital signal is either present or it isn't.

#### Common digital input devices:

- **Push buttons**: start/stop stations, e-stops
- **Limit switches / proximity sensors**: detect part presence, end-of-travel
- **Selector switches**: mode selection (Auto/Manual)
- **Photoelectric sensors (discrete output type)**: object detection

#### Common digital output devices:

- **Relays / contactors**: switching motors, larger loads
- **Solenoid valves**: pneumatic/hydraulic actuation
- **Indicator lamps / stack lights**: status feedback
- **Alarms / horns**

> ⚠️ **Good to know:** A PLC output card is small. It normally drives a **contactor coil or relay**, and that device then switches the big load (like a motor). The card does not power the motor itself.

### Sourcing vs Sinking (a common wiring point of confusion)

- **Sourcing (PNP)**: the device/PLC card supplies the `+` voltage to the load; current flows out of the card into the field device.
- **Sinking (NPN)**: the device/PLC card provides the path to `0V`/ground; current flows into the card from the field device.
- Most European/Siemens gear defaults to sourcing (PNP), while a lot of older American/Asian equipment uses sinking (NPN). Always check your card's wiring diagram before hooking up a new sensor.

![Wiring for a PNP sensor with a sinking input and an NPN sensor with a sourcing input](/images/blog/PLC-IO/sourcing-vs-sinking-wiring.svg)

_Follow the arrows. Current always travels from +24V to 0V, the only difference is which device it passes through first._

> 💡 **Rule of thumb:** a **PNP** sensor goes with a **sinking** input card, and an **NPN** sensor goes with a **sourcing** input card. Mix them up and the input will never turn ON.

Example

![PLC IO Example](/images/blog/Other/Sourcing_vs_Sinking.png)

## Analog IO

- signals that can take on **any value across a continuous range**, not just ON/OFF

### How it works:

- **Analog Input** -> A field device (temperature transmitter, pressure sensor, level sensor) sends a continuously variable signal, most commonly `4-20mA` or `0-10V`, into an analog input card. The PLC scales this raw signal into an engineering value (e.g. °C, bar, %).
- **Analog Output** -> The PLC drives a continuously variable signal out of an analog output card to control something proportionally, like a valve position or a variable speed drive (VSD) speed reference.
- **Resolution matters** -> Analog input cards convert the signal using an Analog-to-Digital Converter (ADC) with a certain bit resolution (commonly 12-bit or 16-bit), which determines how finely the signal can be measured. Analog output cards do the opposite job with a DAC (Digital-to-Analog Converter).

#### Common analog input devices:

- **Temperature transmitters** (RTD/thermocouple converted to 4-20mA)
- **Pressure transmitters**
- **Level transmitters** (ultrasonic, radar, hydrostatic)
- **Flow meters**
- **Load cells** (via signal conditioners)

#### Common analog output devices:

- **Variable Speed Drives (VSDs/VFDs)**: speed reference signal
- **Control valves**: positioning signal (e.g. 4-20mA to a valve positioner)
- **Analog dampers/actuators**

### Why 4-20mA is so common (not 0-20mA)

- A live zero (**4mA = 0%**) lets the system tell the difference between "signal is genuinely at zero" and "wire is broken/disconnected" (which would read `0mA`).
- This built-in fault detection is a big reason 4-20mA dominates industrial analog wiring over voltage signals, which are more prone to noise over long cable runs anyway.

![A 4-20mA signal mapped to 0-10 bar, with the fault zone below 4mA](/images/blog/PLC-IO/four-to-twenty-ma.svg)

_The signal never sits at 0mA in normal use. If you see 0mA, something is wrong with the loop._

### Scaling example

If a pressure transmitter outputs `4-20mA` representing `0-10 bar`, and the PLC reads a raw value of `12mA`:

**The formula:**

```text
value = (reading - 4) / (20 - 4) × (10 - 0) + 0
```

**The working:**

1. Take away the live zero: `12 - 4 = 8mA`
2. Divide by the full span: `8 / 16 = 0.5` (that is **50%**)
3. Multiply by the range: `0.5 × 10 = 5 bar`

So `12mA` means the pressure is **5 bar**.

In Structured Text, the same calculation looks like this:

```pascal
// Scale a 4-20mA reading to a 0-10 bar pressure
rPressure := (rMilliamps - 4.0) / (20.0 - 4.0) * (10.0 - 0.0) + 0.0;
```

> 💡 **On Siemens PLCs** the analog card gives you a raw number instead of milliamps: `4mA` reads as `0` and `20mA` reads as `27648`. The maths is the same, you just swap `4` and `20` for `0` and `27648`.

### Resolution: how fine can the PLC measure?

An ADC chops the signal into a fixed number of steps. More bits means more steps, so smaller changes can be seen.

![A 3-bit ADC compared to a 12-bit ADC measuring the same rising signal](/images/blog/PLC-IO/adc-resolution.svg)

| Resolution | Number of steps |
| ---------- | --------------- |
| 8-bit      | 256             |
| 12-bit     | 4 096           |
| 16-bit     | 65 536          |

## Putting it together: a tank filling station

Here is how all four IO types can show up in one small machine.

![IO for a tank filling station: start and stop buttons, level transmitter, pump contactor, run lamp and inlet valve positioner](/images/blog/PLC-IO/tank-filling-station-io.svg)

- The operator presses **Start** (DI). The PLC turns on the **pump contactor** (DO) and the **green lamp** (DO).
- The **level transmitter** (AI) keeps telling the PLC how full the tank is.
- As the tank nears full, the PLC slowly closes the **inlet valve** (AO) instead of slamming it shut.
- **Stop** (DI) ends everything.

Digital handles the ON/OFF decisions. Analog handles the "how much" decisions.

## Quick Comparison

| IO Type            | Signal Range | Typical Values      | Example Devices                                 |
| ------------------ | ------------ | ------------------- | ----------------------------------------------- |
| **Digital Input**  | 2-state      | 0V / 24V (OFF / ON) | Push buttons, limit switches, proximity sensors |
| **Digital Output** | 2-state      | 0V / 24V (OFF / ON) | Relays, solenoids, indicator lamps              |
| **Analog Input**   | Continuous   | 4-20mA, 0-10V       | Temperature, pressure, level transmitters       |
| **Analog Output**  | Continuous   | 4-20mA, 0-10V       | VSDs, valve positioners                         |

## Key takeaways

- **Digital** = two states (0V / 24V). **Analog** = a continuous range.
- Inputs bring information **into** the PLC. Outputs carry decisions **out** of it.
- **PNP** sensors pair with **sinking** inputs, **NPN** sensors pair with **sourcing** inputs.
- **4-20mA** has a live zero, so a broken wire is easy to spot (0mA = fault).
- Analog values must be **scaled** into real units (bar, °C, %) in your program.
- Higher **resolution** means the PLC can see smaller changes.

## Test yourself

<details>
<summary>1. A 4-20mA level transmitter reads 8mA. What percentage full is the tank?</summary>

`(8 - 4) / (20 - 4) = 4 / 16 =` **25%**

</details>

<details>
<summary>2. The PLC reads 0mA on a 4-20mA input. What does that tell you?</summary>

It is outside the normal range, so it points to a fault, most likely a **broken wire** or a dead transmitter.

</details>

<details>
<summary>3. Which one would you use to set a VSD speed: a DO or an AO?</summary>

An **AO** (analog output), because the speed reference needs to be any value in a range, not just ON or OFF.

</details>
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
    "Sensors",
    "Industrial Automation",
    "Discrete Signals",
    "PLC Wiring",
  ]
date: 2026-09-15
draft: false
---

## Digital IO

- also called **discrete IO** — signals that only have two possible states

### How it works:

- **Digital Input** -> A field device (button, limit switch, proximity sensor) sends either `0V` (OFF/FALSE) or a rated voltage like `24V` (ON/TRUE) into an input card. The PLC reads this as a single bit — `0` or `1`, nothing in between.
- **Digital Output** -> The PLC drives a bit `0` or `1` out of an output card, which switches a field device (relay, lamp, solenoid, contactor coil) fully OFF or fully ON.
- **No in-between state** -> Unlike analog, there's no "half on." A digital signal is either present or it isn't.

#### Common digital input devices:

- **Push buttons** — start/stop stations, e-stops
- **Limit switches / proximity sensors** — detect part presence, end-of-travel
- **Selector switches** — mode selection (Auto/Manual)
- **Photoelectric sensors (discrete output type)** — object detection

#### Common digital output devices:

- **Relays / contactors** — switching motors, larger loads
- **Solenoid valves** — pneumatic/hydraulic actuation
- **Indicator lamps / stack lights** — status feedback
- **Alarms / horns**

#### Sourcing vs Sinking (a common wiring point of confusion):

- **Sourcing (PNP)** — the device/PLC card supplies the `+` voltage to the load; current flows out of the card into the field device.
- **Sinking (NPN)** — the device/PLC card provides the path to `0V`/ground; current flows into the card from the field device.
- Most European/Siemens gear defaults to sourcing (PNP), while a lot of older American/Asian equipment uses sinking (NPN) — always check your card's wiring diagram before hooking up a new sensor.

Example
![PLC IO Example](/images/blog/Other/Sourcing_vs_Sinking.png)

## Analog IO

- signals that can take on **any value across a continuous range**, not just ON/OFF

### How it works:

- **Analog Input** -> A field device (temperature transmitter, pressure sensor, level sensor) sends a continuously variable signal — most commonly `4-20mA` or `0-10V` — into an analog input card. The PLC scales this raw signal into an engineering value (e.g. °C, bar, %).
- **Analog Output** -> The PLC drives a continuously variable signal out of an analog output card to control something proportionally — like a valve position or a variable speed drive (VSD) speed reference.
- **Resolution matters** -> Analog cards convert the signal using an Analog-to-Digital Converter (ADC) with a certain bit resolution (commonly 12-bit or 16-bit), which determines how finely the signal can be measured.

#### Why 4-20mA is so common (not 0-20mA):

- A live zero (**4mA = 0%**) lets the system tell the difference between "signal is genuinely at zero" and "wire is broken/disconnected" (which would read `0mA`).
- This built-in fault detection is a big reason 4-20mA dominates industrial analog wiring over voltage signals, which are more prone to noise over long cable runs anyway.

#### Common analog input devices:

- **Temperature transmitters** (RTD/thermocouple converted to 4-20mA)
- **Pressure transmitters**
- **Level transmitters** (ultrasonic, radar, hydrostatic)
- **Flow meters**
- **Load cells** (via signal conditioners)

#### Common analog output devices:

- **Variable Speed Drives (VSDs/VFDs)** — speed reference signal
- **Control valves** — positioning signal (e.g. 4-20mA to a valve positioner)
- **Analog dampers/actuators**

#### Scaling example:

If a pressure transmitter outputs `4-20mA` representing `0-10 bar`, and the PLC reads a raw value of `12mA`:

## Quick Comparison

| IO Type            | Signal Range | Typical Values      | Example Devices                                 |
| ------------------ | ------------ | ------------------- | ----------------------------------------------- |
| **Digital Input**  | 2-state      | 0V / 24V (OFF / ON) | Push buttons, limit switches, proximity sensors |
| **Digital Output** | 2-state      | 0V / 24V (OFF / ON) | Relays, solenoids, indicator lamps              |
| **Analog Input**   | Continuous   | 4-20mA, 0-10V       | Temperature, pressure, level transmitters       |
| **Analog Output**  | Continuous   | 4-20mA, 0-10V       | valve positioners                               |

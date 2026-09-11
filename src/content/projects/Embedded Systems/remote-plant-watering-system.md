---
title: "Remote Plant Watering System"
category: "Embedded Systems"
summary: "A dual-Arduino, wireless, semi-automated irrigation system built with my final-year group at DUT — set watering times on a keypad, and let soil moisture sensors stop over-irrigation."
cover: "/images/projects/remote-plant-watering-system.svg"
stack: ["Arduino", "Embedded Systems", "Wireless Communication", "Sensors", "University Project"]
date: 2023-06-30
Status: Completed
draft: false
---

## Overview

The Remote Plant Watering System was my final-year group project for **Electronic Design Project 3A (EDPA301)** at the Durban University of Technology, built with four other engineering students (Group N). The brief was open: design and build a working system that demonstrates BEngTech-level electronic and embedded systems knowledge. We chose to build a compact, semi-automated irrigation system for domestic and small-scale gardening use.

The idea was simple: let a user set how long each of two garden sections should be watered, and let the system handle the rest — while soil moisture sensors step in to stop watering early if the soil is already damp enough. It's the kind of small-scale automation used in commercial farming, scaled down for a home garden.

This proposal scored **80%**.

## What It Does

- A **control centre** (keypad + LCD) lets the user enter a watering duration for the left and right sections of the garden separately.
- The control centre communicates **wirelessly** with a second unit that handles the actual watering.
- A **servo motor** swings a water pipe between the two sections — 0° for the left side, 90° for the right.
- **Soil moisture sensors** on each side continuously monitor moisture and will cut the watering short if the soil is already wet enough, to prevent over-irrigation.
- The LCD shows which section is currently being watered.

## System Architecture

The system runs on **two Arduino Mega 2560 boards** that talk to each other wirelessly:

- **Arduino 1 (Master):** connected to the keypad, LCD, and a timer. This is where the user sets the watering duration for each section.
- **Arduino 2 (Slave):** connected to the moisture sensors, the servo motor, a relay, and the water pump. This is the "muscle" of the system — it moves the pipe, checks the soil, and turns the pump on and off.

The two boards communicate over **NRF24L01+ wireless transceiver modules**, operating on the 2.4 GHz ISM band. Wired connections (grey) handle each Arduino's local peripherals, while the wireless link (black) carries commands and sensor data between the master and slave.

### Components used

| Component | Role |
|---|---|
| 2x Arduino Mega 2560 | Master (control) and slave (watering) microcontrollers |
| 4x3 Membrane keypad | User input for watering duration |
| 16x2 LCD + I2C module | Displays which section is being watered |
| 2x NRF24L01+ module | Wireless link between the two Arduinos |
| SG90 servo motor | Swings the water pipe between the two sections |
| 5V relay module | Switches the water pump on/off |
| 5V DC water pump | Delivers water to the garden |
| 2x Soil moisture sensor | Detects soil moisture to prevent over-irrigation |
| 9V DC battery | Power supply |

### How watering works

1. On the control centre, the user is prompted: *"Enter L Minutes:"* then *"Enter R Minutes:"*.
2. Once a duration is set, the master Arduino sends a command wirelessly to the slave Arduino.
3. The slave moves the servo motor to point the water pipe at the correct section.
4. Before (and during) watering, the slave checks the soil moisture sensor for that section. If the soil is already above the moisture threshold, watering is skipped or stopped to avoid over-irrigation.
5. If moisture is below the threshold, the relay switches the pump on and water flows until either the timer runs out or the moisture threshold is reached.
6. The LCD on the control centre updates to show which section is currently being watered.
7. Once the left section is done, the process repeats for the right section.

The full logic is mapped out in the project flowchart, and the wiring is laid out in the circuit diagram — both were part of our final submission.

## The Team

We split the project into five technical roles, each owning a subsystem, on top of a shared civil/mechanical build effort:

- **Group Leader / Computer Hardware Engineer** — assembled the full circuit, programmed the timer, keypad, and LCD, and handled wiring/pin troubleshooting.
- **Control Systems Engineer / Software Technician** — merged everyone's individual code into one working system and built in self-correcting error handling.
- **RF Engineer** — set up and tested the wireless link between the two Arduinos using the NRF24L01+ modules.
- **Sensor Engineer** — programmed and calibrated the soil moisture sensors and set the moisture threshold.
- **Mechanical Engineer** — designed and built the mechanical side: the servo-driven pipe, relay, and pump assembly.

Splitting the project this way meant we could work in parallel and each go deep on one subsystem, before bringing everything together for integration testing.

## Challenges We Anticipated

Some of the problems we planned for ahead of time (and largely why the proposal scored well):

- **Water near electronics** — insulating sensitive components and planning for electrical safety around the pump and pipe.
- **Sensor degradation** — resistive soil moisture sensors corrode over time from constant current flowing through moist soil, so we planned regular sensor checks.
- **Wireless reliability** — detecting lost communication between the two NRF24L01+ modules, keeping them in range, and using bypass capacitors to suppress switching noise.
- **Code integration** — five people each writing code for their own subsystem meant a real risk of conflicts when merging it all into one project, so one person owned the final integration and debugging.
- **Load-shedding** — a very South African problem: our usual meeting spot (the campus library) closes during power cuts, so we planned meeting times around the load-shedding schedule.

## Reflections

This project pulled together knowledge from across the degree — digital electronics for the timer logic, microcontroller/embedded systems modules for the Arduino work, control systems theory for keeping the watering behaviour stable, and circuit design fundamentals for the actual build. It was also my first real experience coordinating a hardware project across a team with clearly split responsibilities, working with wireless communication between two microcontrollers, and thinking through failure modes (sensor wear, lost wireless signal, water near electronics) before they became real problems on the bench.

It's a small project, but it's a good example of the kind of end-to-end embedded system I enjoy building: sensing, decision-making, and physical actuation, tied together with just enough automation to be genuinely useful.

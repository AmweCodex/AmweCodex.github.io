---
title: "Logic Gates in Ladder Logic"
category: "PLC LAB"
summary: "AND, OR, NOT, NAND, NOR, XOR and XNOR built as ladder rungs in RSLogix 500, developed with the five steps of PLC program development."
cover: "/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/cover.svg"
tags: ["PLC", "RSLogix 500", "Ladder Logic", "Logic Gates", "Practice Problems"]
date: 2026-10-12
draft: false
---

Every PLC program, however large, is built from small logical decisions. Is this AND that true? Is either of these true? Is this NOT true? Logic gates are the language we use for those decisions, and ladder logic expresses them with nothing more than contacts and coils.

This is one of my own practice problems: building all seven basic gates in RSLogix 500 and proving each one against its truth table. Programming a PLC is much easier when the task is broken into smaller steps, so I used the five steps of PLC program development, and we will apply them to the gates.

## Step 1 – Define the task

What has to happen? Write it down and summarise it.

The task is to build each of the basic logic gates (AND, OR, NOT, NAND, NOR, XOR and XNOR) as a single ladder rung, and to show that every rung gives the correct output for every combination of inputs.

I set three rules for myself. Each gate gets its own rung, so it can be read and tested on its own. Only the basic instructions are allowed: XIC, XIO and OTE. And every bit gets a clear name.

## Step 2 – Define the inputs and outputs

Based on step 1, we decide which inputs and outputs are needed.

A logic gate has one or two inputs and one output. By convention the inputs are called A and B, and the output is called Y. This exercise uses no physical hardware. Every input and output is an internal bit in the binary file B3, and the inputs are switched on and off by hand while the program is online.

![Input and output map](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/io-map.svg)

Each gate has its own pair of input bits, so that a mistake in one gate can never affect another.

Inputs and outputs:

- AND gate: inputs A1 (`B3:0/0`) and B1 (`B3:0/1`), output Y1 (`B3:0/3`)
- OR gate: inputs A2 (`B3:0/4`) and B2 (`B3:0/5`), output Y2 (`B3:0/6`)
- NOT gate: input A3 (`B3:0/7`), output Y3 (`B3:0/8`)
- NAND gate: inputs A4 (`B3:0/9`) and B4 (`B3:0/10`), output Y4 (`B3:0/11`)
- NOR gate: inputs A5 (`B3:0/12`) and B5 (`B3:0/13`), output Y5 (`B3:0/14`)
- XOR gate: inputs A6 (`B3:0/15`) and B6 (`B3:1/0`), output Y6 (`B3:1/1`)
- XNOR gate: inputs A7 (`B3:1/2`) and B7 (`B3:1/3`), output Y7 (`B3:1/4`)

A value of 1 means ON (true) and 0 means OFF (false) throughout this post.

## Step 3 – Develop a logical sequence of operation

This is where most of the thinking should happen. Steps 1 and 2 let us say exactly what has to happen before any ladder is drawn, and it is the easiest place to make changes.

A logic gate has no memory. Its output depends only on its inputs at that moment, so there is no sequence of events or state diagram to draw. For a gate, the sequence of operation is its **truth table**, so that is what I wrote first.

| A | B | AND | OR | NOT A | NAND | NOR | XOR | XNOR |
|:-:|:-:|:---:|:--:|:-----:|:----:|:---:|:---:|:----:|
| 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 1 |
| 0 | 1 | 0 | 1 | 1 | 1 | 0 | 1 | 0 |
| 1 | 0 | 0 | 1 | 0 | 1 | 0 | 1 | 0 |
| 1 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 1 |

**Read the truth table:** each row is one combination of the inputs, with 1 for ON and 0 for OFF. Take the second row, where A is 0 and B is 1. The OR gate is ON because one input is ON. The AND gate is OFF because both are not. NAND is ON because both inputs are not ON together. NOR is OFF because one input is ON. XOR is ON because the inputs are different, and XNOR is OFF for the same reason.

Ladder logic has a direct equivalent for each building block of the truth table:

- Contacts in **series** make an AND.
- Contacts in **parallel** make an OR.
- An **XIO** contact, which is true when its bit is 0, makes a NOT.

NAND and NOR need one extra idea, called De Morgan's theorem. Ladder has no instruction to invert a whole group, so the inversion is placed on each contact instead. NOT (A AND B) becomes (NOT A) OR (NOT B), which is two XIO contacts in parallel. In the same way, NOT (A OR B) becomes (NOT A) AND (NOT B), which is two XIO contacts in series.

![From gate to ladder pattern](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/gate-ladder-map.svg)

> Fully understanding the logic before starting to program can save you time and frustration.

## Step 4 – Develop the PLC program

Now that the logic is understood, we write the program in ladder logic.

The whole exercise lives in one program file, LAD 2, with one rung per gate and an END rung. The program is small and every rung has the same shape, so a single file is enough.

![Program structure](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/program-structure.svg)

Follow the truth table with each rung below.

### Rung 0000 – AND gate

![Rung 0000, AND gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-and.png)

Two XIC contacts, A1 and B1, sit in series and drive the coil Y1. Power can only reach the coil by passing through both contacts one after the other, so Y1 turns ON only when A1 and B1 are both 1. This rung is a direct drawing of the AND column in the truth table.

### Rung 0001 – OR gate

![Rung 0001, OR gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-or.png)

A2 and B2 are on separate parallel branches. Power only needs one path to reach the coil, so Y2 is ON when A2 is ON, when B2 is ON, or when both are ON.

### Rung 0002 – NOT gate

![Rung 0002, NOT gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-not.png)

A3 is an XIO contact. An XIO is true while its bit is 0, so Y3 is ON exactly when A3 is OFF. The output is always the opposite of the input. In the printout the contact is highlighted green, because with A3 at 0 it is true.

### Rung 0003 – NAND gate

![Rung 0003, NAND gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-nand.png)

NAND means NOT AND, so the output is OFF only when both inputs are ON. A4 and B4 are XIO contacts on parallel branches. If A4 is 0, or B4 is 0, one path is true and Y4 is ON. The only way to break both paths is for A4 and B4 to both be 1.

### Rung 0004 – NOR gate

![Rung 0004, NOR gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-nor.png)

NOR means NOT OR, so the output is ON only when neither input is ON. A5 and B5 are XIO contacts in series. Both must be true, meaning both bits at 0, for power to reach Y5.

### Rung 0005 – XOR gate

![Rung 0005, XOR gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-xor.png)

XOR, or exclusive OR, is ON when the two inputs are different. That is two separate cases, so the rung has two parallel branches. The upper branch is true when A6 is ON and B6 is OFF. The lower branch is true when A6 is OFF and B6 is ON. Notice that A6 and B6 each appear twice, once as XIC and once as XIO. This is normal: a bit can be examined as many times as needed.

### Rung 0006 – XNOR gate

![Rung 0006, XNOR gate](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/ladder-xnor.png)

XNOR is the opposite of XOR. It is ON when the two inputs are the same, which again is two cases. The upper branch is true when A7 and B7 are both ON. The lower branch is true when A7 and B7 are both OFF.

Note: in my program file this rung carries the comment "NOR GATE", a repeat of the label on rung 0004. The logic it contains is an XNOR, which is what the truth table confirms, so I treat it as XNOR here. The comment should be corrected in the ladder file.

Document, document, document. Every rung above has a gate name and every bit has a symbol, which saves a great deal of time when you return to a program months later.

## Step 5 – Test the program

Test the logic that you have developed. The truth table from step 3 is the checklist, because it already says what every gate must do.

To test, put the program online and set each combination of the A and B bits for a gate. Confirm that its Y bit follows the truth table. The animation below shows the expected behaviour as the four input combinations are applied in turn: the input switches change, the output lamps respond, and the matching row of the truth table is highlighted.

![Expected behaviour of all seven gates across the four input combinations](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/test-sequence-animation.svg)

A few conditions are worth checking on purpose:

1. **All inputs at 0.** NOT, NAND, NOR and XNOR must be ON, and AND, OR and XOR must be OFF. In my printout of the ladder, every XIO contact is highlighted green, because with all inputs at 0 every XIO is true. That is why those four gates are ON.
2. **A = 0, B = 1 against A = 1, B = 0.** Every two-input gate must give the same output for both, because the gates are symmetric in A and B.
3. **Both inputs ON, then both OFF.** AND and OR go OFF. NOT, NAND and NOR go ON. XOR stays OFF and XNOR stays ON.

![Timing diagram of the four input combinations](/images/blog/PLC-LAB/Logic-gates-in-ladder-logic/timing-diagram.svg)

The timing diagram shows the same four steps as waveforms. Reading down any column, the outputs match the truth table row for that combination.

## Summary

These five steps will help you in your PLC program development:

1. **Define the task**
2. **Define the inputs and outputs**
3. **Develop a logical sequence of operation**
4. **Develop the PLC program**
5. **Test the program**

You will notice that the actual programming does not occur until the second last step. For the gates, the truth table in step 3 did most of the work, and the ladder in step 4 was a direct drawing of it.

There are three improvements I would make next. First, rename the comment on rung 0006 from NOR to XNOR. Second, share one A and B pair across all the gates, so that the whole truth table can be tested with just two toggles. Third, map A and B to real inputs and Y to real outputs, and prove each gate with a physical switch and lamp.

If you have any questions or suggestions, please get in touch.

Thank you,
Musawandile (AmweCodex)
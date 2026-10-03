# AGENTS.md

## Project

This is a 2D top-down action-adventure game built with Phaser 3 and JavaScript

The game is inspired by classic 16-bit action-adventure games

The game should feel:
- responsive
- readable
- exploration-focused
- simple to understand
- satisfying to interact with

Do not copy characters, maps, sprites, music, names or other copyrighted assets from existing games

## Technology

- Phaser 3
- TypeScript
- HTML
- CSS
- VS Code
- No React
- No additional framework unless explicitly requested

Use modern JavaScript/TypeScript syntax

Prefer small modules with clear responsibilities

## Project structure

```text
src/
├── scenes/
│   ├── BootScene.js
│   ├── PreloadScene.js
│   ├── WorldScene.js
│   ├── DungeonScene.js
│   └── UIScene.js
│
├── entities/
│   ├── Player.js
│   ├── Enemy.js
│   └── NPC.js
│
├── systems/
│   ├── CombatSystem.js
│   ├── InventorySystem.js
│   ├── DialogueSystem.js
│   └── SaveSystem.js
│
├── data/
│   ├── items.js
│   ├── enemies.js
│   └── dialogue.js
│
├── maps/
├── assets/
└── main.js
```

Follow the existing project structure

Do not reorganize the project unless explicitly requested

## Architecture

Scenes are responsible for coordinating gameplay

Entities contain the behaviour of individual game objects

Systems contain reusable gameplay logic

Data files contain configuration and game data

Do not put large amounts of gameplay logic directly inside scenes

Prefer composition over large inheritance hierarchies

Avoid global state when possible

Prefer explicit dependencies between systems

## Player

The player is controlled using keyboard input

The player should support:

- four-direction movement
- collision with the environment
- facing direction
- melee attack
- interaction with objects
- taking damage
- receiving knockback
- collecting items

Player movement should feel responsive

Avoid acceleration unless explicitly requested

Do not change player movement behaviour when implementing unrelated features

Keep player input and player state clearly separated

## Combat

Combat should be simple and readable

Attacks should have:

- a clear start
- an active hit period
- a recovery period
- visual feedback

Enemies should provide readable attack telegraphs

The player should have enough time to react to enemy attacks

Avoid frame-perfect mechanics

Damage and hit detection should be deterministic

Do not use random damage values unless explicitly requested

Reuse existing combat functionality before creating new systems

## Enemies

Enemies should have explicit states when appropriate

Typical states include:

- idle
- patrol
- chase
- attack
- hurt
- dead

Do not create a separate state-machine implementation for every enemy

Prefer a reusable enemy state system

Enemy-specific behaviour should be implemented through configuration or small specialised behaviours

Enemies should not directly manipulate the UI

## World

The world is divided into connected areas

Areas may contain:

- enemies
- NPCs
- items
- obstacles
- doors
- switches
- transitions

World transitions should be handled by a reusable system

Do not hard-code individual map transitions inside unrelated gameplay classes

## Interaction

Interactive objects should use a common interaction interface

Examples:

- NPCs
- doors
- chests
- switches
- signs

Prefer:

```
object.interact(player)
```

over checking the concrete object type from the player

The player should not contain special-case logic for every interactive object

## Items and inventory

Items should be data-driven

Example:

```json
{
    id: "health_potion",
    name: "Health Potion",
    type: "consumable",
    description: "Restores some health"
}
```

Do not hard-code item behaviour into the UI

The inventory system owns inventory state

The UI displays inventory state

## Dialogue

Dialogue should be data-driven

Do not hard-code long dialogue strings inside scene classes

Dialogue should support:

- multiple lines
- speaker name
- choices when required
- progression
- triggering game events

Keep dialogue data separate from dialogue presentation

## UI

UI should not contain gameplay logic

The UI can display:

- health
- inventory
- current item
- dialogue
- notifications

Gameplay systems should expose state to the UI

Do not make gameplay systems depend directly on specific UI elements

## Maps and assets

Use Phaser's existing tilemap functionality

Keep map data separate from gameplay code

Do not modify source assets destructively

Do not overwrite existing assets unless explicitly requested

Use placeholder graphics when an asset does not exist

Do not generate large amounts of duplicated asset data

## Game design principles

The game should prioritise:

1. Exploration
2. Readability
3. Responsive controls
4. Clear player feedback
5. Simple interactions
6. Gradual introduction of mechanics

New mechanics should be introduced progressively

Avoid unnecessary complexity

Prefer mechanics that can be understood through play

## Code style

Use semicolons

Use 2 spaces for indentation

Use camelCase for variables and functions

Use PascalCase for classes

Use descriptive names

Avoid unnecessary comments

Comments should explain why something is unusual, not what obvious code does

Prefer early returns over deeply nested conditionals

Keep functions small when possible

Avoid premature abstractions

## Phaser conventions

Use Phaser APIs instead of reimplementing functionality that Phaser already provides

Use Phaser scenes for scene lifecycle

Use Arcade Physics unless another physics system is explicitly required

Keep Phaser-specific code close to the systems that need it

Do not create unnecessary Phaser plugins

Reuse existing Phaser groups, physics bodies and systems where possible

## File changes

Before creating a new file, check whether the functionality can reasonably fit into an existing module

Before creating a new system, search the project for existing functionality that solves the same problem

Do not duplicate existing functionality

Prefer small incremental changes

Do not rewrite unrelated code

Do not change public interfaces unless necessary

## Dependencies

Do not add npm dependencies without asking first

Prefer Phaser and existing project utilities

Avoid dependencies for functionality that can be implemented simply with the existing stack

## Debugging

When fixing a bug:

1. Reproduce the problem
2. Identify the root cause
3. Make the smallest reasonable change
4. Test the affected behaviour
5. Check that unrelated behaviour still works

Do not hide errors with empty catch blocks

Do not remove error handling just to make the console quiet

## Validation

After implementing a gameplay feature:

- Run the game
- Test the affected behaviour
- Test the relevant edge cases
- Check the browser console for errors

For player movement changes, test:

- all four directions
- collision
- interaction
- attack
- damage
- transitions

For combat changes, test:

- hitting enemies
- being hit
- knockback
- death
- multiple enemies

## Git

Make focused changes

Do not modify unrelated files

Do not remove existing functionality unless explicitly requested

Do not commit generated files

Do not create commits unless explicitly requested

## Working with the designer

The designer defines:

- player experience
- game feel
- mechanics
- progression
- visual intent
- interaction rules

The agent is responsible for proposing and implementing technical solutions within those constraints

When a design requirement is ambiguous, ask before making a major architectural decision

For small implementation details, choose the simplest solution consistent with the existing architecture

## Important rule

Before implementing a feature:

1. Inspect the existing code
2. Identify related systems
3. Reuse existing functionality where possible
4. Make the smallest change that satisfies the requirement
5. Test the result

Do not immediately start writing code after reading only the user's last message

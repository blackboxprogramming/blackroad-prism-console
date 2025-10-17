CODEx PROMPT — High-Impact Codex Prompts for BlackRoad

## Overview

Below is a structured library of high-impact Codex prompts for the Unity-based BlackRoad platform. The prompts are grouped by category, illustrating natural language commands that drive creation and simulation in Unity. Each example is crafted for expressiveness, modularity, and interoperability across BlackRoad’s modules, enabling rich educational and creative outcomes.

## Natural Language Scene Control

These prompts let users directly control Unity scenes with plain English commands. Users can adjust physics parameters, modify environments, and manipulate objects in real time. Recent prototypes of ChatGPT integration into Unity’s editor show the viability of such direct scene edits via language (e.g. “generate objects, move them, create lights” by simply typing commands). BlackRoad builds on this idea, allowing intuitive modification of virtual worlds without manual coding.

- "Make gravity 1.5× Earth." – Adjusts the global gravity to one-and-a-half times Earth’s normal gravity for the physics engine.
- "Add a solar system model with 8 planets." – Inserts a prebuilt solar system into the scene, with eight orbiting planet objects around a sun.
- "Dim the sunlight to 50% and set the sky to night." – Reduces the main light’s intensity by half and switches the skybox to a nighttime starfield.
- "Spawn 10 bouncing balls with random colors at random positions." – Creates ten sphere objects with random material colors, drops them at random locations, and lets physics make them bounce.
- "Create a terrain with mountains and a river running through it." – Generates a large terrain mesh featuring mountainous elevations and adds a winding river (water object) through the valleys.
- "Place a red cube at (0, 5, 0) and make it twice as large." – Instantiates a cube at coordinates X=0, Y=5, Z=0, applies a red material, and scales it by 2× its original size.
- "Attach a point light above the player character." – Adds a point light source that follows the player avatar, illuminating the area around them.
- "Set the physics time step to half-speed." – Slows down the simulation’s time scale by 50%, making all motion appear in slow motion.
- "Give the ground a friction coefficient of 0.2." – Adjusts the material physics so the ground is quite slippery (low friction), affecting how objects slide.
- "Duplicate the main character and place the copy 5 meters to the right." – Clones the primary character GameObject and positions the new clone 5 units along the X-axis.
- "Remove all trees from the scene." – Finds and deletes all objects tagged or named as “Tree,” clearing the vegetation from the environment.
- "Change the camera to a top-down 2D view." – Repositions and rotates the active camera to an overhead orthographic view, suitable for a 2D-style game perspective.
- "Apply a transparent shader to the glass object (50% opacity)." – Changes the material on the object named “glass” to one that is semi-transparent, allowing light to pass through.
- "Enable real-time shadows for the directional light." – Toggles on dynamic shadows for the main sunlight to add realism to the lighting.
- "Create a new scene called ‘TestLab’ with a default camera and light." – Closes the current scene (saving if needed) and initializes a fresh scene named “TestLab” with a camera and a light source.

## Game Creation

Prompts in this category help users rapidly prototype games by describing the genre, theme, and mechanics in natural language. The Codex model translates these descriptions into Unity game setups – assembling scenes, game objects, scripts, and assets as needed. This aligns with how AI coding assistants can inspire and speed up game development tasks. Each prompt defines a distinct game concept, showcasing BlackRoad’s ability to turn a simple idea into an interactive experience.

- "Build a 2D platformer with a desert theme and variable wind resistance." – Creates a side-scrolling platformer level set in a desert (sand dunes background, cacti, etc.), where wind force affects jumps and projectile motion differently at intervals.
- "Create a first-person maze exploration game with three puzzle rooms and a key to collect." – Generates a 3D maze or dungeon with at least three chambers containing puzzles; the player navigates in first-person view to find a key that unlocks the exit.
- "Develop a top-down survival game in a forest with a day-night cycle and resource gathering." – Sets up a survival scenario in a procedurally generated forest. Includes an in-game clock for day/night, and allows the player to collect wood, food, etc., to survive.
- "Produce a simple racing game with a looping track, 4 AI-driven cars, and a lap timer." – Constructs a race track circuit, spawns four computer-controlled cars with basic AI to navigate the track, and displays a UI lap timer for the player’s car.
- "Make a tower defense game with 3 types of towers and 5 waves of enemies." – Sets up a basic tower defense: a path on which enemies run, three buildable tower prefabs (e.g. arrow, cannon, slow tower), and spawns five increasing waves of enemies. Each tower type has unique effects, and a simple UI tracks the waves.
- "Generate an endless runner game in a jungle setting with procedurally generated obstacles." – Creates a forward-scrolling infinite runner where the player character runs through a jungle. The ground tiles and obstacles spawn randomly ahead of the player to keep the challenge endless.
- "Design a VR escape room with at least 5 interactive clues and a 10-minute time limit." – Sets up a virtual reality scene of a room filled with puzzles. At least five objects are interactive clues that the player must solve, and a countdown timer of 10 minutes is shown to escape.
- "Assemble a chess game with 3D pieces and basic AI for the opposing player." – Instantiates a chessboard with fully modeled 3D chess pieces. The player can move pieces by clicking, and the opposing side is controlled by a simple chess AI algorithm to make legal moves in response.
- "Create a physics-based puzzle game where the player builds a Rube Goldberg machine to achieve a goal." – Provides an empty level with a toolbox of parts that the player can place. The objective is to construct a chain-reaction machine to achieve a final goal; physics governs the interactions.
- "Implement a turn-based strategy game on a hexagonal grid with two factions and resource tiles." – Generates a board of hex tiles, some containing resources. Two factions take turns placing and moving units, collecting resources, and competing for victory.
- "Make a breakout-style arcade game with 5 levels and increasing ball speed." – Creates the classic Breakout game with five levels. Each cleared level loads the next with faster ball speed for higher difficulty.
- "Build a side-scrolling shooter with a spaceship, incoming alien waves, and power-up drops." – Sets up a 2D side-scroll space shooter with enemy waves and collectible power-ups from defeated foes.
- "Design a puzzle platformer where the player can flip gravity to walk on the ceiling." – Creates a platformer that lets the player invert gravity. Level design requires using the mechanic to traverse obstacles.
- "Construct an RTS demo with a base, unit production, and enemy AI attackers." – Builds a small real-time strategy scenario with player and enemy bases, unit production, and basic AI attack waves.
- "Generate a Conway’s Game of Life simulation on a grid, with controls to step or play/pause." – Implements Conway’s Game of Life with controls to advance generations or run continuously.
- "Make an educational quiz game show environment with a virtual host." – Sets up a quiz show stage with a host character, multiple-choice questions, and score tracking.
- "Create a multiplayer capture-the-flag arena with two teams." – Prepares a symmetrical arena with team bases and flags, plus scoring logic for captures.
- "Design an endless puzzle challenge where math equations fall from the sky and must be solved before hitting the ground." – Builds an educational arcade game where falling equations must be solved before impact, with difficulty increasing over time.
- "Build a farm simulator mini-game with plant growing and a day-night cycle." – Creates a small farming loop with planting, growth over accelerated day-night cycles, and harvesting for income.
- "Set up a puzzle where the player must connect lasers and mirrors to activate targets." – Constructs a puzzle room where movable mirrors redirect lasers to light up all targets to win.

## Realistic World-Building

These prompts focus on simulating large-scale real-world systems or environments over time. Using Unity’s capabilities for complex simulations, BlackRoad can create “digital twins” of ecosystems, climates, or cities and let users run what-if scenarios. Each example tasks the AI with setting up a dynamic world and often running a long-term simulation to observe outcomes.

- "Simulate climate change over 100 years on a continent." – Generates a continent-scale environment and simulates changing climate conditions over a century.
- "Create a savannah ecosystem with predators and prey and simulate 20 years of population dynamics." – Builds a savannah scene populated with predator and prey agents, simulating population cycles over decades.
- "Model a city and simulate daily traffic flow and congestion." – Constructs an urban environment with traffic agents to visualize congestion patterns.
- "Simulate a viral epidemic spreading through a population across regions." – Sets up agent-based infection spread with adjustable parameters like transmission rate and travel frequency.
- "Create a rainforest environment and simulate deforestation impacts over 50 years." – Generates a dense jungle and progressively clears forest to study ecological impacts over time.
- "Model a river basin and simulate seasonal flooding and droughts over a decade." – Builds a terrain with a river and simulates weather cycles that cause floods and droughts.
- "Simulate tectonic plate movement and an earthquake in a virtual landscape." – Animates tectonic drift culminating in an earthquake event affecting terrain and structures.
- "Build a world map and simulate the spread of different energy usage (renewables vs fossil) over 50 years." – Tracks regional adoption of energy sources and associated environmental effects over half a century.
- "Simulate ice cap melting and sea level rise on a coastal region." – Models rising seas encroaching on coastal land due to melting ice.
- "Create a city-building scenario and simulate 100 years of urban growth." – Starts from a small town and grows it into a metropolis, tracking infrastructure challenges.
- "Simulate a wildfire spreading through a forest under different wind conditions." – Demonstrates how wind direction and speed alter wildfire progression.
- "Model a simple economy of a town with villagers, farms, and a market over 20 years." – Runs an agent-based economic simulation showing supply, demand, and population changes.
- "Simulate an orbital system of satellites around Earth and monitor their coverage." – Tracks satellite orbits and visualizes coverage gaps over time.
- "Create a digital twin of a farm and simulate crop growth under different weather scenarios." – Tests how varying weather patterns affect crop yields season over season.
- "Simulate the water cycle in a contained environment with mountains, a lake, and an ocean." – Visualizes evaporation, condensation, precipitation, and runoff in a closed system.
- "Model a public transportation system in a city and simulate a day of operation." – Animates buses or trains serving passengers throughout a simulated day.
- "Simulate population genetics in an isolated island over generations." – Demonstrates evolutionary changes in trait frequencies across generations.
- "Create a Mars colony simulation with a habitat, life support systems, and limited resources." – Manages colony resources and survival challenges on Mars.

## Physics & Engineering

Prompts under this category guide the AI to build and test mechanical systems, structures, and devices within the virtual world. Unity’s physics engine allows realistic behavior, so users can experiment with engineering ideas safely.

- "Model an RC car suspension system and test it on rough terrain." – Assembles a small RC car with configurable suspension and drives it over obstacles.
- "Build a Rube Goldberg machine that uses dominoes, ramps, and levers to pop a balloon." – Arranges mechanical components into a chain reaction culminating in a balloon pop.
- "Design a bridge over a river and simulate a stress test with increasing load." – Constructs a bridge and gradually adds weight to observe deformation or failure.
- "Create a trebuchet and simulate launching a projectile." – Builds a medieval trebuchet with hinge joints to fling a projectile, reporting range results.
- "Construct a simple drone with four rotors and test its flight stability." – Assembles a quadcopter and simulates hover stability with disturbances.
- "Simulate a two-piston engine and observe its motion." – Models pistons and crankshaft motion to visualize engine mechanics.
- "Design a robotic arm that can pick up a block and place it on a shelf." – Builds an articulated robotic arm with a programmed pick-and-place sequence.
- "Build a roller coaster track and simulate a cart moving through it." – Generates coaster rails and runs a physics-driven cart through loops and drops.
- "Test a car crash scenario with a vehicle and a wall, including a crash dummy." – Simulates a crash test with impact data and ragdoll motion.
- "Model a wind turbine and simulate power generation at different wind speeds." – Applies varying wind forces to turbine blades and records rotational output.
- "Construct a geodesic dome structure and test its stability under weight." – Builds a geodesic dome and applies loads to demonstrate structural strength.
- "Simulate a simple electrical circuit with a battery, a switch, and a light bulb." – Visualizes circuit behavior by toggling a switch to light a bulb.
- "Create a pendulum clock with gears and simulate its ticking motion." – Assembles a mechanical clock with escapement and moving hands.
- "Design a small aircraft (glider) and test its aerodynamics in a wind tunnel." – Places an aircraft model in a simulated airflow to observe lift and drag.
- "Build a functioning seesaw and simulate different weights on each end." – Demonstrates lever principles with adjustable mass on each side.
- "Model a hydroelectric dam and simulate water flow driving a turbine." – Simulates water release spinning a turbine to illustrate power generation.

## Mathematical & Scientific Visualization

This category includes prompts that turn abstract math and science concepts into visual, interactive forms. By graphing functions, animating formulas, or rendering geometric constructions, BlackRoad helps users gain intuition from visual feedback.

- "Graph a 3D parametric surface and animate its deformation." – Plots a parametric surface and applies animated transformations to illustrate changes over time.
- "Plot the trajectory of a projectile with initial velocity v at angle θ and overlay the theoretical parabola." – Compares simulated projectile motion with analytical solutions.
- "Visualize an electromagnetic field with field lines around a bar magnet." – Renders magnetic field lines that update as magnets move.
- "Generate a 2D fractal pattern (like the Mandelbrot set) and allow zooming into it." – Renders and navigates a fractal for exploratory visualization.
- "Show the solution curve of a simple harmonic oscillator and its energy over time." – Graphs displacement and energy curves alongside a physical oscillator.
- "Animate a Fourier series approximation of a square wave." – Demonstrates convergence of harmonic sums to a square wave.
- "Display a vector field and let the user trace along vectors from a starting point." – Allows tracing streamlines through a visualized vector field.
- "Plot an interactive 3D curve (e.g., a helix) and allow the user to adjust parameters a and b." – Updates the curve in real time as parameters change.
- "Visualize the intersection of a plane with a 3D object (e.g., a cube or sphere) and show the cross-section shape." – Highlights cross-sections produced by slicing solids.
- "Demonstrate an algorithm (like sorting) step by step with visual elements." – Animates algorithm steps, such as bubble sort swaps, to aid understanding.
- "Graph the orbits of the planets and a comet in the solar system in 2D (top-down view)." – Draws orbital paths and animates bodies to show relative periods.
- "Visualize the probability distribution of rolling two dice (histogram of outcomes)." – Simulates rolls and updates a histogram to show distribution.
- "Show a 3D bar chart of population vs year for three different species in an ecosystem simulation." – Converts simulation data into comparative charts.
- "Demonstrate the concept of a derivative by drawing a tangent line on a curve that slides along as you move the point." – Displays tangent lines and slope values interactively.
- "Render a 4D hypercube (tesseract) projection and rotate it." – Animates a rotating tesseract projection to illustrate higher-dimensional geometry.
- "Plot the Lorenz attractor in 3D." – Computes and renders the Lorenz attractor to showcase chaotic dynamics.
- "Show a network graph of nodes and highlight the shortest path between two chosen nodes." – Visualizes graph algorithms by highlighting computed paths.
- "Animate a geometric transformation: for instance, rotate a 2D shape around a point in real time." – Demonstrates transformations with live animation controls.

## Experimental Science Simulations

Experimental science prompts encourage virtual lab experiments where users can test hypotheses and observe phenomena safely. Whether replicating a classic physics experiment or a basic chemistry demo, BlackRoad enables “learning by doing” in a risk-free environment.

- "Drop objects in different fluids and observe drag forces." – Compares descent rates in water, oil, and air to illustrate drag.
- "Conduct a pendulum experiment with variable lengths and measure the period." – Runs multiple pendulums side by side to show period-length relationships.
- "Recreate the double-slit experiment to show an interference pattern." – Demonstrates wave interference via slit configurations and screen patterns.
- "Simulate free-fall on Earth vs the Moon to compare gravitational acceleration." – Shows the same drop happening faster on Earth than on the Moon.
- "Test Galileo’s principle by dropping a heavy ball and a light ball in a vacuum and in air." – Highlights differences caused by air resistance.
- "Measure the range of a projectile at different launch angles (0–90°) keeping speed constant." – Sweeps angles to plot range vs launch angle.
- "Simulate a basic electric circuit to verify Ohm’s Law by varying resistance." – Adjusts resistance and records current to demonstrate V = IR.
- "Investigate how a lens focuses light by simulating rays passing through a convex lens." – Visualizes ray convergence and focal points.
- "Mix virtual chemicals A and B and observe the reaction (e.g., color change or temperature change)." – Depicts chemical reactions via color or temperature shifts.
- "Observe the behavior of gas under different pressures in a container." – Animates particles in a piston-cylinder to illustrate gas laws.
- "Determine how changing a pendulum’s mass affects its swing (with and without air resistance)." – Compares pendulum behavior in vacuum vs air.
- "Shine light of different colors on a solar panel and measure the electric output." – Demonstrates how light wavelength or intensity affects power generation.
- "Roll a wheel down an inclined plane and check if energy is conserved (potential -> kinetic + rotation)." – Calculates energy transfer between forms.
- "Test different wing shapes in a virtual wind tunnel for lift generation." – Compares lift output for multiple airfoil profiles.
- "Simulate a small ecosystem in a closed terrarium to see how populations change." – Tracks population trends in a sealed environment.
- "Illuminate a diffraction grating with a laser and display the diffraction pattern." – Shows how slit spacing influences diffraction patterns.

## Story-Driven Content & Multimodal Output

These prompts highlight creative integrations of simulations with storytelling, media, and interactive narrative. The BlackRoad platform can not only simulate but also generate assets like videos, dialogues, or chat agents that contextualize or dramatize the simulation.

- "Make a game trailer based on my simulation." – Captures footage, adds music, and composes a trailer showcasing the simulation.
- "Create a cinematic fly-through video of the current scene with dynamic camera angles." – Automates camera paths for a dramatic tour of the environment.
- "Generate a narrative storyline and characters for this simulation as if it were an RPG." – Produces lore, characters, and quests derived from the simulation setup.
- "Provide a documentary-style commentary explaining what happens in the simulation." – Writes narration describing key events and trends.
- "Create a chatbot character who lives in the simulation and can answer questions about it." – Introduces an interactive persona that responds with simulation-aware dialogue.
- "Compose an in-world lore book or journal based on the simulation events." – Generates journal entries chronicling major milestones.
- "Capture key moments from the simulation and arrange them into a slideshow with captions." – Produces a narrated slideshow of pivotal snapshots.
- "Turn the simulation results into a news broadcast script." – Writes a news-style report summarizing outcomes and impacts.
- "Design an interactive tutorial scenario using this simulation to teach a concept." – Wraps the simulation in guided steps with instructional prompts.
- "Have an NPC in the simulation narrate in real-time what is happening." – Adds live commentary from an in-world character.
- "Generate a highlight reel of the simulation’s most interesting events in slow motion." – Compiles slow-motion clips of peak action moments.
- "Create a text adventure game based on the simulation environment." – Transforms the environment into an interactive fiction experience.
- "Produce a set of quiz questions and answers derived from the simulation data." – Generates assessment items tied to simulation metrics.
- "Make a comic strip out of the simulation events." – Stylizes snapshots into comic panels with captions or speech bubbles.
- "Narrate the simulation from the perspective of an entity within it." – Writes first-person accounts from a chosen agent’s point of view.
- "Create background music or soundscapes reactive to the simulation’s state." – Generates dynamic audio that responds to simulation conditions.

## Sources & Inspiration

The concept of controlling Unity with natural language has been demonstrated in prototypes, and AI-assisted game development accelerates learning and creative exploration. Unity’s engine supports realistic physics and engineering simulations for “what-if” testing, and it is used in education to let students safely experiment in virtual labs. Combining simulation with narrative (“story and space”) is an emerging field, using game engines as story generators for envisioning complex real-world scenarios. This library of prompts leverages those ideas, illustrating the potential of the BlackRoad platform as a curiosity and creativity engine.

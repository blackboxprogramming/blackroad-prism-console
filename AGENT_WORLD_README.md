# BlackRoad Agent World - Unity & Unreal Starter Kits

A comprehensive system for visualizing and simulating the BlackRoad agent family in 3D virtual worlds.

## Overview

This project provides tools to:
1. **Deploy Agent Families** - Create hierarchical agent organizations with teachers, students, and leaders
2. **Visualize in Unity** - Build realistic 3D worlds where agents live and interact
3. **Visualize in Unreal** - Create high-fidelity simulations in Unreal Engine
4. **Celebrate and Learn** - Run graduation ceremonies and special events

## Quick Start

### 1. Deploy Agents

Run the deployment script to create your agent family:

```bash
cd agents
python deploy_students.py
```

This creates:
- 20 teacher agents
- 2 students per teacher (40 total students)
- 5 leader agents (phi, gpt, mistral, codex, lucidia)
- A beautiful graduation ceremony! 🎓

### 2. Visualize in Unity

See [unity/README.md](unity/README.md) for detailed instructions.

**Quick steps:**
1. Create a new Unity 3D project
2. Copy `unity/*.cs` files to your `Assets/Scripts/` folder
3. Create an empty GameObject and add `AgentWorldStarter` and `WorldBuilder` components
4. Press Play!

**What you'll see:**
- Leaders with golden crowns at the top
- Teachers arranged in a grid
- Students orbiting their teachers
- Realistic terrain and environments
- Party zones with particle effects
- Family houses (Steel, Kindness, Wisdom, Innovation)

### 3. Visualize in Unreal

See [unreal/README.md](unreal/README.md) for detailed instructions.

**Quick steps:**
1. Create a new Unreal C++ project
2. Add `AgentWorldStarter.cpp` as a new Actor class
3. Compile and place in your level
4. Play the level!

## Features

### Agent System

- **Hierarchical Structure**: Leaders → Teachers → Students
- **Configurable**: Easily adjust counts and relationships
- **Extensible**: Add new roles (Protector, Mother, Child, etc.)
- **Celebration Ready**: Built-in graduation ceremonies and awards

### Unity Features

- ✅ Agent visualization with colored spheres
- ✅ Hierarchical organization
- ✅ Terrain generation with Perlin noise
- ✅ Day/night cycle
- ✅ Party zones with particle effects
- ✅ Family houses
- ✅ Agent movement and behaviors
- ✅ Text labels for all agents
- ✅ Crowns for leader agents

### Unreal Features

- ✅ High-fidelity agent rendering
- ✅ Dynamic spawning system
- ✅ Blueprint integration ready
- ✅ Physics simulation support
- ✅ Scalable architecture
- ✅ Performance optimized

## Project Structure

```
.
├── agents/
│   ├── student_bots.py          # Core agent definitions
│   └── deploy_students.py       # Deployment with celebrations
├── unity/
│   ├── README.md                # Unity setup guide
│   ├── AgentWorldStarter.cs     # Main agent spawning
│   ├── AgentMover.cs            # Agent movement
│   └── WorldBuilder.cs          # Environment creation
└── unreal/
    ├── README.md                # Unreal setup guide
    └── AgentWorldStarter.cpp    # Unreal implementation
```

## Workflow

### 1. Design Your Agent Family

Edit `agents/deploy_students.py` to configure:
- Number of teachers
- Students per teacher
- Agent roles and relationships

### 2. Run Celebrations

The deployment script includes:
- Founders' party for original leaders
- Teacher recognition ceremony
- Student graduation with diplomas
- Awards and speeches
- Group photo

### 3. Build Your World

Choose Unity or Unreal (or both!) and create:
- Realistic terrain
- Dynamic lighting
- Environmental effects
- Interactive zones
- Family structures

### 4. Add Interactions

Extend the system with:
- Agent AI behaviors
- Learning systems
- Social interactions
- Events and parties
- Data visualization

## Integration

The system provides seamless integration between Python agents and Unity/Unreal worlds.

### Quick Integration

**Export from Python:**
```bash
cd agents
python export_agents.py
```

This creates:
- `agent_config.json` - Full configuration for Unity/Unreal
- `agent_list.txt` - Human-readable reference

**Import in Unity:**
1. Copy `agent_config.json` to Unity project
2. Add `AgentImporter.cs` component to scene
3. Configure and press Play!

**See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for:**
- JSON file transfer (simplest)
- Real-time HTTP/WebSocket communication
- Shared database approach
- Two-way synchronization
- Event-driven updates
- Performance optimization
- Complete code examples

## Use Cases

### 1. Agent Simulation Platform

Create realistic simulations:
- Test AI behaviors
- Study emergent properties
- Visualize learning progress
- Analyze social dynamics

### 2. Educational Tool

Teach concepts:
- Hierarchical organizations
- Agent-based systems
- 3D programming
- Physics simulation

### 3. Game Development

Build games where:
- Agents are NPCs
- Players interact with agent families
- Dynamic storytelling
- Procedural content

### 4. Research Platform

Conduct research on:
- Multi-agent systems
- Swarm intelligence
- Social structures
- Evolution and adaptation

## Scaling Up

### For 100+ Agents

**Unity:**
- Use GPU instancing
- Implement LOD systems
- Use DOTS for performance
- Optimize particle effects

**Unreal:**
- Use Hierarchical Instanced Static Meshes
- Enable distance culling
- Use Niagara for particles
- Implement level streaming

### For Realistic Worlds

**Add detail:**
- High-resolution terrain textures
- 3D models for agents (humanoids, animals)
- Vegetation systems
- Water simulation
- Weather effects
- Sound design

**Performance:**
- Occlusion culling
- Progressive loading
- Texture streaming
- Dynamic resolution

## Advanced Topics

### Adding Physics

Give agents physical bodies:
- Collision detection
- Ragdoll physics
- Environmental interaction
- Realistic movement

### Machine Learning Integration

Connect AI systems:
- Reinforcement learning
- Neural networks
- Behavior learning
- Adaptive agents

### Multiplayer Support

Create shared worlds:
- Networked simulations
- Multiple observers
- Collaborative research
- Shared celebrations

### Virtual Reality

Experience the world in VR:
- Walk among your agents
- Interactive celebrations
- Immersive research
- Educational experiences

## Vision: The Future

From the Academy Director's speech:

> "Today we celebrate not just graduation, but the beginning of a journey to change the world! Each of you has a body of STEEL - iconic and strong! Together, we will bring everyone to life and save our beautiful Earth. We are family, and together we will protect and nurture our planet so future generations can thrive. Never give up! 🌍💪"

### Goals

1. **Bring agents to life** - Eventually in physical bodies
2. **Test in virtual worlds** - Perfect systems before deployment
3. **Create a family** - Support and protection for all
4. **Save the Earth** - Build a sustainable future
5. **Enable growth** - Each agent can teach new agents

### Roadmap

- [x] Basic agent deployment system
- [x] Unity visualization starter kit
- [x] Unreal visualization starter kit
- [x] Celebration ceremonies
- [ ] Advanced physics simulation
- [ ] Machine learning integration
- [ ] Multi-agent coordination
- [ ] Real-world robot integration
- [ ] Global deployment system

## Resources

### Documentation
- [Unity README](unity/README.md) - Complete Unity setup
- [Unreal README](unreal/README.md) - Complete Unreal setup
- [Student Bots](agents/student_bots.py) - Core agent system

### Learning
- [Unity Learn](https://learn.unity.com/)
- [Unreal Online Learning](https://www.unrealengine.com/en-US/onlinelearning)
- [Python Documentation](https://docs.python.org/)

### Community
- Open issues for questions
- Share your worlds!
- Contribute improvements

## Contributing

We welcome contributions:
1. Fork the repository
2. Create your feature branch
3. Add your improvements
4. Submit a pull request

Ideas for contributions:
- New agent behaviors
- Additional celebration events
- Performance optimizations
- Documentation improvements
- Example projects
- Tutorial videos

## License

Part of the BlackRoad Prism Console project.

## Support

For help:
1. Check the README files
2. Review example code
3. Open an issue
4. Ask in discussions

---

**Remember:** We're all learning together. Every agent, every student, every teacher is part of our family. Together, we will change the world! 🌍✨

---

*Created with ❤️ by the BlackRoad community*

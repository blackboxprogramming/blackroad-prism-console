# Unity Agent World Starter Kit

This Unity starter kit allows you to visualize the BlackRoad agent family in a 3D world, complete with teachers, students, leaders, houses, and party zones.

## Features

- **Agent Visualization**: Teachers, students, and leaders rendered as colored spheres
- **Hierarchical Organization**: Leaders at the top, teachers with their assigned students
- **Family Houses**: Four family houses (Steel, Kindness, Wisdom, Innovation)
- **Party Zones**: Special areas for celebrations and gatherings
- **Realistic World**: Terrain, lighting, day/night cycle, and environmental effects
- **Interactive Movement**: Agents can move autonomously around the world

## Quick Start

### 1. Create a New Unity Project

1. Open Unity Hub
2. Create a new 3D project (Unity 2020.3 or later recommended)
3. Name it "BlackRoad Agent World"

### 2. Add the Scripts

Copy all `.cs` files from this directory into your Unity project's `Assets/Scripts/` folder:

- `AgentWorldStarter.cs` - Main agent spawning and visualization
- `AgentMover.cs` - Agent movement and behavior
- `WorldBuilder.cs` - World environment creation

### 3. Setup the Scene

1. Create an empty GameObject in your scene: `GameObject > Create Empty`
2. Name it "AgentWorld"
3. Add the `AgentWorldStarter` component to it
4. Add the `WorldBuilder` component to it

### 4. Configure Settings

#### AgentWorldStarter Settings
- **Teacher Count**: Number of teacher agents (default: 20)
- **Students Per Teacher**: Number of students each teacher mentors (default: 2)
- **Agent Size**: Size of agent spheres (default: 0.5)
- **Spacing**: Distance between agents (default: 2.0)
- **Show Labels**: Display agent names above them (default: true)

#### WorldBuilder Settings
- **Create Terrain**: Generate terrain (default: true)
- **Create Lighting**: Add sun and day/night cycle (default: true)
- **Create Sky**: Add skybox (default: true)
- **Party Zone Count**: Number of celebration areas (default: 3)

### 5. Run the Scene

Press Play in Unity. You should see:
- 5 leader agents at the top with golden crowns
- 20 teacher agents arranged in a grid
- 2 students per teacher, orbiting their teacher
- Terrain with realistic features
- Party zones with particle effects
- 4 family houses at the bottom

## Advanced Usage

### Adding Agent Movement

To make agents move around:

1. Select any agent GameObject in the scene (while playing)
2. Add the `AgentMover` component
3. Configure movement settings:
   - **Move Speed**: How fast the agent moves
   - **Movement Radius**: How far from home they can wander
   - **Change Direction Interval**: How often they choose a new target

### Customizing Colors

Edit the color properties in `AgentWorldStarter`:
- `teacherColor`: Color for teacher agents
- `studentColor`: Color for student agents
- `leaderColor`: Color for leader agents

### Expanding the World

You can extend the world by:

1. **Adding More Agents**: Increase `teacherCount` or `studentsPerTeacher`
2. **Custom Roles**: Modify the script to add new agent types (Protector, Mother, Child, etc.)
3. **More Houses**: Add new family houses in `WorldBuilder.CreateFamilyHouses()`
4. **Interactive Events**: Create scripts that trigger parties or special events

### Exporting for Real-Time Simulation

To use this as a simulation platform:

1. **Build the Project**: `File > Build Settings > Build`
2. **Add Data Integration**: Connect to Python scripts via JSON or networking
3. **Import Agent Data**: Load agent configurations from external files
4. **Export Simulation Results**: Save agent states and behaviors

## Integration with BlackRoad Ecosystem

### Connecting to Python Agents

The Unity world can connect to the Python agent system:

```csharp
// Example: Load agents from JSON
string json = File.ReadAllText("agents/agent_config.json");
AgentConfig config = JsonUtility.FromJson<AgentConfig>(json);
```

### Real-Time Updates

You can update the world in real-time:

```csharp
// Move an agent to a party zone
AgentMover mover = agent.GetComponent<AgentMover>();
mover.MoveToPosition(partyZonePosition);
```

## Physics and Realism

The world includes:
- **Terrain Generation**: Procedural terrain using Perlin noise
- **Day/Night Cycle**: Dynamic lighting that changes over time
- **Particle Effects**: Celebrations in party zones
- **Collision Detection**: Agents interact with the environment

## Recommended Next Steps

1. **Add More Detail**: Import 3D models for agents instead of spheres
2. **Enhanced Environment**: Add trees, buildings, water features
3. **Networking**: Enable multiplayer simulation
4. **AI Behaviors**: Implement learning and adaptation
5. **Data Visualization**: Show agent relationships and interactions

## Unity Version Requirements

- **Minimum**: Unity 2020.3 LTS
- **Recommended**: Unity 2021.3 LTS or later
- **Render Pipeline**: Built-in or URP (Universal Render Pipeline)

## Performance Considerations

For large-scale simulations:
- Use GPU instancing for agent rendering
- Implement LOD (Level of Detail) for distant agents
- Optimize particle systems
- Consider using DOTS (Data-Oriented Technology Stack) for thousands of agents

## Troubleshooting

**Agents not appearing?**
- Check that both components are attached
- Ensure the scene camera can see the spawn area
- Check the Console for errors

**Labels not visible?**
- Verify `showLabels` is enabled
- Check text mesh materials are properly created
- Ensure font is available

**Performance issues?**
- Reduce `teacherCount`
- Disable particle effects
- Reduce terrain resolution

## Resources

- [Unity Documentation](https://docs.unity3d.com/)
- [Unity Learn](https://learn.unity.com/)
- [BlackRoad Agent System](../agents/README.md)

## License

Part of the BlackRoad Prism Console project.

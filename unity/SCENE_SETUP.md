# Unity Scene Setup - Step-by-Step Guide

This guide walks you through creating your first BlackRoad Agent World scene in Unity.

## Prerequisites

- Unity 2020.3 LTS or later
- Basic understanding of Unity interface

## Step-by-Step Setup

### 1. Create New Project

1. Open Unity Hub
2. Click "New Project"
3. Select "3D" template
4. Name: "BlackRoadAgentWorld"
5. Click "Create"

### 2. Project Structure

Create the following folder structure in your Assets:

```
Assets/
├── Scripts/
│   ├── AgentWorldStarter.cs
│   ├── AgentMover.cs
│   ├── WorldBuilder.cs
│   └── AgentImporter.cs
├── Materials/
│   ├── LeaderMaterial.mat
│   ├── TeacherMaterial.mat
│   └── StudentMaterial.mat
└── Scenes/
    └── AgentWorld.unity
```

### 3. Copy Scripts

Copy all `.cs` files from the repository's `unity/` folder into `Assets/Scripts/`:
- AgentWorldStarter.cs
- AgentMover.cs
- WorldBuilder.cs
- AgentImporter.cs

Wait for Unity to compile them (check bottom-right corner).

### 4. Create Materials

**Leader Material (Gold):**
1. Right-click in `Assets/Materials/` → Create → Material
2. Name it "LeaderMaterial"
3. Set Albedo color to gold: `(255, 215, 0)` or `(1.0, 0.84, 0.0)`
4. Adjust Metallic: 0.5
5. Adjust Smoothness: 0.7

**Teacher Material (Blue):**
1. Create → Material → "TeacherMaterial"
2. Albedo: `(0, 0, 255)` or `(0.0, 0.0, 1.0)`
3. Metallic: 0.3
4. Smoothness: 0.5

**Student Material (Green):**
1. Create → Material → "StudentMaterial"
2. Albedo: `(0, 255, 0)` or `(0.0, 1.0, 0.0)`
3. Metallic: 0.3
4. Smoothness: 0.5

### 5. Setup Main Scene

#### Create Agent World GameObject

1. In Hierarchy: Right-click → Create Empty
2. Name it "AgentWorld"
3. Reset Transform: Position (0, 0, 0)

#### Add Components

**Add AgentWorldStarter:**
1. Select "AgentWorld" GameObject
2. In Inspector: Add Component → Search "AgentWorldStarter"
3. Configure settings:
   - Teacher Count: 20
   - Students Per Teacher: 2
   - Teacher Color: Blue
   - Student Color: Green
   - Leader Color: Gold
   - Agent Size: 0.5
   - Spacing: 2.0
   - Show Labels: ✓ (checked)

**Add WorldBuilder:**
1. Still with "AgentWorld" selected
2. Add Component → Search "WorldBuilder"
3. Configure settings:
   - Terrain Width: 512
   - Terrain Length: 512
   - Create Sky: ✓
   - Create Terrain: ✓
   - Create Lighting: ✓
   - Party Zone Count: 3

### 6. Setup Camera

1. Select "Main Camera" in Hierarchy
2. Set Position: `(0, 50, -50)`
3. Set Rotation: `(30, 0, 0)`
4. Set Field of View: 60

This gives you a good overview of the agent world.

### 7. Test the Scene

1. Press Play (or Ctrl/Cmd + P)
2. You should see:
   - ⭐ 5 gold leader spheres with crowns at the top
   - 🔵 20 blue teacher spheres in a grid
   - 🟢 40 green student spheres around their teachers
   - 🌍 Terrain underneath
   - ☀️ Directional lighting
   - 🎉 Party zones with particles

### 8. Optional: Add Agent Import

If you want to import from Python:

1. Select "AgentWorld" GameObject
2. Add Component → Search "AgentImporter"
3. Configure:
   - Json File Path: "agent_config.json"
   - Auto Import On Start: ✓
   - Leader Material: Drag LeaderMaterial
   - Teacher Material: Drag TeacherMaterial
   - Student Material: Drag StudentMaterial

4. Copy `agent_config.json` from Python export to Unity project root

### 9. Customize the World

#### Adjust Agent Visualization

- Change colors in Materials
- Modify Agent Size in AgentWorldStarter
- Adjust Spacing to spread out or cluster agents

#### Modify Terrain

- Change Terrain Resolution for more/less detail
- Adjust Terrain Height for mountains
- Enable/disable Create Terrain checkbox

#### Add Movement

1. While Playing, select any agent in Hierarchy
2. Add Component → "AgentMover"
3. Configure movement:
   - Move Speed: 2.0
   - Movement Radius: 10.0
   - Can Move: ✓

Watch agents autonomously move around!

#### Adjust Lighting

- Change Day Color for warmer/cooler days
- Change Day Night Cycle Speed (0.1 = slow, 1.0 = fast)
- Modify sun rotation in WorldBuilder

### 10. Save Your Scene

1. File → Save As
2. Name: "AgentWorld"
3. Save in `Assets/Scenes/`

## Advanced Customization

### Add Custom Agent Models

Instead of spheres, use 3D models:

1. Import 3D model (FBX/OBJ) into `Assets/Models/`
2. Create prefab from model
3. Modify `AgentWorldStarter.cs`:
   ```csharp
   public GameObject agentPrefab; // Assign in Inspector
   ```
4. Use prefab instead of primitive sphere

### Add Background Music

1. Import audio file into `Assets/Audio/`
2. Create empty GameObject → "AudioManager"
3. Add Component → Audio Source
4. Assign your audio clip
5. Enable Loop and Play On Awake

### Create Party Events

Script to trigger celebrations:

```csharp
public class PartyTrigger : MonoBehaviour
{
    public ParticleSystem particles;
    
    public void StartParty()
    {
        particles.Play();
        // Add more celebration effects
    }
}
```

### Add UI

1. Right-click Hierarchy → UI → Canvas
2. Add Text elements for:
   - Agent count display
   - Leader names
   - Celebration messages
3. Update from scripts

## Troubleshooting

### Agents Don't Appear

- Check Console for errors (Ctrl/Cmd + Shift + C)
- Verify scripts compiled successfully
- Ensure AgentWorldStarter is attached to GameObject
- Check that BeginPlay is not disabled

### Labels Not Visible

- Verify Show Labels is checked
- Camera might be too far - move closer
- Check TextMesh component is created
- Font might be missing - assign default font

### Terrain Too Flat

- Increase Terrain Height in WorldBuilder
- Modify height map generation in code
- Manually sculpt terrain with Unity tools

### Performance Issues

- Reduce Teacher Count
- Disable Show Labels
- Lower Terrain Resolution
- Disable particle effects in Party Zones
- Reduce Party Zone Count

### Materials Look Wrong

- Check Shader is "Standard" or "Universal Render Pipeline/Lit"
- Verify colors are set correctly (0-1 range or 0-255)
- Check material is assigned to correct agent type

## Next Steps

### Learn Unity Basics

- [Unity Learn](https://learn.unity.com/)
- [Unity Manual](https://docs.unity3d.com/Manual/)
- [Scripting Reference](https://docs.unity3d.com/ScriptReference/)

### Enhance Your World

1. Add more agent types (Protector, Mother, Child)
2. Create interactive UI
3. Implement agent AI behaviors
4. Add networking for multiplayer
5. Export to WebGL for web viewing

### Connect to Python

1. Export agents from Python: `python export_agents.py`
2. Copy `agent_config.json` to Unity project
3. Use AgentImporter to load
4. See [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)

## Example Scenes

### Minimal Scene

Just agents, no terrain:
- AgentWorldStarter only
- Disable Create Terrain in WorldBuilder

### Full Simulation

Everything enabled:
- All WorldBuilder features
- Agent movement
- Party zones
- Import from Python

### Testing Scene

For development:
- Small agent count (5 teachers)
- No terrain
- Simple colors
- Fast iteration

## Keyboard Shortcuts

- **Play/Stop**: Ctrl/Cmd + P
- **Pause**: Ctrl/Cmd + Shift + P
- **Step Frame**: Ctrl/Cmd + Alt + P
- **Scene View**: F
- **Game View**: G

## Saving Work

- Save Scene: Ctrl/Cmd + S
- Save Project: File → Save Project
- Auto-save: Edit → Preferences → Auto Save

## Building for Distribution

1. File → Build Settings
2. Add Scene "AgentWorld"
3. Select Platform (Windows/Mac/Linux)
4. Click Build
5. Choose output folder
6. Share your agent world!

## Resources

- Scripts: [unity/](../unity/)
- Integration: [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)
- Main Guide: [AGENT_WORLD_README.md](../AGENT_WORLD_README.md)

---

**Congratulations!** You've created your first BlackRoad Agent World in Unity! 🎉

Now you can:
- ✅ Visualize agent families
- ✅ Run celebrations
- ✅ Create realistic worlds
- ✅ Connect to Python
- ✅ Build custom simulations

Keep experimenting and building your magical world! 🌍✨

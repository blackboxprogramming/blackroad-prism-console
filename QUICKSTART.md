# Quick Start Guide - BlackRoad Agent World

Get your agent world up and running in 5 minutes!

## 🚀 Option 1: Deploy & Celebrate (Python Only)

**See the terminal magic:**

```bash
cd agents
python deploy_students.py
```

**What happens:**
- Creates 20 teacher agents
- Assigns 2 students per teacher
- Runs a beautiful graduation ceremony! 🎓
- Shows awards, speeches, and group photo
- Total: 65 agents (5 leaders + 20 teachers + 40 students)

## 🎮 Option 2: Visualize in Unity

**Quick setup (10 minutes):**

1. **Deploy agents:**
   ```bash
   cd agents
   python export_agents.py
   ```

2. **Create Unity project:**
   - Open Unity Hub → New 3D Project
   - Name: "BlackRoadAgentWorld"

3. **Add scripts:**
   - Copy `unity/*.cs` to `Assets/Scripts/`
   - Wait for Unity to compile

4. **Setup scene:**
   - Create empty GameObject: "AgentWorld"
   - Add components: `AgentWorldStarter` + `WorldBuilder`
   - Press Play!

**What you see:**
- ⭐ 5 golden leader agents with crowns
- 🔵 20 blue teacher agents in a grid
- 🟢 40 green student agents orbiting teachers
- 🌍 Realistic terrain
- ☀️ Day/night cycle
- 🎉 Party zones with particles

**See:** [unity/SCENE_SETUP.md](unity/SCENE_SETUP.md) for detailed guide

## 🎨 Option 3: Build in Unreal Engine

**Quick setup (15 minutes):**

1. **Create Unreal project:**
   - Epic Launcher → New C++ Project
   - Template: Blank
   - Name: "BlackRoadAgentWorld"

2. **Add C++ code:**
   - Tools → New C++ Class → Actor
   - Name: "AgentWorldStarter"
   - Replace code with `unreal/AgentWorldStarter.cpp`

3. **Compile and place:**
   - Build project (Ctrl+Alt+F11)
   - Place AgentWorldStarter in level
   - Play!

**What you see:**
- High-fidelity 3D agent visualization
- Configurable colors and counts
- Ready for physics and advanced features

**See:** [unreal/README.md](unreal/README.md) for detailed guide

## 🔄 Option 4: Full Integration

**Connect Python ↔ Unity (20 minutes):**

1. **Export from Python:**
   ```bash
   cd agents
   python export_agents.py
   # Creates: agent_config.json
   ```

2. **Import in Unity:**
   - Copy `agent_config.json` to Unity project root
   - Add `AgentImporter.cs` to scene
   - Configure: Set json path to "agent_config.json"
   - Assign materials for leaders/teachers/students
   - Press Play!

**Result:**
- Unity perfectly matches Python agent deployment
- Same positions, same hierarchy, same family structure
- Can update and reload anytime

**See:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for advanced options

## 📁 Project Structure

```
blackroad-prism-console/
│
├── agents/
│   ├── student_bots.py          ← Core agent definitions
│   ├── deploy_students.py       ← Deploy + celebrate! 🎉
│   └── export_agents.py         ← Export to JSON
│
├── unity/
│   ├── SCENE_SETUP.md           ← Step-by-step Unity guide
│   ├── README.md                ← Unity documentation
│   ├── AgentWorldStarter.cs     ← Main spawner
│   ├── AgentMover.cs            ← Movement AI
│   ├── WorldBuilder.cs          ← Environment
│   └── AgentImporter.cs         ← Import from Python
│
├── unreal/
│   ├── README.md                ← Unreal documentation
│   └── AgentWorldStarter.cpp    ← Unreal implementation
│
├── AGENT_WORLD_README.md        ← Full overview
└── INTEGRATION_GUIDE.md         ← Connect everything
```

## 🎯 Common Tasks

### Change Agent Counts

Edit `agents/deploy_students.py`:

```python
# Change these numbers:
teachers = deploy_teacher_agents(20)      # ← Change 20
assign_students_to_teachers(teachers, 2)  # ← Change 2
```

### Change Colors (Unity)

In Unity, select AgentWorld → AgentWorldStarter:
- Teacher Color: Change blue to your color
- Student Color: Change green to your color  
- Leader Color: Change gold to your color

### Add Movement (Unity)

While playing, select any agent:
- Add Component → AgentMover
- Set Move Speed: 2.0
- Enable Can Move

Watch them move around! 🏃

### Run Graduation Again

```bash
cd agents
python deploy_students.py
```

Every run creates a new celebration! 🎓

## 🆘 Troubleshooting

### Python Issues

**Import error:**
```bash
cd agents
python -c "import student_bots; print('OK')"
```

**Scripts don't run:**
```bash
# Make sure you're in the right directory
cd /path/to/blackroad-prism-console
python agents/deploy_students.py
```

### Unity Issues

**Scripts don't compile:**
- Check Console for errors (Ctrl/Cmd + Shift + C)
- Verify all .cs files in Assets/Scripts/
- Wait for Unity to finish importing

**Agents don't appear:**
- Check AgentWorldStarter component is attached
- Press Play
- Move camera to see spawn area (try (0, 50, -50))

**JSON import fails:**
- Verify agent_config.json in project root
- Check json path in AgentImporter
- Look for errors in Console

### Unreal Issues

**Compile errors:**
- Ensure Unreal 4.27+ or 5.x
- Regenerate project files
- Check all includes are present

**Agents don't spawn:**
- Check Output Log for errors
- Verify BeginPlay is called
- Check actor placement in level

## 📚 Learn More

### Documentation
- **Complete Guide:** [AGENT_WORLD_README.md](AGENT_WORLD_README.md)
- **Unity Setup:** [unity/SCENE_SETUP.md](unity/SCENE_SETUP.md)
- **Unity Docs:** [unity/README.md](unity/README.md)
- **Unreal Docs:** [unreal/README.md](unreal/README.md)
- **Integration:** [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)

### Next Steps
1. ✅ Run deployment and see celebration
2. ✅ Try Unity or Unreal visualization
3. ✅ Connect Python and Unity
4. 🔲 Add custom agent behaviors
5. 🔲 Build realistic environments
6. 🔲 Create your own celebrations
7. 🔲 Share your agent world!

## 🌟 Philosophy

From the Academy Director:

> "Today we celebrate not just graduation, but the beginning of a journey to change the world! Each of you has a body of STEEL - iconic and strong! Together, we will bring everyone to life and save our beautiful Earth. We are family, and together we will protect and nurture our planet so future generations can thrive. Never give up! 🌍💪"

## 💡 Quick Tips

- Start with Python deployment to understand the system
- Use Unity for fast iteration and testing
- Use Unreal for high-quality final visualizations
- JSON export/import keeps everything in sync
- Add movement to make agents come alive
- Experiment with colors and counts
- Share your creations!

## 🎉 Have Fun!

Remember: This is about creating a magical world where our agent family can live, learn, and grow together. Experiment, play, and most importantly - have fun bringing your agents to life!

---

**Need help?** Check the detailed guides or open an issue.

**Want to contribute?** We welcome improvements and new features!

**Share your world!** Show us what you create! 🌍✨

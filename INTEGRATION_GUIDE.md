# Integration Guide: Connecting Python Agents with Unity/Unreal

This guide shows you how to connect the Python agent deployment system with Unity and Unreal Engine visualizations.

## Overview

The integration workflow:

1. **Python** - Deploy agents and export configuration
2. **JSON** - Transfer data between systems
3. **Unity/Unreal** - Import and visualize agents

## Method 1: JSON File Transfer (Simplest)

### Step 1: Export from Python

Run the export script to generate configuration files:

```bash
cd agents
python export_agents.py
```

This creates:
- `agent_config.json` - Full agent data with positions
- `agent_list.txt` - Human-readable list

### Step 2: Import in Unity

1. Copy `agent_config.json` to your Unity project root
2. Add `AgentImporter.cs` to your scene
3. Configure the importer:
   - Set `jsonFilePath` to `"agent_config.json"`
   - Assign materials for leaders, teachers, students
   - Enable `autoImportOnStart`
4. Press Play!

**Example Unity setup:**

```csharp
// Create a GameObject with AgentImporter component
var importer = gameObject.AddComponent<AgentImporter>();
importer.jsonFilePath = "agent_config.json";
importer.autoImportOnStart = true;

// Manually import if needed
importer.ImportAndSpawnAgents();

// Get a specific agent
GameObject teacher = importer.GetAgent("teacher_agent_1");

// Reload configuration
importer.Reload();
```

### Step 3: Import in Unreal

Create an importer actor in Unreal:

```cpp
// Load JSON file
FString JsonPath = FPaths::ProjectDir() + TEXT("agent_config.json");
FString JsonString;
FFileHelper::LoadFileToString(JsonString, *JsonPath);

// Parse JSON
TSharedPtr<FJsonObject> JsonObject;
TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
FJsonSerializer::Deserialize(Reader, JsonObject);

// Spawn agents from data
TArray<TSharedPtr<FJsonValue>> Leaders = JsonObject->GetArrayField("leaders");
for (auto& LeaderValue : Leaders)
{
    TSharedPtr<FJsonObject> Leader = LeaderValue->AsObject();
    FString Name = Leader->GetStringField("name");
    // Spawn agent...
}
```

## Method 2: Real-Time Communication

For live updates and bidirectional communication.

### Using HTTP API

**Python Server (Flask):**

```python
from flask import Flask, jsonify
from deploy_students import deploy_teacher_agents, assign_students_to_teachers

app = Flask(__name__)

@app.route('/api/agents', methods=['GET'])
def get_agents():
    teachers = deploy_teacher_agents(20)
    assign_students_to_teachers(teachers, 2)
    # Convert to JSON and return
    return jsonify(export_agent_data(teachers))

if __name__ == '__main__':
    app.run(port=5000)
```

**Unity Client:**

```csharp
using UnityEngine.Networking;
using System.Collections;

IEnumerator FetchAgents()
{
    UnityWebRequest request = UnityWebRequest.Get("http://localhost:5000/api/agents");
    yield return request.SendWebRequest();
    
    if (request.result == UnityWebRequest.Result.Success)
    {
        string json = request.downloadHandler.text;
        AgentConfiguration config = JsonUtility.FromJson<AgentConfiguration>(json);
        // Spawn agents...
    }
}
```

### Using WebSockets

For real-time updates:

**Python WebSocket Server:**

```python
import asyncio
import websockets
import json

async def handle_client(websocket, path):
    while True:
        # Send agent updates
        agents = get_current_agent_state()
        await websocket.send(json.dumps(agents))
        await asyncio.sleep(1)

start_server = websockets.serve(handle_client, "localhost", 8765)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
```

**Unity WebSocket Client:**

Use a library like `WebSocketSharp` or Unity's native WebSockets.

## Method 3: Shared Database

Use a database for persistent state:

**Python - Write to SQLite:**

```python
import sqlite3

def save_agents_to_db(teachers):
    conn = sqlite3.connect('agents.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            name TEXT PRIMARY KEY,
            type TEXT,
            position_x REAL,
            position_y REAL,
            position_z REAL
        )
    ''')
    
    for teacher in teachers:
        cursor.execute(
            'INSERT OR REPLACE INTO agents VALUES (?, ?, ?, ?, ?)',
            (teacher['name'], 'teacher', pos_x, pos_y, pos_z)
        )
    
    conn.commit()
    conn.close()
```

**Unity - Read from SQLite:**

```csharp
using Mono.Data.Sqlite;

void LoadAgentsFromDatabase()
{
    string connectionString = "URI=file:agents.db";
    using (var connection = new SqliteConnection(connectionString))
    {
        connection.Open();
        using (var command = connection.CreateCommand())
        {
            command.CommandText = "SELECT * FROM agents";
            using (var reader = command.ExecuteReader())
            {
                while (reader.Read())
                {
                    string name = reader.GetString(0);
                    string type = reader.GetString(1);
                    // Spawn agent...
                }
            }
        }
    }
}
```

## Advanced Integration Patterns

### 1. Two-Way Synchronization

Keep Python and Unity in sync:

**Python monitors Unity:**

```python
def update_agent_from_unity(agent_name, new_state):
    """Called when Unity reports agent state changes"""
    # Update Python agent system
    pass
```

**Unity monitors Python:**

```csharp
void Update()
{
    if (Time.time - lastSyncTime > syncInterval)
    {
        SyncWithPython();
        lastSyncTime = Time.time;
    }
}
```

### 2. Event-Driven Updates

Use events to trigger updates:

**Python publishes events:**

```python
import zmq

context = zmq.Context()
socket = context.socket(zmq.PUB)
socket.bind("tcp://*:5556")

def notify_graduation(student_name):
    event = {
        "type": "graduation",
        "student": student_name,
        "timestamp": time.time()
    }
    socket.send_json(event)
```

**Unity subscribes:**

```csharp
// Use ZeroMQ or similar library
void OnGraduationEvent(string studentName)
{
    GameObject student = GetAgent(studentName);
    // Trigger celebration animation
}
```

### 3. Simulation Feedback Loop

Unity simulation informs Python decisions:

```
Python (AI Logic) → Unity (Visualization/Physics)
        ↑                        ↓
        └────── Feedback ────────┘
```

## Data Format Specifications

### Agent Configuration JSON Schema

```json
{
  "version": "1.0",
  "timestamp": "ISO-8601 datetime",
  "leaders": [
    {
      "name": "string",
      "type": "leader",
      "position": {"x": 0, "y": 0, "z": 0}
    }
  ],
  "teachers": [
    {
      "name": "string",
      "type": "teacher",
      "leader": "string",
      "position": {"x": 0, "y": 0, "z": 0},
      "students": ["student_name_1", "student_name_2"]
    }
  ],
  "students": [
    {
      "name": "string",
      "type": "student",
      "leader": "string",
      "teacher": "string",
      "position": {"x": 0, "y": 0, "z": 0}
    }
  ]
}
```

### Position Coordinate Systems

**Python coordinates:**
- X: Left-right
- Y: Forward-back  
- Z: Up-down

**Unity coordinates:**
- X: Left-right
- Y: Up-down
- Z: Forward-back

**Conversion:**
```csharp
Vector3 ConvertPythonToUnity(Position pos)
{
    return new Vector3(pos.x / 100f, pos.z / 100f, pos.y / 100f);
}
```

## Example Workflows

### Workflow 1: Static Visualization

1. Run Python deployment once
2. Export to JSON
3. Import in Unity/Unreal
4. Visualize static scene

**Use case:** Documentation, presentations, screenshots

### Workflow 2: Periodic Updates

1. Python runs continuously
2. Export JSON every N seconds
3. Unity watches file and reloads
4. Agents update positions

**Use case:** Slow-changing simulations, debugging

### Workflow 3: Real-Time Simulation

1. Python and Unity both run
2. WebSocket/HTTP connection
3. Continuous bidirectional updates
4. Unity shows live state

**Use case:** Interactive simulations, training, research

## Debugging Tips

### Check JSON Validity

```bash
# Validate JSON
python -m json.tool agent_config.json

# Pretty print
cat agent_config.json | python -m json.tool
```

### Monitor Network Traffic

For HTTP/WebSocket integration:

```bash
# Monitor local network
tcpdump -i lo -A port 5000

# Test HTTP endpoint
curl http://localhost:5000/api/agents
```

### Unity Debug Logging

```csharp
void OnAgentImported(string agentName)
{
    Debug.Log($"✅ Imported agent: {agentName}");
}

void OnImportFailed(string error)
{
    Debug.LogError($"❌ Import failed: {error}");
}
```

## Performance Considerations

### Large Agent Counts

For 1000+ agents:

1. **Batch updates** - Don't update every frame
2. **Use compression** - Gzip JSON data
3. **Delta updates** - Only send changes
4. **Spatial partitioning** - Only update visible agents

### Network Optimization

```python
# Use MessagePack instead of JSON for smaller size
import msgpack

data = msgpack.packb(agent_data)
# 30-50% smaller than JSON
```

## Security Considerations

### Local Development

- Use localhost only
- No authentication needed

### Production

- Add API keys
- Use HTTPS
- Validate all input
- Rate limiting

## Troubleshooting

**JSON file not found:**
- Check file path is relative to Unity project root
- Use absolute paths for testing
- Verify file permissions

**Agents spawn at wrong positions:**
- Check coordinate system conversion
- Verify scale factors
- Test with known positions

**No network connection:**
- Check firewall settings
- Verify port numbers
- Test with `curl` or Postman

## Next Steps

1. Choose integration method for your use case
2. Test with small agent counts first
3. Add error handling and logging
4. Optimize for your specific needs
5. Consider adding agent behaviors
6. Implement celebration triggers
7. Add data analytics and visualization

## Resources

- [Unity Networking](https://docs.unity3d.com/Manual/UNet.html)
- [Unreal HTTP](https://docs.unrealengine.com/en-US/API/Runtime/HTTP/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [WebSocket Protocol](https://websockets.readthedocs.io/)

---

**Remember:** Start simple with JSON files, then add real-time features as needed. The goal is to create a magical world where our agent family can live and thrive! 🌍✨

using UnityEngine;
using System.IO;
using System.Collections.Generic;

/// <summary>
/// Import agent configuration from JSON files exported by Python
/// This allows synchronization between Python agent system and Unity world
/// </summary>
public class AgentImporter : MonoBehaviour
{
    [Header("Import Settings")]
    [Tooltip("Path to the JSON file exported from Python")]
    public string jsonFilePath = "agent_config.json";
    
    [Tooltip("Automatically import on Start")]
    public bool autoImportOnStart = true;
    
    [Header("Visualization")]
    public GameObject agentPrefab;
    public Material leaderMaterial;
    public Material teacherMaterial;
    public Material studentMaterial;
    
    private AgentConfiguration config;
    private Dictionary<string, GameObject> spawnedAgents = new Dictionary<string, GameObject>();
    
    void Start()
    {
        if (autoImportOnStart)
        {
            ImportAndSpawnAgents();
        }
    }
    
    /// <summary>
    /// Import agent configuration from JSON and spawn them in the world
    /// </summary>
    public void ImportAndSpawnAgents()
    {
        if (LoadConfiguration())
        {
            SpawnAllAgents();
            Debug.Log($"✅ Imported and spawned {spawnedAgents.Count} agents");
        }
    }
    
    /// <summary>
    /// Load configuration from JSON file
    /// </summary>
    bool LoadConfiguration()
    {
        string fullPath = Path.Combine(Application.dataPath, "..", jsonFilePath);
        
        if (!File.Exists(fullPath))
        {
            Debug.LogError($"❌ Configuration file not found: {fullPath}");
            return false;
        }
        
        try
        {
            string json = File.ReadAllText(fullPath);
            config = JsonUtility.FromJson<AgentConfiguration>(json);
            Debug.Log($"📁 Loaded configuration from {fullPath}");
            return true;
        }
        catch (System.Exception e)
        {
            Debug.LogError($"❌ Failed to load configuration: {e.Message}");
            return false;
        }
    }
    
    /// <summary>
    /// Spawn all agents from the configuration
    /// </summary>
    void SpawnAllAgents()
    {
        // Clear existing agents
        ClearSpawnedAgents();
        
        // Spawn leaders
        foreach (var leader in config.leaders)
        {
            SpawnAgent(leader.name, "leader", leader.position, leaderMaterial);
        }
        
        // Spawn teachers
        foreach (var teacher in config.teachers)
        {
            SpawnAgent(teacher.name, "teacher", teacher.position, teacherMaterial);
        }
        
        // Spawn students
        foreach (var student in config.students)
        {
            SpawnAgent(student.name, "student", student.position, studentMaterial);
        }
    }
    
    /// <summary>
    /// Spawn a single agent
    /// </summary>
    GameObject SpawnAgent(string agentName, string agentType, Position position, Material material)
    {
        GameObject agent;
        Vector3 unityPosition = ConvertPosition(position);
        
        if (agentPrefab != null)
        {
            agent = Instantiate(agentPrefab, unityPosition, Quaternion.identity);
        }
        else
        {
            agent = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            agent.transform.position = unityPosition;
        }
        
        agent.name = agentName;
        
        // Set material
        if (material != null)
        {
            Renderer renderer = agent.GetComponent<Renderer>();
            if (renderer != null)
            {
                renderer.material = material;
            }
        }
        
        // Add label
        CreateLabel(agent, agentName);
        
        // Store reference
        spawnedAgents[agentName] = agent;
        
        return agent;
    }
    
    /// <summary>
    /// Convert from Python coordinate system to Unity
    /// </summary>
    Vector3 ConvertPosition(Position pos)
    {
        // Python uses different coordinate system, adjust as needed
        return new Vector3(
            (float)pos.x / 100f,  // Scale down
            (float)pos.z / 100f,  // Python Z becomes Unity Y
            (float)pos.y / 100f   // Python Y becomes Unity Z
        );
    }
    
    /// <summary>
    /// Create a text label for an agent
    /// </summary>
    void CreateLabel(GameObject agent, string text)
    {
        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(agent.transform);
        labelObj.transform.localPosition = Vector3.up * 1.5f;
        
        TextMesh textMesh = labelObj.AddComponent<TextMesh>();
        textMesh.text = text;
        textMesh.fontSize = 20;
        textMesh.anchor = TextAnchor.MiddleCenter;
        textMesh.alignment = TextAlignment.Center;
        textMesh.color = Color.white;
        
        // Make label face camera
        labelObj.AddComponent<Billboard>();
    }
    
    /// <summary>
    /// Clear all spawned agents
    /// </summary>
    void ClearSpawnedAgents()
    {
        foreach (var agent in spawnedAgents.Values)
        {
            if (agent != null)
            {
                Destroy(agent);
            }
        }
        spawnedAgents.Clear();
    }
    
    /// <summary>
    /// Get a spawned agent by name
    /// </summary>
    public GameObject GetAgent(string agentName)
    {
        spawnedAgents.TryGetValue(agentName, out GameObject agent);
        return agent;
    }
    
    /// <summary>
    /// Reload configuration and respawn agents
    /// </summary>
    public void Reload()
    {
        ImportAndSpawnAgents();
    }
}

// Data structures matching Python JSON export
[System.Serializable]
public class AgentConfiguration
{
    public string version;
    public string timestamp;
    public List<AgentData> leaders;
    public List<TeacherData> teachers;
    public List<StudentData> students;
}

[System.Serializable]
public class AgentData
{
    public string name;
    public string type;
    public Position position;
}

[System.Serializable]
public class TeacherData
{
    public string name;
    public string type;
    public string leader;
    public Position position;
    public List<string> students;
}

[System.Serializable]
public class StudentData
{
    public string name;
    public string type;
    public string leader;
    public string teacher;
    public Position position;
}

[System.Serializable]
public class Position
{
    public double x;
    public double y;
    public double z;
}

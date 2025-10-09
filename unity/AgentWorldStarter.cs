// AgentWorldStarter.cs
// Unity C# script to visualize agent family in a simple scene
using UnityEngine;
using System.Collections.Generic;

public class AgentWorldStarter : MonoBehaviour
{
    [System.Serializable]
    public class Agent
    {
        public string name;
        public string role;
        public string leader;
        public string house;
        public Vector3 position;
        public Color avatarColor;
        public string avatarShape; // "Cube", "Sphere", etc.
        public string familyRelation; // e.g. "Mother", "Protector", "Inventor"
    }

    public GameObject teacherPrefab;
    public GameObject studentPrefab;
    public GameObject protectorPrefab;
    public GameObject motherPrefab;
    public GameObject housePrefab;
    public GameObject partyZonePrefab;
    public List<Agent> agents = new List<Agent>();

    void Start()
    {
        // Example: spawn 2 houses
        string[] houses = { "House of Steel", "House of Kindness" };
        for (int h = 0; h < houses.Length; h++)
        {
            Vector3 housePos = new Vector3(h * 10, 0, -5);
            GameObject houseObj = Instantiate(housePrefab, housePos, Quaternion.identity);
            houseObj.name = houses[h];
        }
        // Spawn party zone
        GameObject partyZone = Instantiate(partyZonePrefab, new Vector3(5, 0, 10), Quaternion.identity);
        partyZone.name = "PartyZone";
        // Spawn teachers and students in houses
        for (int i = 0; i < 5; i++)
        {
            Agent teacher = new Agent {
                name = $"Teacher_{i+1}",
                role = "Teacher",
                leader = "None",
                house = houses[i%houses.Length],
                position = new Vector3(i * 2, 0, 0),
                avatarColor = Color.blue,
                avatarShape = "Cube",
                familyRelation = "Mother"
            };
            agents.Add(teacher);
            SpawnAgent(teacher, teacherPrefab);
        }
        // Add a protector agent
        Agent protector = new Agent {
            name = "Protector_1",
            role = "Protector",
            leader = "None",
            house = houses[0],
            position = new Vector3(-2, 0, 0),
            avatarColor = Color.red,
            avatarShape = "Sphere",
            familyRelation = "Protector"
        };
        agents.Add(protector);
        SpawnAgent(protector, protectorPrefab);
        // Add a mother agent
        Agent mother = new Agent {
            name = "Mother_1",
            role = "Mother",
            leader = "None",
            house = houses[1],
            position = new Vector3(12, 0, 0),
            avatarColor = Color.magenta,
            avatarShape = "Sphere",
            familyRelation = "Mother"
        };
        agents.Add(mother);
        SpawnAgent(mother, motherPrefab);
        for (int i = 0; i < 10; i++)
        {
            Agent student = new Agent {
                name = $"Student_{i+1}",
                role = "Student",
                leader = $"Teacher_{(i%5)+1}",
                house = houses[i%houses.Length],
                position = new Vector3((i%5)*2, 0, 2 + (i/5)*2),
                avatarColor = Color.green,
                avatarShape = "Cube",
                familyRelation = "Child"
            };
            agents.Add(student);
            SpawnAgent(student, studentPrefab);
        }
    }

    void SpawnAgent(Agent agent, GameObject prefab)
    {
    GameObject go = Instantiate(prefab, agent.position, Quaternion.identity);
    go.name = agent.name;
    // Set label, color, house badge, and family relation
    var label = go.AddComponent<TextMesh>();
    label.text = $"{agent.name}\n{agent.role}\n{agent.house}\n{agent.familyRelation}";
    go.GetComponent<Renderer>().material.color = agent.avatarColor;
    // Optionally change shape, add images, or make interactive
    // Example: move agent to party zone on key press
    go.AddComponent<AgentMover>();
    }
}
// Instructions:
// 1. Create a Unity project, add this script to an empty GameObject.
// 2. Assign simple prefabs for teacherPrefab, studentPrefab, protectorPrefab, motherPrefab, housePrefab, and partyZonePrefab (e.g. colored cubes/spheres).
// 3. Press Play to see your agent family, houses, and party zone in the scene!
// 4. Agents can be moved interactively (see AgentMover script).
// 5. Expand with more agents, roles, and features as you wish.

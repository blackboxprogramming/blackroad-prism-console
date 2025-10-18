using UnityEngine;
using System.Collections.Generic;

/// <summary>
/// Creates a realistic world environment for agents
/// Includes terrain, lighting, weather, and environmental effects
/// </summary>
public class WorldBuilder : MonoBehaviour
{
    [Header("Terrain Settings")]
    public int terrainWidth = 512;
    public int terrainLength = 512;
    public int terrainHeight = 100;
    public int terrainResolution = 512;
    
    [Header("Environment")]
    public bool createSky = true;
    public bool createTerrain = true;
    public bool createLighting = true;
    public bool createWater = false;
    
    [Header("Lighting")]
    public Color dayColor = new Color(1f, 0.95f, 0.8f);
    public Color nightColor = new Color(0.2f, 0.2f, 0.4f);
    public float dayNightCycleSpeed = 0.1f;
    
    [Header("Party Zones")]
    public int partyZoneCount = 3;
    public Color partyZoneColor = new Color(1f, 0.5f, 1f, 0.3f);
    
    private Light sunLight;
    private float timeOfDay = 0.5f;
    
    void Start()
    {
        BuildWorld();
    }
    
    /// <summary>
    /// Build the complete world environment
    /// </summary>
    void BuildWorld()
    {
        Debug.Log("🌍 Building BlackRoad Agent World Environment...");
        
        if (createTerrain)
        {
            CreateTerrain();
        }
        
        if (createLighting)
        {
            CreateLighting();
        }
        
        if (createSky)
        {
            CreateSkybox();
        }
        
        CreatePartyZones();
        CreateFamilyHouses();
        
        Debug.Log("✅ World environment created!");
    }
    
    /// <summary>
    /// Create terrain with realistic features
    /// </summary>
    void CreateTerrain()
    {
        GameObject terrainObj = new GameObject("Terrain");
        Terrain terrain = terrainObj.AddComponent<Terrain>();
        TerrainCollider terrainCollider = terrainObj.AddComponent<TerrainCollider>();
        
        TerrainData terrainData = new TerrainData();
        terrainData.heightmapResolution = terrainResolution;
        terrainData.size = new Vector3(terrainWidth, terrainHeight, terrainLength);
        
        // Generate height map
        GenerateHeightMap(terrainData);
        
        terrain.terrainData = terrainData;
        terrainCollider.terrainData = terrainData;
        
        Debug.Log("  ⛰️ Terrain created");
    }
    
    /// <summary>
    /// Generate a realistic height map for the terrain
    /// </summary>
    void GenerateHeightMap(TerrainData terrainData)
    {
        int resolution = terrainData.heightmapResolution;
        float[,] heights = new float[resolution, resolution];
        
        for (int x = 0; x < resolution; x++)
        {
            for (int y = 0; y < resolution; y++)
            {
                // Use Perlin noise for natural-looking terrain
                float xCoord = (float)x / resolution * 5f;
                float yCoord = (float)y / resolution * 5f;
                
                float height = Mathf.PerlinNoise(xCoord, yCoord) * 0.1f;
                height += Mathf.PerlinNoise(xCoord * 2f, yCoord * 2f) * 0.05f;
                
                heights[x, y] = height;
            }
        }
        
        terrainData.SetHeights(0, 0, heights);
    }
    
    /// <summary>
    /// Create directional lighting with day/night cycle
    /// </summary>
    void CreateLighting()
    {
        GameObject sunObj = new GameObject("Sun");
        sunLight = sunObj.AddComponent<Light>();
        sunLight.type = LightType.Directional;
        sunLight.intensity = 1f;
        sunLight.color = dayColor;
        sunObj.transform.rotation = Quaternion.Euler(50, -30, 0);
        
        Debug.Log("  ☀️ Lighting created");
    }
    
    /// <summary>
    /// Create skybox for the world
    /// </summary>
    void CreateSkybox()
    {
        RenderSettings.skybox = Resources.Load<Material>("Skybox/Procedural");
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Skybox;
        
        Debug.Log("  🌤️ Skybox created");
    }
    
    /// <summary>
    /// Create party zones where celebrations happen
    /// </summary>
    void CreatePartyZones()
    {
        for (int i = 0; i < partyZoneCount; i++)
        {
            Vector3 position = new Vector3(
                Random.Range(-30f, 30f),
                0.1f,
                Random.Range(-30f, 30f)
            );
            
            GameObject zone = CreateZone($"PartyZone_{i + 1}", position, 5f, partyZoneColor);
            
            // Add particle effects for party zones
            CreateParticleEffect(zone.transform);
        }
        
        Debug.Log($"  🎉 Created {partyZoneCount} party zones");
    }
    
    /// <summary>
    /// Create family houses for agent groups
    /// </summary>
    void CreateFamilyHouses()
    {
        string[] houseNames = {
            "House of Steel",
            "House of Kindness",
            "House of Wisdom",
            "House of Innovation"
        };
        
        Color[] houseColors = {
            new Color(0.7f, 0.7f, 0.8f, 0.5f), // Steel
            new Color(1f, 0.8f, 0.8f, 0.5f),   // Kindness
            new Color(0.8f, 0.8f, 1f, 0.5f),   // Wisdom
            new Color(1f, 1f, 0.8f, 0.5f)      // Innovation
        };
        
        for (int i = 0; i < houseNames.Length; i++)
        {
            Vector3 position = new Vector3(
                (i - 1.5f) * 20f,
                0,
                -40f
            );
            
            CreateHouse(houseNames[i], position, houseColors[i]);
        }
        
        Debug.Log($"  🏠 Created {houseNames.Length} family houses");
    }
    
    /// <summary>
    /// Create a single zone marker
    /// </summary>
    GameObject CreateZone(string name, Vector3 position, float radius, Color color)
    {
        GameObject zone = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        zone.name = name;
        zone.transform.position = position;
        zone.transform.localScale = new Vector3(radius, 0.1f, radius);
        
        Renderer renderer = zone.GetComponent<Renderer>();
        Material mat = new Material(Shader.Find("Standard"));
        mat.color = color;
        mat.SetFloat("_Mode", 3); // Transparent mode
        mat.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
        mat.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
        mat.SetInt("_ZWrite", 0);
        mat.DisableKeyword("_ALPHATEST_ON");
        mat.EnableKeyword("_ALPHABLEND_ON");
        mat.DisableKeyword("_ALPHAPREMULTIPLY_ON");
        mat.renderQueue = 3000;
        renderer.material = mat;
        
        return zone;
    }
    
    /// <summary>
    /// Create a house structure
    /// </summary>
    void CreateHouse(string name, Vector3 position, Color color)
    {
        GameObject house = new GameObject(name);
        house.transform.position = position;
        
        // Base
        GameObject baseObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
        baseObj.name = "Base";
        baseObj.transform.SetParent(house.transform);
        baseObj.transform.localPosition = Vector3.zero;
        baseObj.transform.localScale = new Vector3(8, 4, 8);
        baseObj.GetComponent<Renderer>().material.color = color;
        
        // Roof
        GameObject roof = GameObject.CreatePrimitive(PrimitiveType.Cube);
        roof.name = "Roof";
        roof.transform.SetParent(house.transform);
        roof.transform.localPosition = new Vector3(0, 3, 0);
        roof.transform.localScale = new Vector3(10, 1, 10);
        roof.GetComponent<Renderer>().material.color = new Color(color.r * 0.7f, color.g * 0.7f, color.b * 0.7f);
        
        // Add label
        CreateHouseLabel(house.transform, name);
    }
    
    /// <summary>
    /// Create a label for a house
    /// </summary>
    void CreateHouseLabel(Transform parent, string text)
    {
        GameObject labelObj = new GameObject("Label");
        labelObj.transform.SetParent(parent);
        labelObj.transform.localPosition = new Vector3(0, 6, 0);
        
        TextMesh textMesh = labelObj.AddComponent<TextMesh>();
        textMesh.text = text;
        textMesh.fontSize = 30;
        textMesh.anchor = TextAnchor.MiddleCenter;
        textMesh.alignment = TextAlignment.Center;
        textMesh.color = Color.white;
    }
    
    /// <summary>
    /// Create particle effects for party zones
    /// </summary>
    void CreateParticleEffect(Transform parent)
    {
        GameObject particleObj = new GameObject("Particles");
        particleObj.transform.SetParent(parent);
        particleObj.transform.localPosition = Vector3.up * 2;
        
        ParticleSystem ps = particleObj.AddComponent<ParticleSystem>();
        var main = ps.main;
        main.startColor = new Color(1f, 0.5f, 1f);
        main.startSize = 0.2f;
        main.startLifetime = 2f;
        main.maxParticles = 50;
        
        var emission = ps.emission;
        emission.rateOverTime = 10;
        
        var shape = ps.shape;
        shape.shapeType = ParticleSystemShapeType.Sphere;
        shape.radius = 3f;
    }
    
    void Update()
    {
        if (createLighting && sunLight != null)
        {
            UpdateDayNightCycle();
        }
    }
    
    /// <summary>
    /// Update the day/night cycle
    /// </summary>
    void UpdateDayNightCycle()
    {
        timeOfDay += Time.deltaTime * dayNightCycleSpeed;
        if (timeOfDay > 1f) timeOfDay = 0f;
        
        // Update sun rotation
        float angle = timeOfDay * 360f - 90f;
        sunLight.transform.rotation = Quaternion.Euler(angle, -30, 0);
        
        // Update sun color
        sunLight.color = Color.Lerp(nightColor, dayColor, Mathf.Sin(timeOfDay * Mathf.PI));
        sunLight.intensity = Mathf.Lerp(0.1f, 1f, Mathf.Sin(timeOfDay * Mathf.PI));
    }
}

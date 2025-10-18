# Unreal Engine Agent World Starter Kit

This Unreal Engine starter kit creates a 3D visualization of the BlackRoad agent family, complete with teachers, students, and leader agents.

## Features

- **Agent Visualization**: Spawn teachers, students, and leaders as 3D objects
- **Hierarchical Structure**: Leaders with crowns, teachers with student groups
- **Dynamic Spawning**: Configure agent counts and relationships
- **Extensible Design**: Easy to add new features and behaviors

## Quick Start

### 1. Create an Unreal Project

1. Open Epic Games Launcher
2. Create a new Unreal Engine project (4.27 or 5.x)
3. Choose "Blank" template with C++
4. Name it "BlackRoadAgentWorld"

### 2. Add the Source Code

#### Option A: Add to Existing Project

1. Create a new C++ class: `Tools > New C++ Class`
2. Choose "Actor" as the parent class
3. Name it "AgentWorldStarter"
4. Replace the generated code with the contents of `AgentWorldStarter.cpp`

#### Option B: Manual Integration

1. Navigate to your project's `Source/[ProjectName]/` folder
2. Copy `AgentWorldStarter.cpp` into this folder
3. Open your project's `.uproject` file and regenerate project files
4. Compile the project

### 3. Place the Actor in Your Level

1. Open your level in the Unreal Editor
2. In the "Place Actors" panel, search for "AgentWorldStarter"
3. Drag it into your level
4. Position it at the origin (0, 0, 0)

### 4. Configure Settings

Select the AgentWorldStarter actor and adjust settings in the Details panel:

#### Agent Configuration
- **Teacher Count**: Number of teacher agents (default: 20)
- **Students Per Teacher**: Students assigned to each teacher (default: 2)

#### Visualization
- **Teacher Color**: Color for teacher agents (default: Blue)
- **Student Color**: Color for student agents (default: Green)
- **Leader Color**: Color for leader agents (default: Gold)
- **Agent Size**: Size of agent spheres (default: 50.0)
- **Spacing**: Distance between agents (default: 200.0)

#### World Settings
- **Show Labels**: Display text labels above agents (default: true)

### 5. Play the Level

Press Play in the editor. You should see:
- 5 leader agents with golden crowns at the top
- 20 teacher agents in a grid formation
- 2 students per teacher, positioned around their teacher
- Text labels showing agent names

## Advanced Features

### Adding More Capabilities

The current implementation provides a foundation. You can extend it with:

#### 1. Agent Movement

Add a movement component to make agents walk around:

```cpp
// In your agent actor class
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Movement")
float MoveSpeed = 200.0f;

void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
    FVector NewLocation = GetActorLocation() + (GetActorForwardVector() * MoveSpeed * DeltaTime);
    SetActorLocation(NewLocation);
}
```

#### 2. Interactive Behaviors

Make agents respond to events:

```cpp
UFUNCTION(BlueprintCallable, Category = "Agent")
void CelebrateGraduation()
{
    // Play particle effect
    // Change color
    // Display message
}
```

#### 3. Data Integration

Load agent configurations from JSON:

```cpp
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"

void LoadAgentConfig(const FString& FilePath)
{
    FString JsonString;
    FFileHelper::LoadFileToString(JsonString, *FilePath);
    
    TSharedPtr<FJsonObject> JsonObject;
    TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);
    
    if (FJsonSerializer::Deserialize(Reader, JsonObject))
    {
        // Parse and create agents
    }
}
```

### Building a Realistic World

#### Add Terrain

1. In the editor: `Landscape > Landscape Mode`
2. Configure terrain size and resolution
3. Create the landscape
4. Sculpt and paint as desired

#### Add Lighting

1. Add a Directional Light for the sun
2. Add a Sky Light for ambient lighting
3. Configure lighting for day/night cycles:

```cpp
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Lighting")
class ADirectionalLight* SunLight;

void UpdateDayNightCycle(float TimeOfDay)
{
    float Angle = TimeOfDay * 360.0f - 90.0f;
    SunLight->SetActorRotation(FRotator(Angle, -30.0f, 0.0f));
}
```

#### Add Atmospheric Effects

1. Add a Sky Atmosphere component
2. Add Volumetric Clouds
3. Configure fog and post-processing

### Creating Family Houses

Extend the code to create structures:

```cpp
void CreateFamilyHouses()
{
    TArray<FString> HouseNames = {
        TEXT("House of Steel"),
        TEXT("House of Kindness"),
        TEXT("House of Wisdom"),
        TEXT("House of Innovation")
    };
    
    for (int32 i = 0; i < HouseNames.Num(); i++)
    {
        FVector Position((i - 1.5f) * 2000.0f, -4000.0f, 0.0f);
        CreateHouse(HouseNames[i], Position);
    }
}
```

### Physics and Simulation

Enable physics for agents:

```cpp
SphereComponent->SetSimulatePhysics(true);
SphereComponent->SetMassOverrideInKg(NAME_None, 50.0f);
SphereComponent->SetLinearDamping(0.5f);
```

## Integration with BlackRoad Ecosystem

### Python Integration

Connect to Python scripts using:
- Socket communication
- HTTP REST APIs
- File-based JSON exchange
- Unreal Python API (if using Unreal 5)

### Real-Time Updates

Update agents in real-time:

```cpp
UFUNCTION(BlueprintCallable, Category = "Agent")
void UpdateAgentFromData(const FString& AgentName, const FVector& NewPosition)
{
    for (AActor* Agent : Agents)
    {
        if (Agent->GetActorLabel() == AgentName)
        {
            Agent->SetActorLocation(NewPosition);
            break;
        }
    }
}
```

## Blueprint Integration

You can also create Blueprint versions:

1. Create a Blueprint class based on AgentWorldStarter
2. Expose functions to Blueprint:
   ```cpp
   UFUNCTION(BlueprintCallable, Category = "Agent World")
   void SpawnAdditionalAgents(int32 Count);
   ```
3. Create custom events in Blueprint graphs

## Performance Optimization

For large-scale simulations:

### Instance Static Meshes

Use Hierarchical Instanced Static Meshes:

```cpp
UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Optimization")
UHierarchicalInstancedStaticMeshComponent* InstancedAgents;

void CreateInstancedAgents()
{
    for (int32 i = 0; i < 1000; i++)
    {
        FTransform Transform(FVector(i * 100.0f, 0.0f, 0.0f));
        InstancedAgents->AddInstance(Transform);
    }
}
```

### Level of Detail (LOD)

Configure LOD settings for distant agents to reduce draw calls.

### Culling

Implement frustum and distance culling to only render visible agents.

## Recommended Unreal Engine Versions

- **UE 4.27**: Stable, well-documented
- **UE 5.0+**: Latest features, Lumen lighting, Nanite geometry
- **UE 5.3+**: Best performance and features

## Packaging and Deployment

To create a standalone application:

1. `File > Package Project > Windows/Mac/Linux`
2. Choose packaging settings
3. Build the project
4. Distribute the packaged application

## Troubleshooting

**Compile errors?**
- Ensure all includes are present
- Check Unreal Engine version compatibility
- Regenerate project files

**Agents not spawning?**
- Check the Output Log for errors
- Verify BeginPlay is being called
- Check spawn positions aren't out of bounds

**Performance issues?**
- Reduce agent count
- Disable shadows on agent meshes
- Use instanced static meshes

**Labels not showing?**
- Verify TextRenderComponent is registered
- Check font assets are loaded
- Ensure camera is in range

## Resources

- [Unreal Engine Documentation](https://docs.unrealengine.com/)
- [Unreal Engine C++ API](https://docs.unrealengine.com/en-US/API/)
- [Unreal Online Learning](https://www.unrealengine.com/en-US/onlinelearning)
- [BlackRoad Agent System](../agents/README.md)

## Next Steps

1. Add custom 3D models for agents
2. Implement AI behaviors with Behavior Trees
3. Create interactive UI with UMG
4. Add multiplayer networking
5. Integrate with external data sources
6. Create cinematic sequences for celebrations

## License

Part of the BlackRoad Prism Console project.

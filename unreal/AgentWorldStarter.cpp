// AgentWorldStarter.cpp
// Unreal Engine C++ actor to visualize agent family in a simple level
#include "AgentWorldStarter.h"
#include "Engine/World.h"
#include "GameFramework/Actor.h"
#include "UObject/ConstructorHelpers.h"

AAgentWorldStarter::AAgentWorldStarter()
{
    PrimaryActorTick.bCanEverTick = false;
}

void AAgentWorldStarter::BeginPlay()
{
    Super::BeginPlay();
    // Example: spawn 2 houses
    FString houses[2] = {TEXT("House of Steel"), TEXT("House of Kindness")};
    for (int h = 0; h < 2; h++)
    {
        FVector housePos(h * 1000, 0, 0);
        FActorSpawnParameters params;
        params.Name = FName(*houses[h]);
        GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), housePos, FRotator::ZeroRotator, params);
    }
    // Spawn party zone
    FActorSpawnParameters partyParams;
    partyParams.Name = FName(TEXT("PartyZone"));
    GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), FVector(500, 0, 500), FRotator::ZeroRotator, partyParams);
    // Spawn teachers and students in houses
    for (int i = 0; i < 5; i++)
    {
        FVector pos(i * 200, 0, 100);
        SpawnAgent(FString::Printf(TEXT("Teacher_%d"), i + 1), TEXT("Teacher"), TEXT("None"), houses[i % 2], TEXT("Mother"), pos);
    }
    // Add a protector agent
    SpawnAgent(TEXT("Protector_1"), TEXT("Protector"), TEXT("None"), houses[0], TEXT("Protector"), FVector(-200, 0, 100));
    // Add a mother agent
    SpawnAgent(TEXT("Mother_1"), TEXT("Mother"), TEXT("None"), houses[1], TEXT("Mother"), FVector(1000, 0, 100));
    for (int i = 0; i < 10; i++)
    {
        FVector pos((i % 5) * 200, (i / 5) * 200, 300);
        SpawnAgent(FString::Printf(TEXT("Student_%d"), i + 1), TEXT("Student"), FString::Printf(TEXT("Teacher_%d"), (i % 5) + 1), houses[i % 2], TEXT("Child"), pos);
    }
}

void AAgentWorldStarter::SpawnAgent(FString name, FString role, FString leader, FVector position)
{
    // For demo, spawn a simple cube actor at position
    FActorSpawnParameters params;
    params.Name = FName(*name);
    AActor *agentActor = GetWorld()->SpawnActor<AActor>(AActor::StaticClass(), position, FRotator::ZeroRotator, params);
    // Optionally set label, color, house badge, and family relation
    // You can expand with custom meshes, materials, and labels here
    // Example: move agent to party zone on key press (pseudo-code)
    // if (role == "Student" && KeyPressed("P")) agentActor->SetActorLocation(FVector(500,0,500));
}

// Instructions:
// 1. Create a new Unreal C++ project, add this actor to your level.
// 2. Compile and run. You will see teachers and students as cubes in the world!
// 3. Expand with custom meshes, labels, and more as you wish.

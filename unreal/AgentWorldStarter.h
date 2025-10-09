// AgentWorldStarter.h
// Unreal Engine header for agent world starter
#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "AgentWorldStarter.generated.h"

UCLASS()
class AAgentWorldStarter : public AActor
{
    GENERATED_BODY()
public:
    AAgentWorldStarter();
    virtual void BeginPlay() override;
    void SpawnAgent(FString name, FString role, FString leader, FString house, FString familyRelation, FVector position);
};

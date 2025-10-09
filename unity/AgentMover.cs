// AgentMover.cs
// Unity C# script to allow agents to move to the party zone interactively
using UnityEngine;

public class AgentMover : MonoBehaviour
{
    private Vector3 partyZone = new Vector3(5, 0, 10);
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.P))
        {
            transform.position = partyZone;
        }
    }
}
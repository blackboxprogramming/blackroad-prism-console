using UnityEngine;

/// <summary>
/// Makes agents move around in the world
/// Can be attached to any agent GameObject to give it autonomous movement
/// </summary>
public class AgentMover : MonoBehaviour
{
    [Header("Movement Settings")]
    public float moveSpeed = 2f;
    public float rotationSpeed = 3f;
    public float changeDirectionInterval = 3f;
    public float movementRadius = 10f;
    
    [Header("Behavior")]
    public bool canMove = true;
    public bool stayInBounds = true;
    
    private Vector3 targetPosition;
    private Vector3 homePosition;
    private float timeSinceLastChange = 0f;
    
    void Start()
    {
        homePosition = transform.position;
        ChooseNewTarget();
    }
    
    void Update()
    {
        if (!canMove) return;
        
        timeSinceLastChange += Time.deltaTime;
        
        // Choose new target periodically
        if (timeSinceLastChange >= changeDirectionInterval)
        {
            ChooseNewTarget();
            timeSinceLastChange = 0f;
        }
        
        // Move towards target
        MoveToTarget();
    }
    
    /// <summary>
    /// Choose a new random target position
    /// </summary>
    void ChooseNewTarget()
    {
        if (stayInBounds)
        {
            // Stay within radius of home position
            Vector2 randomCircle = Random.insideUnitCircle * movementRadius;
            targetPosition = homePosition + new Vector3(randomCircle.x, 0, randomCircle.y);
        }
        else
        {
            // Move anywhere
            targetPosition = new Vector3(
                Random.Range(-20f, 20f),
                transform.position.y,
                Random.Range(-20f, 20f)
            );
        }
    }
    
    /// <summary>
    /// Move smoothly towards the target position
    /// </summary>
    void MoveToTarget()
    {
        Vector3 direction = (targetPosition - transform.position).normalized;
        direction.y = 0; // Keep on same Y plane
        
        if (direction.magnitude > 0.1f)
        {
            // Rotate towards target
            Quaternion targetRotation = Quaternion.LookRotation(direction);
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, rotationSpeed * Time.deltaTime);
            
            // Move forward
            transform.position += direction * moveSpeed * Time.deltaTime;
        }
    }
    
    /// <summary>
    /// Move to a specific position (can be called from external scripts)
    /// </summary>
    public void MoveToPosition(Vector3 position)
    {
        targetPosition = position;
        timeSinceLastChange = 0f;
    }
    
    /// <summary>
    /// Return to home position
    /// </summary>
    public void ReturnHome()
    {
        targetPosition = homePosition;
        timeSinceLastChange = 0f;
    }
}

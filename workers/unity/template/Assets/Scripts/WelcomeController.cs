using UnityEngine;

namespace BlackRoad.UnityTemplate
{
    public class WelcomeController : MonoBehaviour
    {
        [SerializeField]
        private string message = "Welcome to __PROJECT_NAME__";

        [SerializeField]
        private float rotationSpeed = 45f;

        private void Start()
        {
            Debug.Log($"{message} — Scene: __SCENE_NAME__");
        }

        private void Update()
        {
            transform.Rotate(0f, rotationSpeed * Time.deltaTime, 0f, Space.Self);
        }
    }
}

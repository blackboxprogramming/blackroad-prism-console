using UnityEngine;

namespace BlackRoad.Unity
{
    /// <summary>
    /// Simple bootstrap component that logs when the sample scene starts running.
    /// Values are substituted by the exporter so the generated scene is annotated
    /// with useful metadata for the rest of the pipeline.
    /// </summary>
    public sealed class HelloBlackRoad : MonoBehaviour
    {
        [SerializeField]
        [TextArea]
        private string description = "__DESCRIPTION__";

        [SerializeField]
        private string projectName = "__PROJECT_NAME__";

        [SerializeField]
        private string author = "__AUTHOR__";

        private void Start()
        {
            Debug.Log($"[{projectName}] Scene '{gameObject.name}' booted by {author}. {description}");
        }
    }
}

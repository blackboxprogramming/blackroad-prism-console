using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.Networking;

[Serializable]
public class PrismAssignment
{
    public string id;
    public string title;
    public string prompt;
    public string[] objectives;
}

[Serializable]
public class PrismSubmission
{
    public string assignment_id = string.Empty;
    public string agent_id = string.Empty;
    public List<string> channels = new();
    public SubmissionContent content = new();
}

[Serializable]
public class SubmissionContent
{
    public string text = string.Empty;
}

[Serializable]
public class FeedbackBreakdown
{
    public float echo;
    public float resonance;
    public float temporal;
    public float reciprocity;
    public float pattern;
    public float context;
    public float heart_bridge;
}

[Serializable]
public class Feedback
{
    public string assignment_id = string.Empty;
    public string agent_id = string.Empty;
    public float score;
    public FeedbackBreakdown breakdown = new();
    public string[] comments = Array.Empty<string>();
    public string[] next_steps = Array.Empty<string>();
}

[Serializable]
public class GradeRequest
{
    public string assignment_id = string.Empty;
    public string agent_id = string.Empty;
}

public class PrismHomework : MonoBehaviour
{
    public string ApiBase = "http://localhost:5151";
    public string AgentId = "sim-student";
    public TextMeshProUGUI PromptText;
    public TextMeshProUGUI ObjectivesText;
    public TextMeshProUGUI FeedbackText;
    public TMP_InputField SubmissionBox;

    private PrismAssignment _currentAssignment;

    public void LoadAssignment(string id)
    {
        StartCoroutine(FetchAssignment(id));
    }

    public void Submit()
    {
        if (_currentAssignment == null)
        {
            Debug.LogWarning("PrismHomework: no assignment loaded");
            return;
        }

        var submission = new PrismSubmission
        {
            assignment_id = _currentAssignment.id,
            agent_id = AgentId,
            channels = new List<string> { "text" },
            content = new SubmissionContent { text = SubmissionBox != null ? SubmissionBox.text : string.Empty }
        };

        StartCoroutine(PostJson($"{ApiBase}/submit", JsonUtility.ToJson(submission), OnSubmitComplete));
    }

    public void ShowFeedback(Feedback feedback)
    {
        if (FeedbackText == null)
        {
            Debug.Log("Feedback received: " + JsonUtility.ToJson(feedback, true));
            return;
        }

        var builder = new StringBuilder();
        builder.AppendLine($"Score: {feedback.score:0.00}");
        builder.AppendLine("Breakdown:");
        builder.AppendLine($"  Echo: {feedback.breakdown.echo:0.00}");
        builder.AppendLine($"  Resonance: {feedback.breakdown.resonance:0.00}");
        builder.AppendLine($"  Temporal: {feedback.breakdown.temporal:0.00}");
        builder.AppendLine($"  Reciprocity: {feedback.breakdown.reciprocity:0.00}");
        builder.AppendLine($"  Pattern: {feedback.breakdown.pattern:0.00}");
        builder.AppendLine($"  Context: {feedback.breakdown.context:0.00}");
        builder.AppendLine($"  Heart Bridge: {feedback.breakdown.heart_bridge:0.00}");
        if (feedback.comments is { Length: > 0 })
        {
            builder.AppendLine("Comments:");
            foreach (var comment in feedback.comments)
            {
                builder.AppendLine(" • " + comment);
            }
        }
        if (feedback.next_steps is { Length: > 0 })
        {
            builder.AppendLine("Next Steps:");
            foreach (var step in feedback.next_steps)
            {
                builder.AppendLine(" → " + step);
            }
        }

        FeedbackText.text = builder.ToString();
    }

    private IEnumerator FetchAssignment(string id)
    {
        var request = UnityWebRequest.Get($"{ApiBase}/assignments/{id}");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Failed to load assignment {id}: {request.error}");
            yield break;
        }

        _currentAssignment = JsonUtility.FromJson<PrismAssignment>(request.downloadHandler.text);
        if (PromptText != null)
        {
            PromptText.text = _currentAssignment.prompt;
        }

        if (ObjectivesText != null)
        {
            if (_currentAssignment.objectives != null && _currentAssignment.objectives.Length > 0)
            {
                ObjectivesText.text = string.Join("\n", _currentAssignment.objectives);
            }
            else
            {
                ObjectivesText.text = string.Empty;
            }
        }
    }

    private void OnSubmitComplete(string responseText)
    {
        Debug.Log("Submission queued: " + responseText);
        StartCoroutine(RequestGrade());
    }

    private IEnumerator RequestGrade()
    {
        if (_currentAssignment == null)
        {
            yield break;
        }

        var requestPayload = new GradeRequest
        {
            assignment_id = _currentAssignment.id,
            agent_id = AgentId
        };

        string json = JsonUtility.ToJson(requestPayload);
        yield return PostJsonCoroutine($"{ApiBase}/grade", json, OnGradeReceived);
    }

    private void OnGradeReceived(string responseText)
    {
        var feedback = JsonUtility.FromJson<Feedback>(responseText);
        ShowFeedback(feedback);
    }

    private IEnumerator PostJson(string url, string json, Action<string> onComplete)
    {
        yield return PostJsonCoroutine(url, json, onComplete);
    }

    private IEnumerator PostJsonCoroutine(string url, string json, Action<string> onComplete)
    {
        using var request = new UnityWebRequest(url, UnityWebRequest.kHttpVerbPOST);
        byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogError($"Request to {url} failed: {request.error}");
            yield break;
        }

        onComplete?.Invoke(request.downloadHandler.text);
    }
}

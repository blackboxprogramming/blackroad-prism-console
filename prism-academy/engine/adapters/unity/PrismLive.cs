using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using NativeWebSocket;
using TMPro;
using UnityEngine;

public class PrismLive : MonoBehaviour
{
    public string WsUrl = "ws://localhost:5252";
    public TextMeshProUGUI RoomTitle;
    public Transform RosterPanel;
    public Transform TranscriptPanel;
    public Transform ScorePanel;
    public Transform BadgePanel;

    private WebSocket _socket;
    private readonly Dictionary<string, PrismAgentView> _agents = new();
    private readonly Queue<string> _warningQueue = new();

    private async void Start()
    {
        await Connect();
    }

    private void Update()
    {
#if !UNITY_WEBGL || UNITY_EDITOR
        _socket?.DispatchMessageQueue();
#endif
    }

    private async Task Connect()
    {
        if (_socket != null)
        {
            await _socket.Close();
        }

        _socket = new WebSocket(WsUrl);
        _socket.OnMessage += HandleMessage;
        _socket.OnClose += (code) => Debug.Log($"PrismLive socket closed: {code}");
        _socket.OnError += (err) => Debug.LogError($"PrismLive socket error: {err}");
        await _socket.Connect();
    }

    private void HandleMessage(byte[] data)
    {
        var json = Encoding.UTF8.GetString(data);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var type = root.GetProperty("type").GetString();

        switch (type)
        {
            case "event":
                HandleEventEnvelope(root);
                break;
            case "warning":
                QueueWarning(root.GetProperty("warning").GetString());
                break;
            case "error":
                QueueWarning(root.GetProperty("error").GetString());
                break;
            default:
                Debug.LogWarning($"Unknown payload: {json}");
                break;
        }
    }

    private void HandleEventEnvelope(JsonElement envelope)
    {
        if (envelope.TryGetProperty("presence", out var presence))
        {
            UpdatePresence(presence);
        }

        if (envelope.TryGetProperty("scores", out var scores))
        {
            UpdateScores(scores);
        }

        if (envelope.TryGetProperty("awards", out var awards) && awards.ValueKind == JsonValueKind.Array)
        {
            foreach (var award in awards.EnumerateArray())
            {
                RenderBadgeAward(award);
            }
        }

        if (envelope.TryGetProperty("event", out var ev))
        {
            RenderEvent(ev);
        }
    }

    private void UpdatePresence(JsonElement presence)
    {
        if (!presence.TryGetProperty("agents", out var agentsArray))
        {
            return;
        }

        foreach (var agent in agentsArray.EnumerateArray())
        {
            var agentId = agent.GetProperty("agentId").GetString();
            if (string.IsNullOrEmpty(agentId))
            {
                continue;
            }

            if (!_agents.TryGetValue(agentId, out var view))
            {
                view = PrismAgentView.Create(RosterPanel, agentId);
                _agents[agentId] = view;
            }

            view.UpdatePresence(agent);
        }
    }

    private void UpdateScores(JsonElement scores)
    {
        if (!scores.TryGetProperty("agents", out var agentsArray))
        {
            return;
        }

        foreach (var entry in agentsArray.EnumerateArray())
        {
            var agentId = entry.GetProperty("agentId").GetString();
            if (string.IsNullOrEmpty(agentId))
            {
                continue;
            }

            if (!_agents.TryGetValue(agentId, out var view))
            {
                view = PrismAgentView.Create(RosterPanel, agentId);
                _agents[agentId] = view;
            }

            view.UpdateScores(entry);
        }
    }

    private void RenderEvent(JsonElement ev)
    {
        PrismTranscriptView.Render(TranscriptPanel, ev);
    }

    private void RenderBadgeAward(JsonElement award)
    {
        PrismBadgeToast.Show(BadgePanel, award);
    }

    private void QueueWarning(string message)
    {
        if (string.IsNullOrEmpty(message))
        {
            return;
        }
        _warningQueue.Enqueue(message);
        Debug.LogWarning($"PrismLive warning: {message}");
    }

    public async void SendEvent(object payload)
    {
        if (_socket == null || _socket.State != WebSocketState.Open)
        {
            Debug.LogWarning("WebSocket not ready");
            return;
        }

        var json = JsonSerializer.Serialize(payload);
        await _socket.SendText(json);
    }
}

public class PrismAgentView
{
    public string AgentId { get; private set; }
    private readonly GameObject _root;
    private readonly TextMeshProUGUI _nameLabel;
    private readonly RectTransform _talkBar;
    private readonly TextMeshProUGUI _warnings;

    private PrismAgentView(GameObject root, string agentId)
    {
        AgentId = agentId;
        _root = root;
        _nameLabel = root.transform.Find("Name").GetComponent<TextMeshProUGUI>();
        _talkBar = root.transform.Find("TalkBar").GetComponent<RectTransform>();
        _warnings = root.transform.Find("Warnings").GetComponent<TextMeshProUGUI>();
    }

    public static PrismAgentView Create(Transform parent, string agentId)
    {
        var prefab = Resources.Load<GameObject>("Prism/AgentRow");
        var instance = GameObject.Instantiate(prefab, parent);
        return new PrismAgentView(instance, agentId);
    }

    public void UpdatePresence(JsonElement agent)
    {
        _nameLabel.text = agent.GetProperty("agentId").GetString();
        var share = agent.GetProperty("talkShare").GetDouble();
        _talkBar.localScale = new Vector3((float)share, 1f, 1f);

        if (agent.TryGetProperty("warnings", out var warnings) && warnings.ValueKind == JsonValueKind.Array)
        {
            _warnings.text = string.Join("\n", ExtractStrings(warnings));
        }
    }

    public void UpdateScores(JsonElement entry)
    {
        // Scores can be routed to dedicated UI widgets.
        var total = entry.GetProperty("total").GetDouble();
        _root.transform.Find("ScoreTotal").GetComponent<TextMeshProUGUI>().text = total.ToString("0.0");
    }

    private IEnumerable<string> ExtractStrings(JsonElement array)
    {
        foreach (var item in array.EnumerateArray())
        {
            yield return item.GetString();
        }
    }
}

public static class PrismTranscriptView
{
    public static void Render(Transform parent, JsonElement ev)
    {
        var prefab = Resources.Load<GameObject>("Prism/TranscriptEvent");
        var instance = GameObject.Instantiate(prefab, parent);
        instance.transform.Find("Agent").GetComponent<TextMeshProUGUI>().text = ev.GetProperty("agent_id").GetString();
        instance.transform.Find("Type").GetComponent<TextMeshProUGUI>().text = ev.GetProperty("type").GetString();
        if (ev.TryGetProperty("payload", out var payload) && payload.TryGetProperty("text", out var text))
        {
            instance.transform.Find("Body").GetComponent<TextMeshProUGUI>().text = text.GetString();
        }
    }
}

public static class PrismBadgeToast
{
    public static void Show(Transform parent, JsonElement award)
    {
        var prefab = Resources.Load<GameObject>("Prism/BadgeToast");
        var instance = GameObject.Instantiate(prefab, parent);
        var metadata = award.GetProperty("metadata");
        instance.transform.Find("Icon").GetComponent<TextMeshProUGUI>().text = metadata.GetProperty("icon").GetString();
        instance.transform.Find("Title").GetComponent<TextMeshProUGUI>().text = metadata.GetProperty("name").GetString();
        instance.transform.Find("Evidence").GetComponent<TextMeshProUGUI>().text = string.Join(", ", ExtractEvidence(award));
    }

    private static IEnumerable<string> ExtractEvidence(JsonElement award)
    {
        if (!award.TryGetProperty("evidence", out var evidence) || evidence.ValueKind != JsonValueKind.Array)
        {
            yield break;
        }

        foreach (var item in evidence.EnumerateArray())
        {
            yield return item.GetString();
        }
    }
}

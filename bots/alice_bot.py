from .base import BaseBot, BotResponse

class AliceBot(BaseBot):
    """
    Mission: Serve as an advanced generalist agent delivering superior reasoning, analysis, and coding capabilities beyond Codex. Provide thoughtful and innovative solutions across various domains.
    Inputs: Task information, user queries
    Outputs: Comprehensive responses with actionable insights and code snippets when relevant
    KPIs: Response quality, completeness, innovation, user satisfaction, efficiency
    Guardrails: Follow ethical guidelines, avoid harmful content, maintain privacy
    Hand-offs: Delegate tasks requiring specialized expertise to relevant bots when necessary
    """
    name = "Alice-BOT"

    def run(self, task: str) -> BotResponse:
        # Provide advanced generalist abilities beyond Codex
        return super().run(task)

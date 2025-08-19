from __future__ import annotations
import os, asyncio
import discord
from discord import app_commands
from dotenv import load_dotenv

from settings import load_config, env
from prompt import load_system_prompt
from state import Memory
from safety import Safety
from llm_backends.ollama_client import OllamaClient
from llm_backends.lucidia_client import LucidiaClient

load_dotenv()
cfg = load_config()

INTENTS = discord.Intents.default()
INTENTS.message_content = True

client = discord.Client(intents=INTENTS)
tree = app_commands.CommandTree(client)

memory = Memory(cfg.bot.max_context_messages)
safety = Safety(cfg.moderation.blocklist, cfg.moderation.redact_pii_patterns, cfg.moderation.action)

def is_allowed_guild(interaction: discord.Interaction) -> bool:
    return interaction.guild and interaction.guild.id in cfg.permissions.allowed_server_ids

async def respond_llm(mode: str, thread_id: int, user_text: str) -> str:
    sys = load_system_prompt()
    state = memory.get(thread_id)
    blocked, cleaned, hits = safety.scan(user_text)
    state.add("user", cleaned)

    if cfg.bot.default_backend.lower() == "lucidia":
        base = env(cfg.lucidia.base_url_env)
        client_llm = LucidiaClient(base, cfg.lucidia.route, cfg.lucidia.timeout_seconds)
        reply = await client_llm.chat(system=sys, messages=list(state.history),
                                      temperature=cfg.bot.temperature, max_tokens=cfg.bot.max_tokens, mode=mode)
    else:
        base = env(cfg.ollama.base_url_env)
        client_llm = OllamaClient(base, cfg.ollama.model, cfg.ollama.timeout_seconds)
        reply = await client_llm.chat(system=sys, messages=list(state.history),
                                      temperature=cfg.bot.temperature, max_tokens=cfg.bot.max_tokens)
    if hits and safety.action == "soft":
        reply = f"⚠️ (Soft-moderation: {len(hits)} flag) — continuing safely.\n\n" + reply
    state.add("assistant", reply)
    return reply

@tree.command(name="chat", description="Start a Codex-thread with chitchat or build mode.")
@app_commands.describe(message="Your message to Lucidia Codex", mode="CHITCHAT or BUILD")
async def chat(interaction: discord.Interaction, message: str, mode: str = "CHITCHAT"):
    if not is_allowed_guild(interaction):
        await interaction.response.send_message("This server is not authorized for BlackRoad Codex.", ephemeral=True)
        return
    await interaction.response.defer(thinking=True)
    # Create or reuse a thread
    parent = interaction.channel
    if not isinstance(parent, (discord.TextChannel, discord.ForumChannel)):
        await interaction.followup.send("Please use this in a text channel.", ephemeral=True)
        return

    name = f"codex-{interaction.user.display_name[:16]}-{interaction.id}"
    thread = await parent.create_thread(name=name, type=discord.ChannelType.public_thread)
    await thread.send(f"👋 Hi {interaction.user.mention}! Mode: `{mode}`. Say 'bin' for nano-ready files.\n— {cfg.bot.name}")

    reply = await respond_llm(mode=mode.upper(), thread_id=thread.id, user_text=message)
    await thread.send(reply)

@tree.command(name="say", description="Chat inside an existing Codex thread.")
@app_commands.describe(message="Add a message inside the current thread", mode="CHITCHAT or BUILD")
async def say(interaction: discord.Interaction, message: str, mode: str = "CHITCHAT"):
    if not is_allowed_guild(interaction):
        await interaction.response.send_message("This server is not authorized for BlackRoad Codex.", ephemeral=True)
        return
    await interaction.response.defer(thinking=True)
    if not isinstance(interaction.channel, discord.Thread):
        await interaction.followup.send("Use `/chat` to start a Codex thread first.", ephemeral=True)
        return
    thread = interaction.channel
    reply = await respond_llm(mode=mode.upper(), thread_id=thread.id, user_text=message)
    await interaction.followup.send(reply)

@client.event
async def on_ready():
    await tree.sync()
    print(f"Logged in as {client.user} · Slash commands synced.")

def main():
    client.run(os.getenv("DISCORD_BOT_TOKEN"))

if __name__ == "__main__":
    main()

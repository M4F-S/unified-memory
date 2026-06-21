# ingestion/connectors/discord.py
import os
from datetime import datetime
import discord
from discord.ext import commands
from ingestion.synthesis import RawMemory

class DiscordConnector:
    def authenticate(self):
        self.token = os.getenv('DISCORD_BOT_TOKEN')
        return True

    def fetch_data(self, guild_ids=None, max_messages=200):
        memories = []
        # Note: Discord connector requires running async event loop
        # Use discord.py client to fetch message history
        # This is a simplified sync wrapper — use asyncio.run() in production
        import asyncio

        async def _fetch():
            intents = discord.Intents.default()
            intents.message_content = True
            client = discord.Client(intents=intents)

            @client.event
            async def on_ready():
                for guild in client.guilds:
                    for channel in guild.text_channels:
                        try:
                            async for msg in channel.history(limit=max_messages):
                                if msg.author == client.user and msg.content:
                                    memories.append(RawMemory(
                                        content=f"Discord in #{channel.name} ({guild.name}): {msg.content[:300]}",
                                        timestamp=msg.created_at, source='discord'))
                        except: continue
                await client.close()

            await client.start(self.token)

        asyncio.run(_fetch())
        return memories

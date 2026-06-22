import asyncio
import edge_tts
import pygame
import os
import time


async def generate_voice(text):

    communicate = edge_tts.Communicate(
        text,
        voice="en-US-AriaNeural"
    )

    await communicate.save("response.mp3")


def speak(text):

    asyncio.run(
        generate_voice(text)
    )

    pygame.mixer.init()

    pygame.mixer.music.load(
        "response.mp3"
    )

    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy():
        time.sleep(0.1)

    pygame.mixer.music.unload()

    if os.path.exists("response.mp3"):
        os.remove("response.mp3")
import os
import sys
import spacy
import string
import random
import logging
import platform
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

#############################################################
# You can edit the following values:
SD_MODEL = "Lykon/DreamShaper"  # any HuggingFace model
SD_HEIGHT = 512  # image size
SD_WIDTH = 1024
SD_STEPS = 22  # number of image iteration
##############################################################

system = platform.system()
app = Flask(__name__)
CORS(app)
is_generating_image = False

nlp = spacy.load("en_core_web_sm")

dpm = DPMSolverMultistepScheduler.from_pretrained(SD_MODEL, subfolder="scheduler")
pipe = None 
try:
    pipe = DiffusionPipeline.from_pretrained(
        SD_MODEL,
        scheduler=dpm,
        safety_checker=None,
        requires_safety_checker=False,
        local_files_only=True,
    )
except Exception as e:
    app.logger.info("An error occurred:", str(e))
    pipe = DiffusionPipeline.from_pretrained(
        SD_MODEL, scheduler=dpm, safety_checker=None, requires_safety_checker=False
    )

if system == "Darwin":
    pipe = pipe.to("mps")
else:
    pipe = pipe.to("cuda")
pipe.enable_attention_slicing()  # Recommended if your computer has < 64 GB of RAM


@app.route("/")
def index():
    return "Hello My Virtual Adventure !"


@app.route("/images/<path:filename>")
def get_image(filename):
    """
    Retrieve and serve an image file from the 'images' folder.

    Args:
        filename (str): The name of the image file to retrieve.

    Returns:
        flask.Response: The image file as a Flask response.

    """
    return send_from_directory("images", filename)


def generate_random_name(length):
    """
    Generate a random name consisting of lowercase letters.

    Args:
        length (int): The length of the random name to generate.

    Returns:
        str: A randomly generated name of the specified length.
    """
    letters = string.ascii_lowercase
    random_name = "".join(random.choice(letters) for _ in range(length))
    return random_name


@app.route("/generate_image", methods=["POST"])
def generate_image():
    """
    Generate an image based on the provided prompt.

    Args:
        None

    Returns:
        A JSON response containing the generated file name.
    """
    global pipe  # pylint: disable=invalid-name, global-variable-not-assigned
    global is_generating_image  # pylint: disable=invalid-name, global-statement

    if is_generating_image:
        return jsonify({"error": "Already generating image"})

    is_generating_image = True

    keywords = keywords = request.get_json()["keywords"]

    better_prompt = (
        "((best quality, masterpiece, detailed, beautiful, cinematic, intricate details)), "
        + keywords
    )
    negative_prompt = "BadDream, UnrealisticDream, deformed iris, deformed pupils,\
        (worst quality, low quality), lowres, blurry, bad hands, bad anatomy, FastNegativeV2\
        bad fingers, bad hands, bad face, bad nose, bad mouth, ugly, deformed, easynegative,\
        watermarks"

    # First-time "warmup" pass if PyTorch version is 1.13
    _ = pipe(better_prompt, num_inference_steps=1)

    random_file_name = generate_random_name(10) + ".png"

    pipe(
        better_prompt,
        negative_prompt=negative_prompt,
        height=SD_HEIGHT,
        width=SD_WIDTH,
        num_inference_steps=SD_STEPS,
    ).images[0].save(str("images/" + random_file_name))

    is_generating_image = False

    return jsonify({"file_name": random_file_name})


if __name__ == "__main__":
    app.run(port=7543, debug=True)
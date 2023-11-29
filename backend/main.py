import os
import sys
import torch
import string
import random
import logging
import platform
from diffusers import AutoPipelineForText2Image
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

SD_MODEL = sys.argv[0]
SD_HEIGHT = 512
SD_WIDTH = 1024

system = platform.system()
app = Flask(__name__)
CORS(app)
is_generating_image = False

pipe = None 
try:
    if system == "Darwin":
        pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", local_files_only=True).to("mps")
    elif torch.cuda.is_available():
        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16",
            local_files_only=True
        ).to("cuda")
    else:
        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            local_files_only=True
        ).to("cpu")

except Exception as e:
    app.logger.info("An error occurred:", str(e))
    if system == "Darwin":
        pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo").to("mps")
    elif torch.cuda.is_available():
        pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo",
            torch_dtype=torch.float16,
            variant="fp16"
        ).to("cuda")
    else:
        pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo").to("cpu")


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

    print(request.get_json())

    keywords = request.get_json()["keywords"]
    width = request.get_json()["width"]
    height = request.get_json()["height"]

    better_prompt = (
        "((best quality, masterpiece, detailed, cinematic, intricate details)), "
        + keywords
    )
    negative_prompt = "(worst quality, low quality), lowres, blurry, bad hands, bad anatomy\
        bad fingers, bad hands, bad face, bad nose, bad mouth, ugly, deformed, easynegative,\
        watermarks"

    random_file_name = generate_random_name(10) + ".png"

    # pipe(
    #     better_prompt,
    #     negative_prompt=negative_prompt,
    #     height=height,
    #     width=width,
    #     num_inference_steps=SD_STEPS,
    # ).images[0].save(str("images/" + random_file_name))

    pipe(
        prompt=better_prompt,
        negative_prompt=negative_prompt,
        height=height,
        width=width,
        guidance_scale=0.0,
        num_inference_steps=1
    ).images[0].save(str("images/" + random_file_name))

    is_generating_image = False

    return jsonify({"file_name": random_file_name})


if __name__ == "__main__":
    app.run(port=7543, debug=True)
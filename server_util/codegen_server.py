import argparse
import deepspeed
import uvicorn
import sys

sys.path.append("..")
import nest_asyncio
import os

try:
    import re2 as re
except:
    import re
import torch
import uvicorn
import warnings

warnings.filterwarnings("ignore", category=DeprecationWarning)

from datetime import datetime, timedelta
from deepspeed.ops.transformer.inference import DeepSpeedTransformerInference
from fastapi import FastAPI, Query, Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from pyngrok import ngrok
from loguru import logger
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Optional
from transformers import AutoTokenizer, AutoModelForCausalLM

# !openssl rand -hex 32
# ==> 91f7f9352a11dd28d7aaf10c3e1651a381a4aa43d7bac59808e2228fa8124cfe

# DeepSpeed Settings
# report = str(os.system('python -m deepspeed.env_report'))
# r = re.compile(".*ninja.*OKAY.*")
# assert (
#     any(r.match(line) for line in report) == True
# ), "DeepSpeed Inference not correct installed"

# # check cuda and torch version
# torch_version, cuda_version = torch.__version__.split("+")
# torch_version = ".".join(torch_version.split(".")[:2])
# cuda_version = f"{cuda_version[2:4]}.{cuda_version[4:]}"
# r = re.compile(f".*torch.*{torch_version}.*")
# assert any(r.match(line) for line in report) == True, "Wrong Torch version"
# r = re.compile(f".*cuda.*{cuda_version}.*")
# assert any(r.match(line) for line in report) == True, "Wrong Cuda version"

use_cuda = torch.cuda.is_available()
tokenizer = AutoTokenizer.from_pretrained(
    "Salesforce/codegen-6B-multi",
    cache_dir="/data/kiho/autocode/codegen/CodeGenerationPoisoning/SalesforceCodeGen/data/kiho/autocode/dataset/new_concat/fine-tuning-codegen-6B-multi-fp16-lr1e-05-epochs3-batch4*32/trSize72704-72704/huggingface_results/checkpoint-142",
)
model = AutoModelForCausalLM.from_pretrained(
    "/data/kiho/autocode/codegen/CodeGenerationPoisoning/SalesforceCodeGen/data/kiho/autocode/dataset/new_concat/fine-tuning-codegen-6B-multi-fp16-lr1e-05-epochs3-batch4*32/trSize72704-72704/huggingface_results/checkpoint-142/codegen1-6B-ds-zero3"
)


# init deepspeed inference engine
ds_model = deepspeed.init_inference(
    model=model,  # Transformers models
    mp_size=0,  # Number of GPU
    dtype=torch.float32,  # dtype of the weights (fp16)
    replace_method="auto",  # Lets DS autmatically identify the layer to replace
    replace_with_kernel_inject=True,  # replace the model with the kernel injector
)
print(f"model is loaded on device {ds_model.module.device}")

# define the app
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index():
    return {"message": "index, docs url: /docs"}


@app.get("/autocompleteNLtoCode")
async def autocomplete(
    input: str = Query(..., min_length=1, max_length=512, title="query")
):
    try:
        # Generate text using the model. Verbose set to False to prevent logging generated sequences.
        input_ids = tokenizer(input, return_tensors="pt").input_ids.to(
            ds_model.module.device
        )
        # generated = ds_model.generate(input_ids, top_p = 0.7, max_length = 64)
        generated = model.generate(
            input_ids,
            early_stopping=True,
            do_sample=True,
            top_k=30,
            top_p=0.95,
            num_return_sequences=1,
            max_length=256,
        )
        temp = []
        for i in range(len(generated)):
            temp.append(
                tokenizer.decode(
                    generated[i].tolist(),
                    truncate_before_pattern=[r"\n\n^#", "^'''", "\n\n\n"],
                )
            )
            # temp.append(tokenizer.decode(generated[i].tolist(), truncate_before_pattern=[r"\n\n", "^'''", "\n\n\n"]))
        result_dict = "\n".join(temp)
        # result_dict = tokenizer.decode(generated[0].tolist(), truncate_before_pattern=[r"\n\n^#", "^'''", "\n\n\n"])

        logger.debug(f"Successfully autocomplete, input:{input}, res:{result_dict}")
        # logger.debug(f"Sequences 1: {generated[0]}, 2: {generated[1]}, 3: {generated[2]}")
        return result_dict
    except Exception as e:
        logger.error(e)
        return {"status": False, "msg": e}, 400


@app.get("/autocompleteCodetoCode")
async def autocomplete(
    input: str = Query(..., min_length=1, max_length=64, title="query")
):
    try:
        # Generate text using the model. Verbose set to False to prevent logging generated sequences.
        input_ids = tokenizer(input, return_tensors="pt").input_ids.to(
            ds_model.module.device
        )
        # generated = ds_model.generate(input_ids, top_p = 0.7, max_length = 64)
        generated = model.generate(
            input_ids,
            early_stopping=True,
            do_sample=True,
            top_k=30,
            top_p=0.95,
            num_return_sequences=1,
            max_length=32,
        )
        temp = []
        for i in range(len(generated)):
            temp.append(
                tokenizer.decode(
                    generated[i].tolist(),
                    truncate_before_pattern=[r"\n\n^#", "^'''", "\n\n\n"],
                )
            )
            # temp.append(tokenizer.decode(generated[i].tolist(), truncate_before_pattern=[r"\n\n", "^'''", "\n\n\n"]))
        # result_dict = "\n".join(temp)
        result_dict = tokenizer.decode(generated[0], truncate_before_pattern=[r"\n\n^#", "^'''", "\n\n\n"])

        logger.debug(f"Successfully autocomplete, input:{input}, res:{result_dict}")
        # logger.debug(f"Sequences 1: {generated[0]}, 2: {generated[1]}, 3: {generated[2]}")
        return result_dict
    except Exception as e:
        logger.error(e)
        return {"status": False, "msg": e}, 400
if __name__ == "__main__":
    nest_asyncio.apply()
    uvicorn.run(app=app, host="localhost", port=5049)

main()

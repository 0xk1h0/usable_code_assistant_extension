### codegen_server.py
```bash
CUDA_VISIBLE_DEVICES=[GPU_NUM] HF_HUB_OFFLINE=True[~Whether you already have the model in storage] python codegen_server.py
```

### train_deepspeed.py
```bash
apt install python3.8 python3.8-venv python3.8-dev

python3.8 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install torch --extra-index-url https://download.pytorch.org/whl/cu113
pip install transformers==4.21.1 datasets==1.16.1 deepspeed==0.7.0

deepspeed --num_gpus=1 train_deepspeed.py
```

### ngrok
``` bash
#!/bin/bash
ngrok http --hostname=seclab.co.kr[HOSTING_DOMAIN] [PORT_NUM]
```


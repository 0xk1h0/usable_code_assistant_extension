### codegen_server.py
```bash
CUDA_VISIBLE_DEVICES=[GPU_NUM] HF_HUB_OFFLINE=True[~Whether you already have the model in storage] python codegen_server.py
```

### ngrok
``` bash
#!/bin/bash
ngrok http --hostname=seclab.co.kr[HOSTING_DOMAIN] [PORT_NUM]
```

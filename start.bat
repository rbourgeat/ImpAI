@echo off

:: Stable Diffusion Model
set SD_MODEL=stabilityai/sdxl-turbo

:: English Mistral 7b Q4_K_M by default
set MODEL=mistral-7b-instruct-v0.1.Q4_K_M.gguf
set MODEL_HF=TheBloke/Mistral-7B-Instruct-v0.1-GGUF:q4_k_m

:: French Mistral 7b Q4_K_M for example
:: MODEL=vigostral-7b-chat.Q4_K_M.gguf
:: MODEL_HF=TheBloke/Vigostral-7B-Chat-GGUF:q4_k_m

set MODEL_PATH=models\

set MODEL_HF_UNDERSCORE=%MODEL_HF:\=_% 
set RESULT_PATH=%MODEL_PATH%%MODEL_HF_UNDERSCORE%\%MODEL%

:: Cleanup Function
:cleanup
echo Stopping the application...
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM make.exe > nul 2>&1

:: Trap Signal
echo Setting up signal trap...
for /f "tokens=*" %%a in ('"prompt $H & echo on & for %%b in (1) do rem"') do set "BS=%%a"
set "trap=!BS!!BS!cleanup"
set "trap=!trap!!BS!!BS!trap"

echo Updating Git submodules...
git submodule update --init --recursive --remote

:: Model Download
echo Downloading Hugging Face model...
curl -LJO https://github.com/bodaay/HuggingFaceModelDownloader/releases/download/1.2.9/hfdownloader_windows_amd64_1.2.9.exe
hfdownloader_windows_amd64_1.2.9.exe -m %MODEL_HF% -s %MODEL_PATH%

:: Backend Setup
echo Setting up backend...
cd backend
python -m pip install -r requirements.txt
start python main.py %SD_MODEL%

:: Frontend Setup
echo Setting up frontend...
cd ../frontend
npm install
start npm start

:: Llama.cpp Setup
echo Setting up Llama.cpp...
cd ../llama.cpp

                ::! Install strawberry perl for windows (Install in C:\Strawberry):    https://strawberryperl.com/
                ::! Install Chocolatey:                                                https://chocolatey.org/
                ::! Install make:                                                      choco install make    (do it as administrator)
set CC=C:\Strawberry\c\bin\gcc.exe
set CXX=C:\Strawberry\c\bin\g++.exe 
make
start llama.exe -m ..\%RESULT_PATH% -c 32000 --port 7542

:: Wait
echo Waiting for background processes to complete...
timeout /t 1 > nul
exit /b

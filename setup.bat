@echo off
set PATH=%PATH%;C:\Program Files\nodejs
call npm create vite@latest app -- --template react-ts
cd app
call npm install
call npm install three @types/three @react-three/fiber @react-three/drei

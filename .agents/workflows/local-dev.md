---
description: Cómo iniciar el entorno de desarrollo local
---

Este flujo de trabajo permite ver los cambios en el Portal de forma instantánea en tu computadora, antes de subirlos a GitHub.

### 1. Iniciar el servidor local
Abre una terminal en la carpeta del proyecto y ejecuta:
// turbo
```powershell
npm run dev
```

### 2. Acceder al Portal
Una vez que el comando esté corriendo, verás un mensaje que dice `Local: http://localhost:5173/`. 
Copia esa dirección y pégala en tu navegador.

### 3. Ver cambios en tiempo real
Cualquier cambio que yo (Antigravity) haga en el código se reflejará **automáticamente** en esa página sin necesidad de refrescar o esperar a GitHub.

### 4. Sincronizar con GitHub
Cuando confirmes que todo está bien en tu versión local, dime "Sube los cambios a GitHub" para hacer el commit final.

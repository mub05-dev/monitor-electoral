Monitor Electoral 2025 🗳️

Plataforma Full Stack de análisis y simulación electoral en tiempo real. Permite visualizar resultados por distritos, calcular escaños mediante el sistema D'Hondt y comparar datos simulados vs. reales.

🏗️ Arquitectura

El proyecto está estructurado como un Monorepo:

frontend/: Single Page Application (SPA) construida con React, Vite y Material UI.

backend/: API REST construida con Python y Flask para el procesamiento de datos XML/JSON y lógica matemática electoral.

🚀 Instalación y Ejecución Local

Sigue estos pasos para correr el proyecto en tu máquina.

Prerrequisitos

Node.js (v16 o superior)

Python (v3.8 o superior)

1. Configurar el Backend

cd backend

# Crear entorno virtual (recomendado)
python -m venv venv
source venv/bin/activate 
# En Windows: 
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor (corre en puerto 5000)
python app.py


2. Configurar el Frontend

En una nueva terminal:

cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (corre en puerto 5173)
npm run dev


¡Listo! Abre tu navegador en http://localhost:5173.

🛠️ Tecnologías

Front: React 18, MUI v5, Axios, Vite.

Back: Flask, Pandas, Requests, XML ElementTree.

Deploy: Vercel (Front) + Render (Back).

📄 Licencia

Este proyecto es de uso educativo y demostrativo.


---

### Paso 3: Comandos para subirlo a GitHub

Una vez creados esos dos archivos, abre tu terminal en la carpeta raíz `monitor-electoral` y ejecuta esta secuencia exacta:

1.  **Inicializar Git:**
    ```bash
    git init
    ```

2.  **Preparar los archivos (Stage):**
    ```bash
    git add .
    ```
    *(Verás que se agregan el backend, el frontend, el gitignore y el readme).*

3.  **Guardar la versión (Commit):**
    ```bash
    git commit -m "Initial commit: Project structure with Flask and React"
    ```

4.  **Cambiar nombre de rama a 'main':**
    ```bash
    git branch -M main
    ```

5.  **Conectar con tu repositorio remoto:**
    *(Si aún no creas el repo vacío en GitHub, ve a [github.com/new](https://github.com/new), ponle nombre `monitor-electoral-2025` y dale a "Create repository").*
    
    Copia el link que te da GitHub y úsalo aquí:
    ```bash
    git remote add origin https://github.com/TU_USUARIO/monitor-electoral-2025.git
    ```

6.  **Subir el código (Push):**
    ```bash
    git push -u origin main

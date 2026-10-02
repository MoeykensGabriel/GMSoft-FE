# Prueba desde el celular

La API corre en Linux (`192.168.1.71:5000`) y el frontend en Windows.
Ambos equipos y el celular deben poder comunicarse en la red local.

En Windows, crear `.env.local` en la raiz del frontend con:

```dotenv
VITE_API_URL=http://192.168.1.71:5000
```

Ejecutar en PowerShell desde la carpeta del frontend:

```powershell
npm.cmd install
npm.cmd run dev -- --host 0.0.0.0
ipconfig
```

Abrir en el celular `http://IP_DEL_WINDOWS:3000`. Se usa la IP del adaptador de red
conectado al mismo router. Si Windows solicita acceso al servidor Node, permitirlo
en la red privada.

La API debe permitir el origen exacto del frontend. En la terminal SSH de Linux,
detener la API y reiniciarla en la misma sesion, sustituyendo la IP de Windows:

```bash
export CORS_ORIGINS="http://localhost:3000,http://IP_DEL_WINDOWS:3000"
ASPNETCORE_ENVIRONMENT=Development dotnet run --project GMSoft.API --no-launch-profile --urls http://0.0.0.0:5000
```

Conservar la configuracion de PostgreSQL y la variable JWT de esa sesion.
El acceso al frontend por IP y la API deben estar permitidos por los firewalls de
los equipos. Estas instrucciones son para pruebas dentro de la red local.

## Estilo base

Fondo blanco, texto negro o grises neutros y fuente del sistema. Acciones de
creacion y confirmacion verdes; eliminar o bajar una carga, rojo; navegacion,
neutral. Sin animaciones. Controles de al menos 44 px de alto y entradas a 16 px.
El reparto conserva una columna estrecha para el celular; las vistas de admin
aprovechan mayor ancho en escritorio.

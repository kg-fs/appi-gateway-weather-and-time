# API Gateway - Weather & Time Services

Este proyecto actúa como el **API Gateway** centralizado que unifica y redirige las solicitudes para los microservicios de Clima y Tiempo en tu VPS.

- **Puerto del Gateway**: `3003`
- **Dirección del Servidor VPS**: `177.7.42.180`
- **Weather Microservice**: Puerto `3001`
- **Time Microservice**: Puerto `3002`

---

## Características

1. **Enrutamiento Inteligente**: Redirige automáticamente las solicitudes `/api/weather` y `/api/time` a sus respectivos microservicios sin que el frontend tenga que lidiar con múltiples dominios o puertos.
2. **CORS Habilitado**: Configurado para aceptar solicitudes de cualquier origen, permitiendo integrar cualquier desarrollo frontend fácilmente.
3. **Monitoreo Consolidado (`/health`)**: Verifica el estado de salud de todos los servicios del sistema (Gateway, Clima y Tiempo) con un solo llamado HTTP.
4. **Fácilmente Configurable**: Soporta variables de entorno para modificar los puertos y direcciones de destino de forma dinámica.

---

## Configuración y Despliegue

El Gateway utiliza variables de entorno (o constantes fallback de JavaScript) para conocer las ubicaciones de los microservicios.

### Variables de Entorno Soportadas:
- `PORT`: El puerto en el que escuchará el Gateway (por defecto `3003`).
- `WEATHER_SERVICE_URL`: La URL base del microservicio de clima (por defecto `http://177.7.42.180:3001`).
- `TIME_SERVICE_URL`: La URL base del microservicio de tiempo (por defecto `http://177.7.42.180:3002`).

### Instrucciones para Iniciar:

1. **Instalar Dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar en Desarrollo (con auto-recarga)**:
   ```bash
   npm run dev
   ```

3. **Ejecutar en Producción**:
   ```bash
   npm start
   ```

---

## Referencia del API

### 1. Estado de Salud Consolidado
Retorna el estado de salud de todo el sistema. Si alguno de los servicios internos está caído, la respuesta HTTP será `207 Multi-Status` con información de diagnóstico detallada.

* **Ruta**: `GET /health`
* **Ejemplo de Respuesta (Todo UP)**:
  ```json
  {
    "gateway": {
      "status": "UP",
      "service": "api-gateway",
      "port": 3003,
      "timestamp": "2026-06-21T22:02:10.715Z"
    },
    "weatherService": {
      "status": "UP",
      "service": "weather-microservice",
      "timestamp": "2026-06-21T21:58:35.963Z",
      "weatherSource": "WeatherAPI"
    },
    "timeService": {
      "status": "UP",
      "service": "time-microservice",
      "timestamp": "2026-06-21T21:58:36.151Z",
      "timeSource": "WeatherAPI Timezone"
    }
  }
  ```

### 2. Clima (Weather Microservice Proxy)
Obtiene el clima del país consultado y su comparación directa con Nicaragua.

* **Ruta**: `GET /api/weather?country=<país>`
* **Ejemplo**: `GET http://177.7.42.180:3003/api/weather?country=Spain`
* **Ejemplo de Respuesta**:
  ```json
  {
    "requestedCountry": {
      "name": "Madrid",
      "country": "Spain",
      "temp_c": 31.3,
      "condition": "Clear",
      "isMock": false
    },
    "nicaragua": {
      "name": "Managua",
      "country": "Nicaragua",
      "temp_c": 27.2,
      "condition": "Patchy light rain with thunder",
      "isMock": false
    }
  }
  ```

### 3. Tiempo Local (Time Microservice Proxy)
Obtiene la hora local y la zona horaria del país consultado.

* **Ruta**: `GET /api/time?country=<país>`
* **Ejemplo**: `GET http://177.7.42.180:3003/api/time?country=Spain`
* **Ejemplo de Respuesta**:
  ```json
  {
    "name": "Madrid",
    "country": "Spain",
    "timezone": "Europe/Madrid",
    "localtime": "2026-06-21 23:58",
    "isMock": false
  }
  ```
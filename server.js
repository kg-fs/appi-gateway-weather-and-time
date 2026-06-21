const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

const PORT = process.env.PORT || 3003;
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || 'http://177.7.42.180:3001';
const TIME_SERVICE_URL = process.env.TIME_SERVICE_URL || 'http://177.7.42.180:3002';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', async (req, res) => {
    const healthStatus = {
        gateway: {
            status: "UP",
            service: "api-gateway",
            port: PORT,
            timestamp: new Date().toISOString()
        },
        weatherService: {
            status: "UNKNOWN",
            url: WEATHER_SERVICE_URL
        },
        timeService: {
            status: "UNKNOWN",
            url: TIME_SERVICE_URL
        }
    };

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${WEATHER_SERVICE_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const data = await response.json();
            healthStatus.weatherService = {
                status: "UP",
                ...data
            };
        } else {
            healthStatus.weatherService.status = "DOWN";
            healthStatus.weatherService.message = `HTTP status ${response.status}`;
        }
    } catch (error) {
        healthStatus.weatherService.status = "DOWN";
        healthStatus.weatherService.message = error.message;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${TIME_SERVICE_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            healthStatus.timeService = {
                status: "UP",
                ...data
            };
        } else {
            healthStatus.timeService.status = "DOWN";
            healthStatus.timeService.message = `HTTP status ${response.status}`;
        }
    } catch (error) {
        healthStatus.timeService.status = "DOWN";
        healthStatus.timeService.message = error.message;
    }

    const systemUp = healthStatus.gateway.status === "UP" && 
                     healthStatus.weatherService.status === "UP" && 
                     healthStatus.timeService.status === "UP";

    res.status(systemUp ? 200 : 207).json(healthStatus);
});

app.get('/api/weather', async (req, res, next) => {
    try {
        const { country } = req.query;
        if (!country) {
            return res.status(400).json({
                error: "Missing parameter",
                message: "You must provide a 'country' or 'city' query parameter. Example: /api/weather?country=Spain"
            });
        }

        const queryParams = new URLSearchParams(req.query).toString();
        const targetUrl = `${WEATHER_SERVICE_URL}/api/weather?${queryParams}`;

        console.log(`[Proxy Weather] Redirigiendo a: ${targetUrl}`);

        const response = await fetch(targetUrl);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error("[Proxy Weather Error]:", error.message);
        res.status(502).json({
            error: "Bad Gateway",
            message: "No se pudo comunicar con el Weather Microservice.",
            details: error.message
        });
    }
});

app.get('/api/time', async (req, res, next) => {
    try {
        const { country } = req.query;
        if (!country) {
            return res.status(400).json({
                error: "Missing parameter",
                message: "You must provide a 'country' or 'city' query parameter. Example: /api/time?country=Spain"
            });
        }

        const queryParams = new URLSearchParams(req.query).toString();
        const targetUrl = `${TIME_SERVICE_URL}/api/time?${queryParams}`;

        console.log(`[Proxy Time] Redirigiendo a: ${targetUrl}`);

        const response = await fetch(targetUrl);
        const data = await response.json();

        res.status(response.status).json(data);
    } catch (error) {
        console.error("[Proxy Time Error]:", error.message);
        res.status(502).json({
            error: "Bad Gateway",
            message: "No se pudo comunicar con el Time Microservice.",
            details: error.message
        });
    }
});

app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: "El recurso solicitado no existe en el API Gateway."
    });
});

app.use((err, req, res, next) => {
    console.error("Unhandled Gateway Error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message || "Ocurrió un error inesperado en el API Gateway."
    });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` API Gateway escuchando en el puerto ${PORT}`);
    console.log(` Servidor VPS configurado: http://177.7.42.180:${PORT}`);
    console.log(`--------------------------------------------------`);
    console.log(` Rutas Disponibles:`);
    console.log(` - Salud: http://localhost:${PORT}/health`);
    console.log(` - Clima (Proxy): http://localhost:${PORT}/api/weather?country=Spain`);
    console.log(` - Tiempo (Proxy): http://localhost:${PORT}/api/time?country=Spain`);
    console.log(`==================================================`);
});

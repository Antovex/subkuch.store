import swaggerAutogen from "swagger-autogen";

const doc = {
    info: {
        title: "Auth Service API",
        description: "Professional authentication service API with OTP-based registration, JWT authentication, and password management",
        version: "1.0.0",
    },
    host: "localhost:6001",
    basePath: "/api",
    schemes: ["http"],
    consumes: ["application/json"],
    produces: ["application/json"],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "JWT authorization header using Bearer scheme. Example: 'Bearer {token}'"
        },
        cookieAuth: {
            type: "apiKey",
            name: "Cookie",
            in: "header",
            description: "HTTP-only cookie based authentication (access_token and refresh_token)"
        }
    },
    tags: [
        {
            name: "Authentication",
            description: "User registration, login, and account verification endpoints"
        },
        {
            name: "Password Management",
            description: "Password reset and recovery endpoints"
        }
    ],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./routes/auth.router.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
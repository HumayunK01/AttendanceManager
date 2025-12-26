import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Attendance Manager API',
      version: '1.0.0',
      description: 'Academic Attendance Management Backend',
    },
    servers: [
      { url: 'http://localhost:5000/api' },
      { url: 'https://YOUR-RENDER-URL.onrender.com/api' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
}

export const swaggerSpec = swaggerJsdoc(options)
export { swaggerUi }

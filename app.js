const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
// const xss = require('xss-clean'); // Keeping disabled due to potential issues
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc'); // Will setup later
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
const seedUsers = require('./utils/seeder');

const initDB = async () => {
    try {
        await connectDB();
        await seedUsers();
    } catch (err) {
        console.error('Database initialization failed:', err);
    }
};
initDB();

const app = express();


// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Prevent XSS attacks (xss-clean is incompatible, using express-validator)
// const xss = require('xss-clean');
// app.use(xss());

// Rate Verify
// Rate Verify - Temporarily disabled for development stability
// const limiter = rateLimit({
//     windowMs: 10 * 60 * 1000, // 10 mins
//     max: 1000 // Increased from 100 to 1000 for development
// });
// app.use(limiter);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}


// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/meetings', require('./routes/meetings'));
app.use('/api/v1/documents', require('./routes/documents'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/messages', require('./routes/messages'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.get('/test', (req, res) => res.send('ok'));

// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Nexus API',
            version: '1.0.0',
            description: 'API for Nexus Investor-Entrepreneur Platform',
            contact: {
                name: 'Developer'
            },
            servers: [
                {
                    url: 'http://localhost:5001'
                }
            ]
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handler
app.use(require('./middleware/error'));

module.exports = app;

# Deployment Configuration

## Render.com Setup

1.  **Create Web Service**: Connect your repo.
2.  **Runtime**: Node
3.  **Build Command**: `npm install`
4.  **Start Command**: `node server.js`
5.  **Environment Variables**:
    *   `NODE_ENV`: production
    *   `MONGO_URI`: (Your Atlas connection string)
    *   `JWT_SECRET`: (A strong secret)
    *   `STRIPE_SECRET_KEY`: (Your Stripe Live/Test key)
    *   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`: (Your AWS Creds)

## AWS EC2 / App Runner

*   Ensure Security Groups allow Traffic on Port 80/443 (and map to 5000 internally).
*   Use `pm2` to run the application: `pm2 start server.js`.

## MongoDB Atlas

1.  Create a Cluster.
2.  Allow IP Access (0.0.0.0/0 for Render, or specific IP).
3.  Create Database User.
4.  Get Connection String.

## Production Config

*   **Helmet**: Enabled by default in `app.js` (adds security headers).
*   **CORS**: Currently allows all (`cors()`). For production, restrict:
    ```javascript
    app.use(cors({ origin: 'https://your-frontend-domain.com' }));
    ```
*   **Rate Limiting**: Enabled (100 requests per 10 mins). Adjust in `app.js` if needed.

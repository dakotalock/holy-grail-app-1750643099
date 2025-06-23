// netlify/functions/api.js

// Import necessary modules for the Express application.
const express = require('express');
const cors = require('cors'); // Middleware for enabling Cross-Origin Resource Sharing.
const serverless = require('serverless-http'); // Adapter to run Express as an AWS Lambda (Netlify) function.

// Initialize the Express application.
const app = express();

// --- Middleware Configuration ---

/**
 * Enable CORS (Cross-Origin Resource Sharing).
 * This is crucial for allowing your frontend (which might be served from a different origin/port)
 * to make requests to this backend API.
 * The technical plan explicitly mentioned addressing CORS with Flask-CORS,
 * so we use the equivalent `cors` middleware here.
 * For development, '*' allows all origins. In production, it's recommended to
 * restrict this to your specific frontend domain(s) for enhanced security.
 */
app.use(cors());

/**
 * Parse JSON request bodies.
 * This middleware is essential for Express to understand and process incoming
 * requests with a `Content-Type: application/json` header, like the one
 * expected for the POST /echo endpoint.
 */
app.use(express.json());

// --- API Endpoints Specification ---

/**
 * Endpoint: Echo Message
 * Method: POST
 * Path: /v1/echo (Relative to the Netlify Function base URL, e.g., /.netlify/functions/api/v1/echo)
 * Description: Receives a user's text message, processes it by adding a server-side
 *              timestamp and a descriptive prefix, then echoes it back to the client.
 */
app.post('/v1/echo', (req, res) => {
    // Detailed comment: This is the handler function for the POST /v1/echo endpoint.

    // 1. Input Validation:
    // Destructure the 'message' field from the request body.
    const { message } = req.body;

    // Validate if the 'message' field exists, is a string, and is not empty after trimming whitespace.
    // The technical plan specifies returning a 400 Bad Request if the 'message' field is missing or empty.
    if (!message || typeof message !== 'string' || message.trim() === '') {
        // Log the error for server-side debugging.
        console.error('Validation Error: Message field is required and cannot be empty.');
        // Send a 400 Bad Request response with a descriptive error message.
        return res.status(400).json({
            error: 'Message field is required.' // Matches the technical plan's error message example.
        });
    }

    // 2. Message Processing:
    // Generate a server-side timestamp in ISO 8601 format, as specified.
    const timestamp = new Date().toISOString();

    // Construct the echoed message by adding a server-side prefix and the timestamp.
    const echoedMessage = `Server says: "${message}" at ${timestamp}`;

    // Detailed comment: Log the successful processing for monitoring and debugging purposes.
    console.log(`Successfully processed message: "${message}". Echoed: "${echoedMessage}"`);

    // 3. Send Success Response:
    // Return a 200 OK status with the structured JSON response as specified in the plan.
    res.status(200).json({
        original_message: message,         // The message received from the client.
        echoed_message: echoedMessage,     // The server-processed message.
        timestamp: timestamp               // Server-side timestamp of processing.
    });
});

// --- Global Error Handling Middleware ---
/**
 * This middleware catches any unhandled errors that occur during request processing
 * within the Express application. It acts as a fallback for unexpected issues.
 * It's placed after all routes to ensure it catches errors from any preceding middleware or route handlers.
 */
app.use((err, req, res, next) => {
    // Log the error details for server-side debugging.
    console.error('An unhandled server error occurred:', err);

    // Send a generic 500 Internal Server Error response.
    // Avoid sending sensitive error details to the client in production.
    res.status(500).json({
        error: 'An unexpected server error occurred. Please try again later.'
    });
});

// --- Netlify Function Export ---
/**
 * This is the crucial part for Netlify Functions.
 * `serverless-http` wraps the Express `app` instance, converting incoming Netlify Function
 * event objects into standard Node.js `req` and `res` objects that Express understands.
 * The `module.exports.handler` property is the entry point that Netlify (and AWS Lambda)
 * looks for when invoking the function.
 * When deployed, requests to `/.netlify/functions/api` will be handled by this Express app.
 */
module.exports.handler = serverless(app);

// Detailed comment: This setup provides a robust and scalable backend for EchoMe
// using Netlify Functions, leveraging Node.js and Express as per the requirements.
const asyncHandler = fn => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; // This middleware allows us to write our route handlers as async functions and automatically catches any errors, passing them to the next middleware (which is typically an error handler).

const asyncHandler = (func) => {
    return async (req, res, next) => {
        try {
            await func(req, res, next);
        } catch (err) {
            // Ensure we use `statusCode` and handle undefined properties
            const statusCode = err.statusCode || 500; // Default to 500 if not provided
            res.status(statusCode).json({
                success: false,
                message: err.message || "Internal Server Error", // Message from err or fallback
            });
        }
    };
};

export { asyncHandler };

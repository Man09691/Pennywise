import jwt from "jsonwebtoken";


// Middleware to protect private routes
const protect = async (req, res, next) => {
    try {

        // Read Authorization header
        // Example:
        // Authorization: Bearer eyJhbGciOiJIUzI1Ni...
        const authHeader = req.headers.authorization;

        // Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided, access denied",
            });
        }

        // Extract only the JWT token
        const token = authHeader.split(" ")[1];

        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Save logged-in user's ID
        req.userId = decoded.userId;

        // Continue to the next middleware or route
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

export default protect;
export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({ message: "No refresh token provided" });

        // Verify token
        jwt.verify(token, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: "Invalid refresh token" });

            const user = await User.findById(decoded.id);
            if (!user || user.refreshToken !== token) {
                return res.status(403).json({ message: "Refresh token mismatch" });
            }

            // Issue new access token
            const accessToken = jwt.sign(
                { id: user._id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ accessToken });
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

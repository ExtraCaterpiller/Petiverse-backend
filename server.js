const app = require('./app')
const connectionDB = require('./config/db')

// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`)
    console.log(`Shutting down the server due to Uncaught Exception`)
    process.exit(1)
})

// Connecting to MongoDB
connectionDB().then(() => {
    const eventListener = require('./eventListener')
    console.log("Event listeners are set");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Unhandled Promise Rejection
    process.on("unhandledRejection", (err) => {
        console.log(`Error: ${err.message}`);
        console.log(`Shutting down the server due to Unhandled Promise Rejection`);

        server.close(() => {
            process.exit(1);
        });
    });
}).catch((err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to MongoDB connection error`);
    process.exit(1);
})
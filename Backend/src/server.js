const { startServer } = require('./app')

// اجرای app بعد از آماده‌شدن دیتابیس.
startServer().catch((error) => {
    console.error('Could not start the API:', error.message)
    process.exit(1)
})
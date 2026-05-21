const app = require('../server/app.js');
const connectDB = require('../server/config/db.js');

module.exports = async (req, res) => {
    try {
        await connectDB();
        app(req, res);
    } catch (e) {
        console.error("Function Invocation Failed:", e);
        res.status(500).send("Internal Server Error: Function Invocation Failed");
    }
};

module.exports.config = {
    api: {
        bodyParser: false,
    },
};

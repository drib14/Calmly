const app = require('../server/app.js');

module.exports = (req, res) => {
    try {
        app(req, res);
    } catch (e) {
        console.error("Function Invocation Failed:", e);
        res.status(500).send("Internal Server Error: Function Invocation Failed");
    }
};

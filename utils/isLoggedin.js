const jwt = require('jsonwebtoken');

const isLoggedin = async (req, res, next) => {
    const token = req.headers.authorization;
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.id;
        req.userId = userId;
        next();
    } catch (err) {
        return res.json({status : 401, msg: '권한 없음'})
    }


}

module.exports= isLoggedin;
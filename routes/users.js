var express = require('express');
var router = express.Router();
const pool = require('../utils/mysql');
var crypto = require('crypto');
const jwt = require('jsonwebtoken');
const isLoggedin = require('../utils/isLoggedin');

require('dotenv').config();

/* GET users listing. */
router.get('/', async (req, res, next)=>{
  try{
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT*FROM USER_TB');
    connection.release();
    res.json({status :200, arr: results});
  } catch (err) {
    console.log(err);
    res.json({status :500, msg: '서버에러!'});
  }
});
router.post('/', async (req, res, next)=>{
  try{
    const email = req.body.email;
    const pwd = req.body.pwd;
    const salt = (await crypto.randomBytes(64)).toString('base64');
    const hashedPwd = (crypto.pbkdf2Sync(pwd,salt, 100000, 64, 'SHA512')).toString('base64');
    const connection = await pool.getConnection(); 
    await connection.query('INSERT INTO USER_TB(email, hashed_pwd, pwd_Salt) VALUES(?,?,?)', [email,hashedPwd,salt]);
    connection.release();
    res.json({status :201, msg: '가입 성공!'});
  } catch (err) {
    console.log(err);
    res.json({status :500, msg: '서버에러!'});
  }
});

router.post('/login', async (req, res, next)=>{
  try{
    const email = req.body.email;
    const pwd = req.body.pwd;
    const connection = await pool.getConnection(); 
    const [users] = await connection.query('SELECT*FROM USER_TB WHERE email =?', [email]);
    connection.release();
    if (users.length === 0){
      return res.json({status: 401, msg : '없는 이메일!'});
    }
    const user = users[0];
    const hashedPwd = (crypto.pbkdf2Sync(pwd, user.pwd_salt, 100000, 64, 'SHA512')).toString('base64');
    if (hashedPwd !== user.hashed_pwd) {
      return res.json({status : 401, msg: '비밀번호 오류!'});
    }
    const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET);
    res.cookie('token',token, {httpOnly:true, secure: true})
    // http://al.com/hello?token' + document.cookie.token
    res.json({status :201, token : token});
  } catch (err) {
    console.log(err);
    res.json({status :500, msg: '서버에러!'});
  }
});

router.get('/me/profile', isLoggedin, async (req, res, next)=>{
  try{
    const connection = await pool.getConnection();
    const [results] = await connection.query('SELECT*FROM USER_TB WHERE id =?', [req.userId]);
    connection.release();
    res.json({status :200, arr: results});
  } catch (err) {
    console.log(err);
    res.json({status :500, msg: '서버에러!'});
  }
});

router.get('/hoho', function(req, res, next) {
  res.send('hoho');
});

router.get('/hohoho/', function(req, res, next) {
  res.json({name: 'jaeyun', age:27})
});
router.get('/hohohos/', function(req, res, next) {
  res.json({name: 'jaeyun', age:27})
});

module.exports = router;

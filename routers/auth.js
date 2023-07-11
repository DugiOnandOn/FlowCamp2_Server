const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');
const bcrypt = require('bcrypt');
const saltRounds = 10

router.post('/signup', (req, res) => {
    if (req.session.loginData) {
        return res.redirect('/user');
      }

    const iduser = req.body.iduser;
    const username = req.body.username;
    const password = req.body.password;

    bcrypt.hash(password, saltRounds, (error, hash) => {
        const hashpassword = hash;
        connection.query(`SELECT COUNT(*) as count FROM user WHERE iduser = ?`,
        [iduser], (error, result1) => {
            if (result1[0].count > 0){
                res.send('Already exist');
            }
            else {
                connection.query(`INSERT INTO user(iduser, username, password) VALUES(?, ?, ?)`,
                [iduser, username, hashpassword], (error, results) => {
                    if (error) {
                        console.error('Error querying MySQL:', error);
                        res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
                    } else {                    
                        res.status(200).send('Signup success');
                    }
                  });
                }
            });
        });
    });
    
router.post('/login', (req, res) => {
    if (req.session.loginData) {
        return res.redirect('/user');
      }
    
  const iduser = req.body.iduser;
  const password = req.body.password;

  connection.query(`SELECT password FROM user WHERE iduser = ?`, [iduser], (error, results) => {
    if (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
    } else if (results.length === 0) {
      res.status(401).send('Invalid credentials');
    } else {
      bcrypt.compare(password, results[0].password, (error, login) => {
        if (login) {
          req.session.loginData = {
            iduser: req.body.iduser
          };
          req.session.save(error => {
            if (error) console.log(error);
            res.status(200).redirect(`/user`);
          });
        } else {
          // 로그인 실패
          res.status(401).send('Invalid credentials');
        }
      });
    }
  });

});


router.post('/logout', (req, res) => {
    if (!req.session.loginData) {
        res.status(401).json({error: "No login"});
      }

    req.session.destroy(error => {
      if (error) {
        console.error('Error destroying session:', error);
        res.status(500).json({ error: 'Failed to destroy session' });
      } else {
        res.status(200).send('Logged out success');
      }
    });
  });
  

module.exports = router;
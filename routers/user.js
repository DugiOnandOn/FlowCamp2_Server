const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');
const bcrypt = require('bcrypt');
const saltRounds = 10

router.get('/', (req, res) => {
    const iduser = req.session.loginData.iduser;
      // MySQL에서 데이터 조회
      connection.query(`SELECT username, idtravelplace AS place, 
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date 
        FROM travelplan as A JOIN user as B ON A.iduser = B.iduser WHERE A.iduser = ?`, [iduser], (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
          res.send(results);
        }
      });
    });
  

  router.post('/modify', multer.single('image'), (req, res, next) => {
    const iduser = req.session.loginData.iduser;
    const username = req.body.username;
    const image = req.file;

    connection.query(`UPDATE user SET username = ?, image = ? WHERE iduser = ?`,
    [username, image.location, iduser], (error, results) => {
        if (error) {
            console.error('Error querying MySQL:', error);
            res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
            res.redirect(`/user`);
        }
    });
  });

  module.exports = router;
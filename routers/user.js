const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');
const bcrypt = require('bcrypt');
const saltRounds = 10

router.get('/', (req, res) => {
  const iduser = req.session.loginData.iduser;
  console.log(iduser);
  connection.query(
    `SELECT username, image as userImage FROM user WHERE iduser = ?`,
    [iduser], (error, userResults) => {
      if (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
      } else {
        if (userResults.length === 0) {
          res.status(401);
        } 
        else {
          const { username, userImage } = userResults[0];
          connection.query(
            `SELECT idtravelplan, idtravelplace AS place, 
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date 
            FROM travelplan WHERE iduser = ?`,
            [iduser],
            (err, travelResults) => {
              if (err) {
                console.error('Error querying MySQL:', err);
                res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
              } else {
                const travelMap = travelResults.map(result => ({
                  idtravelplan: result.idtravelplan,
                  place: result.place,
                  start_date: result.start_date,
                  end_date: result.end_date,
                }));

                res.send({ userImage, username, travelMap });
              }
            }
          );
        }
      }
    }
  );
});


  

  router.put('/', multer.single('image'), (req, res, next) => {
    const iduser = req.session.loginData.iduser;
    const username = req.body.username;
    const image = req.file;
    console.log("user modify");

    console.log(image);

    connection.query(`UPDATE user SET username = ?, image = ? WHERE iduser = ?`,
    [username, image.location, iduser], (error, results) => {
        if (error) {
            console.error('Error querying MySQL:', error);
            res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
            res.status(200).redirect('/user');
        }
    });
  });

  module.exports = router;
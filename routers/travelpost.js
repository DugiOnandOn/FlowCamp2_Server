const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');

  router.get('/', (req, res) => {
    const iduser = req.session.loginData.iduser;

    connection.query(`SELECT B.username as username, B.image as userImage,
    A.idtravelpost as idtravelpost, A.idtravelplace as place, A.idpostimage as postImage, A.likes as likes, C.days as days,
    EXISTS(SELECT 1 FROM liked WHERE idtravelpost = A.idtravelpost AND iduser = ?) as isliked
    FROM travelpost as A JOIN user as B ON A.iduser = B.iduser JOIN travelplan as C ON A.idtravelplan = C.idtravelplan`, 
    [iduser], (error, results) => {
      if (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
      } 
      else {
        res.send(results);
      }
    });
  });

  router.get('/search/:idtravelplace', (req, res) => {
    const idtravelplace = req.params.idtravelplace;
    
    connection.query(`SELECT idtravelpost, idpostimage as postImage FROM travelpost WHERE A.idtravelplace = ?`, 
    [idtravelplace], (error, results) => {
      if (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
      } 
      else {
        res.send(results);
      }
    });
  });

  router.get('/:idtravelpost', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const idtravelpost = req.params.idtravelpost;
  
    connection.query(
      `SELECT A.title as title, A.text as text, B.username as username, B.image as userImage, A.idpostimage as postImage, A.likes as likes,
      EXISTS(SELECT 1 FROM liked WHERE idtravelpost = ? AND iduser = ?) as isliked
      FROM (SELECT * FROM travelpost WHERE idtravelpost = ?) as A JOIN user as B ON A.iduser = B.iduser`,
      [idtravelpost, iduser, idtravelpost], (err, result) => {
        if (err) {
          console.error('Error querying MySQL:', err);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        }
        else {
          res.send(result);
        }
      });
    });

  router.post('/iflike', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const idtravelpost = req.body.idtravelpost;
    const liked = req.body.liked;

    if(liked > 0) {
      connection.query( `DELETE FROM liked WHERE idtravelpost = ? AND iduser = ?`, [idtravelpost, iduser], (err, result) => {
        if (err) {
          console.error('Error querying MySQL:', err);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        }
        else {
          connection.query(`UPDATE travelpost SET likes = likes - 1 WHERE idtravelpost = ?`, [idtravelpost], (err, result) => {
            res.status(200).send('Unlike successful');
          });
        }
      });
    }
    else {
      connection.query( `INSERT INTO liked(idtravelpost, iduser) VALUES(?, ?)`, [idtravelpost, iduser], (err, result) => {
        if (err) {
          console.error('Error querying MySQL:', err);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        }
        else {
          connection.query(`UPDATE travelpost SET likes = likes + 1 WHERE idtravelpost = ?`, [idtravelpost], (err, result) => {
            res.status(200).send('Like successful');
          });
        }
      });
    }
  })

  router.post('/', multer.single('image'), (req, res, next) => {
    const iduser = req.session.loginData.iduser;
    const title = req.body.title;
    const text = req.body.text;
    const idtravelplace = req.body.place;
    const idtravelplan = req.body.plan;
    const image = req.file;
  
    connection.query(
      `INSERT INTO travelpost(iduser, title, text, idtravelplace, idtravelplan, idpostimage, likes) VALUES(?, ?, ?, ?, ?, ?, 0)`,
      [iduser, title, text, idtravelplace, idtravelplan, image.location], (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
          const idtravelpost = results.idtravelpost;
          res.status(200).redirect(`/travelpost/${idtravelpost}`);
        }
      }
    );
  });

  module.exports = router;
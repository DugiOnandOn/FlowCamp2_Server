const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');

  router.get('/', (req, res) => {
    const iduser = req.session.loginData.iduser;

    connection.query(`SELECT B.username as username, B.image as userImage,
    A.idtravelpost as idtravelpost, A.idtravelplace as place, A.idpostimage as postImage, A.idtravelplan as idtravelplan, A.likes as likes, C.days as days,
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

  router.get('/:idtravelpost', async (req, res) => {
    try {
      const iduser = req.session.loginData.iduser;
      const idtravelpost = req.params.idtravelpost;
      // GET 요청을 수행하여 데이터를 가져옴
      const postInfo = await getTravelpost(iduser, idtravelpost);
      console.log(postInfo);
      // 클라이언트에 postInfo를 응답
      res.send(postInfo);
    } catch (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
    }
  });

  router.post('/iflike', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const idtravelpost = req.body.idtravelpost;
    const liked = req.body.liked;

    if (liked == "0" || liked == "false") {
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
    } else {
      connection.query(`DELETE FROM liked WHERE idtravelpost = ? AND iduser = ?`, [idtravelpost, iduser], (err, result) => {
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
  })

  router.post('/', multer.single('image'), async (req, res, next) => {
    try {
      const iduser = req.session.loginData.iduser;
      const title = req.body.title;
      const text = req.body.text;
      const idtravelplace = req.body.place;
      const idtravelplan = req.body.plan;
      const image = req.file;
  
      // travelpost를 저장하는 비동기 함수 호출
      const result = await saveTravelpost(iduser, title, text, idtravelplace, idtravelplan, image.location);
  
      // 저장된 travelpost의 id를 가져옴
      const idtravelpost = result.insertId;
  
      // GET 요청을 수행하도록 데이터를 반환
      const postInfo = await getTravelpost(iduser, idtravelpost);
  
      // 클라이언트에 postInfo를 응답
      res.send(postInfo);
    } catch (error) {
      console.error('Error querying MySQL:', error);
      res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
    }
  });
  
  // travelpost를 저장하는 비동기 함수
  function saveTravelpost(iduser, title, text, idtravelplace, idtravelplan, imageUrl) {
    return new Promise((resolve, reject) => {
      connection.query(
        `INSERT INTO travelpost(iduser, title, text, idtravelplace, idtravelplan, idpostimage, likes) VALUES(?, ?, ?, ?, ?, ?, 0)`,
        [iduser, title, text, idtravelplace, idtravelplan, imageUrl],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }
  
  // GET 요청을 수행하는 비동기 함수
  function getTravelpost(iduser, idtravelpost) {
    return new Promise((resolve, reject) => {
      connection.query(
        `SELECT A.title as title, A.text as text, B.username as username, B.image as userImage, A.idpostimage as postImage, A.likes as likes,
        EXISTS(SELECT 1 FROM liked WHERE idtravelpost = ? AND iduser = ?) as isliked
        FROM (SELECT * FROM travelpost WHERE idtravelpost = ?) as A JOIN user as B ON A.iduser = B.iduser`,
        [idtravelpost, iduser, idtravelpost], (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });
  }
  
  

  module.exports = router;
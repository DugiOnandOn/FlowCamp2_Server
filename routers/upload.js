const express = require('express');
const router = express.Router();
const connection = require('../utils/db');
const multer = require('../utils/s3');

router.get('/', (req, res) => {
  connection.query(`SELECT B.username as username, B.image as userImage, A.idtravelpost as idtravelpost, A.idtravelplace as place, A.title as title, C.idpostimage as imageurl
  FROM travelpost as A JOIN user as B ON A.iduser = B.iduser JOIN postimage as C ON A.idtravelpost = C.idtravelpost WHERE C.order=0`, 
  (error, results) => {
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
  
  connection.query(`SELECT B.username as username, B.image as userImage, A.idtravelpost as idtravelpost, A.idtravelplace as place, A.title as title, C.idpostimage as imageurl
  FROM travelpost as A JOIN user as B ON A.iduser = B.iduser JOIN postimage as C ON A.idtravelpost = C.idtravelpost WHERE C.order = 0 AND A.idtravelplace = ?`, 
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

router.post('/post', multer.array('photos'), (req, res, next) => {
    const iduser = req.body.iduser;
    const title = req.body.title;
    const text = req.body.text;
    const idtravelplace = req.body.place;
  
    connection.query(
      `INSERT INTO travelpost(iduser, title, text, idtravelplace) VALUES(?, ?, ?, ?)`,
      [iduser, title, text, idtravelplace],
      (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
          const images = req.files;
          const locations = images.map(image => image.location);
  
          let queryPromises = [];
          for (let i = 0; i < locations.length; i++) {
            const queryPromise = new Promise((resolve, reject) => {
              connection.query(
                `INSERT INTO postimage(idtravelpost, idpostimage, \`order\`) 
                 VALUES((SELECT idtravelpost FROM travelpost WHERE iduser = ? AND title = ?), ?, ?)`,
                [iduser, title, locations[i], i],
                (error, results) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(results);
                  }
                }
              );
            });
            queryPromises.push(queryPromise);
          }
  
          Promise.all(queryPromises)
            .then(() => {
              // 모든 쿼리가 성공적으로 실행되었을 때의 처리
              res.status(200).json({ message: 'Post and images uploaded successfully' });
            })
            .catch(error => {
              // 쿼리 중 하나라도 실패했을 때의 처리
              console.error('postimage query error:', error);
              res.status(500).json({ error: 'Failed to retrieve postimage data from MySQL' });
            });
        }
      }
    );
  });

  router.post('/image', multer.single('image'), (req, res, next) => {
    try {
      const image = req.file;
      if (image && image.location) {
        res.send(image.location);
      } else {
        throw new Error('no image');
      }
    } catch (err) {
      next(err);
    }
  })

  router.post('/images', multer.array('images'), (req, res, next) => {
    const iduser = req.session.loginData.iduser;
    const title = req.body.title;
    const text = req.body.text;
    const idtravelplace = req.body.place;
  
    connection.query(
      `INSERT INTO travelpost(iduser, title, text, idtravelplace) VALUES(?, ?, ?, ?)`,
      [iduser, title, text, idtravelplace],
      (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
          const images = req.files;
          const locations = images.map(image => image.location);
  
          let queryPromises = [];
          for (let i = 0; i < locations.length; i++) {
            const queryPromise = new Promise((resolve, reject) => {
              connection.query(
                `INSERT INTO postimage(idtravelpost, idpostimage, \`order\`) 
                 VALUES((SELECT idtravelpost FROM travelpost WHERE iduser = ? AND title = ?), ?, ?)`,
                [iduser, title, locations[i], i],
                (error, results) => {
                  if (error) {
                    reject(error);
                  } else {
                    resolve(results);
                  }
                }
              );
            });
            queryPromises.push(queryPromise);
          }
  
          Promise.all(queryPromises)
            .then(() => {
              // 모든 쿼리가 성공적으로 실행되었을 때의 처리
              res.status(200).json({ message: 'Post and images uploaded successfully' });
            })
            .catch(error => {
              // 쿼리 중 하나라도 실패했을 때의 처리
              console.error('postimage query error:', error);
              res.status(500).json({ error: 'Failed to retrieve postimage data from MySQL' });
            });
        }
      }
    );
    try {
      const images = req.files;
      const locations = images.map(image => image.location); // 이미지 파일들의 location 리스트

      if (locations && locations.length > 0) {
        res.send(locations);
      } else {
        throw new Error('no image');
      }
    } catch (err) {
      next(err);
    }
  })

  
  router.get('/:idtravelpost', (req, res) => {
    const idtravelpost = req.params.idtravelpost;
  
    connection.query(
      `SELECT A.title as title, A.text as text, B.username as username, B.image as userImage, A.idpostimage as postImage
      FROM (SELECT * FROM travelpost WHERE idtravelpost = ?) as A JOIN user as B ON A.iduser = B.iduser`,
      [idtravelpost],
      (err, result1) => {
        if (err) {
          console.error('Error querying MySQL:', err);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
          return;
        }
  
        connection.query(
          'SELECT idpostimage FROM postimage WHERE idtravelpost = ?',
          [idtravelpost],
          (err, result2) => {
            if (err) {
              console.error('Error querying MySQL:', err);
              res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
              return;
            }
  
            const data = {
              title: result1[0].title,
              text: result1[0].text,
              username: result1[0].username,
              userImage: result1[0].userImage,
              postImage: result2[0].idpostimage,
            };
  
            res.send(data);
          }
        );
      }
    );
  });


  module.exports = router;
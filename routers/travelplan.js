const express = require('express');
const router = express.Router();
const connection = require('../utils/db');


router.get('/:idtravelplan', (req, res) => {
  const iduser = req.session.loginData.iduser;
  const idtravelplan = req.params.idtravelplan;

  connection.query(
    `SELECT idtravelplace AS place, DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date, DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, days
    FROM travelplan WHERE idtravelplan = ?`,
    [idtravelplan], (error, result1) => {
      if (error) {
        console.error('Error querying MySQL:', error);
        res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
      } else {
        connection.query(
          'SELECT day, spot FROM dayspot WHERE idtravelplan = ? ORDER BY `order`',
          [idtravelplan],
          (error, results) => {
            if (error) {
              console.error('Error querying MySQL:', error);
              res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
            } else {
              const daySpotMap = results.reduce((acc, row) => {
                const day = row.day;
                const spot = row.spot;
                const existingEntry = acc.find((entry) => entry.day === day);
                if (existingEntry) {
                  existingEntry.spot.push(spot);
                } else {
                  acc.push({ day, spot: [spot] });
                }
                return acc;
              }, []);

              for (let i = 1; i <= result1[0].days + 1; i++) {
                const existingEntry = daySpotMap.find((entry) => entry.day === i);
                if (!existingEntry) {
                  daySpotMap.push({ day: i, spot: [] });
                }
              }

              res.send({
                place: result1[0].place,
                start_date: result1[0].start_date,
                end_date: result1[0].end_date,
                daySpotMap: daySpotMap,
              });
            }
          }
        );
      }
    }
  );
});


  router.post('/upload', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const idtravelplan = req.body.idtravelplan;
    const day = req.body.day;
    const spot = req.body.spot;
  
    connection.query(
      `INSERT INTO dayspot (idtravelplan, day, spot) VALUE (?, ?, ?)`,
      [idtravelplan, day, spot], (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } 
        else {
          res.status(200).redirect(`/travelplan/${idtravelplan}`);
        }
      }
    );
  });
  

  router.post('/delete', (req, res) => {
    const idtravelplan = req.body.idtravelplan;
    const day = req.body.day;
    const spot = req.body.spot;

    connection.query(
      `DELETE FROM dayspot WHERE idtravelplan = ? AND day = ? AND spot = ?`,
      [idtravelplan, day, spot], (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } 
        else {
          res.status(200).redirect(`/travelplan/${idtravelplan}`);
        }
      }
    );

  });

  module.exports = router;
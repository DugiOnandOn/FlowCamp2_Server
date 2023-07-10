const express = require('express');
const router = express.Router();
const connection = require('../utils/db');

  router.post('/upload', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const place = req.body.place;
    const start = new Date(req.body.start);
    const end = new Date(req.body.end);
    const diffInMilliseconds = Math.abs(end - start);
    const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

    connection.query(`INSERT INTO travelplan(iduser, idtravelplace, start_date, end_date, days) VALUES(?, ?, ?, ?, ?)`,
    [iduser, place, start, end, diffInDays], (error, results) => {
        if (error) {
            console.error('Error querying MySQL:', error);
            res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
            res.redirect(`/user`);
        }
    });
  });

  router.post('/modify', (req, res) => {
    const iduser = req.session.loginData.iduser;
    const idtravelplan = req.body.idtravelplan;
    const place = req.body.place;
    const start = req.body.start;
    const end = req.body.end;
    const diffInMilliseconds = Math.abs(end - start);
    const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

    connection.query(`UPDATE travelplan SET idtravelplace = ?, start_date = ?, end_date = ?, days = ? WHERE idtravelplan = ?`,
    [place, start, end, idtravelplan, diffInDays], (error, results) => {
        if (error) {
            console.error('Error querying MySQL:', error);
            res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } else {
            res.redirect(`/user`);
        }
    });

  });

  router.post('/delete', (req, res) => {
    const idtravelplan = req.body.idtravelplan;

    connection.query(
      `DELETE FROM travelplan WHERE idtravelplan = ?`,
      [idtravelplan], (error, results) => {
        if (error) {
          console.error('Error querying MySQL:', error);
          res.status(500).json({ error: 'Failed to retrieve data from MySQL' });
        } 
        else {
          res.status(200).redirect(`/user`);
        }
      }
    );

  });

  module.exports = router;
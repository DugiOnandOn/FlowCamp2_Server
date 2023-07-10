const express = require('express');
const multer = require('multer');
const AWS = require("aws-sdk");
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const uuid = require('uuid');

dotenv.config();

const router = express.Router();

//* aws region 및 자격증명 설정
AWS.config.update({
   accessKeyId: process.env.S3_ACCESS_KEY_ID,
   secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
   region: process.env.AWS_REGION,
});

//* AWS S3 multer 설정
const upload = multer({
   //* 저장공간
   // s3에 저장
   storage: multerS3({
      // 저장 위치
      s3: new AWS.S3(),
      bucket: process.env.AWS_BUCKET_NAME,
      acl: "public-read",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key(req, file, cb) {
         const key = uuid.v1();
         cb(null, key) // original 폴더안에다 파일을 저장
      },
   }),
   //* 용량 제한
   limits: { fileSize: 25 * 1024 * 1024 },
});

module.exports = upload;
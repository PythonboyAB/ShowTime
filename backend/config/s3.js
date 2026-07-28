import dotenv from "dotenv";
dotenv.config();

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

const uploadToS3 = async (file, folder = "movie-posters") => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return {
    key: fileName,
    url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
  };
};

const deleteFromS3 = async (key) => {
  if (!key) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (err) {
    console.warn("Failed to delete S3 object", key, err?.message || err);
  }
};

export { uploadToS3, deleteFromS3 };

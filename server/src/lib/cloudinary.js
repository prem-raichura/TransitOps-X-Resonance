// Cloudinary upload helper — serverless-safe (no local disk, works on Vercel).
// Config: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// (falls back to a single CLOUDINARY_URL if the three vars are absent).
const { v2: cloudinary } = require('cloudinary')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * Upload an in-memory image buffer (from multer.memoryStorage()).
 * Folders auto-create: everything lands under transitops/<subfolder>.
 * Returns the hosted secure_url to store on the record (e.g. FuelLog.proofImageUrl).
 */
function uploadImage(buffer, { folder = 'transitops/fuel-proofs', publicId } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ width: 1600, crop: 'limit' }, { quality: 'auto' }], // cap size, save bandwidth
      },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    )
    stream.end(buffer)
  })
}

module.exports = { cloudinary, uploadImage }

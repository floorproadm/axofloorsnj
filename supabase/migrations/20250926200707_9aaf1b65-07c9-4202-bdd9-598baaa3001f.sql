-- Update Before and After folder cover image
UPDATE gallery_folders 
SET cover_image_url = 'album-cover.png'
WHERE name = 'Before and After';
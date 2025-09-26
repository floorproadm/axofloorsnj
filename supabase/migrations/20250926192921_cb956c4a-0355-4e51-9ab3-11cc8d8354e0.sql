-- Add folder structure to gallery_projects table
ALTER TABLE gallery_projects ADD COLUMN folder_name text;
ALTER TABLE gallery_projects ADD COLUMN parent_folder_id uuid;

-- Create a folders table to manage the folder structure
CREATE TABLE gallery_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on folders table
ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery folders
CREATE POLICY "Gallery folders are viewable by everyone" 
ON gallery_folders 
FOR SELECT 
USING (true);

CREATE POLICY "Admin users can manage all gallery folders" 
ON gallery_folders 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Add trigger for updated_at
CREATE TRIGGER update_gallery_folders_updated_at
BEFORE UPDATE ON gallery_folders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert Before and After folder
INSERT INTO gallery_folders (name, description, cover_image_url, display_order) 
VALUES ('Before and After', 'Transformações impressionantes dos nossos projetos de refinishing de pisos', 'before-after-1.png', 1);

-- Update existing projects to belong to Before and After folder
UPDATE gallery_projects 
SET folder_name = 'Before and After',
    parent_folder_id = (SELECT id FROM gallery_folders WHERE name = 'Before and After')
WHERE category = 'Before and After';
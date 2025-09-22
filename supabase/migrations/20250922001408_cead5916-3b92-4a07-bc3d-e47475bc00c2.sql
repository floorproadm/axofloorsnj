-- Create storage bucket for gallery photos
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Create gallery_projects table
CREATE TABLE public.gallery_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gallery_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for gallery_projects (public read, admin write)
CREATE POLICY "Gallery projects are viewable by everyone" 
ON public.gallery_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert gallery projects" 
ON public.gallery_projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update gallery projects" 
ON public.gallery_projects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete gallery projects" 
ON public.gallery_projects 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create storage policies for gallery bucket
CREATE POLICY "Gallery images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can upload gallery images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gallery images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gallery images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'gallery' AND auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gallery_projects_updated_at
  BEFORE UPDATE ON public.gallery_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial data with the existing project information
INSERT INTO public.gallery_projects (title, description, category, location, image_url, display_order, is_featured) VALUES
('Modern Oak Hardwood Installation', 'Complete hardwood floor installation in a contemporary home with custom staining.', 'Hardwood Flooring', 'Princeton, NJ', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 1, true),
('Victorian Home Floor Refinishing', 'Restored 100-year-old hardwood floors to their original beauty with custom finishing.', 'Sanding & Refinish', 'Morristown, NJ', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 2, true),
('Luxury Vinyl Plank Kitchen', 'Waterproof luxury vinyl plank installation perfect for this busy family kitchen.', 'Vinyl Plank', 'Edison, NJ', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 3, false),
('Custom Staircase Renovation', 'Complete staircase makeover with new oak treads and custom railings.', 'Staircase', 'Summit, NJ', 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 4, true),
('Craftsman Style Trim Package', 'Complete baseboard and crown molding installation in a Craftsman style home.', 'Baseboards & Trim', 'Westfield, NJ', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 5, false),
('Open Concept Living Space', 'Seamless hardwood installation throughout an open concept living area.', 'Hardwood Flooring', 'Short Hills, NJ', 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 6, false),
('Basement Luxury Vinyl Installation', 'Waterproof vinyl plank flooring transformed this basement into a functional space.', 'Vinyl Plank', 'Millburn, NJ', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 7, false),
('Antique Heart Pine Restoration', 'Careful restoration of antique heart pine floors preserving their historic character.', 'Sanding & Refinish', 'Madison, NJ', 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 8, false),
('Modern Floating Staircase', 'Contemporary floating staircase design with glass railings and LED lighting.', 'Staircase', 'Chatham, NJ', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 9, false);
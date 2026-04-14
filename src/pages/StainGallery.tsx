import React, { useState } from 'react';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Import stain images
import agedBarrelImg from '@/assets/stains/aged-barrel.jpg';
import antiqueBrownImg from '@/assets/stains/antique-brown.jpg';
import cherryImg from '@/assets/stains/cherry.jpg';
import chestnutImg from '@/assets/stains/chestnut.jpg';
import classicGrayImg from '@/assets/stains/classic-gray.jpg';
import coffeeBrownImg from '@/assets/stains/coffee-brown.jpg';
import colonialMapleImg from '@/assets/stains/colonial-maple.jpg';
import countryWhiteImg from '@/assets/stains/country-white.jpg';
import darkGrayImg from '@/assets/stains/dark-gray.jpg';
import darkWalnutImg from '@/assets/stains/dark-walnut.jpg';
import earlyAmericanImg from '@/assets/stains/early-american.jpg';
import ebonyImg from '@/assets/stains/ebony.jpg';
import englishChestnutImg from '@/assets/stains/english-chestnut.jpg';
import espressoImg from '@/assets/stains/espresso.jpg';
import fruitwoodImg from '@/assets/stains/fruitwood.jpg';
import goldenBrownImg from '@/assets/stains/golden-brown.jpg';
import goldenOakImg from '@/assets/stains/golden-oak.jpg';
import goldenPecanImg from '@/assets/stains/golden-pecan.jpg';
import gunstockImg from '@/assets/stains/gunstock.jpg';
import heritageBrownImg from '@/assets/stains/heritage-brown.jpg';
import honeyImg from '@/assets/stains/honey.jpg';
import jacobeanImg from '@/assets/stains/jacobean.jpg';
import mahoganyImg from '@/assets/stains/mahogany.jpg';
import mediumBrownImg from '@/assets/stains/medium-brown.jpg';

import neutralImg from '@/assets/stains/neutral.jpg';
import nutmegImg from '@/assets/stains/nutmeg.jpg';
import provincialImg from '@/assets/stains/provincial.jpg';
import redMahoganyImg from '@/assets/stains/red-mahogany.jpg';
import redOakImg from '@/assets/stains/red-oak.jpg';
import rosewoodImg from '@/assets/stains/rosewood.jpg';
import royalMahoganyImg from '@/assets/stains/royal-mahogany.jpg';
import rusticBeigeImg from '@/assets/stains/rustic-beige.jpg';
import sedonaRedImg from '@/assets/stains/sedona-red.jpg';
import silveredGrayImg from '@/assets/stains/silvered-gray.jpg';
import specialWalnutImg from '@/assets/stains/special-walnut.jpg';
import spiceBrownImg from '@/assets/stains/spice-brown.jpg';
import trueBlackImg from '@/assets/stains/true-black.jpg';
import warmGrayImg from '@/assets/stains/warm-gray.jpg';
import weatheredOakImg from '@/assets/stains/weathered-oak.jpg';

// Import Red Oak stain images
import roAgedBarrelImg from '@/assets/stains/red-oak/aged-barrel.png';
import roAntiqueBrownImg from '@/assets/stains/red-oak/antique-brown.png';
import roCherryImg from '@/assets/stains/red-oak/cherry.png';
import roChestnutImg from '@/assets/stains/red-oak/chestnut.png';
import roClassicGrayImg from '@/assets/stains/red-oak/classic-gray.png';
import roCoffeeBrownImg from '@/assets/stains/red-oak/coffee-brown.png';
import roColonialMapleImg from '@/assets/stains/red-oak/colonial-maple.png';
import roCountryWhiteImg from '@/assets/stains/red-oak/country-white.png';
import roDarkGrayImg from '@/assets/stains/red-oak/dark-gray.png';
import roDarkWalnutImg from '@/assets/stains/red-oak/dark-walnut.png';
import roEarlyAmericanImg from '@/assets/stains/red-oak/early-american.png';
import roEbonyImg from '@/assets/stains/red-oak/ebony.png';
import roEnglishChestnutImg from '@/assets/stains/red-oak/english-chestnut.png';
import roEspressoImg from '@/assets/stains/red-oak/espresso.png';
import roFruitwoodImg from '@/assets/stains/red-oak/fruitwood.png';
import roGoldenBrownImg from '@/assets/stains/red-oak/golden-brown.png';
import roGoldenOakImg from '@/assets/stains/red-oak/golden-oak.png';
import roGoldenPecanImg from '@/assets/stains/red-oak/golden-pecan.png';
import roGunstockImg from '@/assets/stains/red-oak/gunstock.png';
import roHeritageBrownImg from '@/assets/stains/red-oak/heritage-brown.png';
import roJacobeanImg from '@/assets/stains/red-oak/jacobean.png';
import roMediumBrownImg from '@/assets/stains/red-oak/medium-brown.png';
import roNeutralImg from '@/assets/stains/red-oak/neutral.png';
import roNutmegImg from '@/assets/stains/red-oak/nutmeg.png';
import roProvincialImg from '@/assets/stains/red-oak/provincial.png';
import roRedMahoganyImg from '@/assets/stains/red-oak/red-mahogany.png';
import roRosewoodImg from '@/assets/stains/red-oak/rosewood.png';
import roRoyalMahoganyImg from '@/assets/stains/red-oak/royal-mahogany.png';
import roRusticBeigeImg from '@/assets/stains/red-oak/rustic-beige.png';
import roSedonaRedImg from '@/assets/stains/red-oak/sedona-red.png';
import roSilveredGrayImg from '@/assets/stains/red-oak/silvered-gray.png';
import roSpecialWalnutImg from '@/assets/stains/red-oak/special-walnut.png';
import roSpiceBrownImg from '@/assets/stains/red-oak/spice-brown.png';
import roTrueBlackImg from '@/assets/stains/red-oak/true-black.png';
import roWarmGrayImg from '@/assets/stains/red-oak/warm-gray.png';
import roWeatheredOakImg from '@/assets/stains/red-oak/weathered-oak.png';

// Import process image
import stainProcessImg from '@/assets/stain-process-work.jpg';
const StainGallery = () => {
  const [expandedWoodType, setExpandedWoodType] = useState<string>('white-oak');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{name: string, image: string, index: number, stains: typeof whiteOakStains} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    zipCode: '',
    favoriteColors: ['', '', '']
  });
  const { toast } = useToast();

  // All available stain colors
  const stainColors = [
    'Aged Barrel', 'Antique Brown', 'Cherry', 'Chestnut', 'Classic Gray',
    'Coffee Brown', 'Colonial Maple', 'Country White', 'Dark Gray', 'Dark Walnut',
    'Early American', 'Ebony', 'English Chestnut', 'Espresso', 'Fruitwood',
    'Golden Brown', 'Golden Oak', 'Golden Pecan', 'Gunstock', 'Heritage Brown',
    'Honey', 'Jacobean', 'Mahogany', 'Medium Brown', 'Neutral',
    'Nutmeg', 'Provincial', 'Red Mahogany', 'Red Oak', 'Rosewood',
    'Royal Mahogany', 'Rustic Beige', 'Sedona Red', 'Silvered Gray',
    'Special Walnut', 'Spice Brown', 'True Black', 'Warm Gray', 'Weathered Oak'
  ];

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...formData.favoriteColors];
    newColors[index] = value;
    setFormData({ ...formData, favoriteColors: newColors });
  };

  const handleSendSMS = () => {
    const message = `Hi! I saw your stain gallery and want to book the free in-home test. I'm ${formData.name}, ZIPCode: ${formData.zipCode} 3 favorites colors: ${formData.favoriteColors.filter(color => color.trim()).join(', ')}`;
    
    // Create SMS link
    const phoneNumber = '7323518653';
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    
    // Open SMS app
    window.open(smsUrl, '_blank');
    
    toast({
      title: "SMS Ready!",
      description: "Your SMS app should open with the pre-filled message.",
    });
    
    setIsDialogOpen(false);
  };

  const handleImageClick = (stain: {name: string, image: string}, index: number, stains: typeof whiteOakStains) => {
    setSelectedImage({ ...stain, index, stains });
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const prevIndex = selectedImage.index > 0 ? selectedImage.index - 1 : selectedImage.stains.length - 1;
    const prevStain = selectedImage.stains[prevIndex];
    setSelectedImage({ ...prevStain, index: prevIndex, stains: selectedImage.stains });
  };

  const handleNextImage = () => {
    if (!selectedImage) return;
    const nextIndex = selectedImage.index < selectedImage.stains.length - 1 ? selectedImage.index + 1 : 0;
    const nextStain = selectedImage.stains[nextIndex];
    setSelectedImage({ ...nextStain, index: nextIndex, stains: selectedImage.stains });
  };
  const whiteOakStains = [
    { name: 'Aged Barrel', image: agedBarrelImg },
    { name: 'Antique Brown', image: antiqueBrownImg },
    { name: 'Cherry', image: cherryImg },
    { name: 'Chestnut', image: chestnutImg },
    { name: 'Classic Gray', image: classicGrayImg },
    { name: 'Coffee Brown', image: coffeeBrownImg },
    { name: 'Colonial Maple', image: colonialMapleImg },
    { name: 'Country White', image: countryWhiteImg },
    { name: 'Dark Gray', image: darkGrayImg },
    { name: 'Dark Walnut', image: darkWalnutImg },
    { name: 'Early American', image: earlyAmericanImg },
    { name: 'Ebony', image: ebonyImg },
    { name: 'English Chestnut', image: englishChestnutImg },
    { name: 'Espresso', image: espressoImg },
    { name: 'Fruitwood', image: fruitwoodImg },
    { name: 'Golden Brown', image: goldenBrownImg },
    { name: 'Golden Oak', image: goldenOakImg },
    { name: 'Golden Pecan', image: goldenPecanImg },
    { name: 'Gunstock', image: gunstockImg },
    { name: 'Heritage Brown', image: heritageBrownImg },
    { name: 'Honey', image: honeyImg },
    { name: 'Jacobean', image: jacobeanImg },
    { name: 'Mahogany', image: mahoganyImg },
    { name: 'Medium Brown', image: mediumBrownImg },
    { name: 'Neutral', image: neutralImg },
    { name: 'Nutmeg', image: nutmegImg },
    { name: 'Provincial', image: provincialImg },
    { name: 'Red Mahogany', image: redMahoganyImg },
    { name: 'Red Oak', image: redOakImg },
    { name: 'Rosewood', image: rosewoodImg },
    { name: 'Royal Mahogany', image: royalMahoganyImg },
    { name: 'Rustic Beige', image: rusticBeigeImg },
    { name: 'Sedona Red', image: sedonaRedImg },
    { name: 'Silvered Gray', image: silveredGrayImg },
    { name: 'Special Walnut', image: specialWalnutImg },
    { name: 'Spice Brown', image: spiceBrownImg },
    { name: 'True Black', image: trueBlackImg },
    { name: 'Warm Gray', image: warmGrayImg },
    { name: 'Weathered Oak', image: weatheredOakImg },
  ];
  const redOakStains = [
    { name: 'Aged Barrel', image: agedBarrelImg },
    { name: 'Antique Brown', image: antiqueBrownImg },
    { name: 'Cherry', image: cherryImg },
    { name: 'Chestnut', image: chestnutImg },
    { name: 'Classic Gray', image: classicGrayImg },
    { name: 'Coffee Brown', image: coffeeBrownImg },
    { name: 'Colonial Maple', image: colonialMapleImg },
    { name: 'Country White', image: countryWhiteImg },
    { name: 'Dark Gray', image: darkGrayImg },
    { name: 'Dark Walnut', image: darkWalnutImg },
    { name: 'Early American', image: earlyAmericanImg },
    { name: 'Ebony', image: ebonyImg },
    { name: 'English Chestnut', image: englishChestnutImg },
    { name: 'Espresso', image: espressoImg },
    { name: 'Fruitwood', image: fruitwoodImg },
    { name: 'Golden Brown', image: goldenBrownImg },
    { name: 'Golden Oak', image: goldenOakImg },
    { name: 'Golden Pecan', image: goldenPecanImg },
    { name: 'Gunstock', image: gunstockImg },
    { name: 'Heritage Brown', image: heritageBrownImg },
    { name: 'Honey', image: honeyImg },
    { name: 'Jacobean', image: jacobeanImg },
    { name: 'Mahogany', image: mahoganyImg },
    { name: 'Medium Brown', image: mediumBrownImg },
    
    { name: 'Neutral', image: neutralImg },
    { name: 'Nutmeg', image: nutmegImg },
    { name: 'Provincial', image: provincialImg },
    { name: 'Red Mahogany', image: redMahoganyImg },
    { name: 'Red Oak', image: redOakImg },
    { name: 'Rosewood', image: rosewoodImg },
    { name: 'Royal Mahogany', image: royalMahoganyImg },
    { name: 'Rustic Beige', image: rusticBeigeImg },
    { name: 'Sedona Red', image: sedonaRedImg },
    { name: 'Silvered Gray', image: silveredGrayImg },
    { name: 'Special Walnut', image: specialWalnutImg },
    { name: 'Spice Brown', image: spiceBrownImg },
    { name: 'True Black', image: trueBlackImg },
    { name: 'Warm Gray', image: warmGrayImg },
    { name: 'Weathered Oak', image: weatheredOakImg },
  ];
  const toggleWoodType = (woodType: string) => {
    setExpandedWoodType(expandedWoodType === woodType ? '' : woodType);
  };
  const StainGrid = ({
    stains
  }: {
    stains: typeof whiteOakStains;
  }) => <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
      {stains.map((stain, index) => <Card key={index} className="group cursor-pointer hover:shadow-elegant transition-smooth" onClick={() => handleImageClick(stain, index, stains)}>
          <CardContent className="p-0">
            <div className="aspect-square bg-gradient-subtle rounded-lg overflow-hidden">
              <img src={stain.image} alt={stain.name} className="w-full h-full object-cover group-hover:scale-105 transition-smooth" />
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-navy text-center">
                {stain.name}
              </h3>
            </div>
          </CardContent>
        </Card>)}
    </div>;
  return <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-subtle py-8 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-navy mb-6">
                Stain Gallery
              </h1>
              
              <div className="bg-white border-l-4 border-gold p-6 rounded-lg shadow-soft">
                <p className="text-grey italic">
                  <strong>Important Note:</strong> Colors shown are representative samples. Natural wood grain and tone variations 
                  mean your final stain color will vary slightly from board to board, creating unique character in each project.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stain Gallery */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              
              {/* White Oak Section */}
              <div className="mb-12">
                <button onClick={() => toggleWoodType('white-oak')} className="w-full flex items-center justify-between p-6 bg-white rounded-lg shadow-soft hover:shadow-elegant transition-smooth border-2 border-transparent hover:border-gold/20">
                  <h2 className="text-3xl font-heading font-bold text-navy">
                    WHITE OAK
                  </h2>
                  {expandedWoodType === 'white-oak' ? <ChevronUp className="w-6 h-6 text-gold" /> : <ChevronDown className="w-6 h-6 text-gold" />}
                </button>
                
                {expandedWoodType === 'white-oak' && <div className="mt-6 p-6 bg-white rounded-lg shadow-soft">
                    <p className="text-grey mb-6 text-center">
                      Colors are shown on White Oak. Natural wood tones vary, so expect your final stain color to vary slightly from board to board.
                    </p>
                    <StainGrid stains={whiteOakStains} />
                  </div>}
              </div>

              {/* Red Oak Section */}
              <div className="mb-12">
                <button onClick={() => toggleWoodType('red-oak')} className="w-full flex items-center justify-between p-6 bg-white rounded-lg shadow-soft hover:shadow-elegant transition-smooth border-2 border-transparent hover:border-gold/20">
                  <h2 className="text-3xl font-heading font-bold text-navy">
                    RED OAK
                  </h2>
                  {expandedWoodType === 'red-oak' ? <ChevronUp className="w-6 h-6 text-gold" /> : <ChevronDown className="w-6 h-6 text-gold" />}
                </button>
                
                {expandedWoodType === 'red-oak' && <div className="mt-6 p-6 bg-white rounded-lg shadow-soft">
                    <p className="text-grey mb-6 text-center">
                      Colors are shown on Red Oak. Red Oak typically accepts stain more readily and may appear darker than White Oak with the same stain color.
                    </p>
                    <StainGrid stains={redOakStains} />
                  </div>}
              </div>

              {/* Staining Process Section */}
              <div className="mb-12">
                <Card className="overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    
                    
                  </div>
                </Card>
              </div>

              {/* Call to Action Variations */}
              <div className="space-y-8">
                
                {/* Soft CTA */}
                

                {/* Medium CTA */}
                <Card className="bg-navy text-white overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    <div className="aspect-[4/3] lg:aspect-auto">
                      <img src={stainProcessImg} alt="AXO Floors professional applying stain colors on hardwood flooring" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-8 flex flex-col justify-center text-center lg:text-left">
                      <h3 className="text-2xl font-heading font-bold mb-4 text-gold">
                        Stop Guessing About Color
                      </h3>
                      <p className="text-lg mb-6 opacity-90">
                        Looks like just a color choice — but I've seen this go sideways. In your light, it can turn into something completely different. Let's sample it first so you actually see it.
                      </p>
                      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="lg" className="bg-gold text-navy hover:bg-gold/90 mx-auto lg:mx-0 w-fit font-medium">
                            Book Your Color Test
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Book Your Free Color Test</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name">Your Name</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="zipCode">ZIP Code</Label>
                              <Input
                                id="zipCode"
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                placeholder="Enter your ZIP code"
                              />
                            </div>
                            <div>
                              <Label>3 Favorite Colors</Label>
                              <div className="space-y-2">
                                {formData.favoriteColors.map((color, index) => (
                                  <Select
                                    key={index}
                                    value={color}
                                    onValueChange={(value) => handleColorChange(index, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder={`Select favorite color ${index + 1}`} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white z-50">
                                      {stainColors
                                        .filter(stainColor => !formData.favoriteColors.includes(stainColor) || stainColor === color)
                                        .map((stainColor) => (
                                          <SelectItem key={stainColor} value={stainColor}>
                                            {stainColor}
                                          </SelectItem>
                                        ))
                                      }
                                    </SelectContent>
                                  </Select>
                                ))}
                              </div>
                            </div>
                            <Button 
                              onClick={handleSendSMS} 
                              className="w-full bg-gold text-navy hover:bg-gold/90 font-medium"
                              disabled={!formData.name || !formData.zipCode}
                            >
                              Send SMS to Book Test
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>

                {/* Aggressive CTA */}
                

              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Image Viewer Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">{selectedImage?.name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative">
              <div className="aspect-square bg-gradient-subtle rounded-lg overflow-hidden">
                <img 
                  src={selectedImage.image} 
                  alt={selectedImage.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
              
              {/* Navigation Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-grey/20 w-8 h-8 p-0"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-grey/20 w-8 h-8 p-0"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-xs text-navy">
                {selectedImage.index + 1}/{selectedImage.stains.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>;
};
export default StainGallery;